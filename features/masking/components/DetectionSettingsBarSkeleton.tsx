/**
 * 検出設定バーの読み込み中プレースホルダー（応急措置・表示層のみ）
 */
export function DetectionSettingsBarSkeleton() {
  return (
    <div
      className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
      aria-busy="true"
      aria-label="検出設定を読み込み中"
    >
      <div className="h-5 w-48 animate-pulse rounded bg-zinc-200" />
      <div className="h-9 w-28 animate-pulse self-start rounded-lg bg-zinc-200 sm:self-auto" />
    </div>
  );
}
