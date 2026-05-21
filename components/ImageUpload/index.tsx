"use client";

import { useCallback, useRef, useState } from "react";
import type { ChangeEvent, DragEvent, KeyboardEvent } from "react";
import clsx from "clsx";
import { ImageIcon, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import {
  ACCEPTED_IMAGE_TYPES,
  ACCEPTED_IMAGE_TYPES_ERROR,
  MAX_CANVAS_DIMENSION,
  MAX_IMAGE_FILE_SIZE,
} from "./constants";

/** D&D で許可する URL スキーム */
const ALLOWED_URL_SCHEMES = ["http:", "https:", "data:"];

/**
 * `text/uri-list` 文字列から最初の有効な URL を抽出する
 *
 * RFC 2483 に従い、コメント行（`#` 始まり）と空行を除外して先頭 URL を返す。
 *
 * @param uriList - DataTransfer から取得した `text/uri-list` 文字列
 * @returns 最初の有効 URL、または null
 */
const extractUrlFromUriList = (uriList: string): string | null => {
  for (const line of uriList.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) return trimmed;
  }
  return null;
};

/**
 * `text/html` 文字列から最初の `<img>` タグの `src` 属性を抽出する
 *
 * @param html - ドロップされた HTML 文字列
 * @returns 画像 URL、または null
 */
const extractImageUrlFromHtml = (html: string): string | null => {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const img = doc.querySelector("img");
  return img?.src ?? null;
};

/**
 * URL のスキームを検証し、許可外スキームの場合は null を返す
 *
 * `data:` は `new URL()` でパースできない環境もあるため個別に判定する。
 * 許可スキーム: http / https / data
 *
 * @param url - 検証する URL 文字列
 * @returns 有効な URL 文字列、または null
 */
const validateUrlScheme = (url: string): string | null => {
  if (url.startsWith("data:")) return url;
  try {
    const parsed = new URL(url);
    return ALLOWED_URL_SCHEMES.includes(parsed.protocol) ? url : null;
  } catch {
    return null;
  }
};

/**
 * 既知の画像拡張子から MIME タイプへのマッピング
 *
 * ACCEPTED_IMAGE_TYPES に含まれない形式（BMP / SVG 等）も列挙して明示的に弾けるようにする。
 * このマップに存在しない拡張子（拡張子なし URL 等）は未知として変換を試みる。
 */
const IMAGE_EXT_TO_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  bmp: "image/bmp",
  svg: "image/svg+xml",
  tiff: "image/tiff",
  tif: "image/tiff",
  ico: "image/x-icon",
  avif: "image/avif",
  heic: "image/heic",
  heif: "image/heif",
};

/**
 * URL または data: URI の画像形式が許可済み MIME タイプかどうかを変換前に検証する
 *
 * - `data:` URI: MIME を `ACCEPTED_IMAGE_TYPES` と照合する
 * - http/https URL: 拡張子から MIME を推測し `ACCEPTED_IMAGE_TYPES` と照合する
 * - 拡張子不明（マッピング外・拡張子なし）の URL は許可して変換を試みる
 *
 * @param url - 検証対象の URL または data: URI
 * @returns エラーメッセージ、または null（問題なし）
 */
const validateImageTypeFromUrl = (url: string): string | null => {
  if (url.startsWith("data:")) {
    const mimeMatch = url.match(/^data:([^;,]+)/);
    const mime = mimeMatch?.[1] ?? "";
    return ACCEPTED_IMAGE_TYPES.includes(mime) ? null : ACCEPTED_IMAGE_TYPES_ERROR;
  }

  try {
    const ext = new URL(url).pathname.split(".").pop()?.toLowerCase() ?? "";
    const mime = IMAGE_EXT_TO_MIME[ext];
    /** 拡張子不明の場合は変換を試みる（拡張子なし URL 等） */
    if (!mime) return null;
    return ACCEPTED_IMAGE_TYPES.includes(mime) ? null : ACCEPTED_IMAGE_TYPES_ERROR;
  } catch {
    return null;
  }
};

