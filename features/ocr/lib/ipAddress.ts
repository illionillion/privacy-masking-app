/**
 * IPv4 / IPv6 アドレスの検証と、OCR 行テキストからの検出
 */

/** IPv6 の 1 グループ（1–4 桁の十六進）か判定する */
function isIpv6Group(group: string): boolean {
  return /^[0-9a-fA-F]{1,4}$/.test(group);
}

/**
 * IPv4 アドレス（ドット区切り・各オクテット 0–255）か判定する
 *
 * @param text - 検証対象（ポートなし）
 */
export function isValidIpv4(text: string): boolean {
  const parts = text.split(".");
  if (parts.length !== 4) {
    return false;
  }
  return parts.every((part) => {
    if (!/^\d{1,3}$/.test(part)) {
      return false;
    }
    const value = Number(part);
    return value >= 0 && value <= 255;
  });
}

/**
 * IPv6 アドレス（フル形式・圧縮形式・`::`）か判定する
 *
 * @param text - 検証対象
 */
export function isValidIpv6(text: string): boolean {
  if (text.length === 0 || text.includes(":::")) {
    return false;
  }

  const compressionMatches = text.match(/::/g);
  if (compressionMatches !== null && compressionMatches.length > 1) {
    return false;
  }

  if (text.includes("::")) {
    const [left = "", right = ""] = text.split("::");
    if (left.startsWith(":") || left.endsWith(":")) {
      return false;
    }
    if (right.startsWith(":") || right.endsWith(":")) {
      return false;
    }
    const leftGroups = left === "" ? [] : left.split(":");
    const rightGroups = right === "" ? [] : right.split(":");
    if (leftGroups.some((group) => !isIpv6Group(group))) {
      return false;
    }
    if (rightGroups.some((group) => !isIpv6Group(group))) {
      return false;
    }
    /** 圧縮は少なくとも 1 グループ分を省略する必要がある（`::` 単体は 0 グループで可） */
    const groupCount = leftGroups.length + rightGroups.length;
    return groupCount < 8;
  }

  if (text.startsWith(":") || text.endsWith(":")) {
    return false;
  }

  const groups = text.split(":");
  return groups.length === 8 && groups.every((group) => isIpv6Group(group));
}

/**
 * IPv4（任意でポート付き）または IPv6 として有効か判定する
 *
 * @param text - 検証対象
 */
export function isValidIpAddress(text: string): boolean {
  if (text.includes(".")) {
    const withPort = /^(.+):(\d{1,5})$/.exec(text);
    if (withPort !== null && withPort[1]!.includes(".")) {
      const port = Number(withPort[2]);
      return isValidIpv4(withPort[1]!) && port >= 1 && port <= 65535;
    }
    return isValidIpv4(text);
  }
  return isValidIpv6(text);
}

/**
 * `IP:` / `IPv6:` のようなラベルか判定する
 *
 * 英字2文字以上＋末尾の短い数字（IPv4 / IPv6）のみをラベルとする。
 * `x` や `x2001` のようなアドレス断片は除外する。
 *
 * @param label - コロン直前の文字列
 */
function isAddressLabel(label: string): boolean {
  return /^[a-zA-Z]{2,}[0-9]{0,2}$/.test(label);
}

/** 行内で検出した IP アドレスの範囲 */
export interface IpMatchRange {
  start: number;
  end: number;
  text: string;
}

/**
 * 指定位置から始まる最長の有効 IP を返す
 *
 * @param lineText - 行テキスト
 * @param start - 開始位置
 * @param maxEnd - 終了位置の上限（排他的）
 */
function longestValidIpFrom(lineText: string, start: number, maxEnd: number): IpMatchRange | null {
  for (let end = maxEnd; end > start; end -= 1) {
    const text = lineText.slice(start, end);
    if (isValidIpAddress(text)) {
      return { start, end, text };
    }
  }
  return null;
}

/**
 * 範囲が既存マッチと重なるか判定する
 *
 * @param ranges - 既存範囲
 * @param start - 開始
 * @param end - 終了（排他的）
 */
function isOverlapping(ranges: readonly IpMatchRange[], start: number, end: number): boolean {
  return ranges.some((range) => start < range.end && end > range.start);
}

/**
 * 行テキストから有効な IP アドレス（IPv4 / IPv6）を検出する
 *
 * 1. `Label:address` 形式（IPv6:2001:... など）
 * 2. `[0-9a-fA-F:.]+` の極大トークン全体が IP になる場合
 *
 * 極大トークンの部分文字列は採用しない（`x2001:db8::1` や `x:::` の誤検出を防ぐ）。
 *
 * @param lineText - OCR 結果の行テキスト
 * @returns 検出した IP の範囲（出現順・非重複）
 */
export function findIpMatches(lineText: string): IpMatchRange[] {
  const matches: IpMatchRange[] = [];

  const labelPattern = /([a-zA-Z][a-zA-Z0-9]*):([0-9a-fA-F:.]+)/g;
  let labelMatch: RegExpExecArray | null;
  while ((labelMatch = labelPattern.exec(lineText)) !== null) {
    const label = labelMatch[1]!;
    if (!isAddressLabel(label)) {
      continue;
    }
    const ipStart = labelMatch.index + label.length + 1;
    const ipMaxEnd = ipStart + labelMatch[2]!.length;
    const found = longestValidIpFrom(lineText, ipStart, ipMaxEnd);
    if (found !== null && !isOverlapping(matches, found.start, found.end)) {
      matches.push(found);
    }
  }

  const tokenPattern = /[0-9a-fA-F:.]+/g;
  let tokenMatch: RegExpExecArray | null;
  while ((tokenMatch = tokenPattern.exec(lineText)) !== null) {
    const start = tokenMatch.index;
    const end = start + tokenMatch[0].length;
    if (isOverlapping(matches, start, end)) {
      continue;
    }
    /** 英数字に隣接する部分トークンは採用しない（例: x2001:db8::1） */
    if (start > 0 && /[0-9a-zA-Z.]/.test(lineText[start - 1]!)) {
      continue;
    }
    if (end < lineText.length && /[0-9a-zA-Z:.]/.test(lineText[end]!)) {
      continue;
    }
    /** 極大トークン全体が IP のときだけ採用する（部分一致はしない） */
    if (isValidIpAddress(tokenMatch[0])) {
      matches.push({ start, end, text: tokenMatch[0] });
    }
  }

  matches.sort((a, b) => a.start - b.start);
  return matches;
}
