import { IdCard, Image as ImageIcon, MessagesSquare } from "lucide-react";

/** ユースケースセクション */
export function UseCasesSection() {
  const cases = [
    {
      icon: ImageIcon,
      title: "行事写真の公開前",
      description:
        "運動会や発表会など、子どもや参加者の顔が写る写真を公開する前に一括マスキング。同意のない写り込みもブラウザだけで隠せます。",
      tag: "行事・SNS",
      tagColor: "bg-sky-100 text-sky-700",
    },
    {
      icon: MessagesSquare,
      title: "チャット共有前のスクショ",
      description:
        "Slack や社内チャットに貼る前に、添付写真の顔とメッセージ内の電話・メールをまとめて隠します。インストール不要です。",
      tag: "ビジネス",
      tagColor: "bg-violet-100 text-violet-700",
    },
    {
      icon: IdCard,
      title: "名刺・画面の文字隠し",
      description:
        "名刺や資料スクショに写った連絡先を検出して黒塗り。顔だけ・文字だけに分かれない加工を、1つのツールで行えます。",
      tag: "文字・OCR",
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
          <p className="mt-3 text-zinc-500">顔だけ・文字だけ、に分かれない公開前チェック向け</p>
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
