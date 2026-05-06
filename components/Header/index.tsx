import Image from "next/image";
import Link from "next/link";

const GITHUB_REPOSITORY_URL = "https://github.com/illionillion/privacy-masking-app";

/**
 * アプリヘッダーコンポーネント
 *
 * アプリ名とナビゲーションリンクを表示するトップバー。
 */
export function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link className="flex items-center gap-2" href="/">
          <Image src="/fusely-icon.png" alt="" width={48} height={48} priority />
          <span className="text-lg font-bold tracking-tight text-zinc-900">伏せ太郎</span>
        </Link>
        <div className="flex flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-4">
          <Link
            href="/lp"
            className="text-sm font-medium text-indigo-600 underline-offset-4 transition-colors hover:text-indigo-800 hover:underline"
          >
            サービス紹介
          </Link>
          <Link
            href={GITHUB_REPOSITORY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-zinc-700 underline-offset-4 transition-colors hover:text-zinc-900 hover:underline"
          >
            GitHubでスター
          </Link>
          <p className="hidden text-sm text-zinc-500 sm:block">
            画像内の顔・個人情報を安全にマスキング
          </p>
        </div>
      </div>
    </header>
  );
}
