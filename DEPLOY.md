# Nicole the Astronavigator v1.8.2
更新対象: sw.js のみ

※ index.html は v1.8.1 のままで変更不要です。
※ 星図描画・追尾・ジャイロ・180°反転対策などのロジックは変更していません。

変更: Nicole Cache Manager
- Service Worker cache を `nicole-pwa-v1.8.2` に更新
- 旧 `nicole-pwa-*` キャッシュは activate 時に自動削除
- 動的データを用途別に分類し、保存期限と件数上限を設定
- Open-Meteo 天気: 最大18時間 / 64件
- night-comets / comet-track: 最大7日 / 160件
- meteors: 最大45日 / 16件
- Hoshinotori: 最大365日 / 240件
- raw.githubusercontent.com の固定天文データ: 最大365日 / 32件
- DATA_CACHE 全体: 最大320件
- キャッシュ整理は最大10分間隔で実行し、通信レスポンスを待たせないよう FetchEvent.waitUntil() で処理
- 保存時刻 `X-Nicole-Cached-At` を使って古い項目から削除
- 期限切れデータはオフライン時にも返さず削除し、古い天気・彗星情報の誤表示を防止
- App Shell は従来通り別キャッシュで保持

Service Worker cache: nicole-pwa-v1.8.2
