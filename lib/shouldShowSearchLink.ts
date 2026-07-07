/**
 * `/app` とオフラインページでは検索導線を表示しない。
 */
export function shouldShowSearchLink(pathname: string | null): boolean {
  if (!pathname) {
    return true;
  }

  return pathname !== "/app" && !pathname.startsWith("/~offline");
}
