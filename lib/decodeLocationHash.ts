/**
 * location.hash から取り出した文字列を安全にデコードする。
 */
export function decodeLocationHash(hash: string): string {
  if (hash.length === 0) {
    return hash;
  }

  try {
    return decodeURIComponent(hash);
  } catch {
    return hash;
  }
}
