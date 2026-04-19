# Stamp Images

このディレクトリには顔マスキング用のスタンプ画像が格納されています。

## 現在のファイル

| ファイル名       | 説明       |
| ---------------- | ---------- |
| `happy.svg`      | 笑顔       |
| `wink.svg`       | ウィンク   |
| `sunglasses.svg` | サングラス |
| `star.svg`       | 星         |

これらのSVGファイルはオリジナル作品（シンプルなベクターグラフィック）です。

## 推奨: 高品質絵文字への置き換え

本番環境では、以下のオープンソース絵文字セットからダウンロードすることを推奨します：

### Twemoji (Twitter Emoji)

- ライセンス: **CC-BY 4.0**（商用利用可、帰属表示が必要）
- リポジトリ: https://github.com/twitter/twemoji
- CDN: `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/{codepoint}.png`

例:

```
😊 = 1f60a.png
😉 = 1f609.png
😎 = 1f60e.png
⭐ = 2b50.png
```

### OpenMoji

- ライセンス: **CC-BY-SA 4.0**（商用利用可、帰属表示＋継承が必要）
- サイト: https://openmoji.org/
- フォーマット: PNG / SVG

## 帰属表示 (CC-BY 4.0 の場合)

Twemoji を使用する場合、帰属表示が必要です:

> Twemoji graphics are made by Twitter and other contributors, licensed under CC-BY 4.0.
