/**
 * 見出し id へスクロールする。sticky Header を考慮するため h2 の scroll-margin に任せる。
 */
export function scrollToHeadingId(id: string): boolean {
  const element = document.getElementById(id);
  if (!element) {
    return false;
  }

  element.scrollIntoView({ behavior: "smooth", block: "start" });

  const nextHash = `#${id}`;
  if (window.location.hash !== nextHash) {
    window.history.replaceState(null, "", nextHash);
  }

  return true;
}
