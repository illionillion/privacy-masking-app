import type { ReactNode } from "react";

type LegalPageLayoutProps = {
  /** ページ見出し */
  title: string;
  /** 画面上に表示する日付テキスト（フォーマット済み） */
  dateText: string;
  /** 日付ラベルの見出し（既定: 最終更新日） */
  dateLabel?: string;
  children: ReactNode;
};

/**
 * プライバシーポリシー・利用規約など、本文が長い静的ページ用のレイアウト。
 */
export function LegalPageLayout({
  title,
  dateText,
  dateLabel = "最終更新日",
  children,
}: LegalPageLayoutProps) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight text-zinc-900">{title}</h1>
      <p className="mt-2 text-sm text-zinc-500">
        {dateLabel}: {dateText}
      </p>
      <div className="mt-8 space-y-6 text-sm leading-relaxed text-zinc-700">{children}</div>
    </div>
  );
}
