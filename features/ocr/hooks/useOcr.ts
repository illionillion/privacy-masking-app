"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { OcrPatternType, OcrRegion, UseOcrReturn } from "../types";

/**
 * 個人情報検出パターンの定義
 *
 * 優先度順（高→低）で適用する:
 * email > phone > url > apikey
 */
const PATTERNS: ReadonlyArray<{ type: OcrPatternType; source: string }> = [
  {
    type: "email",
    source: String.raw`[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}`,
  },
  {
    type: "phone",
    source: String.raw`0\d{1,4}[-\s]?\d{1,4}[-\s]?\d{4}`,
  },
  {
    type: "url",
    source: String.raw`https?:\/\/[^\s　]+`,
  },
  {
    type: "apikey",
    /**
     * 20文字以上の英数字列を APIキー・トークン候補として検出する。
     * 意図的に広いパターンを使用しており、誤検出が生じる可能性がある。
     * プライバシー保護を優先し、過検出を許容する設計。
     */
    source: String.raw`[A-Za-z0-9+/=_\-]{20,}`,
  },
] as const;

/** Tesseract.js の Word 型（動的インポート用に部分的に定義） */
interface TesseractBbox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

interface TesseractWord {
  text: string;
  bbox: TesseractBbox;
}

interface TesseractLine {
  text: string;
  words: TesseractWord[];
}

interface TesseractParagraph {
  lines: TesseractLine[];
}

interface TesseractBlock {
  paragraphs: TesseractParagraph[];
}

interface TesseractPage {
  blocks: TesseractBlock[] | null;
}

/**
 * 1行のテキストと単語座標から個人情報領域を検出する
 *
 * @param lineText - OCR結果の行テキスト
 * @param words - 行内の単語一覧（テキスト・bbox付き）
 * @returns 検出された個人情報領域の配列
 */
export function detectPersonalInfoInLine(lineText: string, words: TesseractWord[]): OcrRegion[] {
  /** 各単語の文字位置範囲をマップする */
  let pos = 0;
  const wordPositions = words.map((w) => {
    const start = pos;
    const end = pos + w.text.length;
    pos = end + 1; // 単語間のスペース
    return { start, end, bbox: w.bbox };
  });

  const regions: OcrRegion[] = [];
  /** すでにマッチした文字位置を追跡して重複を防ぐ */
  const matchedRanges: Array<{ start: number; end: number }> = [];

  for (const pattern of PATTERNS) {
    const regex = new RegExp(pattern.source, "g");
    let match: RegExpExecArray | null;

    while ((match = regex.exec(lineText)) !== null) {
      const matchStart = match.index;
      const matchEnd = matchStart + match[0].length;

      /** 既にマッチ済みの範囲と重複する場合はスキップ */
      const alreadyMatched = matchedRanges.some((r) => r.start < matchEnd && r.end > matchStart);
      if (alreadyMatched) continue;

      /** マッチ範囲と重なる単語のbboxを統合 */
      const overlapping = wordPositions.filter((w) => w.start < matchEnd && w.end > matchStart);

      if (overlapping.length > 0) {
        const x0 = Math.min(...overlapping.map((w) => w.bbox.x0));
        const y0 = Math.min(...overlapping.map((w) => w.bbox.y0));
        const x1 = Math.max(...overlapping.map((w) => w.bbox.x1));
        const y1 = Math.max(...overlapping.map((w) => w.bbox.y1));

        regions.push({
          x: x0,
          y: y0,
          width: x1 - x0,
          height: y1 - y0,
          text: match[0],
          patternType: pattern.type,
        });

        matchedRanges.push({ start: matchStart, end: matchEnd });
      }
    }
  }

  return regions;
}

/**
 * Tesseract.js の Page データから個人情報領域を抽出する
 *
 * @param page - Tesseract.js の認識結果ページ
 * @returns 検出された個人情報領域の配列
 */
function extractOcrRegions(page: TesseractPage): OcrRegion[] {
  const regions: OcrRegion[] = [];

  for (const block of page.blocks ?? []) {
    for (const para of block.paragraphs) {
      for (const line of para.lines) {
        const lineRegions = detectPersonalInfoInLine(line.text, line.words);
        regions.push(...lineRegions);
      }
    }
  }

  return regions;
}

/**
 * OCRフック
 *
 * Tesseract.js の Web Worker を使用して画像内テキストを認識し、
 * 個人情報パターン（メール・電話番号・URL・APIキー等）を検出する。
 *
 * @returns {UseOcrReturn} OCR処理の状態と実行関数
 */
export function useOcr(): UseOcrReturn {
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [ocrRegions, setOcrRegions] = useState<OcrRegion[]>([]);
  const [error, setError] = useState<string | null>(null);
  /** Tesseract Worker のキャッシュ（インスタンス内で再利用） */
  const workerRef = useRef<Promise<import("tesseract.js").Worker> | null>(null);
  /** 最後に開始した認識リクエストのID（古い結果の state 上書きを防ぐ） */
  const recognizeRequestRef = useRef(0);

  /**
   * Tesseract Worker を取得する。初回のみ生成し以降はキャッシュを返す。
   *
   * @returns Tesseract Worker
   */
  const getWorker = useCallback(async () => {
    if (!workerRef.current) {
      const { createWorker, OEM } = await import("tesseract.js");
      /**
       * OEM.LSTM_ONLY を明示指定する（デフォルト値と同じだが意図を明確にする）。
       *
       * jpn 訓練データが旧来エンジン専用のパラメータ `language_model_ngram_on` を
       * 参照するため、LSTM-only ビルドでは初期化時に
       * "Warning: Parameter not found: language_model_ngram_on" が出力されるが、
       * これは既知の無害な警告であり OCR の動作には影響しない。
       */
      workerRef.current = createWorker(["jpn", "eng"], OEM.LSTM_ONLY);
    }
    return workerRef.current;
  }, []);

  useEffect(() => {
    return () => {
      /** アンマウント時にWorkerを終了してリソースを解放 */
      if (workerRef.current) {
        void workerRef.current.then((w) => w.terminate()).catch(() => {});
        workerRef.current = null;
      }
    };
  }, []);

  /**
   * 画像内のテキストを OCR 認識し個人情報領域を返す
   *
   * @param imageElement - 認識対象の HTMLImageElement
   * @returns 検出された個人情報領域の配列
   */
  const recognizeText = useCallback(
    async (imageElement: HTMLImageElement): Promise<OcrRegion[]> => {
      const requestId = ++recognizeRequestRef.current;
      setIsRecognizing(true);
      setError(null);

      try {
        const worker = await getWorker();
        const { data } = await worker.recognize(imageElement);
        const regions = extractOcrRegions(data as TesseractPage);

        if (requestId === recognizeRequestRef.current) {
          setOcrRegions(regions);
        }

        return regions;
      } catch (err) {
        if (requestId === recognizeRequestRef.current) {
          setError(err instanceof Error ? err.message : "OCR処理中にエラーが発生しました");
        }
        return [];
      } finally {
        if (requestId === recognizeRequestRef.current) {
          setIsRecognizing(false);
        }
      }
    },
    [getWorker]
  );

  return { isRecognizing, ocrRegions, error, recognizeText };
}
