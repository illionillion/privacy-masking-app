/**
 * サイト全体の SEO 用コピー・キーワード定義。
 * layout / 各ページの metadata と、画面上の説明文で共有する。
 */

/** 検索流入を狙う主要キーワード（スペース区切りフレーズ） */
export const SITE_TARGET_KEYWORD_PHRASES = [
  "ブラウザ 顔隠し",
  "画像 個人情報 マスキング",
  "スクショ 個人情報 隠す",
  "写真 個人情報 消す",
  "AI マスキング",
  "自動 マスキング 無料",
  "顔隠し Webアプリ",
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
] as const;

/** 自動検出で拾えない箇所は手動調整できる旨（LP HowTo 等と同趣旨） */
export const MANUAL_MASKING_NOTE = "検出できない部分は手動で調整・追加できます。";

/** ルート layout のデフォルト description */
export const SITE_DEFAULT_DESCRIPTION =
  "伏せ太郎（Fusely）は顔隠しWebアプリ。写真・スクショの顔・文字を検出してマスキングできます。" +
  MANUAL_MASKING_NOTE +
  "自動マスキングは無料。サーバーへ画像を送らず、インストール・会員登録も不要です。";

/** トップページ（/）の title */
export const HOME_PAGE_TITLE = "伏せ太郎 | ブラウザで顔隠し・画像の個人情報マスキング（無料）";

/** LP（/lp）の title */
export const LP_PAGE_TITLE =
  "伏せ太郎 | 顔隠しWebアプリ - 写真・スクショの個人情報をブラウザで隠す";

/** LP（/lp）の description */
export const LP_PAGE_DESCRIPTION =
  "顔・文字を検出してマスキング。" +
  MANUAL_MASKING_NOTE +
  "写真やスクショをブラウザ内だけで処理し、サーバーに送信しません。無料・ログイン不要の顔隠しWebアプリです。";

/** トップページ h1 */
export const HOME_PAGE_HEADING = "ブラウザで顔隠し・画像の個人情報マスキング";

/** トップページ リード文（ヒーロー直下） */
export const HOME_PAGE_LEAD =
  "伏せ太郎（Fusely）は、写真やスクショの顔・文字を検出してマスキングできる無料ツールです。" +
  MANUAL_MASKING_NOTE +
  "画像はサーバーに送らず、ブラウザ内だけで処理します。";

/** トップページ 補足説明（ツール下・クローラー向け本文） */
export const HOME_PAGE_ABOUT =
  "イベント写真の顔隠し、社内スクショの個人情報の隠蔽、SNS投稿前の加工などに使えます。自動マスキングは無料。アプリのインストールや会員登録は不要で、ファイルを選ぶだけです（画像を外部サーバーへアップロードすることはありません）。";
