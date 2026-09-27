# Nicole the Astronavigator v2.0.1 — GitHub Pages更新

v2.0.1では `index.html` だけでなく、`bootstrap.js`、`app.js`、`database/` も必須です。

## 更新するもの

GitHub PagesのNicoleリポジトリへ、このパッケージの内容をルートからそのまま配置してください。

主な追加・更新ファイル：

- `index.html`
- `bootstrap.js`
- `app.js`
- `database/` 一式（Nicole Astronomy Database v0.2.0）
- `sw.js`
- `README.md`
- `RELEASE.md`
- `CHANGELOG.md`
- PWAアイコン / manifest類

## 共通DB

オンラインの固定参照先は `Nicole-Astronomy-Database/versions/0.2.0/` です。先に共通DB v0.2.0を公開しておくのが推奨ですが、公開前または通信失敗時でもNicoleは同梱DB v0.2.0へフォールバックします。

Service Worker cache: `nicole-pwa-v2.0.1`

## Rebuild note
This package was rebuilt from the canonical `Nicole-v1.12.0-full.zip` base, then the common DB layer was reapplied. The bundled database is the v0.2.0 generated from v0.1.1 in the same rebuild sequence.
