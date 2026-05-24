export interface EditorViewportHintTextOptions {
  /** モーダル内など、通常ホイールをスクロールに任せるレイアウト */
  pinViewportControls: boolean;
  /** Tailwind `md` 未満（767px 以下） */
  isNarrowViewport: boolean;
}

/**
 * 表示ズームコントロール横の操作ヒント文言を返す
 */
export function getEditorViewportHintText({
  pinViewportControls,
  isNarrowViewport,
}: EditorViewportHintTextOptions): string {
  if (isNarrowViewport) {
    return "2本指ピンチで拡大/縮小 · 拡大時: 空白をドラッグで移動";
  }

  const zoomHint = pinViewportControls ? "Ctrl/Cmd+ホイールで拡大/縮小" : "ホイールで拡大/縮小";
  return `${zoomHint} · 拡大時: 空白／Space+ドラッグで移動`;
}
