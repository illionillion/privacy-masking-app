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
 * @param text - 検証対象（ドット付き IPv4 埋め込みは isValidIpv4EmbeddedIpv6 で扱う）
 */
export function isValidIpv6(text: string): boolean {
  if (text.length === 0 || text.includes(":::") || text.includes(".")) {
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
 * IPv4 埋め込み IPv6（例: `::ffff:192.0.2.128`）か判定する
 *
 * 末尾のドット付き IPv4 を 2 つの hextet に置き換えて IPv6 として検証する。
 *
 * @param text - 検証対象
 */
function isValidIpv4EmbeddedIpv6(text: string): boolean {
  const match = /^(.+):(\d{1,3}(?:\.\d{1,3}){3})$/.exec(text);
  if (match === null) {
    return false;
  }
  const ipv6Prefix = match[1]!;
  const ipv4Part = match[2]!;
  if (!isValidIpv4(ipv4Part)) {
    return false;
  }
  const octets = ipv4Part.split(".").map((part) => Number(part));
  const high = ((octets[0]! << 8) | octets[1]!).toString(16);
  const low = ((octets[2]! << 8) | octets[3]!).toString(16);
  return isValidIpv6(`${ipv6Prefix}:${high}:${low}`);
}

/**
 * IPv4（任意でポート付き）または IPv6 として有効か判定する
 *
 * @param text - 検証対象
 */
export function isValidIpAddress(text: string): boolean {
  if (text.includes(".")) {
    if (isValidIpv4EmbeddedIpv6(text)) {
      return true;
    }
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
 * 明示的な IP ラベル（`IP` / `IPv4` / `IPv6`）か判定する
 *
 * 英字だけの IPv6 先頭グループ（例: `abcd`）をラベルと誤認しない。
 *
 * @param label - コロン直前の文字列
 */
function isAddressLabel(label: string): boolean {
  return /^(?:IP|IPv4|IPv6)$/i.test(label);
}

/** 行内で検出した IP アドレスの範囲 */
export interface IpMatchRange {
  start: number;
  end: number;
  text: string;
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
 * 生トークンから区切り記号を剥がし、有効な IP 範囲へ正規化する
 *
 * - 直前が区切り（非十六進）の先頭単独 `:` を除去（`Address:192.168.0.1`）
 * - 文末句点の末尾 `.` を除去（`192.168.0.1.`）
 * - `::` 開始や `:1:2:...` の不正形は維持して棄却させる
 *
 * @param lineText - 行テキスト
 * @param rawStart - 生トークン開始位置
 * @param rawText - 生トークン
 */
function normalizeIpToken(
  lineText: string,
  rawStart: number,
  rawText: string
): IpMatchRange | null {
  let text = rawText;
  let start = rawStart;
  let end = rawStart + rawText.length;

  if (text.startsWith(":") && !text.startsWith("::")) {
    const prev = rawStart > 0 ? lineText[rawStart - 1]! : "";
    if (prev !== "" && !/[0-9a-fA-F:]/.test(prev)) {
      text = text.slice(1);
      start += 1;
    }
  }

  while (text.endsWith(".")) {
    text = text.slice(0, -1);
    end -= 1;
  }

  if (text.endsWith(":") && !text.endsWith("::")) {
    text = text.slice(0, -1);
    end -= 1;
  }

  if (text.length === 0 || !isValidIpAddress(text)) {
    return null;
  }

  return { start, end, text };
}

/**
 * 行テキストから有効な IP アドレス（IPv4 / IPv6）を検出する
 *
 * 1. 明示ラベル形式（`IP:` / `IPv4:` / `IPv6:`）
 * 2. `[0-9a-fA-F:.]+` のトークンを正規化して検証
 *
 * ラベル値はキャプチャ全体が有効な IP である必要があり、終端直後が
 * 英数字・`.`・`:` なら棄却する（部分一致の誤検出を防ぐ）。
 *
 * @param lineText - OCR 結果の行テキスト
 * @returns 検出した IP の範囲（出現順・非重複）
 */
export function findIpMatches(lineText: string): IpMatchRange[] {
  const matches: IpMatchRange[] = [];

  const labelPattern = /\b(IP(?:v[46])?):([0-9a-fA-F:.]+)/gi;
  let labelMatch: RegExpExecArray | null;
  while ((labelMatch = labelPattern.exec(lineText)) !== null) {
    const label = labelMatch[1]!;
    if (!isAddressLabel(label)) {
      continue;
    }
    const ipText = labelMatch[2]!;
    const ipStart = labelMatch.index + label.length + 1;
    const ipEnd = ipStart + ipText.length;
    /**
     * 区切りコロンの直後がさらにコロンなら `IP:::` のような不正形。
     * （区切りと圧縮 `::` が連続している）
     */
    if (ipText.startsWith(":")) {
      continue;
    }
    /** ラベル値全体が IP で、終端がトークン途中でないこと */
    if (!isValidIpAddress(ipText)) {
      continue;
    }
    if (ipEnd < lineText.length && /[0-9a-zA-Z:.]/.test(lineText[ipEnd]!)) {
      continue;
    }
    if (!isOverlapping(matches, ipStart, ipEnd)) {
      matches.push({ start: ipStart, end: ipEnd, text: ipText });
    }
  }

  const tokenPattern = /[0-9a-fA-F:.]+/g;
  let tokenMatch: RegExpExecArray | null;
  while ((tokenMatch = tokenPattern.exec(lineText)) !== null) {
    const rawStart = tokenMatch.index;
    const rawEnd = rawStart + tokenMatch[0].length;
    if (isOverlapping(matches, rawStart, rawEnd)) {
      continue;
    }

    const normalized = normalizeIpToken(lineText, rawStart, tokenMatch[0]);
    if (normalized === null) {
      continue;
    }
    if (isOverlapping(matches, normalized.start, normalized.end)) {
      continue;
    }

    /** 正規化後も英数字に隣接する部分トークンは採用しない */
    if (normalized.start > 0 && /[0-9a-zA-Z.]/.test(lineText[normalized.start - 1]!)) {
      continue;
    }
    /** 直後の英数字・コロンはトークン途中。文末の `.` は句点として許容する */
    if (normalized.end < lineText.length && /[0-9a-zA-Z:]/.test(lineText[normalized.end]!)) {
      continue;
    }

    matches.push(normalized);
  }

  matches.sort((a, b) => a.start - b.start);
  return matches;
}
