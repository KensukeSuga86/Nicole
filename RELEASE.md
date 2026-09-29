# Nicole the Astronavigator v2.0.3

## v2.0.3 の追加変更

- 天体詳細モーダルに「🌌 星図でも見る」を追加。
- 観測条件パネルの天体検索から詳細を開いた場合、そのまま対象天体を星図で強調表示できます。
- 共通天文DBの固定参照は v0.2.0 のままです。

**星空の案内人・ニコルと一緒に**

Nicole the Astronavigator v2.0.3 は、Nicoleシリーズで天文データを共有するためのメジャーアップデートです。

公開版：  
https://kensukesuga86.github.io/Nicole/

---

## 共通天文DBへ移行

Nicole the Astronavigator は **Nicole Astronomy Database v0.2.0** を使用します。

読み込み順は次のとおりです。

1. GitHub Pages上の固定バージョン `0.2.0`
2. Nicoleに同梱した `0.2.0`
3. 従来の内蔵データ（最終フォールバック）

`latest.json` を自動追従せず、動作確認済みのDBバージョンを固定して使う構成です。

---

## Messier M1〜M110に対応

共通DBに収録した **Messier M1〜M110の110天体すべて**を、天体検索・天体一覧・星図の対象にしました。

Nicoleに従来から解説がある天体はその内容を維持します。新たに共通DBから追加されたカタログ天体は、位置、種類、等級、見かけの大きさ、所属星座、別名など利用可能なカタログ情報を表示し、未整備の解説欄には **「情報準備中」** と表示します。

---

## Nicoleシリーズで共有するデータ

共通DBには次の情報をまとめています。

- 88星座
- 恒星64件と測光情報
- 惑星
- Messier M1〜M110を含むDeep Sky天体
- アステリズム
- 共通カタログ索引
- Deep Skyの見かけサイズ
- 太陽・月・惑星の描画用Solar Systemメタデータ

Nicole the Astronavigator と Nicole the Astrorium が同じ不変IDと天文データを参照できる構成になりました。

---

## PWA / オフライン

共通DBローダーとDB v0.2.0をアプリシェルへ追加しています。オンラインDBが利用できない場合でも、同梱DBへ切り替えて起動できます。

Service Workerのアプリキャッシュ名前空間：

```text
nicole-pwa-v2.0.3
```

動的データキャッシュ：

```text
nicole-data-v1
```

---

**Version 2.0.3**