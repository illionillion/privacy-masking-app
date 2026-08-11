/**
 * サイト全体の SEO 用コピー・キーワード定義。
 * layout / 各ページの metadata と、画面上の説明文で共有する。
 */

/** 検索流入を狙う主要キーワード（スペース区切りフレーズ） */
export const SITE_TARGET_KEYWORD_PHRASES = [
  "画像 個人情報 マスキング",
  "スクショ 個人情報 隠す",
  "スクショ 顔 隠す",
  "写真 個人情報 消す",
  "ブラウザ 顔隠し",
  "顔隠し Webアプリ",
  "電話番号 画像 隠す",
  "自動 マスキング 無料",
  "アップロード不要 マスキング",
] as const;

/** `metadata.keywords` 用（ブランド名 + 主要フレーズ + 関連語） */
export const SITE_METADATA_KEYWORDS = [
  "伏せ太郎",
  "Fusely",
  ...SITE_TARGET_KEYWORD_PHRASES,
  "顔隠し",
  "個人情報 保護",
  "モザイク",
  "ぼかし",
  "黒塗り",
  "OCR",
] as const;

/** 自動検出で拾えない箇所は手動調整できる旨（LP HowTo 等と同趣旨） */
export const MANUAL_MASKING_NOTE = "検出できない部分は手動で調整・追加できます。";

/** ルート layout のデフォルト description */
export const SITE_DEFAULT_DESCRIPTION =
  "伏せ太郎（Fusely）は、写真・スクショの顔と文字（電話・メールなど）を検出してマスキングできる無料ツールです。" +
  MANUAL_MASKING_NOTE +
  "サーバーへ画像を送らず、インストール・会員登録も不要の顔隠しWebアプリです。";

/** トップページ（/）の title — サービス紹介 LP */
export const HOME_PAGE_TITLE = "伏せ太郎 | 写真・スクショの顔と文字をブラウザで隠す";

/** トップページ（/）の description */
export const HOME_PAGE_DESCRIPTION =
  "顔と文字を検出してマスキング。" +
  MANUAL_MASKING_NOTE +
  "写真やチャットのスクショをブラウザ内だけで処理し、サーバーに送信しません。無料・ログイン不要です。";

/** マスキングツール（/app）の h1 */
export const APP_PAGE_HEADING = "ブラウザで顔と文字をマスキング";

/** マスキングツール（/app）のリード文 */
export const APP_PAGE_LEAD =
  "伏せ太郎（Fusely）— 写真やスクショの顔・文字を、ブラウザ内だけでマスキングできる無料ツールです。";

/** マスキングツール（/app）使い例セクションの補足説明 */
export const APP_PAGE_ABOUT =
  "行事写真の顔隠し、チャット共有前のスクショ、名刺や画面の文字隠しなどに使えます。" +
  MANUAL_MASKING_NOTE +
  "自動マスキングは無料。インストール・会員登録は不要で、画像はサーバーに送信しません。";
