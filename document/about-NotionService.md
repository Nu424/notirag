# NotionService 設計方針ドキュメント

## 概要

NotionServiceは、Notion APIを活用したデータベースおよびページ操作を抽象化するサービスクラスです。本ドキュメントでは、その設計思想、アーキテクチャ、および実装方針について詳述します。

## 目次

1. [設計目標と基本方針](#1-設計目標と基本方針)
2. [アーキテクチャ設計](#2-アーキテクチャ設計)
3. [データモデル設計](#3-データモデル設計)
4. [API設計方針](#4-api設計方針)
5. [エラーハンドリング戦略](#5-エラーハンドリング戦略)
6. [データ変換設計](#6-データ変換設計)
7. [パフォーマンス考慮事項](#7-パフォーマンス考慮事項)
8. [制限事項と制約](#8-制限事項と制約)
9. [使用方法とサンプルコード](#9-使用方法とサンプルコード)

---

## 1. 設計目標と基本方針

### 1.1 設計目標

- **抽象化**: Notion APIの複雑さを隠蔽し、直感的なインターフェースを提供
- **型安全性**: TypeScriptの型システムを活用した安全な開発体験
- **保守性**: 明確な責任分離と可読性の高いコード構造
- **再利用性**: 様々なユースケースに対応できる汎用的な設計

### 1.2 基本方針

```typescript
// 一貫したインターフェース設計
const notionService = new NotionService(apiKey);
const page = await notionService.getPage(pageId);
const database = await notionService.getDatabase(databaseId);
```

**設計原則:**
- **単一責任の原則**: Notion API操作に特化
- **依存性の逆転**: 外部ライブラリへの依存を最小化
- **開放閉鎖の原則**: 拡張に開き、修正に閉じた設計

---

## 2. アーキテクチャ設計

### 2.1 レイヤー構造

```
┌─────────────────────────────────┐
│     Application Layer           │  ← 業務ロジック
├─────────────────────────────────┤
│     NotionService (本クラス)     │  ← サービス層
├─────────────────────────────────┤
│     External Libraries          │  ← ライブラリ層
│  - @notionhq/client            │
│  - notion-to-md                │
│  - @tryfabric/martian          │
├─────────────────────────────────┤
│     Notion API                  │  ← 外部API
└─────────────────────────────────┘
```

### 2.2 依存関係設計

**主要依存ライブラリとその役割:**

| ライブラリ | 役割 | 選定理由 |
|-----------|------|----------|
| `@notionhq/client` | Notion API公式クライアント | 公式サポート、型安全性 |
| `notion-to-md` | Notion→Markdown変換 | 高い変換精度、保守性 |
| `@tryfabric/martian` | Markdown→Notion変換 | GFMサポート、柔軟性 |

### 2.3 クラス設計

```typescript
export class NotionService {
  private notion: Client;          // API クライアント
  private n2m: NotionToMarkdown;   // 変換ツール
  
  // パブリック API
  public async getDatabase(databaseId: string): Promise<NotionDatabaseData>
  public async getPage(pageId: string): Promise<NotionPageData>
  public async createPage(createData: CreatePageRequest): Promise<NotionPageData>
  public async updatePage(pageId: string, updateData: UpdatePageRequest): Promise<NotionPageData>
  
  // プライベート ヘルパー
  private extractPageData(): NotionPageData
  private extractTitle(): string
  private extractKeywords(): string[]
  private updatePageContent(): Promise<void>
  private convertMarkdownToNotionBlocks(): any[]
}
```

---

## 3. データモデル設計

### 3.1 プロパティ標準化

**固定プロパティ名の採用:**

```typescript
const titleProperty = "nora_title";      // タイトル専用プロパティ
const keywordsProperty = "nora_keywords"; // キーワード専用プロパティ
```

**設計意図:**
- **一貫性**: 全プロジェクトで統一されたプロパティ名
- **保守性**: プロパティ名変更時の影響範囲を限定
- **可読性**: 用途が明確なプロパティ名

### 3.2 型定義戦略

```typescript
interface NotionPageData {
  id: string;
  title: string;
  keywords: string[];
  content?: string;        // オプショナル（取得方法により異なる）
  createdTime: string;
  lastEditedTime: string;
}
```

**型設計の考慮点:**
- **厳密性**: 必須/オプションの明確な区別
- **拡張性**: 将来的なプロパティ追加への対応
- **利便性**: 開発者にとって直感的な型構造

---

## 4. API設計方針

### 4.1 メソッド設計パターン

**CRUD操作の統一インターフェース:**

```typescript
// 取得系 - 既存リソースのアクセス
getDatabase(databaseId: string): Promise<NotionDatabaseData>
getPage(pageId: string): Promise<NotionPageData>

// 作成系 - 新規リソースの作成
createPage(createData: CreatePageRequest): Promise<NotionPageData>

// 更新系 - 既存リソースの変更
updatePage(pageId: string, updateData: UpdatePageRequest): Promise<NotionPageData>
```

### 4.2 データ取得の最適化

**データベース取得の設計:**

```typescript
async getDatabase(databaseId: string): Promise<NotionDatabaseData> {
  // 1. データベース情報取得
  // 2. ページ一覧取得（一括クエリ）
  // 3. プロパティ抽出（個別リクエスト回避）
}
```

**最適化ポイント:**
- **バッチ処理**: 個別APIコール数の最小化
- **データ抽出**: プロパティアクセスの効率化
- **キャッシュ設計**: 将来的な性能向上の余地

---

## 5. エラーハンドリング戦略

### 5.1 統一されたエラー処理

```typescript
try {
  // Notion API 操作
} catch (error) {
  console.error('Error context:', error);
  throw new Error(`Failed to operation: ${error}`);
}
```

**エラー処理方針:**
- **透明性**: 原因エラーを隠蔽せず、コンテキストを付加
- **一貫性**: 全メソッドで統一されたエラーパターン
- **デバッグ性**: ログ出力による問題調査の容易さ

### 5.2 エラー分類と対応

| エラー分類 | 対応方針 | 例 |
|-----------|----------|-----|
| API通信エラー | 再試行可能性の判断 | ネットワーク断絶 |
| 認証エラー | 明確なメッセージ表示 | APIキー無効 |
| データ形式エラー | フォールバック処理 | 不正なページ構造 |
| 制限エラー | レート制限の考慮 | API呼び出し制限 |

---

## 6. データ変換設計

### 6.1 Markdown ↔ Notion 変換

**変換フロー:**

```
Markdown Content
      ↓ (入力時)
@tryfabric/martian → Notion Blocks
      ↓ (Notion API)
Notion Page Content
      ↓ (出力時)
notion-to-md → Markdown Content
```

### 6.2 変換ライブラリの選定理由

**notion-to-md (Notion → Markdown):**
- 公式ライブラリではないが、広く採用されている
- 豊富なブロックタイプに対応
- カスタマイズ可能な変換ルール

**@tryfabric/martian (Markdown → Notion):**
- GFMアラート記法に対応（`> [!NOTE]` 等）
- Notion制限の自動処理機能
- 変換エラーのグレースフルな処理

### 6.3 変換時の考慮事項

```typescript
private convertMarkdownToNotionBlocks(markdown: string): any[] {
  try {
    const options = {
      enableEmojiCallouts: true,    // GFMアラート対応
      notionLimits: {
        truncate: true,             // 制限超過時の自動切り詰め
        onError: (err) => warn(err) // エラーハンドリング
      },
      strictImageUrls: true         // 画像URL検証
    };
    return markdownToBlocks(markdown, options);
  } catch (error) {
    // フォールバック: プレーンテキストとして処理
    return createFallbackBlock(markdown);
  }
}
```

---

## 7. パフォーマンス考慮事項

### 7.1 API呼び出し最適化

**バッチ処理の活用:**
- データベースクエリでページ一覧を一括取得
- 個別ページ取得の回数を最小化
- プロパティアクセスの効率化

**ブロック操作の最適化:**
- 100ブロック制限に対する分割処理
- 既存コンテンツの効率的な削除
- 大量コンテンツの分割追加

### 7.2 メモリ使用量の配慮

```typescript
// 大量データ処理時のメモリ効率
for (let i = 0; i < notionBlocks.length; i += chunkSize) {
  const chunk = notionBlocks.slice(i, i + chunkSize);
  await this.notion.blocks.children.append({
    block_id: pageId,
    children: chunk,
  });
}
```

---

## 8. 制限事項と制約

### 8.1 Notion API の制限

| 制限項目 | 制限値 | 対応策 |
|---------|--------|--------|
| ブロック追加 | 100個/回 | 分割処理 |
| API Rate Limit | 3req/sec | レート制限考慮 |
| プロパティ名 | 固定 | 標準化プロパティ使用 |

### 8.2 実装上の制約

```typescript
// 固定プロパティ名による制約
const titleProperty = "nora_title";
const keywordsProperty = "nora_keywords";

// キーワード形式の制約
// カンマ区切り文字列として格納
keywords: string[]; // → "keyword1,keyword2,keyword3"
```

**制約の影響:**
- 既存Notionページとの互換性制限
- プロパティ名変更時の影響範囲
- キーワード区切り文字の制限

---

## 9. 使用方法とサンプルコード

### 9.1 基本的な使用方法

#### 初期設定

```typescript
import { NotionService } from '@/services/notion';

// Notion Integration APIキーを使用してインスタンス化
const notionService = new NotionService('secret_xxxxxxxxxxxxx');
```

#### 環境変数を使用した設定（推奨）

```typescript
// .env ファイル
NOTION_API_KEY=secret_xxxxxxxxxxxxx

// アプリケーションコード
const notionService = new NotionService(process.env.NOTION_API_KEY!);
```

### 9.2 データベース操作

#### データベースとページ一覧の取得

```typescript
async function getDatabaseInfo() {
  try {
    const databaseId = '550e8400-e29b-41d4-a716-446655440000';
    const database = await notionService.getDatabase(databaseId);
    
    console.log(`データベース: ${database.title}`);
    console.log(`ページ数: ${database.pages.length}`);
    
    // ページ一覧の表示
    database.pages.forEach((page, index) => {
      console.log(`${index + 1}. ${page.title}`);
      console.log(`   キーワード: ${page.keywords.join(', ')}`);
      console.log(`   最終更新: ${new Date(page.lastEditedTime).toLocaleDateString()}`);
    });
    
    return database;
  } catch (error) {
    console.error('データベース取得エラー:', error);
    throw error;
  }
}
```

### 9.3 ページ操作

#### ページの詳細取得

```typescript
async function getPageDetail(pageId: string) {
  try {
    const page = await notionService.getPage(pageId);
    
    console.log('=== ページ詳細 ===');
    console.log(`タイトル: ${page.title}`);
    console.log(`キーワード: ${page.keywords.join(', ')}`);
    console.log(`作成日: ${new Date(page.createdTime).toLocaleDateString()}`);
    console.log(`更新日: ${new Date(page.lastEditedTime).toLocaleDateString()}`);
    console.log('--- コンテンツ ---');
    console.log(page.content);
    
    return page;
  } catch (error) {
    console.error('ページ取得エラー:', error);
    throw error;
  }
}
```

#### 新しいページの作成

```typescript
async function createNewPage() {
  try {
    const databaseId = '550e8400-e29b-41d4-a716-446655440000';
    
    const createData = {
      databaseId: databaseId,
      title: 'プロジェクト企画書',
      keywords: ['企画', 'プロジェクト', 'アイデア'],
      content: `# プロジェクト企画書

## 概要
新しいプロジェクトの企画書です。

## 目標
- 目標1: ユーザー満足度の向上
- 目標2: 効率的な開発プロセスの確立

## スケジュール
| フェーズ | 期間 | 内容 |
|---------|------|------|
| 企画 | 1週間 | 要件定義 |
| 開発 | 4週間 | 実装・テスト |
| リリース | 1週間 | デプロイ・運用開始 |

> [!NOTE]
> 重要な注意事項: スケジュールは暫定的なものです。

## 次のアクション
- [ ] チームメンバーとの打ち合わせ
- [ ] 技術調査の実施
- [ ] プロトタイプの作成`
    };
    
    const newPage = await notionService.createPage(createData);
    
    console.log('ページが正常に作成されました');
    console.log(`ページID: ${newPage.id}`);
    console.log(`タイトル: ${newPage.title}`);
    
    return newPage;
  } catch (error) {
    console.error('ページ作成エラー:', error);
    throw error;
  }
}
```

#### 既存ページの更新

```typescript
async function updateExistingPage(pageId: string) {
  try {
    const updateData = {
      title: 'プロジェクト企画書（更新版）',
      keywords: ['企画', 'プロジェクト', 'アイデア', '更新'],
      content: `# プロジェクト企画書（更新版）

## 概要
新しいプロジェクトの企画書です。
**更新内容**: 詳細なスケジュールを追加しました。

## 目標
- 目標1: ユーザー満足度の向上（達成率: 80%）
- 目標2: 効率的な開発プロセスの確立（進行中）
- 目標3: コスト削減（新規追加）

## 詳細スケジュール
### フェーズ1: 企画
- 要件定義
- 市場調査
- 競合分析

### フェーズ2: 開発
- 設計
- 実装
- 単体テスト
- 結合テスト

> [!WARNING]
> スケジュール変更の可能性があります。

## 進捗状況
- [x] チームメンバーとの打ち合わせ
- [x] 技術調査の実施
- [ ] プロトタイプの作成`
    };
    
    const updatedPage = await notionService.updatePage(pageId, updateData);
    
    console.log('ページが正常に更新されました');
    console.log(`タイトル: ${updatedPage.title}`);
    console.log(`キーワード: ${updatedPage.keywords.join(', ')}`);
    
    return updatedPage;
  } catch (error) {
    console.error('ページ更新エラー:', error);
    throw error;
  }
}
```

### 9.4 実用的な使用例

#### ブログ記事の管理システム

```typescript
class BlogManager {
  private notionService: NotionService;
  private blogDatabaseId: string;
  
  constructor(apiKey: string, databaseId: string) {
    this.notionService = new NotionService(apiKey);
    this.blogDatabaseId = databaseId;
  }
  
  // 記事一覧の取得
  async getAllArticles() {
    const database = await this.notionService.getDatabase(this.blogDatabaseId);
    return database.pages.map(page => ({
      id: page.id,
      title: page.title,
      tags: page.keywords,
      publishedAt: page.createdTime,
      updatedAt: page.lastEditedTime
    }));
  }
  
  // 新しい記事の投稿
  async publishArticle(title: string, content: string, tags: string[]) {
    return await this.notionService.createPage({
      databaseId: this.blogDatabaseId,
      title,
      keywords: tags,
      content
    });
  }
  
  // 記事の更新
  async updateArticle(pageId: string, updates: {
    title?: string;
    content?: string;
    tags?: string[];
  }) {
    return await this.notionService.updatePage(pageId, {
      title: updates.title,
      content: updates.content,
      keywords: updates.tags
    });
  }
  
  // タグ別記事検索
  async getArticlesByTag(tag: string) {
    const database = await this.notionService.getDatabase(this.blogDatabaseId);
    return database.pages.filter(page => 
      page.keywords.some(keyword => 
        keyword.toLowerCase().includes(tag.toLowerCase())
      )
    );
  }
}

// 使用例
const blogManager = new BlogManager(
  process.env.NOTION_API_KEY!,
  'blog-database-id'
);

// 新記事の投稿
await blogManager.publishArticle(
  'TypeScriptでの効率的な開発手法',
  '# TypeScriptでの効率的な開発手法\n\n型安全性を活用した開発について...',
  ['TypeScript', '開発手法', 'ベストプラクティス']
);
```
