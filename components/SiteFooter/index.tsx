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

const footerSectionClass = clsx([
  "border-t",
  "border-zinc-200",
  "pt-4",
  "sm:border-l",
  "sm:border-t-0",
  "sm:pl-6",
  "sm:pt-0",
  "first:border-t-0",
  "first:pt-0",
  "sm:first:border-l-0",
  "sm:first:pl-0",
]);

const footerSectionTitleClass = "text-xs font-semibold tracking-wide text-zinc-900";

/**
 * 全ページ共通フッター。規約・LP・GitHub への導線をまとめる。
 */
export function SiteFooter() {
  return (
    <footer
      className={clsx([
        "mt-auto",
        "border-t border-zinc-200/90",
        "bg-gradient-to-b from-zinc-100 to-zinc-100/95",
        "shadow-[inset_0_1px_0_0_rgb(255_255_255_/_.45)]",
      ])}
    >
      <div className="mx-auto max-w-5xl px-4 pb-8 pt-10">
        <nav aria-label="フッターナビゲーション">
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            <li className={footerSectionClass}>
              <p className={footerSectionTitleClass}>アプリ</p>
              <ul className="mt-3 space-y-2">
                <li>
                  <Link href="/app" className={footerLinkClass}>
                    マスキングツール
                  </Link>
                </li>
              </ul>
            </li>
            <li className={footerSectionClass}>
              <p className={footerSectionTitleClass}>ガイド・お知らせ</p>
              <ul className="mt-3 space-y-2">
                <li>
                  <Link href="/guides" className={footerLinkClass}>
                    使い方ガイド
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className={footerLinkClass}>
                    よくある質問（FAQ）
                  </Link>
                </li>
                <li>
                  <Link href="/updates" className={footerLinkClass}>
                    更新情報
                  </Link>
                </li>
              </ul>
            </li>
            <li className={footerSectionClass}>
              <p className={footerSectionTitleClass}>規約・ポリシー</p>
              <ul className="mt-3 space-y-2">
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
              </ul>
            </li>
            <li className={footerSectionClass}>
              <p className={footerSectionTitleClass}>開発・連絡</p>
              <ul className="mt-3 space-y-2">
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
