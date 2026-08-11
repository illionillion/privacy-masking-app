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
    label: "行事・集合写真",
    description: "複数人の顔を一括検出してマスキング",
    beforeSrc: "/lp/sample1.png",
    afterSrc: "/lp/sample1-masked.png",
    beforeAlt: "行事・集合写真のマスキング処理前",
    afterAlt: "行事・集合写真のマスキング処理後",
  },
  {
    label: "名刺・連絡先",
    description: "電話番号・メールなどの文字を検出して黒塗り",
    beforeSrc: "/lp/sample2.png",
    afterSrc: "/lp/sample2-masked.png",
    beforeAlt: "名刺・連絡先のマスキング処理前",
    afterAlt: "名刺・連絡先のマスキング処理後",
  },
  {
    label: "チャットのスクショ",
    description: "添付写真の顔と、メッセージ内の個人情報を同時にマスキング",
    beforeSrc: "/lp/sample3.png",
    afterSrc: "/lp/sample3-masked.png",
    beforeAlt: "チャットのスクショのマスキング処理前",
    afterAlt: "チャットのスクショのマスキング処理後",
  },
] as const;

/** トップのコンパクトデモで使う代表サンプル（先頭＝行事・集合写真） */
export const PRIMARY_MASKING_DEMO = MASKING_DEMO_SAMPLES[0];
