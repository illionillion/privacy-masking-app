import { Image as ImageIcon, Monitor, UserX } from "lucide-react";

/** ユースケースセクション */
export function UseCasesSection() {
  const cases = [
    {
      icon: ImageIcon,
      title: "SNS投稿前の画像編集",
      description:
        "インスタグラムやXへの投稿前に、写真に写り込んだ顔や個人情報をAIマスキングでサッと消去。スマホのブラウザからも顔隠しできます。",
      tag: "個人利用",
      tagColor: "bg-sky-100 text-sky-700",
    },
    {
      icon: Monitor,
      title: "社内資料・スクショの共有",
      description:
        "スクショの個人情報（メール・電話番号など）を隠してから社外共有。ブラウザだけで画像マスキングでき、情報漏洩リスクを低減します。",
      tag: "ビジネス",
      tagColor: "bg-violet-100 text-violet-700",
    },
    {
      icon: UserX,
      title: "イベント・オフ会写真の加工",
      description:
        "同意を得ていない参加者の顔をマスキングしてから公開。プライバシーに配慮したイベントレポートが作れます。",
      tag: "コミュニティ",
      tagColor: "bg-emerald-100 text-emerald-700",
    },
  ] as const;

  return (
    <section className="bg-zinc-50 px-4 py-20">
      <div className="mx-auto max-w-4xl">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            こんな場面で使われています
          </h2>
          <p className="mt-3 text-zinc-500">幅広いシーンでプライバシー保護をサポートします</p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {cases.map(({ icon: Icon, title, description, tag, tagColor }) => (
            <div
              key={title}
              className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100">
                  <Icon className="h-6 w-6 text-zinc-600" aria-hidden="true" />
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${tagColor}`}>
                  {tag}
                </span>
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
