# Privacy Masking Tool (伏せ太郎 / Fusely)

画像内の顔やテキスト情報を検出し、公開前にマスキング編集できるブラウザ完結型ツールです。

## 特徴

- ブラウザだけで処理し、画像データをサーバーへ送信しません
- 顔検出とOCRを使って、個人情報の候補を検出します
- 黒塗り・モザイク・ぼかしなどのマスキング編集に対応します
- 編集後の画像をそのままダウンロードできます

## 使い方

1. 画像をアップロードします
2. 検出結果を確認し、必要な箇所を調整します
3. マスキング方法を選び、画像を書き出します

## ローカル開発

### 前提

- Node.js（バージョンはリポジトリの `.nvmrc` を参照、現状 `22.13.0` 以上）
- pnpm

### セットアップ

```bash
pnpm install
```

### 開発サーバー起動

```bash
pnpm dev
```

`http://localhost:3000` にアクセスしてください。

## デプロイ

Cloudflare Pages で運用しています。具体的な仕組みは次のとおりです。

- `next.config.ts` で `output: "export"` を指定し、本番ビルド時は静的ファイルを `docs/` に出力します（`distDir`）
- `main` への push をトリガーに GitHub Actions（`.github/workflows/cd.yml`）が `pnpm build` を実行し、生成された `docs/` をリポジトリへコミットします
- Cloudflare Pages がリポジトリの `docs/` を公開ディレクトリとして配信します
- 公開後は Google Search Console に登録し、インデックスを管理します

## 注意事項

- 検出精度は画像品質や文字条件に依存します
- 最終的な公開前チェックは利用者側で実施してください
- 機密性の高い素材を扱う場合は運用ルールも併せて整備してください

## コントリビュート

改善提案やバグ報告はIssueへお願いします。PRも歓迎します。

- Repository: <https://github.com/illionillion/privacy-masking-app>
- Issues: <https://github.com/illionillion/privacy-masking-app/issues>
- Pull Requests: <https://github.com/illionillion/privacy-masking-app/pulls>

## ライセンス

本リポジトリのライセンスは `LICENSE` を参照してください。
