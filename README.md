# Smart Closet - スマートクローゼット管理アプリ

AI画像認識で衣類を自動分類し、日々のコーディネートを記録・管理できるスマートフォンアプリ。写真を撮るだけでデジタルワードローブが完成します。
---

## 背景（製品開発のきっかけ、課題等）

### 解決したい課題

- **クローゼットの管理が大変**：何を持っているか把握できず、同じような服ばかり買ってしまう
- **写真整理が面倒**：全身コーディネート写真から個別アイテムを手動で切り出すのは時間がかかる
- **カテゴリー分類が手間**：大量の衣類を手動で分類するのは非効率的

### 開発のきっかけ

毎朝「今日は何を着よう」と悩む時間、クローゼットの中に何があるか分からなくなる経験...誰もが一度は経験したことがあるのではないでしょうか。
Smart Closetは、そんな日常の小さな悩みを解決するために生まれました。

---

## 製品説明（具体的な製品の説明）

### システム概要

React Native + Expoで開発したクロスプラットフォーム（iOS/Android対応）のモバイルアプリ。Google Cloud Vision APIを活用し、衣類の自動認識・分割を実現。

### 主な機能

1. **写真撮影・アップロード**：カメラ撮影または既存写真から衣類を登録
2. **AI自動分類**：Google Cloud Vision APIで衣類カテゴリーを自動認識
3. **スマート分割**：1枚の写真から複数アイテムを自動検出・切り出し
4. **クローゼット管理**：カテゴリー別・タグ別・お気に入りで整理
5. **多言語対応**：日本語・英語・中国語に対応

---

## 特長

### 1. 1枚の写真から複数アイテムを自動分割

- Google Cloud Vision APIの物体検出機能を活用
- 全身コーディネート写真から上着・下衣・靴・アクセサリーを自動検出
- 各アイテムの位置を検出し、個別に切り出して保存

### 2. 完全ローカルストレージで安心

- すべてのデータをデバイス内に保存
- プライバシー保護（サーバーにデータ送信なし）

---

## 解決できること

✅ **時間の節約**：手動で1枚ずつ切り出す作業が不要に

✅ **整理整頓**：自動分類で衣類を体系的に管理  

✅ **重複購入防止**：持っている服を可視化し、無駄な買い物を削減  

✅ **ファッション記録**：過去のコーディネートを簡単に振り返り  

✅ **バリアフリー**：多言語対応で様々なユーザーが利用可能

---

## 今後の展望

- **AR試着機能**：カメラで自分の姿に衣類を重ねて仮想試着
- **天気連携**：気温・天候に応じたコーディネート提案
- **カラー分析**：パーソナルカラー診断と相性の良いアイテム提案
- **着用頻度分析**：よく着る服・眠っている服を可視化
- **SNS共有**：コーディネートを友達と共有
- **クローゼット最適化**：断捨離のサポート機能
---

## セットアップと実行方法

### 必要な環境

- Node.js 16以上
- npm または yarn
- Expo Go アプリ（スマートフォンでのテスト用）
- Google Cloud Vision API Key（オプション）

### インストール手順

#### 1. リポジトリをクローン

git clone https://github.com/syokan00/smart-closet.git

cd smart-closet

#### 2. 依存関係をインストール
npm install --legacy-peer-deps**注意**: React 19との依存関係の問題を回避するため、`--legacy-peer-deps` フラグが必要です。

#### 3. API設定ファイルを作成

# Windows
copy src\config\api.ts.example src\config\api.ts

# Mac/Linux
cp src/config/api.ts.example src/config/api.ts

#### 4. API Keyの設定（オプション）

`src/config/api.ts` を開き、Google Cloud Vision API Keyを設定します：

export const API_CONFIG = {
  GOOGLE_VISION_API_KEY: 'あなたのAPIキーをここに入力',
};

**API Keyがない場合**: 
- アプリはモックデータを使用して動作します
- Google Cloud Vision API Keyの取得方法は[こちら](https://cloud.google.com/vision/docs/setup)

### アプリの起動

npm startコマンド実行後、以下の選択肢が表示されます：

- **`a`** - Androidエミュレーターで開く
- **`i`** - iOSシミュレーターで開く（Macのみ）
- QRコードをスキャン - 実機のExpo Goアプリで開く

### トラブルシューティング

#### エラー: `Unable to resolve "../config/api"`

→ `src/config/api.ts` ファイルが作成されていません。手順3を確認してください。

#### エラー: `npm ERR! ERESOLVE unable to resolve dependency tree`

→ `npm install --legacy-peer-deps` を使用してインストールしてください。

#### エラー: `'expo' is not recognized`

→ 依存関係のインストールが失敗しています。`node_modules` フォルダを削除して再インストールしてください：

# Windows
rmdir /s node_modules
npm install --legacy-peer-deps

# Mac/Linux  
rm -rf node_modules
npm install --legacy-peer-deps

### コマンド
npm start          # 開発サーバー起動
npm run android    # Androidで実行
npm run ios        # iOSで実行（Macのみ）

---

## 活用した技術

### API・データ

- **Google Cloud Vision API** - 物体検出・物体位置特定

### フレームワーク・ライブラリ

- **React Native** - クロスプラットフォームモバイル開発
- **Expo** - 開発環境・ビルドツール
- **TypeScript** - 型安全性確保
- **React Native Paper** - Material Design UIコンポーネント
- **AsyncStorage** - ローカルデータ永続化

---

## 独自技術

### 開発した独自機能・技術

#### 1. インテリジェント服装分割システム

**主な機能**:
- Google Vision APIのObject Localizationで衣類の位置を検出
- 衣類カテゴリーマッピングアルゴリズム
- 複数アイテムの同時検出・処理


#### 2. AI認識システム

**主な機能**:
- 複数物品の同時認識
- タグ自動提案機能

#### 3. ユーザーフレンドリーなアップロード体験


**核心機能**:
- 写真選択と同時にAI認識を自動実行
- 画像最適化パイプライン（自動リサイズ・圧縮）
- 複数の認識結果を表示し、ユーザーが最終選択できる柔軟性
- ローディング状態の明確な表示

---

## プロジェクト情報

- **バージョン**: 1.0.0
- **開発言語**: TypeScript, JavaScript
- **リポジトリ**: [GitHub](https://github.com/yourusername/smart-closet)

---

<div align="center">

**Made with ❤️ by Smart Closet**

</div>
