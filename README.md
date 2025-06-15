# notirag (のちらぐ)

Notionのデータベースをもとに、RAGアプリを作成するアプリです。

## セットアップ

### 環境変数の設定

`.env.local` ファイルを作成し、以下の環境変数を設定してください：

```
NOTION_API_KEY=your_notion_api_key_here
```

#### Notion API Keyの取得方法

1. [Notion Integrations](https://www.notion.so/my-integrations) にアクセス
2. 「+ New integration」をクリック
3. 設定項目を入力してインテグレーションを作成
4. 「Internal Integration Secret」をコピー
5. `.env.local` ファイルに設定

## API エンドポイント

### データベースの取得
- **GET** `/api/notion/database/[databaseId]`
- データベース内の全ページを取得

### ページの取得
- **GET** `/api/notion/page/[pageId]`
- 指定したページをMarkdown形式で取得

### ページの更新
- **PUT** `/api/notion/page/[pageId]`
- 指定したページを更新（Markdown形式で入力）

### ページの作成
- **POST** `/api/notion/page`
- 新しいページを作成（Markdown形式で入力）

## 使用技術

- Next.js 15.3.3
- TypeScript
- Notion API
- notion-to-md (Notion→Markdown変換)
- @tryfabric/martian (Markdown→Notion変換)

## 機能

### サポートするMarkdown機能

Martianライブラリにより、以下のMarkdown機能をサポートしています：

- **基本要素**: ヘッダー、段落、リスト、コードブロック
- **GitHub Flavored Markdown**: タスクリスト、テーブル、取り消し線
- **高度なブロッククォート**: 
  - 通常のブロッククォート
  - GFMアラート（`> [!NOTE]`、`> [!WARNING]`など）
  - 絵文字スタイルのコールアウト（`> 📘 **Note:**`など）
- **インライン要素**: 太字、斜体、コード、リンク
- **画像とメディア**: 画像の自動URL検証
- **Notion制限の自動処理**: 文字数制限、ブロック制限の自動調整