/** canvas.toBlob でサポートされる出力 MIME タイプ */
const CANVAS_SUPPORTED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
type CanvasMimeType = (typeof CANVAS_SUPPORTED_TYPES)[number];

/**
 * URL または data: URI から canvas.toBlob に渡す出力 MIME タイプを決定する
 *
 * GIF など canvas でエンコードできない形式は image/png にフォールバックする。
 *
 * @param url - 画像 URL または data: URI
 * @returns canvas.toBlob に渡す MIME タイプ
 */
const detectOutputMimeType = (url: string): CanvasMimeType => {
  if (url.startsWith("data:")) {
    const mimeMatch = url.match(/^data:([^;,]+)/);
    const mime = mimeMatch?.[1] ?? "";
    return (CANVAS_SUPPORTED_TYPES as readonly string[]).includes(mime)
      ? (mime as CanvasMimeType)
      : "image/png";
  }
  try {
    const ext = new URL(url).pathname.split(".").pop()?.toLowerCase() ?? "";
    const extToMime: Record<string, CanvasMimeType> = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      webp: "image/webp",
    };
    return extToMime[ext] ?? "image/png";
  } catch {
    return "image/png";
  }
};

/**
 * 画像 URL を `<img crossOrigin="anonymous">` + Canvas `toBlob` で File に変換する
 *
 * サーバーへの画像データ送信を避けるため fetch は使用しない。
 * CORS エラーや形式不正の場合は reject される。
 * `data:` URI の場合はファイル名をMIMEタイプから決定する。
 *
 * @param url - 画像 URL（http/https/data: URI）
 * @returns 変換した File オブジェクト
 */
const urlToFile = (url: string): Promise<File> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    /** Referer ヘッダーの送信を抑えてドロップ元への閲覧元URL漏洩を防ぐ */
    img.referrerPolicy = "no-referrer";

    img.onload = () => {
      /**
       * 巨大解像度画像は Canvas のメモリ確保でタブがフリーズ/クラッシュするため、
       * MAX_IMAGE_FILE_SIZE チェックより先に解像度をガードする。
       */
      if (img.naturalWidth > MAX_CANVAS_DIMENSION || img.naturalHeight > MAX_CANVAS_DIMENSION) {
        img.onload = null;
        img.onerror = null;
        reject(
          new Error(
            `画像の解像度が大きすぎます（最大 ${MAX_CANVAS_DIMENSION}×${MAX_CANVAS_DIMENSION}px）`
          )
        );
        return;
      }

      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        canvas.width = 0;
        canvas.height = 0;
        img.onload = null;
        img.onerror = null;
        reject(new Error("Canvas コンテキストの取得に失敗しました"));
        return;
      }
      ctx.drawImage(img, 0, 0);
      /**
       * CORS ヘッダー不足等で Canvas が taint されている場合、
       * toBlob() は SecurityError をスローするため try/catch で捕捉して reject する
       */
      try {
        canvas.toBlob((blob) => {
          /** GC を早めるため toBlob 完了後に canvas のピクセルバッファを解放する */
          canvas.width = 0;
          canvas.height = 0;
          img.onload = null;
          img.onerror = null;

          if (!blob) {
            console.error("[urlToFile] toBlob returned null:", url);
            reject(new Error("画像の変換に失敗しました"));
            return;
          }
          /**
           * 拡張子は blob.type から決定する。
           * Canvas による再エンコード（例: GIF → PNG）で URL の拡張子と
           * File.type が不一致になるのを防ぐため、URL 由来のパスは stem のみ採用する。
           */
          const ext = blob.type.split("/")[1] ?? "png";
          const fileName = url.startsWith("data:")
            ? `image.${ext}`
            : `${
                new URL(url).pathname
                  .split("/")
                  .pop()
                  ?.replace(/\.[^.]*$/, "") || "image"
              }.${ext}`;
          resolve(new File([blob], fileName, { type: blob.type }));
        }, detectOutputMimeType(url));
      } catch (err) {
        canvas.width = 0;
        canvas.height = 0;
        img.onload = null;
        img.onerror = null;
        /**
         * Canvas が taint されている場合など、DOMException の SecurityError が来る可能性がある。
         * 生の英語メッセージをユーザーに露出しないよう既知ケースをフレンドリー文言にマッピングする。
         */
        console.error("[urlToFile] toBlob threw:", err, "url:", url);
        const friendlyMessage =
          err instanceof DOMException && err.name === "SecurityError"
            ? "この画像は読み込めませんでした（セキュリティエラーの可能性があります）"
            : "この画像は読み込めませんでした";
        reject(new Error(friendlyMessage));
      }
    };

    img.onerror = () => {
      img.onload = null;
      img.onerror = null;
      console.error("[urlToFile] img load failed:", url);
      reject(
        new Error(
          "この画像は読み込めませんでした（CORS・ネットワーク・URLの問題の可能性があります）"
        )
      );
    };

    img.src = url;
  });
};

