# Nicole Astronomy Database v0.3.0

## v0.3.0 — Nicole標準星座データ正式版
Nicole the Astrorium v0.7.6 で完了した88星座の編集成果を共通DBへ正式登録しました。

### 新規正式データ
- `data/constellation-standard.json` — 88星座のNicole標準星座線、構成星ID、星座絵配置
- `data/constellation-line-stars.json` — 標準星座線が参照する恒星IDと座標解決情報
- `data/constellation-art-manifest.json` — 88星座絵のSHA-256と由来
- `assets/constellation-art/*.png` — 88星座の正式星座絵
- `data/constellation-editor-audit.json` — 編集成果の監査情報

### 完成状態
- 星座: 88/88
- workflow完了: 88/88
- Nicole標準星座線: 88/88
- 線分: 717
- 星座線恒星ID: 760
- 星座絵: 88/88
- 星座絵差し替え正式昇格: 9
- 手動編集線: 55星座
- v0.7.6基準線を完成形として採用: 33星座

### 座標互換性
標準星座線の**トポロジー（どの星とどの星を結ぶか）と星座絵はv0.3.0で完全固定**されています。
線で使う恒星ID 760件のうち、270件はv0.3.0内に座標を保持しています。残る490件のHIP座標は、v0.7.6が従来利用していた `hip_constellation_line_star.csv` を明示的な参照元として保持しています。
これはデータ欠損を推測値で埋めないための互換設計です。将来の完全オフライン版では上流座標カタログをライセンス表示とともに同梱できます。

## v0.2.0から継続するデータ
- 星座88の科学・神話/成立史メタデータ
- 恒星64
- Deep Sky 119 / Messier 110
- 惑星・太陽系描画メタデータ
- アステリズム9
- 宮沢賢治関連タグ

既存Nicole IDは変更していません。
