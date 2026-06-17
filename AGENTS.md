# Cursor エージェント向けインストラクション

このドキュメントは、privacy-masking-app（プライバシーマスキングツール）で Cursor エージェントがコード生成・変更を行う際に参照するプロジェクトルールです。  
GitHub Copilot 向けの同等内容は `.github/copilot-instructions.md`（ルールのマップやパス表記が Copilot 側）。**更新がある場合は両方メンテナンスすること。**

## 共通基本ルール

1. **応答言語**: 質問への回答は常に日本語で行ってください。

2. **確認メッセージ**: ルールを参照したことを示すため、回答の冒頭に「ルールを参照しました！」と表示してください。

3. **領域別ルールの必須参照**: 作業開始前に、対象領域のルールファイルを**必ず**参照する。
   - Frontend作業 → `.cursor/rules/frontend.mdc`
   - Git/GitHub操作（Issue・PR・コミット・`gh`） → `.cursor/skills/github-ops/SKILL.md`
   - 脆弱性対応（pnpm audit 等） → `.cursor/skills/vuln-fix/SKILL.md`

   参照したファイル名を確認メッセージに明記する（例: 「frontend.mdc のルールを参照しました！」）

4. **推論・想像の禁止**: 推論や想像で作業しない。事実に基づいて作業する。不明な点は確認を求める。

5. **テスト実行の効率化と検証**: 変更したファイルがある場合、まずテスト内容が修正内容を正しく検証できるかを確認してから、全体実行ではなく単体で実行して時間を省略する。必要に応じてテストケースを追加してから実行する。

6. **ルール管理**: 重要なベストプラクティスを発見した際は、基本ルールへの昇格も検討し、動的ルールセクションまたは基本ルールへの追加を提案する。

7. **設定ファイルの動作確認**: Linter設定、ビルド設定、CI設定等の設定ファイルを作成・変更した場合、必ず実行して動作確認してからコミットする。動作しない設定をコミットしてはならない。

8. **セキュリティ優先**: このアプリはブラウザ完結型（サーバーに画像を送信しない）。画像データをサーバー送信するコードは絶対に追加しない。

## ルールファイルのマップ（Cursor）

### `.cursor/rules/`（globs に一致するファイルを編集・参照する際に適用）

- `frontend.mdc`: Frontend固有ルール（TypeScript、コンポーネント設計、Canvas/WebWorker等） — `**/*.{ts,tsx,mjs}`

### `.cursor/skills/`（該当操作・依頼時に SKILL を明示参照）

- `github-ops/`: Issue作成・PR作成・コミット・`gh` CLI 操作の手順
- `vuln-fix/`: pnpm audit 脆弱性対応・バージョンアップ・overrides設定・PR作成までの手順

## プロダクト概要

**Privacy Masking Tool** — 画像内の顔・個人情報（テキスト）を検出し、公開前にマスキングできるブラウザ完結型ツール。

### 主要技術スタック

- **フレームワーク**: Next.js（App Router）
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **顔検出**: face-api.js
- **OCR**: Tesseract.js
- **描画**: Canvas API
- **パッケージマネージャー**: pnpm

### 設計原則

- **完全クライアントサイド**: 画像データはサーバーに送信しない
- **プライバシーファースト**: ローカル処理のみ
- **パフォーマンス**: 重い処理はWeb Workerで非同期化

## ディレクトリ構造

```
/app            - Next.js App Routerのルーティング
/components     - 再利用可能なUIコンポーネント
/features       - 機能ごとのディレクトリ（components・hooks・types・testsを含む）
  /face-detection  - 顔検出機能
  /ocr             - OCR機能
  /masking         - マスキング処理
  /editor          - 編集UI
/lib            - ユーティリティ関数、hooks
/types          - 共通型定義
/public         - 静的ファイル（face-api.jsモデル等）
```

## 開発フロー

1. 該当Issueに「着手開始」コメントを記載（Issue作成時は適切なラベルを必ず紐づける）
2. `main`ブランチから新しいブランチを作成、変更内容が分かる命名（`ラベル/issue番号-内容`）にする
3. 開発作業を実施
   - 基本ルールに従ってコード品質と型安全性を保つ
   - フロントエンド設計原則に従う
4. 動作確認・セルフレビューの実施
   - テストを実行し、すべてのテストが通ることを確認する
   - lefthookのpre-commitでlint/formatが自動実行される
   - push は作業単位ごとにまとめる（Copilot 自動レビューは push ごとに走るため）。ローカルでは複数コミット可。詳細は `.cursor/skills/github-ops/SKILL.md` のプッシュ方針
5. Pull Requestの作成
   - タイトル: 変更内容を簡潔に表現（プレフィックス不要）
   - 説明文: `.github/pull_request_template.md` に従う
   - Commit Message: Conventional Commits形式（日本語）
   - `Closes #issue番号`を書く
   - ラベル: 該当するラベルを必ず紐づける
6. レビューを受ける
7. 修正が必要な場合は対応する
8. 1つ以上のApproveを得たらマージ
9. IssueをCloseする

## 型安全性・コード品質

- `any` 禁止、型安全に実装する
- ファイル冒頭のimport文セクションに機能修正のコードを混在させない
- 配列などの `{}` の開始終了を明確にする
- TypeScript/JavaScript: 関数と定数にコメントを書く場合は必ずJSDoc形式 `/**...*/` を使用する

## 自動ルール管理

<!-- AUTO_RULES_START -->
<!-- 今後、重要なルールやベストプラクティスが自動で追加されます -->
<!-- AUTO_RULES_END -->
