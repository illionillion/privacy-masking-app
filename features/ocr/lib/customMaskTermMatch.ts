import type { OcrRegion } from "../types";

/** OCR 単語の bbox */
interface MatchBbox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/** カスタム語句マッチ用の単語 */
export interface CustomMaskMatchWord {
  text: string;
  bbox: MatchBbox;
}

/** 単語テキスト上の文字位置 */
interface WordPosition {
  start: number;
  end: number;
  bbox: MatchBbox;
}

/** マッチ済み文字範囲 */
interface MatchedRange {
  start: number;
  end: number;
}

/** 空白除去後テキストと元テキストの対応 */
interface CollapsedTextIndex {
  collapsed: string;
  startIndices: number[];
}

/**
 * マッチ比較用に空白を除去する（半角・全角・改行など Unicode 空白）
 *
 * @param text - 入力文字列
 */
export function stripWhitespaceForMatch(text: string): string {
  return text.replace(/\s+/gu, "");
}

/**
 * 空白を除いた文字列と、元テキスト上の開始インデックス対応を構築する
 *
 * @param lineText - OCR 行テキスト
 */
export function buildCollapsedTextIndex(lineText: string): CollapsedTextIndex {
  const startIndices: number[] = [];
  let collapsed = "";

  for (let index = 0; index < lineText.length; index++) {
    const char = lineText[index]!;
    if (!/\s/u.test(char)) {
      collapsed += char;
      startIndices.push(index);
    }
  }

  return { collapsed, startIndices };
}

/**
 * 空白の有無を無視して語句が出現する文字範囲を列挙する
 *
 * @param lineText - OCR 行テキスト
 * @param term - 登録語句
 */
export function findWhitespaceFlexibleTermRanges(
  lineText: string,
  term: string
): Array<{ start: number; end: number }> {
  const collapsedTerm = stripWhitespaceForMatch(term);
  if (collapsedTerm.length === 0) {
    return [];
  }

  const { collapsed, startIndices } = buildCollapsedTextIndex(lineText);
  const ranges: Array<{ start: number; end: number }> = [];
  let searchFrom = 0;

  while (searchFrom <= collapsed.length - collapsedTerm.length) {
    const matchIndex = collapsed.indexOf(collapsedTerm, searchFrom);
    if (matchIndex === -1) {
      break;
    }

    const start = startIndices[matchIndex]!;
    const lastCharIndex = startIndices[matchIndex + collapsedTerm.length - 1]!;
    ranges.push({ start, end: lastCharIndex + 1 });
    searchFrom = matchIndex + collapsedTerm.length;
  }

  return ranges;
}

/**
 * 単語配列から行テキストを組み立てる（単語間は半角スペース）
 *
 * @param words - OCR 単語一覧
 */
export function buildLineTextFromWords(words: readonly CustomMaskMatchWord[]): string {
  return words.map((word) => word.text).join(" ");
}

/**
 * 行テキストと単語配列から文字位置マップを構築する
 *
 * @param words - OCR 単語一覧
 */
export function buildWordPositions(words: readonly CustomMaskMatchWord[]): WordPosition[] {
  let position = 0;
  return words.map((word) => {
    const start = position;
    const end = position + word.text.length;
    position = end + 1;
    return { start, end, bbox: word.bbox };
  });
}

/**
 * マッチ範囲が既存範囲と重複するか判定する
 */
function isRangeOverlapping(
  matchedRanges: readonly MatchedRange[],
  matchStart: number,
  matchEnd: number
): boolean {
  return matchedRanges.some((range) => range.start < matchEnd && range.end > matchStart);
}

/**
 * マッチ範囲と重なる単語 bbox から OcrRegion を組み立てる
 */
function buildRegionFromMatch(
  matchText: string,
  matchStart: number,
  matchEnd: number,
  wordPositions: readonly WordPosition[]
): OcrRegion | null {
  const overlapping = wordPositions.filter(
    (word) => word.start < matchEnd && word.end > matchStart
  );
  if (overlapping.length === 0) {
    return null;
  }

  const x0 = Math.min(...overlapping.map((word) => word.bbox.x0));
  const y0 = Math.min(...overlapping.map((word) => word.bbox.y0));
  const x1 = Math.max(...overlapping.map((word) => word.bbox.x1));
  const y1 = Math.max(...overlapping.map((word) => word.bbox.y1));

  return {
    x: x0,
    y: y0,
    width: x1 - x0,
    height: y1 - y0,
    text: matchText,
    patternType: "custom",
  };
}

/**
 * 単語グループ（1行または段落）からカスタムマスク語句を検出する
 *
 * OCR で単語が分割されても、登録語句内の空白差（例: 山田太郎 / 山田　太郎）は無視して照合する。
 *
 * @param words - 照合対象の OCR 単語（読み順）
 * @param customMaskTerms - 有効な登録語句
 * @param matchedRanges - 既存マッチ範囲（更新される）
 */
export function detectCustomMaskTermsInWordGroup(
  words: readonly CustomMaskMatchWord[],
  customMaskTerms: readonly string[],
  matchedRanges: MatchedRange[]
): OcrRegion[] {
  if (words.length === 0 || customMaskTerms.length === 0) {
    return [];
  }

  const lineText = buildLineTextFromWords(words);
  const wordPositions = buildWordPositions(words);
  const regions: OcrRegion[] = [];
  const sortedTerms = [...customMaskTerms]
    .filter((term) => stripWhitespaceForMatch(term).length > 0)
    .sort((a, b) => stripWhitespaceForMatch(b).length - stripWhitespaceForMatch(a).length);

  for (const term of sortedTerms) {
    const ranges = findWhitespaceFlexibleTermRanges(lineText, term);

    for (const { start, end } of ranges) {
      if (isRangeOverlapping(matchedRanges, start, end)) {
        continue;
      }

      const region = buildRegionFromMatch(term, start, end, wordPositions);
      if (region) {
        regions.push(region);
        matchedRanges.push({ start, end });
      }
    }
  }

  return regions;
}
