# Nicole the Astronavigator v2.1.1

## 変更点
- Nicole Astronomy Database v0.3.0 をオンライン参照。
- GitHub Pages公開物のローカルDBフォールバックを軽量化。
- Nicole 1で使用しない `database/assets/constellation-art/` 88枚を公開パッケージから除外。
- 星座線・恒星座標・主要天体JSONはオフラインフォールバックとして保持。
- v2.1.0のユーザーデータ書き出し／読み込み機能を維持。

## DB方針
オンライン時は共通DB v0.3.0を優先し、取得失敗時のみ同梱JSONへフォールバックします。星座絵はNicole 1では使用しないため同梱しません。
