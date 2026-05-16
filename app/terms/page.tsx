import Link from "next/link";
import { LegalPageLayout } from "@/components/LegalPageLayout";
import {
  GITHUB_DISCUSSIONS_URL,
  GITHUB_ISSUES_URL,
  GITHUB_REPOSITORY_URL,
} from "@/lib/githubRepositoryUrl";
import { LEGAL_DOCUMENT_LAST_UPDATED_LABEL } from "@/lib/legalDocuments";
import { buildPageMetadata } from "@/lib/buildPageMetadata";

const PAGE_TITLE = "利用規約 | 伏せ太郎（Fusely）";
const PAGE_DESCRIPTION =
  "伏せ太郎（Fusely）の利用規約。免責、禁止事項、連絡方法、ソフトウェアライセンスについて定めます。";

export const metadata = buildPageMetadata({
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  canonicalPath: "terms",
});

/**
 * 利用規約ページ
 */
export default function TermsPage() {
  return (
    <LegalPageLayout title="利用規約" lastUpdatedLabel={LEGAL_DOCUMENT_LAST_UPDATED_LABEL}>
      <p>
        本利用規約（以下「本規約」）は、伏せ太郎（Fusely）（以下「本サービス」）の利用条件を定めるものです。本サービスを利用する前に、本規約をお読みください。
      </p>

      <section className="space-y-3" aria-labelledby="terms-agree-heading">
        <h2 id="terms-agree-heading" className="text-base font-semibold text-zinc-900">
          第1条（適用）
        </h2>
        <p>
          本規約は、本サービスの提供条件および当方と利用者との間の権利義務関係を定めることを目的とし、利用者と当方との間の本サービスの利用に関わる一切の関係に適用されます。
        </p>
      </section>

      <section className="space-y-3" aria-labelledby="terms-service-heading">
        <h2 id="terms-service-heading" className="text-base font-semibold text-zinc-900">
          第2条（サービス内容）
        </h2>
        <p>
          本サービスは、利用者がブラウザ上で画像を読み込み、顔・文字領域等の検出およびマスキング編集を行うためのツールを提供します。詳細な機能説明は{" "}
          <Link
            href="/lp"
            className="font-medium text-indigo-600 underline-offset-2 hover:underline"
          >
            サービス紹介（LP）
          </Link>
          をご参照ください。
        </p>
      </section>

      <section className="space-y-3" aria-labelledby="terms-disclaimer-heading">
        <h2 id="terms-disclaimer-heading" className="text-base font-semibold text-zinc-900">
          第3条（免責・非保証）
        </h2>
        <p>
          本サービスは現状有姿で提供されます。顔・文字等の検出およびマスキング支援は、機械学習・画像処理・統計的モデル等に基づく
          <strong>自動処理</strong>
          であり、100%の精度や完全性を保証するものではありません。検出の漏れ・誤検出、編集結果の完全性、特定の法令・契約・社内規程等への適合性などについて、当方は一切保証しません。
        </p>
        <p>
          利用者は、本サービスの出力を過信せず、SNS・メール・クラウドストレージその他いかなる手段による
          <strong>第三者への送信・公開・共有の前に</strong>
          、自らの責任と費用において内容を必ず確認し、必要に応じて手動で修正するものとします。
        </p>
        <p>
          前項の確認を怠り、又は検出結果を過信したことにより、画像等の送信・公開・共有に関して利用者又は第三者に生じた損害（契約違反、賠償請求、法的責任、制裁、逸失利益、名誉毀損その他一切の不利益を含みますが、これらに限られません）について、当方に故意又は重過失がある場合を除き、当方は責任を負いません。
        </p>
        <p>
          本サービスの利用又は利用不能に起因するその他の損害について、当方に故意又は重過失がある場合を除き、当方は責任を負いません。
        </p>
      </section>

      <section className="space-y-3" aria-labelledby="terms-prohibited-heading">
        <h2 id="terms-prohibited-heading" className="text-base font-semibold text-zinc-900">
          第4条（禁止事項）
        </h2>
        <p>利用者は、本サービスの利用にあたり、以下の行為をしてはなりません。</p>
        <ul className="list-inside list-disc space-y-1 pl-1">
          <li>法令または公序良俗に違反する行為、またはそのおそれのある行為</li>
          <li>第三者の権利を侵害する行為、またはそのおそれのある行為</li>
          <li>
            児童ポルノの所持・送信・提供その他これに類する違法な画像を本サービスに入力する行為
          </li>
          <li>本サービスの運営を妨害する行為、不正アクセスに相当する行為</li>
          <li>その他、当方が不適切と判断する行為</li>
        </ul>
      </section>

      <section className="space-y-3" aria-labelledby="terms-ip-heading">
        <h2 id="terms-ip-heading" className="text-base font-semibold text-zinc-900">
          第5条（利用者コンテンツ）
        </h2>
        <p>
          利用者が本サービスに読み込んだ画像の著作権その他の権利は、利用者または正当な権利者に帰属します。当方は、本サービスの設計上、当方のサーバーに画像をアップロードして保存することは行いません。
        </p>
      </section>

      <section className="space-y-3" aria-labelledby="terms-oss-heading">
        <h2 id="terms-oss-heading" className="text-base font-semibold text-zinc-900">
          第6条（オープンソース・ライセンス）
        </h2>
        <p>
          本サービスのソースコードは{" "}
          <a
            href={GITHUB_REPOSITORY_URL}
            className="font-medium text-indigo-600 underline-offset-2 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>{" "}
          で公開されており、リポジトリに含まれるライセンス文書（例: Apache License
          2.0）に従います。本規約はウェブ上での利用に関する補足的な定めであり、ソースコードの再配布条件は各ライセンスに従います。
        </p>
      </section>

      <section className="space-y-3" aria-labelledby="terms-changes-heading">
        <h2 id="terms-changes-heading" className="text-base font-semibold text-zinc-900">
          第7条（サービス内容の変更・終了）
        </h2>
        <p>
          当方は、利用者への事前の通知なく、本サービスの内容を変更、中断、または終了することがあります。
        </p>
      </section>

      <section className="space-y-3" aria-labelledby="terms-contact-heading">
        <h2 id="terms-contact-heading" className="text-base font-semibold text-zinc-900">
          第8条（お問い合わせ）
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
          をご利用ください。
        </p>
      </section>

      <section className="space-y-3" aria-labelledby="terms-law-heading">
        <h2 id="terms-law-heading" className="text-base font-semibold text-zinc-900">
          第9条（準拠法）
        </h2>
        <p>本規約は日本法を準拠法とします。</p>
      </section>

      <p className="pt-2">
        <Link href="/" className="font-medium text-indigo-600 underline-offset-2 hover:underline">
          トップページへ戻る
        </Link>
      </p>
    </LegalPageLayout>
  );
}
