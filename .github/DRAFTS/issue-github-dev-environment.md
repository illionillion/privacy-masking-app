## 対象システム

GitHub Actions ワークフロー、lefthook（pre-commit フック）、Copilot カスタム設定、Issue/PR テンプレート

## CI/CDの種類

GitHub Actions ワークフロー作成・更新

## 背景・目的

privacy-masking-app の開発をスムーズに進めるための GitHub 開発環境を一式セットアップする。
Copilot を活用した開発フローの確立、CI によるコード品質の自動チェック、pre-commit フックによるローカルチェックを整備する。

## 変更内容

### Copilot カスタム設定
- `.github/copilot-instructions.md` — プロジェクト共通ルール（ブラウザ完結・プライバシーファースト）
- `.github/instructions/frontend.instructions.md` — フロントエンド固有ルール（Canvas/WebWorker/セキュリティ/テスト方針）
- `.github/instructions/review.instructions.md` — レビュー規約（バッジシステム・Privacy Masking App観点）

### GitHub テンプレート
- `.github/ISSUE_TEMPLATE/` — feature / bug_fix / refactor / test / ci_cd / other の6種
- `.github/pull_request_template.md` — PR テンプレート

### Copilot Skills
- `.github/skills/github-ops/SKILL.md` — Issue/PR/コミット/レビューコメント操作手順
- `.github/skills/vuln-fix/SKILL.md` — pnpm audit 脆弱性対応手順

### CI/CD ワークフロー
- `.github/workflows/ci.yml` — PR/main push 時の品質チェック（ESLint・型チェック・フォーマット・テスト・ビルド）
- `.github/workflows/cd.yml` — main push 時の Next.js ビルド確認

### ローカル開発ツール
- `lefthook.yml` — pre-commit（lint・format・typecheck）、commit-msg（commitlint）、post-merge/checkout（pnpm install）
- `commitlint.config.js` — Conventional Commits（日本語対応）
- `.prettierrc` / `.prettierignore` — Prettier 設定
- `.nvmrc` — Node.js v22

## 動作確認

- [x] `pnpm lint` が通過すること
- [x] `pnpm type-check` が通過すること
- [x] `pnpm format:check` が通過すること
- [x] `pnpm lefthook install` が成功すること

*-- by Copilot*
