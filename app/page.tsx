import { LandingPage } from "@/components/LandingPage";
import { buildPageMetadata } from "@/lib/buildPageMetadata";
import { HOME_PAGE_DESCRIPTION, HOME_PAGE_TITLE } from "@/lib/siteSeo";

/** トップ（/）: サービス紹介 LP。ツール本体は /app */
export const metadata = buildPageMetadata({
  title: HOME_PAGE_TITLE,
  description: HOME_PAGE_DESCRIPTION,
  canonicalPath: "./",
});

/**
 * トップページ（サービス紹介 LP）
 */
export default function Home() {
  return <LandingPage />;
}
