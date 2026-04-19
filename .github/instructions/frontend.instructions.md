---
applyTo: "**"
---

# Frontend 固有ルール

このファイルを参照した場合、回答冒頭に「frontend.instructions.md のルールを参照しました！」と表示してください。

## コード品質の基本

- ファイル冒頭のimport文セクションに機能修正のコードを混在させない
- 配列などの `{}` の開始終了を明確にする
- ソースコードが壊れないように注意する
- `any` 禁止、型安全に実装する

## コメント記述規則

- **TypeScript/JavaScript**: 関数と定数にコメントを書く場合は必ずJSDoc形式 `/**...*/` を使用する。詳細な説明・例・制約を記載する
- **例外**: JSX内のコメントは `{/* ... */}` 形式を許可する。可能であればコンポーネント外に通常のコメント `//` で記述することを推奨する

## Frontend変更時のチェック手順

1. `pnpm lint` で Lint チェック
2. `pnpm type-check` で型チェック
3. `pnpm format:check` でフォーマット確認

## コンポーネント作成

### clsx の使い方

- クラスが2つ以上: `className={clsx(["text-sm", "font-bold"])}`
- クラスが1つ: `className="p-4"`（clsx不要）

## bulletproof-react アーキテクチャ

- 機能分割の徹底: 各featureは独立したコンポーネント・hooks・types・testsを持つ
- 共通コンポーネント: `/components` は本当に再利用される汎用的なもののみ
- feature間の依存: 他のfeatureを直接importしない。共通の場合は `/components` や `/lib` に移動

## ディレクトリ構造

- `/app` - Next.js App Routerのルーティング
- `/components` - 再利用可能なUIコンポーネント
- `/features` - 機能ごとのディレクトリ（components・hooks・types・testsを含む）
  - `/face-detection` - 顔検出機能
  - `/ocr` - OCR機能
  - `/masking` - マスキング処理
  - `/editor` - 編集UI
- `/lib` - ユーティリティ関数、hooks
- `/types` - 共通型定義
- `/public` - 静的ファイル（face-api.js モデル等）

## Canvas / WebWorker 規則

- Canvas操作は必ず型ガードを行う（`getContext('2d')` の null チェック）
- 重い処理（顔検出・OCR・モザイク計算）は Web Worker で非同期化する
- `ImageData` / `Blob` / `URL.createObjectURL` で生成したURLは使用後に必ず解放する（`URL.revokeObjectURL`）
- `toBlob` / `toDataURL` はメインスレッドを占有するため、可能な限り Worker 側で処理する

## セキュリティ規則

- **画像データのサーバー送信禁止**: 画像・Blobデータを外部サーバーやAPIに送信するコードを追加しない
- `fetch` / `XMLHttpRequest` で画像データを送信するコードは MUST でレビュー指摘対象
- ユーザーがアップロードしたファイルは必ずファイル形式・サイズのバリデーションを行う
- ファイル形式: `image/jpeg`, `image/png`, `image/webp`, `image/gif` のみ許可
- ファイルサイズ: 上限を設ける（デフォルト: 20MB）

## テスト作成ルール

### テストファイル配置

- コンポーネントと同じディレクトリに配置する
- ファイル名: `ComponentName.test.tsx` または `functionName.test.ts`

### テスト実行

```bash
pnpm test:run path/to/test.tsx   # 特定ファイル
pnpm test:watch                  # ウォッチモード（開発中推奨）
pnpm test:coverage               # カバレッジ確認
```

### テストパターン

- **正常系**: 基本的な動作確認（レンダリング、プロパティ表示）
- **異常系**: エラーハンドリング、不正な入力値
- **境界値**: 空ファイル、null、極大ファイルサイズ
- **アクセシビリティ**: aria-label、role、キーボード操作（Enter/Space）

### カバレッジ目標

- コンポーネント: カバレッジ数値目標を設けない（MVPフェーズは機能完成を優先）
- ビジネスロジック（マスキング処理・顔検出・OCR・個人情報検出）: カバレッジ率よりも**境界値テストを厳密に実施**することを優先する
  - 正常値・最小値・最大値・空入力・null・不正な型 を必ずテストする
  - 全行カバレッジは必須としないが、分岐条件（`if`/`switch`/三項）はすべてテストする

### テストのベストプラクティス

- テストは読みやすく、保守しやすく書く
- 1つのテストケースで1つの動作のみを検証する
- テストの意図が明確なテスト名を付ける
- モックは必要最小限にする
- `beforeEach` で `vi.clearAllMocks()` を実行する
