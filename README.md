[README.md](https://github.com/user-attachments/files/32545863/README.md)
# Nicole the Astronavigator

**Nicole the Astronavigator** は、天体観測の計画・星図表示・天体解説・撮影支援などを行うWebアプリです。

公開版：  
https://kensukesuga86.github.io/Nicole/

---

## 概要

Nicoleは、観測する日時と場所を基準に、その場所から見える星空や天体情報をまとめて確認できるように作られています。

主な目的は、

- 天体観測を計画する
- 今見えている星を確認する
- 星空について解説する

の3つです。

星図、天候、月齢、薄明、彗星、流星群、観測スケジュール、撮影支援などをひとつのWebアプリ内で扱います。

---

## 主な機能

- 指定日時・場所の全天星図
- 地平星図
- 星座線・星座名表示
- 太陽・黄道表示
- 月・白道表示
- 昼光シミュレーション
- 月光シミュレーション
- 惑星表示
- 主要天体表示
- 彗星表示
- 流星群放射点表示
- 天の川表示
- 天体・星座検索
- 月相カレンダー
- 観測スケジュール
- 「いつ・どこで見る？」による観測候補検索
- 観測地点の天候確認
- 夜間光の参考表示
- 周囲のより暗い候補地点の検索
- 星景撮影の写野表示
- 星を点で写すための推奨シャッタースピード計算
- NPF参考値・500ルール参考値
- タイムラプス計算
- 比較明合成・星グル撮影時間計算
- スタッキング時のS/N改善目安
- 赤色夜間モード
- 使用マニュアル

---

## 彗星データベース「星の鳥」

Nicoleは、彗星データベース **Hoshinotori / 星の鳥** と連携します。

公開版：  
https://kensukesuga86.github.io/Hoshinotori/

星の鳥では、彗星の軌道情報を検索し、Nicoleの星図へ反映できます。

Nicoleでは以下の計算モードを利用できます。

- 簡易計算
- 精密計算
- JPL高精度

JPL高精度ではNASA/JPL Horizons由来の見かけ位置を利用します。

---

## 外部サービスについて

Nicoleの一部機能は、外部サービスや外部データを利用しています。

主なものには以下があります。

- Open-Meteo
- OpenStreetMap / Nominatim
- 国土地理院
- NASA Earthdata / GIBS
- NASA/JPL
- Leaflet
- d3-celestial
- hipparcos_planetarium_data_creator

第三者ソフトウェア、データ、API等の詳細は以下を参照してください。

- `THIRD_PARTY_NOTICES.md`
- `LICENSES/`

---

## プライバシーについて

Nicoleでは、星図・天候・彗星情報などの計算に観測地点の緯度・経度を使用します。

機能によっては、観測地点の座標や観測日時が外部サービスへ送信されます。

お気に入り地点など、一部の設定は利用中のブラウザ内に保存されます。

詳しくはNicole本体の

**「データ出典・プライバシー・免責事項」**

を確認してください。

---

## 使用について

Nicole the Astronavigator のオリジナルソースコードは、オープンソースとして公開していません。

Copyright © 2026 Kensuke Suga. All rights reserved.

第三者ソフトウェア・データ等を除き、Nicoleのオリジナルソースコード、文章、UI、デザイン、その他のオリジナル素材について、事前の許可なく以下を行うことを認めていません。

- 複製
- 改変
- 再配布
- 派生物の作成
- 商用利用
- 再ライセンス
- その他の再利用

詳細はリポジトリ内の `COPYRIGHT` を参照してください。

GitHub上でリポジトリが公開されていること自体は、ソースコードの再利用・改変・再配布等を許可するものではありません。

---

## 第三者ライセンス

Nicoleで利用している第三者ソフトウェアやデータは、それぞれの提供元のライセンス・利用条件に従います。

詳細：

- `THIRD_PARTY_NOTICES.md`
- `LICENSES/Leaflet-BSD-2-Clause.txt`
- `LICENSES/d3-celestial-BSD-3-Clause.txt`
- `LICENSES/hipparcos-planetarium-data-creator-GPL-2.0.txt`

これら第三者素材について、Nicoleの `COPYRIGHT` が各提供元の権利やライセンスを制限するものではありません。

---

## 免責事項

Nicoleが表示する天体位置、天候、夜間光、彗星情報、撮影設定、観測候補などは、天体観測を補助するための参考情報です。

以下の用途には使用しないでください。

- 航法
- 安全確保に関する重要判断
- 立入可否の判断
- 人命や財産に関わる判断
- 高精度を保証する必要がある用途

外部サービスやデータは、提供元による仕様変更・更新・停止・利用制限等により利用できなくなる場合があります。

---

## 対応環境

NicoleはWebブラウザ上で動作します。

主に以下の環境での利用を想定しています。

- macOS
- iPhone / iPad
- Windows
- Safari
- Chrome系ブラウザ

一部機能はオンライン接続が必要です。

---

## 作者

**Kensuke Suga**

Website:  
https://kensuke-suga.myportfolio.com/

---

## 関連ファイル

- `COPYRIGHT` — Nicole本体の権利関係
- `THIRD_PARTY_NOTICES.md` — 第三者ソフトウェア・データ・外部サービスの一覧
- `LICENSES/` — 第三者ライセンス原文

---

## Project status

Nicole the Astronavigator is a personal astronomy-observation support project developed and maintained by Kensuke Suga.
