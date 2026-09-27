# Nicole Astronomy Database v0.1.2

## 変更
- 恒星64件すべてにB−V・スペクトル型・表示用近似色を追加
- Deep Skyの所属星座を正式データで補完
- Messier M1〜M110を完全収録
- アステリズムを再点検し、春の大曲線を追加
- 秋の四辺形の名称を整理
- 出典とライセンスを `ATTRIBUTION.md` に追加

## 件数
- 88星座
- 恒星 64
- 7惑星
- 非惑星天体 119（Messier 110）
- アステリズム 9
- catalog 287

既存のNicole IDは変更していません。


## v0.1.2 rendering metadata
- Added `data/solar-system.json` for Sun, Moon and seven planets.
- Added `physical_diameter_km` and rendering hints to planets.
- Added numeric `angular_size.major_arcmin/minor_arcmin` to 119 deep-sky objects where the existing catalog/source supplied an apparent size.
- These values let Nicole/Astrorium render apparent size without replacing the existing astronomical-position engines.
