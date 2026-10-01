# Migration to Nicole Astronomy Database v0.3.0

v0.2.0の既存データ構造を保持したまま、Nicole標準星座データを追加します。

## 新規ファイル
- `data/constellation-standard.json`
- `data/constellation-line-stars.json`
- `data/constellation-art-manifest.json`
- `data/constellation-editor-audit.json`
- `assets/constellation-art/*.png`
- `schema/constellation-standard.schema.json`
- `schema/constellation-line-star.schema.json`

## アプリ側の推奨移行
1. `constellation-standard.json` が存在する場合、星座線トポロジーはこれを最優先する。
2. 恒星座標は `constellation-line-stars.json` の `coordinate_status=embedded` を使用する。
3. `upstream_reference` のHIP IDは、従来のHipparcos line-star sourceで解決する。
4. 星座絵は `art.asset` と `art.placement` を使用する。
5. 編集用localStorage/プロジェクトJSONは上書きレイヤーとしてのみ扱い、初期値はDB v0.3.0へ移す。
