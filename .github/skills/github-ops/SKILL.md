---
name: github-ops
description: "Issue作成・PR作成・コミット・ghコマンド操作を行う時に使用するSkill。「Issue作って」「PR立てて」「コミットして」「PRレビューコメント確認」などの操作が対象。ラベル確認・本文ファイル生成・署名・Conventional Commitsルールを含む。"
argument-hint: '例: "顔検出機能追加のIssueを作成" / "PR作成してmain向けに" / "変更をコミットしてプッシュ"'
---

# GitHub Operations Skill

Issue作成・PR作成・コミット・GitHubコメント投稿など、`git` / `gh` CLIを使った操作全般を行う際のワークフロー。

## PR作成手順

必ず以下の順序で実行すること。

1. **ラベル確認**

   ```bash
   gh label list
   ```

   必要なラベルが存在しない場合は作成する：

   ```bash
   gh label create <name> --color <hex>
   ```

2. **本文ファイル生成**  
   PRの本文は `.github/DRAFTS/<ブランチ名>-pr.md` にファイルとして作成する。  
   テンプレートは [pull_request_template.md](../../pull_request_template.md) に従い全項目を埋める。  
   コマンドライン引数に `\n` を埋め込まない（シェル解釈や文字化け防止）。

3. **PR作成**
   ```bash
   gh pr create --title "タイトル" --body-file .github/DRAFTS/<ブランチ名>-pr.md --label "ラベル"
   ```

### ポイント

- タイトルにプレフィックス不要（例: `feat:` は不要）。変更内容を簡潔に表現する
- `Closes #Issue番号` を本文に必ず含める
- 重点レビュー箇所・変更の意図・影響範囲を明記する

### PR本文の追従（push のたびに確認）

コミット・プッシュを行うたびに、PR本文（`.github/DRAFTS/<ブランチ名>-pr.md`）が実装内容と乖離していないか確認する。  
以下のいずれかに該当する場合は、プッシュ前または直後に PR 本文を更新してから `gh pr edit` で反映する：

- 変更ファイル・機能の追加・削除があった
- 動作確認項目やチェックリストの状態が変わった
- レビューポイントが増減した

```bash
# PR本文を更新する
gh pr edit <PR番号> --body-file .github/DRAFTS/<ブランチ名>-pr.md
```

PR本文が実装と乖離したままにしておくと、レビュー時に「本文と実装が違う」と指摘される原因になる。

---

## Issue作成手順

```bash
gh issue create --title "タイトル" --body-file <bodyファイル> --label "ラベル"
```

- ラベルを必ず紐づける

---

## コミットルール

### Conventional Commits（日本語）

```
type: 日本語で説明
```

| type       | 用途                   |
| ---------- | ---------------------- |
| `feat`     | 新機能                 |
| `fix`      | バグ修正               |
| `refactor` | リファクタリング       |
| `test`     | テスト追加・修正       |
| `docs`     | ドキュメント修正       |
| `chore`    | 設定・環境変更         |
| `style`    | フォーマット・lint修正 |
| `ci`       | CI/CD設定変更          |

例：

```
feat: 顔検出機能を追加
fix: Canvas マスキング処理のメモリリークを修正
```

### コミット粒度

論理的に関連する変更ごとに小分けにする。1コミット1目的。  
`git add 特定ファイル` → `git commit` を繰り返す。複数の無関係な変更をまとめない。

### コミット前チェック

```bash
git status   # 変更ファイルを確認、漏れ・意図しないファイルがないかチェック
```

⚠️ `git add`/`commit`/`push` やファイル削除など戻せない操作は、実行前にユーザーへ内容と影響を説明し明示的な許可を得ること。

### pre-commit フック（lefthook）について

