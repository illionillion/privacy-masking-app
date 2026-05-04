import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle,
  Download,
  Image as ImageIcon,
  Lock,
  Monitor,
  ShieldCheck,
  Upload,
  UserX,
  Wand2,
} from "lucide-react";

export const metadata: Metadata = {
  title: "伏せ太郎 | Fusely - ブラウザだけで画像の個人情報を安全に隠せるツール",
  description:
    "顔・テキストをブラウザだけで自動検出してマスキング。画像はサーバーに送信しない完全プライベートツール。",
};

/** ヒーローセクション */
function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-indigo-800 to-violet-900 px-4 py-12 text-center sm:py-20">
      {/* 背景装飾 */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-violet-500/10 blur-2xl" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-indigo-400/10 blur-2xl" />
      </div>

      <div className="relative mx-auto max-w-3xl">
        {/* バッジ */}
        <span className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-indigo-400/40 bg-indigo-400/10 px-4 py-1.5 text-sm font-medium text-indigo-200">
          <ShieldCheck className="h-4 w-4" />
          完全無料・ログイン不要・サーバー送信なし
        </span>

        <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
          <span className="mb-2 flex items-center justify-center gap-2 text-indigo-300">
            伏せ太郎
            <Image
              src="/fusely-icon.png"
              alt="伏せ太郎のアイコン"
              width={72}
              height={72}
              priority
              className="drop-shadow-2xl"
            />
          </span>
          ブラウザだけで画像の
          <br className="hidden sm:block" />
          個人情報を安全に隠せる
        </h1>

        <p className="mt-6 text-lg leading-relaxed text-indigo-100 sm:text-xl">
          顔・テキストを自動検出してモザイク・黒塗りでマスキング。
          <br className="hidden sm:block" />
          画像はあなたのブラウザの中だけで処理されます。
        </p>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-bold text-indigo-900 shadow-lg transition-all hover:bg-indigo-50 hover:shadow-xl active:scale-95"
          >
            今すぐ使う
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/** デモ用 Before/After ペアの型定義 */
type DemoItem = {
  label: string;
  description: string;
  beforeSrc: string;
  afterSrc: string;
  beforeAlt: string;
  afterAlt: string;
};

/** Before/After デモセクション */
function DemoSection() {
  const demos: DemoItem[] = [
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
      description: "氏名・電話番号・メールアドレスなどのテキストを黒塗り",
      beforeSrc: "/lp/sample1.png",
      afterSrc: "/lp/sample1-masked.png",
      beforeAlt: "名刺のマスキング処理前",
      afterAlt: "名刺のマスキング処理後",
    },
    {
      label: "トーク画面",
      description: "投稿された顔写真とメッセージ内の個人情報を同時にマスキング",
      beforeSrc: "/lp/sample1.png",
      afterSrc: "/lp/sample1-masked.png",
      beforeAlt: "トーク画面のマスキング処理前",
      afterAlt: "トーク画面のマスキング処理後",
    },
  ];

  return (
    <section className="bg-white px-4 py-20">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            こんな感じでマスキングできます
          </h2>
          <p className="mt-3 text-zinc-500">
            顔・名前・電話番号など個人情報をワンクリックで隠せます
          </p>
        </div>

        <div className="space-y-10">
          {demos.map(({ label, description, beforeSrc, afterSrc, beforeAlt, afterAlt }) => (
            <div key={label}>
              {/* ラベル・説明 */}
              <div className="mb-4">
                <span className="mr-2 inline-block rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                  {label}
                </span>
                <span className="text-sm text-zinc-500">{description}</span>
              </div>

              {/* Before/After グリッド */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Before */}
                <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
                  <div className="border-b border-zinc-100 bg-zinc-50 px-5 py-3">
                    <span className="text-sm font-semibold text-zinc-500">処理前</span>
                  </div>
                  <div className="p-5">
                    <div className="overflow-hidden rounded-xl">
                      <Image
                        src={beforeSrc}
                        alt={beforeAlt}
                        width={600}
                        height={400}
                        className="w-full object-cover"
                      />
                    </div>
                  </div>
                </div>

                {/* After */}
                <div className="overflow-hidden rounded-2xl border border-indigo-200 bg-white shadow-md ring-2 ring-indigo-100">
                  <div className="border-b border-indigo-100 bg-indigo-50 px-5 py-3">
                    <span className="text-sm font-semibold text-indigo-700">処理後</span>
                  </div>
                  <div className="p-5">
                    <div className="relative overflow-hidden rounded-xl">
                      <Image
                        src={afterSrc}
                        alt={afterAlt}
                        width={600}
                        height={400}
                        className="w-full object-cover"
                      />
                      {/* 完了バッジ */}
                      <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-1 text-xs font-bold text-white shadow">
                        <CheckCircle className="h-3 w-3" />
                        マスク済み
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/** 3ステップの使い方セクション */
function HowToSection() {
  const steps = [
    {
      step: "01",
      icon: Upload,
      title: "画像をドラッグ＆ドロップ",
      description:
        "対応形式はJPEG・PNG・WebP。ファイルをブラウザにドロップするだけで読み込み完了。",
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      ring: "ring-indigo-100",
    },
    {
      step: "02",
      icon: Wand2,
      title: "自動または手動でマスク処理",
      description: "顔・テキストを自動検出してマスキング範囲を提案。手動での調整・追加も可能。",
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
                  <Icon className={`h-5 w-5 ${color}`} />
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

/** プライバシー説明セクション */
function PrivacySection() {
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
        "顔検出・OCR・マスキングはすべてデバイス上のJavaScriptで完結。インターネット接続すら不要です（初回モデル読み込み除く）。",
      color: "text-violet-600",
      bg: "bg-violet-50",
    },
    {
      icon: ShieldCheck,
      title: "ログイン不要・登録不要",
      description:
        "アカウント作成やメールアドレスの入力は不要。URLにアクセスすれば即座に使い始められます。",
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
                <Icon className={`h-7 w-7 ${color}`} />
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

/** ユースケースセクション */
function UseCasesSection() {
  const cases = [
    {
      icon: ImageIcon,
      title: "SNS投稿前の画像編集",
      description:
        "インスタグラムやXへの投稿前に、写り込んだ他人の顔や個人情報をサッと処理。スマートフォンのブラウザからも使えます。",
      tag: "個人利用",
      tagColor: "bg-sky-100 text-sky-700",
    },
    {
      icon: Monitor,
      title: "社内資料・スクショの共有",
      description:
        "スクリーンショットに映り込んだ名前・メールアドレス・電話番号を隠してから社外共有。情報漏洩リスクを低減できます。",
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
                  <Icon className="h-6 w-6 text-zinc-600" />
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

/** 最終CTAセクション */
function FinalCtaSection() {
  return (
    <section className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-violet-900 px-4 py-20 text-center">
      <div className="mx-auto max-w-2xl">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          今すぐ、無料で試してみましょう
        </h2>
        <p className="mt-4 text-lg text-indigo-200">
          ログイン不要・インストール不要。ブラウザさえあればすぐ使えます。
        </p>
        <div className="mt-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-10 py-4 text-base font-bold text-indigo-900 shadow-lg transition-all hover:bg-indigo-50 hover:shadow-xl active:scale-95"
          >
            今すぐ使う
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
        <p className="mt-6 text-sm text-indigo-300">
          <ShieldCheck className="mr-1 inline h-4 w-4" />
          画像はサーバーに送信されません
        </p>
      </div>
    </section>
  );
}

/**
 * LP（ランディングページ）
 *
 * `/lp` ルートに配置される静的マーケティングページ。
 * 画像処理コードを含まない純粋な紹介ページ。
 */
export default function LpPage() {
  return (
    <div className="flex flex-col">
      <HeroSection />
      <DemoSection />
      <HowToSection />
      <PrivacySection />
      <UseCasesSection />
      <FinalCtaSection />
    </div>
  );
}
