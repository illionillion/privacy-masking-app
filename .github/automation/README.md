# Cursor Automation プロンプト控え

このディレクトリは **Cursor Automation の設定ファイルではありません**。

- **実際に動くプロンプト**: [Cursor Dashboard](https://cursor.com/dashboard) の Automations 画面に貼った内容
- **ここにあるもの**: 下書き・履歴管理用の**控え**（レビュー・差分追跡用）

プロンプトを更新したら、次の両方をメンテナンスしてください。

1. このリポジトリの `cursor-copilot-review-prompt.md` を更新してコミット
2. Cursor Automation のプロンプト欄に同じ内容をコピペして Save

関連 workflow:

- `.github/workflows/copilot-request-review.yml` — push 時に Copilot 再依頼（未カバーなら失敗）
- `.github/workflows/copilot-review-cursor-trigger.yml` — Copilot workflow 完了後に payload 準備（`workflow_run`、secrets 不使用）
- `.github/workflows/copilot-cursor-webhook-dispatch.yml` — gate 完了後に Webhook POST（secrets 使用）
