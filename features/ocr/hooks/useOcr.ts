"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { detectCustomMaskTermsInWordGroup } from "../lib/customMaskTermMatch";
import type { OcrPatternType, OcrRegion, RecognizeTextOptions, UseOcrReturn } from "../types";

/**
 * 個人情報検出パターンの定義
 *
 * 優先度順（高→低）で適用する:
 * email > phone > postal > url > apikey
 */
const PATTERNS: ReadonlyArray<{ type: OcrPatternType; source: string }> = [
  {
    type: "email",
    source: String.raw`[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}`,
  },
  {
    type: "phone",
    /**
     * 3つの表記を `|` で結合して検出する:
     * 1. 国際番号形式: +81-90-1234-5678 / +1-800-555-1234
     * 2. 国内番号（区切りあり）: 080-1234-5678 / 090-1234-5678 / 03-1234-5678 / 0120-123-456
     * 3. 国内番号（ハイフンなし）: 09012345678 / 0312345678
     *
     * 国内番号の誤検出防止は detectPersonalInfoInLine 内の isDomesticPhoneFalsePositive で行う:
     * - 直前が数字ならスキップ（例: 〒100-0001 内の 00-0001）
     * - 0始まりかつ数字が10桁未満ならスキップ（例: 〒010-0001）
     * 正規表現の lookbehind は Safari 15 等で SyntaxError になるため使用しない。
     */
    source: String.raw`\+\d{1,3}[-\s]?\d{1,4}[-\s]?\d{1,4}[-\s]?\d{3,4}|0\d{1,4}[-\s]?\d{1,4}[-\s]?\d{3,4}|0\d{9,10}`,
  },
  {
    type: "postal",
    source: String.raw`〒?\d{3}[-\s]?\d{4}`,
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

/** detectPersonalInfoInLine の単語位置情報 */
interface WordPosition {
  start: number;
  end: number;
  bbox: TesseractBbox;
}

/** マッチ済み文字範囲 */
interface MatchedRange {
  start: number;
  end: number;
}

interface TesseractLine {
  text?: string;
  words?: TesseractWord[];
}

interface TesseractParagraph {
  lines: TesseractLine[];
}

interface TesseractBlock {
  paragraphs: TesseractParagraph[];
}

interface TesseractPage {
  blocks: TesseractBlock[] | null;
  lines?: TesseractLine[];
  words?: TesseractWord[];
  text?: string;
}

/** 国内電話番号として扱う最低桁数（郵便番号7桁との誤検出を防ぐ） */
const MIN_DOMESTIC_PHONE_DIGITS = 10;

/**
 * 国内電話番号（0始まり）のマッチが郵便番号等への誤検出かどうかを判定する
 *
 * @param lineText - OCR結果の行テキスト
 * @param matchStart - マッチ開始位置
 * @param matchText - マッチした文字列
 * @returns 誤検出と判断する場合は true
 */
function isDomesticPhoneFalsePositive(
  lineText: string,
  matchStart: number,
  matchText: string
): boolean {
  if (!matchText.startsWith("0")) {
    return false;
  }
  /** 直前が数字の場合は郵便番号内の部分文字列（例: 〒100-0001 の 00-0001） */
  if (matchStart > 0 && /\d/.test(lineText[matchStart - 1]!)) {
    return true;
  }
  /** 数字が10桁未満の場合は郵便番号（7桁）等への誤マッチ（例: 〒010-0001） */
  const digitCount = matchText.replace(/\D/g, "").length;
  return digitCount < MIN_DOMESTIC_PHONE_DIGITS;
}

/**
 * 1行のテキストと単語座標から個人情報領域を検出する
 *
 * @param lineText - OCR結果の行テキスト
 * @param words - 行内の単語一覧（テキスト・bbox付き）
 * @param customMaskTerms - ユーザー登録のマスク語句（空白差・OCR分割に対応）
 * @returns 検出された個人情報領域の配列
 */
export function detectPersonalInfoInLine(
  lineText: string,
  words: TesseractWord[],
  customMaskTerms: readonly string[] = []
): OcrRegion[] {
  /** 各単語の文字位置範囲をマップする */
  let pos = 0;
  const wordPositions: WordPosition[] = (words ?? []).map((w) => {
    const start = pos;
    const end = pos + w.text.length;
    pos = end + 1; // 単語間のスペース
    return { start, end, bbox: w.bbox };
  });

  const regions: OcrRegion[] = [];
  /** すでにマッチした文字位置を追跡して重複を防ぐ */
  const matchedRanges: MatchedRange[] = [];

  for (const pattern of PATTERNS) {
    const regex = new RegExp(pattern.source, "g");
    let match: RegExpExecArray | null;

    while ((match = regex.exec(lineText)) !== null) {
      const matchStart = match.index;
      const matchEnd = matchStart + match[0].length;

      /** 既にマッチ済みの範囲と重複する場合はスキップ */
      if (isRangeOverlapping(matchedRanges, matchStart, matchEnd)) continue;

      /** 国内電話番号の郵便番号誤検出をスキップ（lookbehind 非使用・桁数チェック） */
      if (
        pattern.type === "phone" &&
        isDomesticPhoneFalsePositive(lineText, matchStart, match[0])
      ) {
        continue;
      }

      const region = buildRegionFromMatch(
        match[0],
        pattern.type,
        matchStart,
        matchEnd,
        wordPositions
      );
      if (region) {
        regions.push(region);
        matchedRanges.push({ start: matchStart, end: matchEnd });
      }
    }
  }

  const customRegions = detectCustomMaskTermsInWordGroup(
    words ?? [],
    customMaskTerms,
    matchedRanges
  );
  regions.push(...customRegions);

  return regions;
}

/**
 * ページ構造から段落単位でカスタムマスク語句を検出する
 *
 * 名刺などで姓・名が別単語・別行になっても、段落内なら登録語句にマッチさせる。
 *
 * @param page - Tesseract.js の認識結果ページ
 * @param customMaskTerms - 有効な登録語句
 */
function extractCustomMaskTermRegions(
  page: TesseractPage,
  customMaskTerms: readonly string[]
): OcrRegion[] {
  if (customMaskTerms.length === 0) {
    return [];
  }

  const matchedRanges: MatchedRange[] = [];
  const regions: OcrRegion[] = [];
  const paragraphs = page.blocks?.flatMap((block) => block.paragraphs) ?? [];

  if (paragraphs.length > 0) {
    for (const paragraph of paragraphs) {
      const words = paragraph.lines.flatMap((line) => line.words ?? []);
      regions.push(...detectCustomMaskTermsInWordGroup(words, customMaskTerms, matchedRanges));
    }
    return regions;
  }

  const lines = page.lines ?? [];
  if (lines.length > 0) {
    for (const line of lines) {
      const words = line.words ?? [];
      regions.push(...detectCustomMaskTermsInWordGroup(words, customMaskTerms, matchedRanges));
    }
    return regions;
  }

  const words = page.words ?? [];
  regions.push(...detectCustomMaskTermsInWordGroup(words, customMaskTerms, matchedRanges));
  return regions;
}

/**
 * マッチ範囲と重なる単語 bbox から OcrRegion を組み立てる
 *
 * @param matchText - マッチ文字列
 * @param patternType - パターン種別
 * @param matchStart - マッチ開始位置
 * @param matchEnd - マッチ終了位置
 * @param wordPositions - 単語位置一覧
 */
function buildRegionFromMatch(
  matchText: string,
  patternType: OcrPatternType,
  matchStart: number,
  matchEnd: number,
  wordPositions: WordPosition[]
): OcrRegion | null {
  const overlapping = wordPositions.filter((w) => w.start < matchEnd && w.end > matchStart);
  if (overlapping.length === 0) {
    return null;
  }

  const x0 = Math.min(...overlapping.map((w) => w.bbox.x0));
  const y0 = Math.min(...overlapping.map((w) => w.bbox.y0));
  const x1 = Math.max(...overlapping.map((w) => w.bbox.x1));
  const y1 = Math.max(...overlapping.map((w) => w.bbox.y1));

  return {
    x: x0,
    y: y0,
    width: x1 - x0,
    height: y1 - y0,
    text: matchText,
    patternType,
  };
}

/**
 * マッチ範囲が既存範囲と重複するか判定する
 */
function isRangeOverlapping(
  matchedRanges: MatchedRange[],
  matchStart: number,
  matchEnd: number
): boolean {
  return matchedRanges.some((range) => range.start < matchEnd && range.end > matchStart);
}

/**
 * 2つの OcrRegion の bbox が重なるか判定する
 *
 * @param a - 比較対象の領域A
 * @param b - 比較対象の領域B
 * @returns 重なる場合は true
 */
function isBboxOverlapping(a: OcrRegion, b: OcrRegion): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

/**
 * Tesseract.js の Page データから個人情報領域を抽出する
 *
 * @param page - Tesseract.js の認識結果ページ
 * @param customMaskTerms - ユーザー登録のマスク語句
 * @returns 検出された個人情報領域の配列
 */
function extractOcrRegions(
  page: TesseractPage,
  customMaskTerms: readonly string[] = []
): OcrRegion[] {
  const regions: OcrRegion[] = [];

  /**
   * blocks が null の場合（Tesseract の出力形式によって発生）は
   * page.lines に直接フォールバックする
   */
  const lines: TesseractLine[] =
    page.blocks != null
      ? page.blocks.flatMap((block) => block.paragraphs.flatMap((para) => para.lines))
      : (page.lines ?? []);

  if (lines.length > 0) {
    for (const line of lines) {
      const lineRegions = detectPersonalInfoInLine(line.text ?? "", line.words ?? [], []);
      regions.push(...lineRegions);
    }
    const customRegions = extractCustomMaskTermRegions(page, customMaskTerms);
    regions.push(...customRegions.filter((cr) => !regions.some((r) => isBboxOverlapping(r, cr))));
    return regions;
  }

  /**
   * lines も空の場合は page.words を直接使う。
   * 全単語テキストを結合してパターンマッチし、対応する単語の bbox を統合する。
   */
  const words = page.words ?? [];
  if (words.length > 0) {
    const fullText = words.map((w) => w.text).join(" ");
    regions.push(...detectPersonalInfoInLine(fullText, words, []));
    const customRegions = extractCustomMaskTermRegions(page, customMaskTerms);
    regions.push(...customRegions.filter((cr) => !regions.some((r) => isBboxOverlapping(r, cr))));
  }

  return regions;
}

/**
 * Tesseract Worker を生成し OCR 用パラメータを設定する
 *
 * PSM.AUTO: 名刺など散在テキストの行結合ミスを減らし、
 * 080-1234-5678 等の電話番号の取りこぼしを防ぐ（デフォルト PSM では未検出）。
 *
 * @returns 初期化済みの Tesseract Worker
 */
async function initializeTesseractWorker(): Promise<import("tesseract.js").Worker> {
  const { createWorker, OEM, PSM } = await import("tesseract.js");
  const worker = await createWorker(["jpn", "eng"], OEM.LSTM_ONLY);
  try {
    await worker.setParameters({ tessedit_pageseg_mode: PSM.AUTO });
    return worker;
  } catch (err) {
    try {
      await worker.terminate();
    } catch {
      /** 初期化失敗時の terminate はベストエフォート */
    }
    throw err;
  }
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
  /** Tesseract Worker のキャッシュ（インスタンス内で再利用） */
  const workerRef = useRef<Promise<import("tesseract.js").Worker> | null>(null);
  /** 最後に開始した認識リクエストのID（古い結果の state 上書きを防ぐ） */
  const recognizeRequestRef = useRef(0);
  /** 処理中リクエスト数（並列実行時に isRecognizing を正確に管理する） */
  const inFlightRef = useRef(0);

  /**
   * Tesseract Worker を取得する。初回のみ生成し以降はキャッシュを返す。
   *
   * @returns Tesseract Worker
   */
  const getWorker = useCallback((): Promise<import("tesseract.js").Worker> => {
    if (!workerRef.current) {
      /**
       * 初期化 Promise を先に workerRef.current へ格納する。
       * こうすることで、並列呼び出し時に複数の getWorker() が同時に
       * null 判定を通って Worker を重複生成するのを防ぐ。
       *
       * OEM.LSTM_ONLY を明示指定する（デフォルト値と同じだが意図を明確にする）。
       * jpn 訓練データが旧来エンジン専用のパラメータ `language_model_ngram_on` を
       * 参照するため、LSTM-only ビルドでは初期化時に
       * "Warning: Parameter not found: language_model_ngram_on" が出力されるが、
       * これは既知の無害な警告であり OCR の動作には影響しない。
       */
      const promise = initializeTesseractWorker();
      workerRef.current = promise;
      /** reject 時はキャッシュを破棄し、次回呼び出しで再生成できるようにする */
      promise.catch(() => {
        workerRef.current = null;
      });
      return promise;
    }
    return workerRef.current!;
  }, []);

  useEffect(() => {
    return () => {
      /** アンマウント時にWorkerを終了してリソースを解放 */
      const workerPromise = workerRef.current;
      workerRef.current = null;
      if (workerPromise) {
        void (async () => {
          try {
            const worker = await workerPromise;
            await worker.terminate();
          } catch {
            /** 終了処理の失敗はアンマウント時のベストエフォート */
          }
        })();
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
    async (
      imageElement: HTMLImageElement,
      options?: RecognizeTextOptions
    ): Promise<OcrRegion[]> => {
      const requestId = ++recognizeRequestRef.current;
      inFlightRef.current++;
      setIsRecognizing(true);

      const customMaskTerms = options?.customMaskTerms ?? [];

      try {
        const worker = await getWorker();
        const { data } = await worker.recognize(imageElement, {}, { blocks: true, text: true });

        const regions = extractOcrRegions(data as unknown as TesseractPage, customMaskTerms);

        if (requestId === recognizeRequestRef.current) {
          setOcrRegions(regions);
        }

        return regions;
      } catch (err) {
        if (requestId === recognizeRequestRef.current) {
          setOcrRegions([]);
        }
        /** 呼び出し元（MaskingGallery 等）でOCR失敗を検知できるよう再スロー */
        throw err;
      } finally {
        inFlightRef.current--;
        if (inFlightRef.current === 0) {
          setIsRecognizing(false);
        }
      }
    },
    [getWorker]
  );

  return { isRecognizing, ocrRegions, recognizeText };
}
