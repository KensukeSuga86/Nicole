# Nicole the Astronavigator v1.5 deploy

GitHub Pages の Nicole リポジトリ直下へ配置:
- index.html
- manifest.webmanifest
- sw.js
- favicon.ico
- icon-32.png
- icon-192.png
- icon-512.png
- apple-touch-icon.png

Service Worker cache: nicole-pwa-v1.5.0

v1.5.0 主な変更:
- 端末連動の高仰角時の方位反転を抑制し、約75°まで追尾
- 観測日時の直下に観測開始ボタンを配置
- 観測開始ボタンを「はじめようか天体観測🔭」へ変更
- 予報一致度「低」かつ降水確率20%以上で雨の注意文を表示
- 星図表示設定をカテゴリ単位の同系色ボックスへ再編
- 星図時刻スライダーを ±7日（±168h）へ拡張
- 極軸望遠鏡の反転表示を「レクチル表示を180°回転」へ修正
- 2:00 AM + 地名検索「フミキリ」のイースターエッグ追加
