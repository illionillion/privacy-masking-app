"use client";

import { Toaster } from "sonner";

/**
 * トースト通知プロバイダー
 *
 * sonner の Toaster はクライアント専用コンポーネントのため、
 * Server Component の RootLayout から直接 import できない。
 * このコンポーネントでラップして `"use client"` 境界を設ける。
 */
export function ToasterProvider() {
  return <Toaster richColors position="bottom-right" />;
}
