/**
 * HTML の script タグ内に安全に埋め込むための JSON-LD シリアライズ。
 * `JSON.stringify` 後に `<` / `>` を Unicode エスケープし、`</script>` によるタグ破断を防ぐ。
 */
export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c").replace(/>/g, "\\u003e");
}
