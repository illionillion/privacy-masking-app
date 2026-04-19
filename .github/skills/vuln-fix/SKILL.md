---
name: vuln-fix
description: "npm/pnpm の脆弱性対応を行う時に使用するSkill。「脆弱性修正して」「pnpm audit対応して」「セキュリティ警告を直して」などの操作が対象。audit実行・バージョンアップ・overrides設定・パッチなし無視・PR作成までの一連フローを含む。"
argument-hint: '例: "pnpm auditの脆弱性を修正" / "セキュリティ警告をまとめて対応してPR作成" / "依存関係の脆弱性チェックして修正"'
---

# 脆弱性対応 Skill

`pnpm audit` で検出された脆弱性をトリアージし、修正・上書き設定・無視の判断を行い、github-ops Skill でPRを作成するまでの全手順。

## ワークフロー全体像

```
1. pnpm i          … 最新の lockfile を生成
2. pnpm audit      … 脆弱性を検出
3. トリアージ         … 対応 / 無視 を判断
4. 修正を適用         … バージョンアップ or overrides
5. pnpm i + audit  … 解消を確認
6. github-ops Skill でブランチ・コミット・PR 作成
```

---

## Step 1: 依存関係インストール

```bash
pnpm i
```

---

## Step 2: 脆弱性スキャン

```bash
pnpm audit
```

### 出力の読み方

| 項目         | 内容                                                    |
| ------------ | ------------------------------------------------------- |
| `Severity`   | `low` / `moderate` / `high` / `critical`                |
| `Package`    | 脆弱性のある直接依存 or 間接依存パッケージ              |
| `Patched in` | 修正済みバージョン（`No patch available` の場合は無視） |
| `Paths`      | 依存ツリー（どのパッケージ経由で使われているか）        |

---

## Step 3: トリアージ（対応 / 無視 の判断）

### 対応する条件（いずれか一つでも該当すれば対応）

- `Patched in` に修正バージョンが存在する
- Severity が `high` 以上

### 無視する条件（全て該当する場合のみ無視）

- `No patch available` と明記されている
- **かつ** 代替パッケージも存在しない
- **かつ** devDependencies のビルド・テストツールのみで使用されている（本番コードに影響なし）

> ⚠️ `No patch available` でも `critical` / `high` かつ本番コードに影響する場合は、代替パッケージへの移行を検討してユーザーに相談すること。

---

## Step 4: 修正を適用

### 方法A: 直接依存パッケージのバージョンアップ

そのパッケージが `package.json` の `dependencies` / `devDependencies` に直接記載されている場合：

```bash
# 特定バージョンを指定
pnpm add <package>@<patched-version>

# 例
pnpm add axios@1.7.9
pnpm add -D vite@5.4.11
```

### 方法B: 間接依存への overrides 設定

脆弱なパッケージが間接依存（他パッケージが依存している）の場合、`package.json` に `pnpm.overrides` で強制バージョン指定する：

```json
{
  "pnpm": {
    "overrides": {
      "vulnerable-package": ">=patched-version"
    }
  }
}
```

> `>=` を使うことで、より新しいパッチが出た際も自動的に対応できる。

### 方法C: `pnpm audit --fix`（自動修正）

直接依存のみに有効。試してから手動確認が必要：

```bash
pnpm audit --fix
```

> ⚠️ メジャーバージョンアップが発生する場合は破壊的変更のリスクがあるため、ビルド・テストで動作確認すること。

---

## Step 5: 解消確認

```bash
# 修正後に再インストール
pnpm i

# 再度スキャン
pnpm audit
```

### 確認基準

| 状態                      | 対応                               |
| ------------------------- | ---------------------------------- |
| `found 0 vulnerabilities` | 完全解消 → Step 6 へ               |
| パッチなし脆弱性のみ残存  | 無視対象として記録 → Step 6 へ     |
| パッチあり脆弱性が残存    | overrides / バージョン指定を再確認 |

残存する無視対象がある場合は、PR本文に理由を明記する。

---

## Step 6: github-ops Skill でPR作成

[github-ops/SKILL.md](../github-ops/SKILL.md) に従い、以下の手順でPRを作成する。

### ブランチ命名規則

```
chore/security-fix-YYYYMMDD
```

### コミットメッセージ

```
chore: セキュリティ脆弱性を修正（pnpm audit対応）
```

### コミット対象ファイル

```bash
git add package.json pnpm-lock.yaml
```

### PR本文に必ず含める内容

- 対応した脆弱性の一覧（パッケージ名・旧バージョン→新バージョン・CVE番号・Severity）
- 修正方法（バージョンアップ / overrides）
- 無視した脆弱性がある場合は理由（`No patch available` 等）
- `pnpm audit` の最終結果（クリーン or 残存件数）
- 破壊的変更リスクの有無・動作確認状況

---

## よくあるケースと対処

### ケース1: 間接依存で修正バージョンがある

→ `pnpm.overrides` に `"vulnerable-package": ">=1.2.3"` を追加

### ケース2: `No patch available`

→ devDependencies かつ本番コードへの影響がないことを確認して無視。PR本文に無視理由を記載。

### ケース3: メジャーバージョンアップが必要

→ `pnpm add <package>@latest` を試みる前に **CHANGELOG / Breaking Changes を確認**する。  
→ ビルド (`pnpm build`) とテスト (`pnpm test`) が通ることを確認してからコミット。

### ケース4: audit --fix が lockfile を壊す

→ `pnpm i` を再実行して lockfile を再生成。それでも解消しない場合は手動でバージョン指定する。