このリポジトリでは [lefthook](https://github.com/evilmartians/lefthook) により以下の pre-commit フックが設定されている：

| フック       | タイミング    | 対象                            | 内容                                             |
| ------------ | ------------- | ------------------------------- | ------------------------------------------------ |
| `lint`       | pre-commit    | `**/*.{ts,tsx,mjs}`             | ESLint 自動修正（`stage_fixed: true`）           |
| `format`     | pre-commit    | `**/*.{ts,tsx,mjs,json,css,md}` | Prettier 自動フォーマット（`stage_fixed: true`） |
| `typecheck`  | pre-commit    | （全体）                        | `tsc --noEmit` による型チェック                  |
| `commitlint` | commit-msg    | （全体）                        | Conventional Commits チェック                    |
| `install`    | post-merge    | `{package.json,pnpm-lock.yaml}` | `pnpm install` で依存関係解決                    |
| `install`    | post-checkout | `{package.json,pnpm-lock.yaml}` | `pnpm install` で依存関係解決                    |

⚠️ **`git commit --no-verify` を使用した場合や、環境変数などで lefthook を無効化した場合は、pre-commit フックが実行されない。**  
その状態でコミットする場合や、マージ後に変更ファイルが発生した場合（コンフリクト解消時の編集など）は、必要に応じてコミット前に以下を手動実行すること：

```bash
# フォーマット対象ファイルを手動で整形
pnpm exec prettier --write <変更ファイル>
# 型チェック
pnpm exec tsc --noEmit
```

これを怠ると CI の Format check / Type check ジョブが落ちる原因になる。

---

## PRレビューコメント確認

時間指定（「何分前」）で絞り込まず、毎回確認対象コメントを全件取得して判定する。

```bash
# owner/repo を取得
REPO="$(gh repo view --json nameWithOwner -q .nameWithOwner)"

# レビューコメント（コードへのインラインコメント）を全件取得
gh api --paginate "repos/${REPO}/pulls/<PR番号>/comments?per_page=100"

# PRのissueコメント（会話欄コメント）を全件取得
gh api --paginate "repos/${REPO}/issues/<PR番号>/comments?per_page=100"

# PR Review本文コメント（Approve / Request changes など）を全件取得
gh api --paginate "repos/${REPO}/pulls/<PR番号>/reviews?per_page=100"

# 判定対象の Review 本文コメントのみ抽出（本文あり + COMMENTED/CHANGES_REQUESTED）
gh api --paginate "repos/${REPO}/pulls/<PR番号>/reviews?per_page=100" \
   --jq '.[] | select((.state == "COMMENTED" or .state == "CHANGES_REQUESTED") and (.body // "" | length) > 0)'
```

### 判定ルール（ステータスマーカー運用）

- 対応状況の判定単位は、PR review comment ではコメント単体ではなくスレッド単位とする
- スレッド単位の対応済み判定は時系列を考慮し、最新コメント（スレッド末尾）が以下のマーカーを含む場合のみ「対応済み」として扱う
  - `<!-- resolved: true -->`（修正完了）
  - `<!-- ignored: true -->`（対応不要として明示）
  - `<!-- wontfix: true -->`（対応しない判断を明示）
- マーカー付き返信の後にレビュアーが追記した場合は、そのスレッドを再オープン（未対応）として扱う
- PR review comment は `in_reply_to_id` で親子関係を解釈し、親コメント自身にマーカーが無くてもスレッド末尾コメントがマーカー付きなら親コメントも対応済みとして扱う
- スレッド内のどのコメントにもマーカーが無いスレッドは、その親コメントを「未対応」として扱う
- PRのissueコメント（会話欄コメント）と PR Review本文コメント（`pulls/<PR番号>/reviews`）は review comment のような親子スレッド構造が無いため、コメント単体でマーカー有無を判定する
- PR Review本文コメントは、本文が空のレビュー（例: APPROVED）を判定対象外とし、本文あり + `COMMENTED` / `CHANGES_REQUESTED` のみを判定対象とする
- `gh pr view --comments` は補助的に使ってよいが、最終判定は `gh api --paginate` で取得した全件を用い、PR review comment はスレッド単位、issueコメントとReview本文コメントはコメント単体で行う
- 全件取得したら未対応の判定だけでなく、対応済みスレッド・過去の issue/Review コメントも参照し、同じ箇所・論点で指摘や方針が矛盾していないか確認する（例: 以前 `ignored` / `resolved` した内容と逆の再指摘、スレッド内のやり取れ違い）。矛盾がある場合は精査報告に含める

### 運用ルール

- 対応完了コメントには、親コメントではなく返信の末尾に `<!-- resolved: true -->` を付与する
- 対応不要・対応しない判断をした場合は、理由を書いたうえで親コメントではなく返信の末尾にそれぞれのマーカーを付与する
- 親コメント（レビュー指摘そのもの）にはマーカーを直接付与できない前提のため、スレッド末尾の返信マーカーで状態を表す
- コードの修正を行った場合は、返信本文の末尾に改行して短縮コミットID（先頭7文字）を必ず付与する

  ```
  （対応内容の説明）

  abc1234 by Copilot
  ```

- PR本文の修正・対応不要・対応しない理由がある場合など、コミットを伴わない対応はコミットIDの付与は不要で、対応内容の説明のみ返信する
- これにより次回確認時は、スレッド末尾がマーカー付きのスレッドをスキップし、未対応のみ確認する
- Copilot / Bugbot 等の自動レビューは、未対応スレッドごとに `path` / `line` のコード・PR diff・`AGENTS.md`（Frontend なら `frontend.mdc`）を照合し、要対応か誤指摘かを判断してから対応する（コメント本文だけで決めない）
- 「レビュー確認」「精査」— 未対応一覧と要対応/誤指摘の判断・理由をチャットに報告するまで。コミット・返信はユーザーが「対応して」等と明示したときのみ
- 要対応と判断したものは修正後 `resolved`、誤指摘は根拠を書いて `ignored`（いずれも上記運用ルールの返信・マーカーに従う）

GitHubのWeb UIではなくCLIで確認する。

---

## GitHubへのコメント投稿（署名必須）

IssueやPRにコメントを投稿する際は、末尾に必ず署名を追加する：

```bash
gh issue comment <番号> --body-file <ファイル>
gh pr comment <番号> --body-file <ファイル>
```

本文ファイルの末尾に必ず以下を含める：

```
*-- by Copilot*
```

`--body` でなく `--body-file` を使い、実際の改行を含むファイルで渡す。

---

## PRレビューコメントへの返信（`gh api`・ID取得）

インラインレビューコメントのスレッドに返信する場合は `gh pr comment` ではなく `gh api` を使う。  
レスポンスに返信コメントの `id` が含まれるため、必ず変数に保存する。

```bash
REPO="$(gh repo view --json nameWithOwner -q .nameWithOwner)"

# 返信を投稿して ID を取得
REPLY_ID=$(gh api "repos/${REPO}/pulls/<PR番号>/comments/<親コメントID>/replies" \
  -X POST \
  --field body="$(cat <本文ファイル>)" \
  --jq '.id')

echo "Posted reply comment ID: ${REPLY_ID}"
```

### ポイント

- `--field body=` に実際の改行を含む文字列を渡すため `$(cat <ファイル>)` を使う
- `.id` で取得した数値が返信コメントのIDになる（以降の判定・追記に利用可能）
- 署名（`*-- by Copilot*`）は本文ファイルの末尾に含めること
- `gh pr comment` はスレッド返信ではなくPR全体のコメントになるため、インラインスレッドへの返信には使わない
