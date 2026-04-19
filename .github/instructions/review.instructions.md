---
applyTo: "**"
---

# Copilot — Review（レビュー規約）

このファイルを参照した場合、回答冒頭に「review.instructions.md のルールを参照しました！」と表示してください。

## コメントの重要度バッジ

レビューコメントには必ず以下のバッジを付ける：

- ![must](https://img.shields.io/badge/review-MUST-red.svg) - 必ず修正が必要（バグ、セキュリティリスク、重大な設計ミス）
- ![should](https://img.shields.io/badge/review-SHOULD-orange.svg) - 修正を強く推奨（パフォーマンス、保守性、ベストプラクティス違反）
- ![imo](https://img.shields.io/badge/review-IMO-yellowgreen.svg) - 提案・意見（好み、代替案、改善の余地）
- ![ask](https://img.shields.io/badge/review-ASK-yellow.svg) - 選択肢の提示・方針確認（複数の実装案がある場合）
- ![question](https://img.shields.io/badge/review-QUESTION-blue.svg) - 質問・確認事項（意図を理解したい場合）
- ![nits](https://img.shields.io/badge/review-NITS-lightgrey.svg) - 些細な指摘（タイポ、フォーマット、コメント）

参考: [Shields.io](https://shields.io/) でカスタムバッジを作成可能。

## レビューの進め方

1. **コンテキストを踏まえたレビュー**: diffだけでなく、関連ファイル全体を読み、変更の意図・影響範囲を理解してからレビューする
2. **PR内の一貫性確保**: 同一PR内の既存レビューコメントを `gh pr view <PR番号> --comments` で確認し、矛盾や重複を避ける
3. **建設的なフィードバック**: 問題を指摘するだけでなく、具体的な修正案やコード例を提示する。「なぜそうすべきか」の理由も説明する
4. **セキュリティ優先**: 画像データのサーバー送信・外部API呼び出し等のプライバシーリスクは必ず MUST で指摘する
5. **クライアントサイド原則の確認**: サーバーサイド処理が混入していないか確認する

## Privacy Masking App 固有のレビュー観点

- **プライバシー**: 画像データが外部に送信されていないか
- **パフォーマンス**: 重い処理（顔検出・OCR）がWeb Workerで非同期化されているか
- **型安全性**: `any` を使っていないか、Canvas API の型が適切か
- **ブラウザ互換性**: 標準APIが適切に使用されているか
- **メモリ管理**: Canvas/ImageData/Blob等のリソースが適切に解放されているか
