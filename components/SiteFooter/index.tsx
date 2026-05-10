import clsx from "clsx";
import Link from "next/link";
import {
  GITHUB_DISCUSSIONS_URL,
  GITHUB_ISSUES_URL,
  GITHUB_REPOSITORY_URL,
} from "@/lib/githubRepositoryUrl";

const footerLinkClass = clsx([
  "text-sm",
  "text-zinc-600",
  "underline-offset-4",
  "transition-colors",
  "hover:text-zinc-900",
  "hover:underline",
]);

const externalLinkClass = clsx([footerLinkClass, "inline-flex", "items-center", "gap-0.5"]);

/**
 * 全ページ共通フッター。規約・LP・GitHub への導線をまとめる。
 */
export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-zinc-200 bg-white/80">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <nav aria-label="フッターナビゲーション">
          <ul className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-x-6 sm:gap-y-2">
            <li>
              <Link href="/privacy" className={footerLinkClass}>
                プライバシーポリシー
              </Link>
            </li>
            <li>
              <Link href="/terms" className={footerLinkClass}>
                利用規約
              </Link>
            </li>
            <li>
              <Link href="/lp" className={footerLinkClass}>
                サービス紹介（LP）
              </Link>
            </li>
            <li>
              <a
                href={GITHUB_ISSUES_URL}
                className={externalLinkClass}
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub Issues
                <span className="sr-only">（新しいタブで開く）</span>
              </a>
            </li>
            <li>
              <a
                href={GITHUB_DISCUSSIONS_URL}
                className={externalLinkClass}
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub Discussions
                <span className="sr-only">（新しいタブで開く）</span>
              </a>
            </li>
            <li>
              <a
                href={GITHUB_REPOSITORY_URL}
                className={externalLinkClass}
                target="_blank"
                rel="noopener noreferrer"
              >
                ソースコード
                <span className="sr-only">（新しいタブで開く）</span>
              </a>
            </li>
          </ul>
        </nav>
        <p className="mt-6 text-xs leading-relaxed text-zinc-500">
          お問い合わせ・不具合報告は GitHub Issues、ご質問・議論は GitHub Discussions
          をご利用ください。
        </p>
      </div>
    </footer>
  );
}
