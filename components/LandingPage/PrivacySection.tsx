import { Lock, Monitor, ShieldCheck } from "lucide-react";

/** プライバシー説明セクション */
export function PrivacySection() {
  const features = [
    {
      icon: Lock,
      title: "画像はサーバーに送信されない",
      description:
        "アップロードした画像データは一切外部に送信されません。すべての処理はお使いのブラウザ内のみで実行されます。",
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
    {
      icon: Monitor,
      title: "すべてブラウザ内で処理",
      description:
        "顔検出・OCR・マスキングはすべてデバイス上のJavaScriptで完結します。画像データの処理はブラウザ内のみです（ページ表示や初回モデル取得など、通信が必要な場合を除く）。",
      color: "text-violet-600",
      bg: "bg-violet-50",
    },
    {
      icon: ShieldCheck,
      title: "ログイン不要・登録不要",
      description: "URLを開いてすぐ使えます。会員登録・インストールは不要で、画像を選ぶだけです。",
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
  ] as const;

  return (
    <section className="bg-white px-4 py-20">
      <div className="mx-auto max-w-4xl">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            プライバシーを最優先に設計
          </h2>
          <p className="mt-3 text-zinc-500">大切な画像データは、あなたのデバイスから出ません</p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {features.map(({ icon: Icon, title, description, color, bg }) => (
            <div
              key={title}
              className="flex flex-col items-center rounded-2xl border border-zinc-100 bg-zinc-50 p-6 text-center shadow-sm"
            >
              <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${bg}`}>
                <Icon className={`h-7 w-7 ${color}`} aria-hidden="true" />
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
