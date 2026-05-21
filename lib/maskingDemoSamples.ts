/** Before/After デモ用のサンプル画像ペア */
export type MaskingDemoSample = {
  label: string;
  description: string;
  beforeSrc: string;
  afterSrc: string;
  beforeAlt: string;
  afterAlt: string;
};

/** LP・トップで共有するデモ一覧（表示順） */
export const MASKING_DEMO_SAMPLES: readonly MaskingDemoSample[] = [
  {
    label: "集合写真",
    description: "複数人の顔を一括検出してマスキング",
    beforeSrc: "/lp/sample1.png",
    afterSrc: "/lp/sample1-masked.png",
    beforeAlt: "集合写真のマスキング処理前",
    afterAlt: "集合写真のマスキング処理後",
  },
  {
    label: "名刺",
    description: "電話番号・メールアドレスなどの文字情報を黒塗り",
    beforeSrc: "/lp/sample2.png",
    afterSrc: "/lp/sample2-masked.png",
    beforeAlt: "名刺のマスキング処理前",
    afterAlt: "名刺のマスキング処理後",
  },
  {
    label: "トーク画面",
    description: "投稿された顔写真とメッセージ内の個人情報を同時にマスキング",
    beforeSrc: "/lp/sample3.png",
    afterSrc: "/lp/sample3-masked.png",
    beforeAlt: "トーク画面のマスキング処理前",
    afterAlt: "トーク画面のマスキング処理後",
  },
] as const;

/** トップのコンパクトデモで使う代表サンプル（先頭＝集合写真） */
export const PRIMARY_MASKING_DEMO = MASKING_DEMO_SAMPLES[0];
