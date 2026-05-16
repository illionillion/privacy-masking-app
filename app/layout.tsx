import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Header } from "@/components/Header";
import { SiteFooter } from "@/components/SiteFooter";
import { ToasterProvider } from "@/components/ToasterProvider";
import { ADSENSE_CLIENT_ID } from "@/lib/adsenseClientId";
import { SITE_SOCIAL_METADATA } from "@/lib/siteOpenGraph";
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
  title: "伏せ太郎 | Fusely",
  description:
    "伏せ太郎（Fusely）は、画像内の顔・文字情報を検出して黒塗り・モザイク・ぼかし編集ができるブラウザ完結型ツール",
  keywords: [
    "伏せ太郎",
    "Fusely",
    "画像 マスキング",
    "顔隠し",
    "個人情報 保護",
    "AI 画像編集",
    "モザイク",
    "ぼかし",
  ],
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
        <Header />
        <main className="flex flex-1 flex-col">{children}</main>
        <SiteFooter />
        <ConfirmDialog />
        <ToasterProvider />
      </body>
    </html>
  );
}
