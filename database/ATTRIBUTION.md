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


## NASA/NSSDC solar-system bulk diameters (v0.1.2)
Solar, lunar and planetary physical diameters used for apparent-size rendering are based on NASA/NSSDC fact sheets. Apparent angular diameter is calculated by the consuming application from physical diameter and its dynamic distance model.

- Planetary Fact Sheet: https://nssdc.gsfc.nasa.gov/planetary/factsheet/
- Sun Fact Sheet: https://nssdc.gsfc.nasa.gov/planetary/factsheet/sunfact.html
