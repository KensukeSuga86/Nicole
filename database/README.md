# Nicole Astronomy Database v0.2.0

## v0.2.0 — データ補完・科学/文化再検証
- 恒星64件すべてに解説・英名・距離表示を整備（一般向け丸め値）
- Deep Sky 119件すべてに解説・距離表示を整備し、`catalog_only` の72 Messierを補完
- 88星座に科学と神話/成立史を分離した検証メタデータを追加
- NASA Hubble Messier、IAU、国立天文台、SIMBAD/CDS、Smithsonian/Chandra等を出典体系に追加
- 宮沢賢治『星めぐりの歌』『銀河鉄道の夜』の直接的な天文対応を `cultural_context.miyazawa_kenji` として追加
- 追加・修正内容は `COMPLETION_REPORT.md/.csv/.json` で確認可能
- v0.1.2の視直径描画メタデータは維持

## v0.1.2 変更
- v0.1.1を基礎に、太陽・月・7惑星の視直径描画用メタデータを追加
- `data/solar-system.json` を新設し、物理直径と距離モデルを保持
- Deep Sky 119件すべてに `angular_size.major_arcmin / minor_arcmin` を数値化して追加
- Position Angle はv0.1.1の元データに確実な値がないため `null` とし、推測値は入れない
- 既存Nicole ID、既存解説、星座・恒星・Messier収録内容は変更しない

## 件数
- 88星座
- 恒星 64
- 7惑星
- 非惑星天体 119（Messier 110）
- アステリズム 9
- solar-system 9（太陽・月・7惑星）
- Deep Sky視サイズ数値化 119/119

既存のNicole IDは変更していません。