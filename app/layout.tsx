import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Header } from "@/components/Header";
import { SiteFooter } from "@/components/SiteFooter";
import { ToasterProvider } from "@/components/ToasterProvider";
import { ADSENSE_CLIENT_ID } from "@/lib/adsenseClientId";
import { JsonLdWebApplication } from "@/components/JsonLdWebApplication";
import { SITE_SOCIAL_METADATA } from "@/lib/siteOpenGraph";
import { HOME_PAGE_TITLE, SITE_DEFAULT_DESCRIPTION, SITE_METADATA_KEYWORDS } from "@/lib/siteSeo";
import { getSiteUrlAsUrl } from "@/lib/siteUrl";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: getSiteUrlAsUrl(),
  title: {
    default: HOME_PAGE_TITLE,
    template: "%s",
  },
  description: SITE_DEFAULT_DESCRIPTION,
  keywords: [...SITE_METADATA_KEYWORDS],
  openGraph: {
    type: "website",
    locale: "ja_JP",
    siteName: "伏せ太郎 | Fusely",
    ...SITE_SOCIAL_METADATA.openGraph,
  },
  twitter: {
    ...SITE_SOCIAL_METADATA.twitter,
  },
  icons: {
    icon: "favicon.ico",
  },
  verification: {
    google: "h8_qALSr2HLxo3u0KCmFKOB-BfRPs6Wh_oPvaYGu1kU",
  },
  // AdSense のサイト／アカウント関連付け用。広告表示には adsbygoogle スクリプトも必要。
  other: {
    "google-adsense-account": ADSENSE_CLIENT_ID,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="ja" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <head>
        {/* AdSense: 検証は head 内の素の script を期待する。next/script の静的書き出しは __next_s になり不一致になり得る */}
        <script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`}
          crossOrigin="anonymous"
        />
      </head>
      <body className="flex min-h-full flex-col bg-zinc-50 text-zinc-900">
        {/* JSON-LD は head 隣接の AdSense script と hydration でタグがずれるため body 先頭に配置（Google は body 内も可） */}
        <JsonLdWebApplication />
        <Header />
        <main className="flex flex-1 flex-col">{children}</main>
        <SiteFooter />
        <ConfirmDialog />
        <ToasterProvider />
      </body>
    </html>
  );
}
