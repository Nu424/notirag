# Notirag - Notion RAG プラットフォーム

![Notirag Logo](https://via.placeholder.com/800x200/3B82F6/FFFFFF?text=Notirag+-+Notion+%C3%97+RAG+%E3%83%97%E3%83%A9%E3%83%83%E3%83%88%E3%83%95%E3%82%A9%E3%83%BC%E3%83%A0)

**Notirag（のちらぐ）** は、NotionデータベースをRAGのデータソースとして活用し、散らばった情報を統合して効率的に検索・活用できるプラットフォームです。

## 🚀 主要機能

### 1. 情報追加
- AIが関連性を分析し、適切なページに自動で情報を追加
- 手動でページを指定することも可能
- Markdown形式での入力をサポート

### 2. Notion API テスト
- Notionデータベースとページの作成・読み取り・更新
- 直感的なインターフェースでAPI操作
- リアルタイムでの結果確認

### 3. RAG検索
- 自然言語での質問に対する回答生成
- Notionデータベースから関連情報を抽出
- 参考情報の詳細表示

## 📋 セットアップ

### 前提条件
- Node.js 18.17以上
- npm または yarn
- Notion API キー
- OpenAI API キー

### 1. リポジトリのクローン
```bash
git clone https://github.com/your-username/notirag.git
cd notirag
```

### 2. 依存関係のインストール
```bash
npm install
```

### 3. 環境変数の設定
`.env.local` ファイルを作成し、以下の環境変数を設定してください：

```env
NOTION_API_KEY=your_notion_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini
```

#### 環境変数の説明
- `NOTION_API_KEY`: Notion APIへのアクセスキー（必須）
- `OPENAI_API_KEY`: OpenAI APIへのアクセスキー（必須、RAG機能で使用）
- `OPENAI_MODEL`: 使用するOpenAIモデル名（オプション、デフォルト: gpt-4o-mini）

### 4. 開発サーバーの起動
```bash
npm run dev
```

ブラウザで `http://localhost:3000` にアクセスしてください。

## 🔑 Notion API キーの取得方法

1. [Notion Integrations](https://www.notion.so/my-integrations) にアクセス
2. 「+ New integration」をクリック
3. 設定項目を入力してインテグレーションを作成
4. 「Internal Integration Secret」をコピー
5. `.env.local` ファイルに設定
6. 使用するNotionデータベースにインテグレーションを招待

## 🎯 使用方法

### 情報追加機能
1. **データベース読み込み**: NotionデータベースのIDを入力
2. **追加先選択**: 特定のページを指定するか、AI自動選択
3. **内容入力**: Markdown形式で情報を入力
4. **実行**: 情報を追加

### RAG検索機能
1. **設定**: データベースIDと検索パラメータを設定
2. **質問入力**: 自然言語で質問を入力
3. **検索実行**: AIが関連情報を抽出して回答を生成
4. **結果確認**: 回答と参考情報を確認

## 🛠️ 技術スタック

- **Frontend**: Next.js 15.3.3, TypeScript, Tailwind CSS
- **UI Components**: カスタムUIコンポーネント（Button, Card, Alert等）
- **APIs**: Notion API, OpenAI API
- **Markdown**: notion-to-md, @tryfabric/martian
- **State Management**: React Hooks, localStorage

## 📚 API エンドポイント

### データベース操作
- **GET** `/api/notion/database/[databaseId]` - データベース内の全ページを取得
- **GET** `/api/notion/page/[pageId]` - 指定したページをMarkdown形式で取得
- **POST** `/api/notion/page` - 新しいページを作成
- **PUT** `/api/notion/page/[pageId]` - 指定したページを更新

### RAG機能
- **POST** `/api/rag` - RAG検索を実行
- **POST** `/api/append` - 情報を適切なページに追加

## 🎨 UI/UX 特徴

- **レスポンシブデザイン**: モバイル・デスクトップ対応
- **ダークモード対応**: システム設定に応じた自動切り替え
- **アニメーション**: スムーズなトランジション
- **アクセシビリティ**: キーボードナビゲーション対応
- **ローカルストレージ**: 設定の自動保存

## 🔧 サポートするMarkdown機能

- **基本要素**: ヘッダー、段落、リスト、コードブロック
- **GitHub Flavored Markdown**: タスクリスト、テーブル、取り消し線
- **高度なブロッククォート**: 
  - 通常のブロッククォート
  - GFMアラート（`> [!NOTE]`、`> [!WARNING]`など）
  - 絵文字スタイルのコールアウト（`> 📘 **Note:**`など）
- **インライン要素**: 太字、斜体、コード、リンク
- **画像とメディア**: 画像の自動URL検証
- **Notion制限の自動処理**: 文字数制限、ブロック制限の自動調整

## 🚀 デプロイ

### Vercel
```bash
npm run build
vercel --prod
```

### Docker
```bash
docker build -t notirag .
docker run -p 3000:3000 notirag
```

## 🤝 コントリビューション

1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/AmazingFeature`)
3. 変更をコミット (`git commit -m 'Add some AmazingFeature'`)
4. ブランチにプッシュ (`git push origin feature/AmazingFeature`)
5. プルリクエストを作成

## 📝 ライセンス

このプロジェクトは MIT ライセンスの下で公開されています。詳細は [LICENSE](LICENSE) ファイルを参照してください。

## 🙏 謝辞

- [Notion API](https://developers.notion.com/) - 素晴らしいAPI
- [OpenAI](https://openai.com/) - 強力な言語モデル
- [Next.js](https://nextjs.org/) - 優れたReactフレームワーク
- [Tailwind CSS](https://tailwindcss.com/) - 効率的なCSSフレームワーク

---

**Made with ❤️ by Notirag Team**