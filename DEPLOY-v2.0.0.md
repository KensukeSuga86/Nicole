# Nicole the Astronavigator v2.0.0 — GitHub Pages更新

v2.0.0では `index.html` だけでなく、`bootstrap.js`、`app.js`、`database/` も必須です。

## 更新するもの

GitHub PagesのNicoleリポジトリへ、このパッケージの内容をルートからそのまま配置してください。

主な追加・更新ファイル：

- `index.html`
- `bootstrap.js`
- `app.js`
- `database/` 一式（Nicole Astronomy Database v0.1.2）
- `sw.js`
- `README.md`
- `RELEASE.md`
- `CHANGELOG.md`
- PWAアイコン / manifest類

## 共通DB

オンラインの固定参照先は `Nicole-Astronomy-Database/versions/0.1.2/` です。先に共通DB v0.1.2を公開しておくのが推奨ですが、公開前または通信失敗時でもNicoleは同梱DB v0.1.2へフォールバックします。

Service Worker cache: `nicole-pwa-v2.0.0`
