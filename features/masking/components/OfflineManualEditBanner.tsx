import { WifiOff } from "lucide-react";
import { OFFLINE_MANUAL_EDIT_BANNER_MESSAGE } from "../lib/offlineManualEdit";

type OfflineManualEditBannerProps = {
  /** 表示するか（オフライン時のみ true） */
  visible: boolean;
};

/**
 * オフライン手動編集モードであることを伝えるバナー。
 */
export function OfflineManualEditBanner({ visible }: OfflineManualEditBannerProps) {
  if (!visible) {
    return null;
  }

  return (
    <div
      role="status"
      className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
    >
      <WifiOff className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <p>{OFFLINE_MANUAL_EDIT_BANNER_MESSAGE}</p>
    </div>
  );
}
