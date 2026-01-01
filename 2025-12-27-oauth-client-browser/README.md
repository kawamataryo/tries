# Bluesky OAuth SPA

BlueskyのOAuth認証と投稿機能を持つシンプルなReact SPAアプリケーションです。

## 技術スタック

- **React** + **TypeScript**
- **Vite** - ビルドツール
- **@atproto/oauth-client-browser** - OAuth認証ライブラリ
- **@atproto/api** - Bluesky APIクライアント
- **Tailwind CSS** - スタイリング
- **shadcn/ui** - UIコンポーネント

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. OAuthクライアントIDの設定

**開発環境（localhost）の場合:**

このアプリケーションは、開発環境（localhost）で動作するように設定されています。クライアントメタデータはコード内に直接定義されており、追加の設定は不要です。

**本番環境の場合:**

本番環境にデプロイする場合は、`src/lib/blueskyAuth.ts`の`defaultClientMetadata`を編集して、実際のドメインに合わせて更新してください：

```typescript
const defaultClientMetadata: OAuthClientMetadataInput = {
  client_id: "https://your-domain.com",
  client_name: "Bluesky OAuth App",
  client_uri: "https://your-domain.com",
  redirect_uris: ["https://your-domain.com"],
  // ... 他の設定
};
```

> **注意**: loopback（localhost）の場合、クライアントIDにパスを含めることができません。そのため、開発環境ではメタデータをコード内に直接定義しています。本番環境でも同様の方法を使用するか、または`BrowserOAuthClient.load()`を使用してURLからメタデータを読み込むことも可能です（その場合は、メタデータJSONファイルをWebサーバーでホストする必要があります）。

### 3. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで`http://localhost:5173`にアクセスしてください。

## 使用方法

1. 「Blueskyでログイン」ボタンをクリック
2. Blueskyの認証ページでログインを承認
3. 認証後、投稿フォームが表示されます
4. 投稿内容を入力して「投稿」ボタンをクリック

## プロジェクト構造

```
.
├── src/
│   ├── components/
│   │   ├── ui/          # shadcn/uiコンポーネント
│   │   ├── LoginButton.tsx
│   │   └── PostForm.tsx
│   ├── lib/
│   │   ├── blueskyAuth.ts    # OAuth認証ロジック
│   │   ├── blueskyClient.ts  # APIクライアント
│   │   └── utils.ts          # ユーティリティ関数
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── .env.example
├── tailwind.config.js
├── postcss.config.js
└── vite.config.ts
```

## ビルド

本番環境用にビルドする場合：

```bash
npm run build
```

ビルドされたファイルは`dist`ディレクトリに出力されます。

## 注意事項

- OAuthクライアントIDとリダイレクトURIは、Blueskyの開発者ポータルで登録したものと一致させる必要があります
- 本番環境にデプロイする場合は、リダイレクトURIを適切に設定してください
- `@atproto/api`がブラウザ環境で動作しない場合は、REST APIを直接呼び出す方法に変更する必要があるかもしれません

## 参考リンク

- [Bluesky ATProto Documentation](https://docs.bsky.app/)
- [@atproto/oauth-client-browser](https://github.com/bluesky-social/atproto/tree/main/packages/oauth/oauth-client-browser)
- [shadcn/ui Documentation](https://ui.shadcn.com/)
