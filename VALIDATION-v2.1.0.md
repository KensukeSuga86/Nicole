# Nicole the Astronavigator v2.1.0 Validation

- Nicole Astronomy Database v0.3.0 固定参照
- 88星座・717線分のNicole標準星座線を `constellation-standard.json` から使用
- DB内蔵座標270件とHipparcos line-star catalog座標を統合して星座線恒星を解決
- DBに座標未同梱の490恒星はオンラインまたは既存キャッシュから補完
- ユーザーデータJSONの書き出し／読み込みUIと保存処理を追加
- Service Worker: `nicole-pwa-v2.1.0`
- JS / JSON / HTML重複ID / ローカルHTTP配信をリリース時に検証
- iPhone / iPad / Safariの実機PWA更新テストは未実施
