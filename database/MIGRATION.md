# Migration to Nicole Astronomy Database v0.1.2

v0.1.1との互換性を維持しつつ、描画用メタデータを追加しています。

- 新規: `data/solar-system.json`
- 追加: `deep-sky.json[*].angular_size`
- 追加: `planets.json[*].physical_diameter_km` / `rendering`

視直径は `2 * atan(diameter / (2 * distance))` で計算できます。距離は描画日時の動的な地心距離を利用してください。