interface ImageUploadProps {
  /** ファイル選択時のコールバック */
  onUpload: (files: File[]) => void;
  /** 無効化フラグ */
  disabled?: boolean;
  /** 複数選択を許可するか */
  multiple?: boolean;
  /** ローディング表示メッセージ */
  loadingMessage?: string | null;
}

/**
 * 画像アップロードコンポーネント
 *
 * ドラッグ＆ドロップとファイル選択の両方に対応。
 * 許可形式: JPEG / PNG / WebP / GIF（最大20MB）
 */
export function ImageUpload({
  onUpload,
  disabled = false,
  multiple = true,
  loadingMessage = null,
}: ImageUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /**
   * ファイル配列のバリデーションを行い、問題ないファイルのみコールバックを呼ぶ
   *
   * @param files - アップロード対象ファイル配列
   */
  const handleFiles = useCallback(
    (files: File[]) => {
      const validFiles: File[] = [];
      let validationError: string | null = null;

      for (const file of files) {
        if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
          validationError = ACCEPTED_IMAGE_TYPES_ERROR;
          continue;
        }
        if (file.size > MAX_IMAGE_FILE_SIZE) {
          validationError = "ファイルサイズは20MB以下にしてください";
          continue;
        }
        validFiles.push(file);
      }

      if (validFiles.length > 0) {
        setError(null);
        onUpload(validFiles);
        return;
      }

      setError(validationError);
    },
    [onUpload]
  );

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);
      if (disabled) return;

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFiles(multiple ? files : [files[0]]);
        return;
      }

      /** files が空の場合は別タブ・外部アプリからの D&D として URL を取得する */
      const uriList = e.dataTransfer.getData("text/uri-list");
      const html = e.dataTransfer.getData("text/html");

      const rawUrl = extractUrlFromUriList(uriList) ?? extractImageUrlFromHtml(html);
      if (!rawUrl) return;

      /** URL D&D 経路に入ったら以前のインラインエラーをクリアする */
      setError(null);

      /** 許可外スキーム（javascript: / file: 等）はエラーとして弾く */
      const imageUrl = validateUrlScheme(rawUrl);
      if (!imageUrl) {
        toast.error("この画像は読み込めませんでした");
        return;
      }

      /** 許可外 MIME タイプ（BMP / SVG 等）は変換前にエラーとして弾く */
      const typeError = validateImageTypeFromUrl(imageUrl);
      if (typeError) {
        toast.error(typeError);
        return;
      }

      void (async () => {
        try {
          const file = await urlToFile(imageUrl);
          handleFiles([file]);
        } catch (err) {
          /**
           * urlToFile がスローするエラーは既にフレンドリー文言に変換済み。
           * 想定外の型のエラーは共通文言に丸めてユーザーへ露出しない。
           */
          const message = err instanceof Error ? err.message : "この画像は読み込めませんでした";
          toast.error(message);
        }
      })();
    },
    [disabled, handleFiles, multiple]
  );

  const handleDragOver = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (!disabled) setIsDragOver(true);
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    /** relatedTarget がドロップゾーン内の Node の場合のみハイライトを維持する */
    const container = e.currentTarget;
    const relatedTarget = e.relatedTarget;
    if (relatedTarget instanceof Node && container.contains(relatedTarget)) return;
    setIsDragOver(false);
  }, []);

  const handleDesktopKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (!disabled) inputRef.current?.click();
      }
    },
    [disabled]
  );

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files ? Array.from(e.target.files) : [];
      if (files.length > 0) {
        handleFiles(multiple ? files : [files[0]]);
      }
      // 同じファイルを連続で選択できるよう、入力値をリセットする
      e.target.value = "";
    },
    [handleFiles, multiple]
  );

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        aria-label="画像をアップロード。クリックしてファイルを選択"
        aria-busy={Boolean(loadingMessage)}
        disabled={disabled}
        className={clsx([
          "w-full md:hidden",
          "inline-flex items-center justify-center gap-2",
          "rounded-xl px-4 py-3 text-sm font-semibold",
          "transition-colors duration-200",
          "bg-blue-600 text-white hover:bg-blue-700",
          disabled && "cursor-not-allowed opacity-50",
        ])}
        onClick={() => !disabled && inputRef.current?.click()}
      >
        {loadingMessage ? (
          <>
            <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />
            <span>{loadingMessage}</span>
          </>
        ) : (
          <>
            <ImageIcon className="h-5 w-5" aria-hidden="true" />
            <span>{multiple ? "画像を選択" : "画像を選ぶ"}</span>
          </>
        )}
      </button>

      <p className="text-center text-xs text-zinc-500 md:hidden">
        JPEG / PNG / WebP / GIF（最大 20MB）
      </p>

      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="画像をアップロード。クリックまたはドラッグ＆ドロップ"
        aria-disabled={disabled}
        aria-busy={Boolean(loadingMessage)}
        className={clsx([
          "relative hidden w-full md:flex",
          "cursor-pointer flex-col items-center justify-center",
          "rounded-xl border-2 border-dashed px-6 py-12 text-center",
          "transition-colors duration-200",
          isDragOver
            ? "border-blue-400 bg-blue-50"
            : "border-zinc-300 bg-zinc-50 hover:border-zinc-400 hover:bg-zinc-100",
          disabled && "cursor-not-allowed opacity-50",
        ])}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={handleDesktopKeyDown}
      >
        <div
          className={clsx(["flex flex-col items-center gap-3", loadingMessage && "opacity-0"])}
          aria-hidden={Boolean(loadingMessage)}
        >
          <ImageIcon className="h-10 w-10 text-zinc-500" aria-hidden="true" />
          <div className="flex flex-col gap-1">
            <p className="font-medium text-zinc-700">画像をドラッグ＆ドロップ</p>
            <p className="text-sm text-zinc-500">
              または クリックして{multiple ? "ファイルを複数選択" : "ファイルを選択"}
            </p>
            <p className="text-xs text-zinc-400">JPEG / PNG / WebP / GIF（最大 20MB）</p>
          </div>
        </div>
        {loadingMessage && (
          <div
            className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2"
            aria-live="polite"
          >
            <LoaderCircle className="h-10 w-10 animate-spin text-blue-600" aria-hidden="true" />
            <p className="text-sm font-medium text-blue-700">{loadingMessage}</p>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(",")}
        multiple={multiple}
        className="hidden"
        onChange={handleChange}
        disabled={disabled}
        aria-hidden="true"
      />
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
