import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";

/** 最終CTAセクション */
export function FinalCtaSection() {
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
          <ShieldCheck className="mr-1 inline h-4 w-4 text-emerald-400" />
          画像はサーバーに送信されません
        </p>
      </div>
    </section>
  );
}
