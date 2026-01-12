# X利用制限Chrome拡張機能 実装プラン

## 概要

Plasmoフレームワークを使用して、X（旧Twitter）の利用を制限するChrome拡張機能を実装します。情報収集ツールとしてXを活用するため、惰性での閲覧を防ぎ、意図的な利用を促します。

## 主要機能

### 1. 時間管理
- **1日の総利用時間上限**: 設定可能（例：30分/日）
- **セッション管理**: 各セッションの開始前に利用時間を設定（プリセット + カスタム入力）
- **タイマー表示**: セッション中、画面上に残り時間を常時表示
- **時間計測**: タブを開いている間カウント（複数タブでは全タブで共有）

### 2. ページ制限
- **制限対象**（タイマー動作）:
  - タイムライン: `https://x.com/home`
  - 検索・トレンド: `https://x.com/search`, `https://x.com/explore`
  - 通知: `https://x.com/notifications`
- **除外対象**（タイマー停止）:
  - 投稿画面: `https://x.com/compose`
  - DM画面: `https://twitter.com/messages/compose`

### 3. 振り返り機能
- セッション終了時、「その時間で何を得られたか」の入力を必須化
- 入力内容を日付とともに保存し、後から閲覧可能

## プロジェクト構造

```
x-blocker/
├── package.json                    # Plasmo設定・依存関係
├── tsconfig.json
├── assets/
│   └── icon.png                    # 拡張機能アイコン
├── background/
│   ├── index.ts                    # Background Service Worker
│   └── messages/
│       ├── get-session-state.ts    # セッション状態取得
│       ├── start-session.ts        # セッション開始
│       ├── end-session.ts          # セッション終了
│       └── save-reflection.ts      # 振り返り保存
├── contents/
│   ├── overlay.tsx                 # セッション開始オーバーレイ
│   ├── timer-display.tsx           # タイマー表示UI
│   └── lock-screen.tsx             # ロック画面（時間切れ後）
├── tabs/
│   └── options.tsx                 # 設定・履歴閲覧ページ
├── components/
│   ├── TimeSelector.tsx            # 時間選択コンポーネント
│   ├── ReflectionForm.tsx          # 振り返り入力フォーム
│   └── SessionHistory.tsx          # セッション履歴表示
├── lib/
│   ├── storage.ts                  # Storage管理
│   ├── timer.ts                    # タイマーロジック
│   ├── url-matcher.ts              # URL判定ロジック
│   └── types.ts                    # 型定義
└── styles/
    └── global.css                  # グローバルスタイル
```

## データモデル

### Storage構造

```typescript
// 設定データ
interface Settings {
  dailyLimitMinutes: number;        // 1日の総利用時間上限（分）
  presetMinutes: number[];          // プリセット時間（例: [1, 5, 10, 20]）
}

// セッションデータ
interface Session {
  id: string;                       // セッションID
  startTime: number;                // 開始時刻（timestamp）
  durationMinutes: number;          // セッション時間（分）
  remainingSeconds: number;         // 残り時間（秒）
  isActive: boolean;                // アクティブ状態
}

// 日次データ
interface DailyUsage {
  date: string;                     // YYYY-MM-DD
  totalUsedMinutes: number;         // 使用済み時間（分）
  sessions: SessionRecord[];        // セッション記録
}

// セッション記録
interface SessionRecord {
  id: string;
  startTime: number;
  endTime: number;
  durationMinutes: number;
  reflection: string;               // 振り返り内容
}

// Storageキー
const STORAGE_KEYS = {
  SETTINGS: 'settings',
  CURRENT_SESSION: 'currentSession',
  DAILY_USAGE: 'dailyUsage',
};
```

## 実装ステップ

### フェーズ1: プロジェクト初期化

1. Plasmoプロジェクト作成
```bash
npm create plasmo
cd x-blocker
npm install @plasmohq/storage @plasmohq/messaging
```

2. package.json設定
```json
{
  "manifest": {
    "permissions": ["storage", "tabs"],
    "host_permissions": [
      "https://twitter.com/*",
      "https://x.com/*"
    ]
  }
}
```

### フェーズ2: データ層実装

**重要ファイル:**
- `lib/types.ts` - 全データモデル定義
- `lib/storage.ts` - Storage管理（CRUD操作）
- `lib/url-matcher.ts` - URL判定ロジック

**実装内容:**
- 型定義の完全な実装
- Storage操作の抽象化（getSettings, saveSettings, getDailyUsage等）
- デフォルト設定の初期化
- URL判定関数（isRestrictedPage, isExcludedPage）

### フェーズ3: Background Service Worker実装

**重要ファイル:**
- `background/index.ts` - タイマー管理の中核
- `lib/timer.ts` - タイマーロジック
- `background/messages/*.ts` - メッセージハンドラ

**実装内容:**
1. **タイマー管理**
   - 1秒ごとにremainingSecondsをデクリメント
   - Storage更新とContent Scriptへの通知
   - 時間切れ検出

2. **タブ監視**
   - `chrome.tabs.onUpdated`: URL変更検出
   - 制限ページ→除外ページ移動時のタイマー一時停止
   - 除外ページ→制限ページ移動時のタイマー再開

3. **状態復元**
   - `chrome.runtime.onStartup`: ブラウザ起動時の状態復元
   - 経過時間を計算して残り時間更新

4. **日付変更対応**
   - 日付が変わったらセッションリセット
   - 1分ごとにチェック

### フェーズ4: Content Scripts実装

**重要ファイル:**
- `contents/overlay.tsx` - セッション開始UI
- `contents/timer-display.tsx` - タイマー表示
- `contents/lock-screen.tsx` - ロック画面

