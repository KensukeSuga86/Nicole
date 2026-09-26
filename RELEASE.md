# Nicole the Astronavigator v1.12.0

v1.12.0は、PWA・iPhoneホーム画面起動・キャッシュ・全画面表示など、アプリの土台を安定化するメンテナンスリリースです。

公開版：  
https://kensukesuga86.github.io/Nicole/

---

## 主な変更

### 📱 PWA設定を整理

HTML `<head>` 内に重複していたfavicon、apple-touch-icon、theme-colorなどの指定を整理し、1つの設定へ統一しました。

また、`viewport-fit=cover` とiPhone / iPadのSafe Areaを考慮する設定を追加しています。

manifest、HTML、CSSの背景色・テーマ色はNicoleの暗色背景へ統一しました。

### 🪐 PWAアイコン一式を再生成

これまでのiOS用アイコンは画像自体に角丸・透明コーナーを含んでいました。

v1.12.0では、OS側で角丸やマスクを処理する前提へ変更し、**全面不透明の正方形アイコン**として再生成しています。

完全版ZIPには次の素材を同梱します。

- `apple-touch-icon.png` — iOS用 180×180
- `icon-32.png`
- `icon-192.png`
- `icon-512.png`
- `icon-maskable-192.png`
- `icon-maskable-512.png`
- `icon-master-1024.png`
- `favicon.ico`
- `manifest.webmanifest`

### 🔄 Service Workerを安定化

Service Workerの更新方法とキャッシュ構成を整理しました。

- アイコンなど任意の資産が一時的に欠けても、Service Worker全体のインストールが失敗しない
- オフライン起動用HTMLは `index.html` へ統一
- 天候・彗星・流星群等の動的キャッシュは通常のアプリ更新では消さない
- 新版が待機した場合、Nicole内に更新通知を表示

### 🔴 赤色夜間モードの構造を変更

ページ全体の `body` にCSS `filter` を掛ける方式を廃止しました。

代わりに画面上のオーバーレイで赤色化することで、`position: fixed`、モーダル、星図全画面表示などとの干渉を減らしています。

### 🩺 起動時セルフチェック

主要なDOM要素の欠落やID重複を起動時に検査する軽量な診断機能を追加しました。

開発時にはブラウザコンソールのほか、`window.NicoleDiagnostics` から状態を確認できます。

---

## PWA / キャッシュ

Service Workerのアプリキャッシュ名前空間：

```text
nicole-pwa-v1.12.0
```

動的データキャッシュ：

```text
nicole-data-v1
```

---

**Version 1.12.0**
