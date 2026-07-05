"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { GitHubMarkIcon } from "@/components/GitHubMarkIcon";
import { GITHUB_REPOSITORY_URL } from "@/lib/githubRepositoryUrl";
import { useSearchModalStore } from "@/lib/searchModalStore";

const navLinkClass =
  "text-sm font-medium text-zinc-600 underline-offset-4 transition-colors hover:text-zinc-900 hover:underline";

const primaryLinkClass =
  "text-sm font-medium text-indigo-600 underline-offset-4 transition-colors hover:text-indigo-800 hover:underline";

/**
 * `/app` とオフラインページでは検索導線を表示しない。
 */
function shouldShowSearchLink(pathname: string | null): boolean {
  if (!pathname) {
    return true;
  }

  return pathname !== "/app" && !pathname.startsWith("/~offline");
}

/**
 * アプリヘッダーコンポーネント
 *
 * アプリ名とナビゲーションリンクを表示するトップバー。
 */
export function Header() {
  const pathname = usePathname();
  const showSearch = shouldShowSearchLink(pathname);
  const openSearch = useSearchModalStore((state) => state.open);

  return (
    <header className="sticky top-0 z-10 border-b border-white/40 bg-white/75 shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link className="flex items-center gap-2" href="/">
          <Image src="/fusely-icon.png" alt="" width={48} height={48} priority />
          <span className="text-lg font-bold tracking-tight text-zinc-900">伏せ太郎</span>
        </Link>
        <div className="flex flex-row flex-wrap items-center justify-end gap-2 sm:gap-4">
          {showSearch ? (
            <button
              type="button"
              onClick={openSearch}
              className="rounded-md p-2 text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
              aria-label="サイト内検索"
            >
              <Search aria-hidden="true" className="h-5 w-5" />
            </button>
          ) : null}
          <Link href="/faq" className={navLinkClass}>
            FAQ
          </Link>
          <Link href="/app" className={primaryLinkClass}>
            今すぐ使う
          </Link>
          <Link
            href={GITHUB_REPOSITORY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md p-2 text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
            aria-label="GitHubでスター（新しいタブで開く）"
          >
            <GitHubMarkIcon className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