**1. overlay.tsx（セッション開始オーバーレイ）**
- ページ全体を覆う半透明背景
- 中央にモーダル表示
- 残り利用可能時間の計算と表示
- プリセットボタン（1分、5分、10分、20分）
- カスタム入力フィールド
- バリデーション: 選択時間 ≤ 残り時間
- 開始ボタン → Background Scriptに`start-session`メッセージ送信

**2. timer-display.tsx（タイマー表示）**
- 右下固定位置に配置
- 円形プログレスバー + 残り時間表示
- Storageの変更を監視して自動更新
- フォーマット: MM:SS形式

**3. lock-screen.tsx（ロック画面）**
- ページ全体を覆う
- セッション終了メッセージ
- 振り返り入力テキストエリア（必須）
- 入力なしは送信ボタン無効化
- 送信 → Background Scriptに`save-reflection`メッセージ送信

**Content Script配置設定:**
```typescript
export const config: PlasmoCSConfig = {
  matches: [
    "https://twitter.com/*",
    "https://x.com/*"
  ],
  run_at: "document_start",
};
```

### フェーズ5: Options Page実装

**重要ファイル:**
- `tabs/options.tsx` - 設定画面
- `components/SessionHistory.tsx` - 履歴表示

**実装内容:**
1. **設定セクション**
   - 1日の総利用時間上限の設定
   - プリセット時間の編集（追加・削除・変更）
   - 設定の保存・読み込み

2. **履歴セクション**
   - 日付別セッション履歴の表示
   - 各セッションの詳細（時間、振り返り内容）
   - 日付フィルター機能

### フェーズ6: UIコンポーネント実装

**重要ファイル:**
- `components/TimeSelector.tsx` - 時間選択UI
- `components/ReflectionForm.tsx` - 振り返りフォーム

**実装内容:**
- 再利用可能なコンポーネント化
- バリデーションロジック
- スタイリング（Tailwind CSS推奨）

### フェーズ7: 統合とテスト

**テストケース:**

1. **基本フロー**
   - X.comアクセス → オーバーレイ表示
   - 5分選択 → タイマー開始
   - タイマーカウントダウン確認
   - 時間切れ → ロック画面
   - 振り返り入力 → 次セッション開始

2. **複数タブ**
   - タブ1でセッション開始
   - タブ2を開く → 同じタイマー表示
   - タブ1閉じる → タイマー継続

3. **除外ページ**
   - `/compose`アクセス → オーバーレイなし
   - タイマー一時停止確認
   - 制限ページに戻る → タイマー再開

4. **日次制限**
   - 総利用時間30分設定
   - セッション1: 20分使用
   - セッション2: 15分選択 → エラー（残り10分のみ）
   - セッション2: 10分選択 → 成功

5. **永続化・状態復元**
   - セッション中にブラウザ再起動
   - 残り時間が正しく復元されるか
   - 日付変更時のリセット確認

6. **エッジケース**
   - セッション時間0秒での即時ロック
   - 振り返り未入力での画面遷移防止
   - ストレージ容量超過時のエラーハンドリング

## 重要な技術的考慮事項

### 1. タイマーの精度
- Background Service Workerは一定時間後にアイドル状態になる可能性
- 解決策: `chrome.alarms` APIの併用も検討（現在は`setInterval`）

### 2. 複数タブ対応
- Background Service Workerで単一セッション管理
- Storage経由でタブ間同期
- 全タブ閉鎖時もタイマー継続（次回開いたとき残り時間で再開）

### 3. パフォーマンス
- Storage書き込み頻度の最適化（1秒ごとのカウントダウンで毎回書き込むと負荷）
- 解決策: 5秒ごとにバッチ更新、または`remainingSeconds`ではなく`startTime`と`durationMinutes`から計算

### 4. スタイル分離
- Content ScriptでShadow DOMを使用してページスタイルとの干渉を防止
- Plasmoは自動的にShadow DOMを作成

### 5. セキュリティ
- ユーザー入力のサニタイゼーション（振り返りテキスト）
- XSS対策（ReactのデフォルトエスケープでOK）

## 検証方法

### 開発環境
```bash
npm run dev
# Chrome: chrome://extensions → 開発者モード → 「パッケージ化されていない拡張機能を読み込む」
# build/chrome-mv3-dev を選択
```

### 本番ビルド
```bash
npm run build
# build/chrome-mv3-prod が生成される
```

### 動作確認
1. X.comにアクセスして基本フローを確認
2. Chrome DevTools → Background ページでログ確認
3. Storage確認: DevTools → Application → Storage → Extension Storage

## 将来の拡張機能案

- 統計ダッシュボード（週次・月次利用時間グラフ）
- 目標設定機能（例：今週は週5時間以内）
- エクスポート機能（振り返りデータのCSV/JSON出力）
- 通知機能（残り5分などのアラート）
- カテゴリー分類（振り返り内容にタグ付け）

## クリティカルファイル

実装時に最も重要なファイル:

1. **lib/types.ts** - 全データモデル定義（最初に確定必須）
2. **background/index.ts** - セッションタイマー管理の中核（全体の状態制御）
3. **lib/storage.ts** - データ永続化層（全コンポーネントが依存）
4. **contents/overlay.tsx** - ユーザーが最初に触れるUI
5. **package.json** - Plasmo設定とマニフェスト定義

## 実装時の注意点

1. **型安全性**: TypeScriptの型を厳格に定義し、実行時エラーを防ぐ
2. **エラーハンドリング**: Storage操作、メッセージング、タイマー処理すべてでtry-catch
3. **ユーザー体験**: ローディング状態の表示、エラーメッセージの分かりやすさ
4. **テスタビリティ**: ロジックとUIの分離、ユニットテスト可能な設計
5. **アクセシビリティ**: キーボード操作対応、スクリーンリーダー対応
