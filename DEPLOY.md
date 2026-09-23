# Nicole the Astronavigator — PWA + 端末連動版

GitHub Pages の Nicole リポジトリ直下へ、このフォルダ内のファイルを配置してください。

必須:
- index.html
- manifest.webmanifest
- sw.js
- favicon.ico
- icon-32.png
- icon-192.png
- icon-512.png
- apple-touch-icon.png

PWA の Service Worker は HTTPS（GitHub Pages は対応）で動作します。
初回はオンラインで Nicole を1回開いてください。その後、アプリ本体はオフライン起動できます。
天候・彗星などのAPIデータは、同じリクエストの直近応答がService Workerに保存されていればオフラインで参照できます。最新性は保証されません。

端末連動は「星図 → 地平 → 📱 端末連動」から開始します。iPhone / iPad ではボタン操作をきっかけにセンサー利用許可が表示されます。
