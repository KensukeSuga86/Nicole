# DATA SOURCES / ATTRIBUTION

## 恒星 B−V・スペクトル型
`stars.json` の測光値は isene/starmap の `stars.csv` と照合して補完。
同データのREADMEでは、位置・等級・B−V・スペクトル型は Yale Bright Star Catalogue, 5th Revised Edition に由来すると説明されています。

B−VからBallesteros近似式で有効温度を推定し、その温度から星図表示用の近似黒体色を生成しています。
`display_color_hex` は観測RGB値ではなく可視化用です。

EpsLyrはNicole側でダブル・ダブル系全体を1 IDにしているため、ε1 Lyrae代表値を採用。

## Messier M1–M110
brettonw/YaleBrightStarCatalog の `messier.json` を基礎資料として完全収録。
Nicole 1に既存する解説は保持し、新規天体はcatalog-onlyとして追加。

M102は歴史的に同定に議論があるため、本DBではNGC 5866を採用し注記を付与。

## Deep Skyの所属星座
Messierは上記カタログのConを使用。
Nicole 1既存の非Messier Deep SkyはOpenNGCのConstフィールドで確認。
OpenNGCはCC BY-SA 4.0。帰属・ライセンス条件を維持してください。

## Asterisms
NASA等の一般的な星空案内資料と複数資料を照合し、実用上オーソドックスな構成に整理。
春の大三角は定義にバリエーションがあるため、本DBではアルクトゥルス・スピカ・デネボラを採用し注記。


## v0.1.2 solar-system metadata
Physical-diameter metadata uses NASA/NSSDC Planetary Fact Sheet / Sun Fact Sheet conventions. Deep Sky angular sizes are normalized from the existing v0.1.1 Nicole fields; no new position angle is inferred.

## Nicole標準星座線・星座絵 (v0.3.0)
Nicole標準星座線は、Nicole the Astrorium v0.7.6 の星座編集プロジェクトで88星座を手作業確認・調整した結果を正式化したものです。

星座線の基礎データには **Hipparcos Planetarium Data Creator / Stellarium-derived constellation-line data** を使用しています。上流プロジェクトが示すライセンスは GNU GPL v2.0 です。v0.3.0で基準線をそのまま採用した33星座、および編集の出発点となった線データについて、上流の帰属・ライセンス条件を維持してください。

- Upstream: https://github.com/creativival/hipparcos_planetarium_data_creator
- Line data: `hip_constellation_line.csv`
- Line-star data: `hip_constellation_line_star.csv`

88枚の星座絵はNicole用に制作・調整した画像です。v0.3.0ではAstrorium v0.7.6同梱画像79枚と、最終編集プロジェクトで差し替えられた9枚を正式アセットとして格納しています。

