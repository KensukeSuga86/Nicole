# Nicole the Astronavigator v1.7 deploy

GitHub Pages の Nicole リポジトリ直下へ配置:
- index.html
- manifest.webmanifest
- sw.js
- favicon.ico
- icon-32.png
- icon-192.png
- icon-512.png
- apple-touch-icon.png

Service Worker cache: nicole-pwa-v1.7.0

v1.7.0 主な変更:
- Open-Meteo通常予報を地点ごとに30分キャッシュ
- JMA MSM / ECMWF IFS / NOAA GFS 比較を地点ごとに2時間キャッシュ
- 緯度経度を0.001°へ丸め、ほぼ同一地点の重複API通信を抑制
- 同一地点への同時リクエストを1本へまとめる
- ブラウザ保存は最大10エントリで古いものから整理
- 通信失敗時は期限切れキャッシュを「保存済み予報（更新待ち）」として利用
- クライアント側の自動多重リトライを廃止し、1回の取得に限定
- Service Worker の保存済み応答もNicole側キャッシュへ取り込み
- v1.6で発生していた「雨注意文」の変数参照順による実行時エラーを修正
