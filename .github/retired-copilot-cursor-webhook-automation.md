# 廃止: Copilot レビュー → Cursor Automation Webhook 連携

**ステータス: 廃止（2026-06）** — 関連 workflow・プロンプト控えはリポジトリから削除済み。

## やろうとしていたこと

Copilot が PR レビューを submit したあと、GitHub Actions 経由で Cursor Automation の Webhook を叩き、Copilot 指摘の精査・修正をクラウドエージェントに任せる。

想定フロー:

```text
push → Copilot レビュー → gate（payload 準備）→ dispatch（Webhook POST）→ Cursor Automation
```

## 結論

**完全自動化は GitHub の Bot 制約により実現できなかった。**

- Copilot / Bot 起点の workflow チェーンでは **「Waiting Approve to Run」** が発生する
- **gate（secrets なし）も dispatch（secrets あり）も** Approve 待ちになることがある（実測: 両方 `action_required` → 手動承認後のみ success）
- Approve なしでは Webhook が叩かれず、Cursor Automation は起動しない
- 半手動（Actions で Approve を押す）なら動くことはあるが、**毎回の完全自動にはならない**

## 試したトリガー（いずれも完全自動には至らず）

| 方式                                                | 結果                                                          |
| --------------------------------------------------- | ------------------------------------------------------------- |
| `pull_request_review`（Copilot submit）             | `triggering_actor: Copilot` → Approve 必須                    |
| `check_run`（`copilot-pull-request-reviewer` 完了） | Copilot 完了時に workflow が発火しないことがある              |
| `workflow_run`（Copilot workflow 完了）             | gate は通る場合もあるが、dispatch は Approve 待ちになりやすい |
| gate / dispatch の二段構え（secrets 分離）          | Approve 問題は解消できず                                      |
| Webhook 用 workflow を main 先行で配置              | workflow 定義の問題ではなく actor 制約が本質                  |

## 削除したファイル（再導入しないこと）

- `.github/workflows/copilot-request-review.yml`
- `.github/workflows/copilot-review-cursor-trigger.yml`
- `.github/workflows/copilot-cursor-webhook-dispatch.yml`
- `.github/automation/` 配下（プロンプト控え・README）

## リポジトリ設定で残っている可能性があるもの

GitHub → Settings → Secrets に以下を登録していた場合、**手動で削除**してよい:

- `CURSOR_AUTOMATION_WEBHOOK_URL`
- `CURSOR_AUTOMATION_WEBHOOK_API_KEY`

Cursor Dashboard 側の Automation 定義はこのリポジトリとは独立している。不要なら Dashboard から無効化・削除する。

## 今後の検討方向（メモ）

Copilot 経由の Webhook 連携ではなく、**Cursor Automations の GitHub ネイティブトリガー**（`Pull request pushed` / `CI completed` 等）で PR 上のレビュー・修正を行う案は別途検討する。本ドキュメントの方式とは別物。
