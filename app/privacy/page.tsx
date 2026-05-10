import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageLayout } from "@/components/LegalPageLayout";
import {
  GITHUB_DISCUSSIONS_URL,
  GITHUB_ISSUES_URL,
  GITHUB_REPOSITORY_URL,
} from "@/lib/githubRepositoryUrl";
import { LEGAL_DOCUMENT_LAST_UPDATED_LABEL } from "@/lib/legalDocuments";
import { resolveSiteUrl } from "@/lib/siteUrl";

const PAGE_TITLE = "プライバシーポリシー | 伏せ太郎（Fusely）";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description:
    "伏せ太郎（Fusely）のプライバシーポリシー。ブラウザ内での画像処理方針と、連絡方法について説明します。",
  alternates: {
    canonical: "privacy",
  },
  openGraph: {
    title: PAGE_TITLE,
    description:
      "伏せ太郎（Fusely）のプライバシーポリシー。ブラウザ内での画像処理方針と、連絡方法について説明します。",
    url: resolveSiteUrl("privacy"),
  },
};

/**
 * プライバシーポリシーページ
 */
export default function PrivacyPage() {
  return (
    <LegalPageLayout
      title="プライバシーポリシー"
      lastUpdatedLabel={LEGAL_DOCUMENT_LAST_UPDATED_LABEL}
    >
      <p>
        本ポリシーは、伏せ太郎（Fusely）（以下「本サービス」）の利用にあたり、利用者の情報がどのように扱われるかを説明するものです。本サービスはオープンソースとして公開されており、ソースコードは{" "}
        <a
          href={GITHUB_REPOSITORY_URL}
          className="font-medium text-indigo-600 underline-offset-2 hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub リポジトリ
        </a>
        で確認できます。
      </p>

      <section className="space-y-3" aria-labelledby="privacy-handling-heading">
        <h2 id="privacy-handling-heading" className="text-base font-semibold text-zinc-900">
          1. 画像データの取り扱い（ブラウザ完結）
        </h2>
        <p>
          本サービスのコア機能は、利用者が選択した画像を<strong>利用者のブラウザ内</strong>
          で処理することです。当方が運用するアプリケーションの設計方針として、利用者のアップロード画像を当方のサーバーに送信して保存・解析することは行いません。
        </p>
        <p>
          処理結果の画像のダウンロードは、利用者のブラウザから利用者の端末に保存される動作に依存します。
        </p>
      </section>

      <section className="space-y-3" aria-labelledby="privacy-tech-heading">
        <h2 id="privacy-tech-heading" className="text-base font-semibold text-zinc-900">
          2. 利用技術と端末外との通信
        </h2>
        <p>
          顔検出・文字認識（OCR）などの機能のために、ブラウザ上でオープンソースのライブラリが利用されます。これらのライブラリは、動作に必要なプログラムや学習済みデータ等を、利用者の環境に応じてネットワーク経由で取得する場合があります（例:
          パッジ・CDN）。その際も、
          <strong>利用者が選択した画像ファイルを当方が収集する仕組みはありません</strong>。
        </p>
      </section>

      <section className="space-y-3" aria-labelledby="privacy-cookies-heading">
        <h2 id="privacy-cookies-heading" className="text-base font-semibold text-zinc-900">
          3. Cookie・広告・解析・識別子
        </h2>
        <p>
          本サービスは、現時点で当方が独自に設置する広告タグやアクセス解析ツール（いわゆる第三者配信の広告用
          Cookie 等を主目的とするもの）は使用していません。
        </p>
        <p>
          将来的に Google AdSense
          等のディスプレイ広告やアクセス解析を導入する場合、広告配信事業者・広告ネットワーク運営者等の第三者が、
          <strong>
            Cookie、モバイル広告識別子、ブラウザに保存される類似の識別情報、その他の技術
          </strong>
          を用いて、次のような処理を行うことがあります。これらはいわゆる「追跡」や計測・パーソナライズに該当し得ます。
        </p>
        <ul className="list-inside list-disc space-y-1 pl-1">
          <li>広告の表示回数・効果の計測、不正対策</li>
          <li>
            利用者の興味関心や閲覧履歴等に基づく広告の配信、またはその可否の判定（パーソナライズド広告等）
          </li>
          <li>第三者が定めるプライバシーポリシー・オプトアウト手段に基づく取り扱い</li>
        </ul>
        <p>
          上記は本サービスが画像データを当方のサーバーに送信しないこととは別のレイヤーで、
          <strong>利用者のブラウザまたは端末上で</strong>
          行われることが一般的です。導入時点で利用する事業者・技術の範囲に応じて本ポリシーを具体化し、必要に応じて同意取得の手段を設けるなど、法令および各サービス（例:
          Google の広告・ Cookie に関する説明）のポリシーに従います。
        </p>
      </section>

      <section className="space-y-3" aria-labelledby="privacy-contact-heading">
        <h2 id="privacy-contact-heading" className="text-base font-semibold text-zinc-900">
          4. お問い合わせ
        </h2>
        <p>
          本サービスに関するお問い合わせ・不具合報告は{" "}
          <a
            href={GITHUB_ISSUES_URL}
            className="font-medium text-indigo-600 underline-offset-2 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub Issues
          </a>
          、ご質問や一般のディスカッションは{" "}
          <a
            href={GITHUB_DISCUSSIONS_URL}
            className="font-medium text-indigo-600 underline-offset-2 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub Discussions
          </a>
          をご利用ください。GitHub 側の利用規約およびプライバシー方針が適用されます。
        </p>
      </section>

      <section className="space-y-3" aria-labelledby="privacy-changes-heading">
        <h2 id="privacy-changes-heading" className="text-base font-semibold text-zinc-900">
          5. 本ポリシーの変更
        </h2>
        <p>
          法令の改正やサービス内容の変更に応じて、本ポリシーを更新することがあります。更新後の内容は本ページに掲載した時点から効力を有するものとします。
        </p>
      </section>

      <p className="pt-2">
        <Link href="/" className="font-medium text-indigo-600 underline-offset-2 hover:underline">
          トップページへ戻る
        </Link>
      </p>
    </LegalPageLayout>
  );
}
