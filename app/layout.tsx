import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Header } from "@/components/Header";
import { ToasterProvider } from "@/components/ToasterProvider";
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
    images: [
      {
        url: "/hero.png",
        width: 1024,
        height: 537,
        alt: "伏せ太郎 | Fusely",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/hero.png"],
  },
  icons: {
    icon: "/favicon.ico",
  },
  verification: {
    google: "h8_qALSr2HLxo3u0KCmFKOB-BfRPs6Wh_oPvaYGu1kU",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="ja" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-zinc-50 text-zinc-900">
        <Header />
        <main className="flex flex-1 flex-col">{children}</main>
        <ConfirmDialog />
        <ToasterProvider />
      </body>
    </html>
  );
}
