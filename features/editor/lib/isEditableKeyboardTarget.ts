/**
 * キーボードショートカットを無効化すべきフォーカス先か（入力系 UI）
 *
 * @param target - keydown 等の event.target
 */
export function isEditableKeyboardTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
}
