import { Download, Upload, Wand2 } from "lucide-react";

/** 3ステップの使い方セクション */
export function HowToSection() {
  const steps = [
    {
      step: "01",
      icon: Upload,
      title: "画像をドラッグ＆ドロップ",
      description:
        "対応形式は JPEG・PNG・WebP・GIF。ファイルをブラウザにドロップするだけで読み込み完了。",
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      ring: "ring-indigo-100",
    },
    {
      step: "02",
      icon: Wand2,
      title: "自動または手動でマスク処理",
      description:
        "顔・文字を検出してマスキング範囲を提案。検出できない部分は手動で調整・追加できます。",
      color: "text-violet-600",
      bg: "bg-violet-50",
      ring: "ring-violet-100",
    },
    {
      step: "03",
      icon: Download,
      title: "マスク済み画像をダウンロード",
      description: "処理が完了したらボタン1つでダウンロード。元の画像には一切手を加えません。",
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      ring: "ring-emerald-100",
    },
  ] as const;

  return (
    <section className="bg-zinc-50 px-4 py-20">
      <div className="mx-auto max-w-4xl">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            たった3ステップで完了
          </h2>
          <p className="mt-3 text-zinc-500">操作は直感的。難しい設定は不要です</p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {steps.map(({ step, icon: Icon, title, description, color, bg, ring }) => (
            <div
              key={step}
              className="relative flex flex-col rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
            >
              <div className="mb-4 flex items-center gap-3">
                <span className="text-4xl font-extrabold text-zinc-300">{step}</span>
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${bg} ${ring} ring-2`}
                >
                  <Icon className={`h-5 w-5 ${color}`} aria-hidden="true" />
                </div>
              </div>
              <h3 className="mb-2 text-base font-bold text-zinc-900">{title}</h3>
              <p className="text-sm leading-relaxed text-zinc-500">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
