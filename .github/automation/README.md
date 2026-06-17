# Cursor Automation プロンプト控え

このディレクトリは **Cursor Automation の設定ファイルではありません**。

- **実際に動くプロンプト**: [Cursor Dashboard](https://cursor.com/dashboard) の Automations 画面に貼った内容
- **ここにあるもの**: 下書き・履歴管理用の**控え**（レビュー・差分追跡用）

プロンプトを更新したら、次の両方をメンテナンスしてください。

1. このリポジトリの `cursor-copilot-review-prompt.md` を更新してコミット
2. Cursor Automation のプロンプト欄に同じ内容をコピペして Save

関連 workflow:

- `.github/workflows/copilot-request-review.yml` — push 時に Copilot 再依頼
- `.github/workflows/copilot-review-cursor-trigger.yml` — Copilot レビュー後に Webhook 起動
