/**
 * アプリヘッダーコンポーネント
 *
 * アプリ名とナビゲーションリンクを表示するトップバー。
 */
export function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl" aria-hidden="true">
            🛡️
          </span>
          <span className="text-lg font-bold tracking-tight text-zinc-900">
            Privacy Masking Tool
          </span>
        </div>
        <p className="hidden text-sm text-zinc-500 sm:block">
          画像内の顔・個人情報を安全にマスキング
        </p>
      </div>
    </header>
  );
}
