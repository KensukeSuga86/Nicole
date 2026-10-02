# Nicole Astronomy Database v0.3.2

## v0.3.2 — 共通解説エディタ

- Nicole 0（Nicole Astronomy Database）に `description-editor.html` / `description-editor.js` を追加。
- 星座・恒星・深宇宙天体・惑星の解説をブラウザ上で編集できる。
- 編集内容は `nicole0_description_overrides_v1` としてブラウザのローカル保存領域に保持し、差分JSONとして書き出し・読み込みできる。
- 編集済みのカテゴリJSONも書き出し可能。
- 天文データ本体はv0.3.1と同一で、Aqr星座線ホットフィックスをそのまま維持。

## v0.3.1 — 星座線ホットフィックス

- 2026-10-02のNicole星座編集プロジェクトから、みずがめ座（Aqr）の最終星座線修正を正式反映。
- Aqrの最終線 `HIP112542 → HIP114341` を `HIP112716 → HIP114341` に置換。
- 総セグメント数は717のまま。最終星座線で使用する一意恒星IDは759件（埋込座標269件 + 上流参照490件）。
- 星座絵およびその他の天文DB内容はv0.3.0を維持。


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
標準星座線のトポロジーと星座絵はv0.3.0で正式化され、v0.3.1ではみずがめ座の星座線1箇所のみをホットフィックスしています。
線で使う恒星ID 759件のうち、269件はDB内に座標を保持しています。残る490件のHIP座標は、v0.7.6が従来利用していた `hip_constellation_line_star.csv` を明示的な参照元として保持しています。
これはデータ欠損を推測値で埋めないための互換設計です。将来の完全オフライン版では上流座標カタログをライセンス表示とともに同梱できます。

## v0.2.0から継続するデータ
- 星座88の科学・神話/成立史メタデータ
- 恒星64
- Deep Sky 119 / Messier 110
- 惑星・太陽系描画メタデータ
- アステリズム9
- 宮沢賢治関連タグ

既存Nicole IDは変更していません。
