import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Star } from "lucide-react";
import { GitHubMarkIcon } from "@/components/GitHubMarkIcon";
import { GITHUB_REPOSITORY_URL } from "@/lib/githubRepositoryUrl";

/** ヒーローセクション */
export function HeroSection() {
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
          <ShieldCheck className="h-4 w-4 text-emerald-400" aria-hidden="true" />
          完全無料・ログイン不要・サーバー送信なし
        </span>

        <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
          <span className="mb-2 flex items-center justify-center gap-2 text-indigo-300">
            伏せ太郎
            <Image
              src="/fusely-icon.png"
              alt=""
              width={72}
              height={72}
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
            <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </Link>
          <Link
            href={GITHUB_REPOSITORY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2.5 rounded-xl border border-white/10 bg-[#24292f] px-8 py-4 text-base font-semibold text-white shadow-lg transition-all hover:border-white/15 hover:bg-[#1b1f23] hover:shadow-xl active:scale-[0.98]"
            aria-label="GitHubでスター（新しいタブで開く）"
          >
            <GitHubMarkIcon className="h-5 w-5 shrink-0" />
            <span>GitHubでスター</span>
            <Star
              className="h-5 w-5 shrink-0 text-white transition-colors group-hover:fill-yellow-400 group-hover:text-yellow-400"
              strokeWidth={1.75}
              aria-hidden="true"
            />
          </Link>
        </div>
      </div>
    </section>
  );
}
