/**
 * Google AdSense の公開パブリッシャ ID（`ca-pub-...`）。
 *
 * 秘密情報ではなく、配布 HTML に必ず含まれる。変更時は AdSense コンソールの発行 ID に合わせ、
 * `public/ads.txt` の `pub-...` 行も同じパブリッシャ ID になるよう更新すること。
 */
export const ADSENSE_CLIENT_ID = "ca-pub-5141642513537299" as const;
