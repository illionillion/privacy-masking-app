/** スタンプ画像 1 件の定義 */
export interface StampCatalogEntry {
  /** 画像ファイル名（/public/stamps/ 配下） */
  fileName: string;
  /** 絵文字（select の先頭に表示） */
  emoji: string;
  /** 日本語ラベル */
  label: string;
}

/**
 * スタンプ画像カタログ（ファイル名・絵文字・ラベルの対応表）
 *
 * /public/stamps/ に配置された画像ファイルと 1:1 対応する。
 * 追加・削除はこの配列のみ変更すれば良い。
 */
export const STAMP_CATALOG: readonly StampCatalogEntry[] = [
  { fileName: "beaming_face_with_smiling_eyes-64.png", emoji: "😁", label: "はにかみ笑顔" },
  { fileName: "face_with_tears_of_joy-64.png", emoji: "😂", label: "爆笑" },
  { fileName: "grinning_face-64.png", emoji: "😀", label: "笑顔" },
  { fileName: "grinning_face_with_big_eyes-64.png", emoji: "😃", label: "目を見開いた笑顔" },
  { fileName: "grinning_face_with_smiling_eyes-64.png", emoji: "😄", label: "目も笑う笑顔" },
  { fileName: "grinning_squinting_face-64.png", emoji: "😆", label: "目を細めた笑顔" },
  { fileName: "rolling_on_the_floor_laughing-64.png", emoji: "🤣", label: "床を転げる笑い" },
  { fileName: "smiling_face_with_halo-64.png", emoji: "😇", label: "天使の笑顔" },
  { fileName: "smiling_face_with_hearts-64.png", emoji: "🥰", label: "ハートの笑顔" },
  { fileName: "smiling_face_with_smiling_eyes-64.png", emoji: "😊", label: "穏やかな笑顔" },
  { fileName: "winking_face-64.png", emoji: "😉", label: "ウィンク" },
];

/** スタンプ画像のファイル名一覧（STAMP_CATALOG から生成） */
export const STAMP_FILE_NAMES: readonly string[] = STAMP_CATALOG.map((s) => s.fileName);
