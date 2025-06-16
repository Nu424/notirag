# Notion API Routes 設計方針ドキュメント

## 概要

本プロジェクトのNotion APIルートは、Next.js 15.3.3のApp Routerを活用し、Notion APIとの統合を提供する3つの主要なエンドポイントから構成されています。これらのAPIは、NotionServiceクラスを基盤として、RESTful設計原則に従い、型安全性とエラーハンドリングを重視した実装となっています。

## 目次

1. [設計目標と基本方針](#1-設計目標と基本方針)
2. [アーキテクチャ設計](#2-アーキテクチャ設計)
3. [API仕様詳細](#3-api仕様詳細)
4. [エラーハンドリング戦略](#4-エラーハンドリング戦略)
5. [認証・セキュリティ設計](#5-認証セキュリティ設計)
6. [レスポンス設計](#6-レスポンス設計)
7. [型安全性の実装](#7-型安全性の実装)
8. [パフォーマンス考慮事項](#8-パフォーマンス考慮事項)
9. [使用方法とサンプルコード](#9-使用方法とサンプルコード)

---

## 1. 設計目標と基本方針

### 1.1 設計目標

- **統一性**: 全APIエンドポイントで一貫したインターフェース
- **型安全性**: TypeScriptによる厳密な型チェック
- **エラー処理**: 統一されたエラーレスポンス形式
- **保守性**: 明確な責任分離と再利用可能な設計

### 1.2 基本設計方針

```typescript
// 統一されたAPIレスポンス構造
interface NotionApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
```

**設計原則:**
- **RESTful設計**: HTTP動詞とリソース指向のURL設計
- **単一責任**: 各エンドポイントは明確な責任を持つ
- **一貫性**: 全APIで統一されたレスポンス形式
- **拡張性**: 将来的な機能追加に対応可能な設計

---

## 2. アーキテクチャ設計

### 2.1 レイヤー構造

```
┌─────────────────────────────────┐
│     Next.js Route Handlers      │  ← APIルート層
├─────────────────────────────────┤
│     NotionService              │  ← サービス層
├─────────────────────────────────┤
│     Type Definitions           │  ← 型定義層
├─────────────────────────────────┤
│     External Libraries         │  ← ライブラリ層
└─────────────────────────────────┘
```

### 2.2 APIエンドポイント構成

| エンドポイント | HTTPメソッド | 責務 | ファイルパス |
|---------------|-------------|------|-------------|
| `/api/notion/database/[databaseId]` | GET | データベース取得 | `database/[databaseId]/route.ts` |
| `/api/notion/page/[pageId]` | GET | ページ取得 | `page/[pageId]/route.ts` |
| `/api/notion/page/[pageId]` | PUT | ページ更新 | `page/[pageId]/route.ts` |
| `/api/notion/page` | POST | ページ作成 | `page/route.ts` |

### 2.3 依存関係設計

```typescript
Route Handler → NotionService → Notion API
     ↓              ↓              ↓
Type Safety    Data Processing   External API
```

---

## 3. API仕様詳細

### 3.1 データベース取得API

**エンドポイント**: `GET /api/notion/database/[databaseId]`
**機能概要**: 指定したNotionデータベース内の全ページ一覧とメタデータを取得する

```typescript
// ファイル: src/app/api/notion/database/[databaseId]/route.ts
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ databaseId: string }> }
): Promise<NextResponse<NotionApiResponse<NotionDatabaseData>>>
```

**設計特徴:**
- **動的ルーティング**: `[databaseId]`による柔軟なリソース指定
- **非同期パラメータ**: Next.js 15の新仕様に対応した`Promise<params>`
- **型安全性**: 戻り値型の明示的な定義

**処理フロー:**
1. パラメータからdatabaseIdを非同期取得
2. 環境変数からAPIキーを取得・検証
3. NotionServiceインスタンス化
4. データベース情報とページ一覧を一括取得
5. 統一レスポンス形式で返却

### 3.2 ページ取得API

**エンドポイント**: `GET /api/notion/page/[pageId]`
**機能概要**: 指定したページの詳細内容をMarkdown形式で取得する

```typescript
// ファイル: src/app/api/notion/page/[pageId]/route.ts
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
): Promise<NextResponse<NotionApiResponse<NotionPageData>>>
```

**設計特徴:**
- **詳細コンテンツ取得**: ページの全コンテンツをMarkdown形式で取得
- **メタデータ包含**: タイトル、キーワード、作成・更新日時を含む
- **効率的変換**: notion-to-mdライブラリによる高精度変換

### 3.3 ページ更新API

**エンドポイント**: `PUT /api/notion/page/[pageId]`
**機能概要**: 既存ページのタイトル・キーワード・コンテンツを更新する

```typescript
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
): Promise<NextResponse<NotionApiResponse<NotionPageData>>>
```

**設計特徴:**
- **部分更新対応**: タイトル、キーワード、コンテンツの選択的更新
- **Markdown入力**: 直感的なMarkdown形式での入力
- **原子性**: 全ての更新処理を単一トランザクションで実行

**リクエストボディ:**
```typescript
interface UpdatePageRequest {
  title?: string;
  keywords?: string[];
  content?: string;
}
```

### 3.4 ページ作成API

**エンドポイント**: `POST /api/notion/page`
**機能概要**: 指定したデータベースに新しいページを作成する

```typescript
// ファイル: src/app/api/notion/page/route.ts
export async function POST(
  request: NextRequest
): Promise<NextResponse<NotionApiResponse<NotionPageData>>>
```

**設計特徴:**
- **必須項目検証**: databaseId, title, contentの存在確認
- **201ステータス**: 作成成功時の適切なHTTPステータス
- **即座のレスポンス**: 作成されたページ情報を即座に返却

**リクエストボディ:**
```typescript
interface CreatePageRequest {
  databaseId: string;  // 必須
  title: string;       // 必須
  keywords: string[];  // オプション
  content: string;     // 必須
}
```

---

## 4. エラーハンドリング戦略

### 4.1 統一エラーレスポンス

```typescript
// 成功時
{
  "success": true,
  "data": { /* 実際のデータ */ }
}

// エラー時
{
  "success": false,
  "error": "具体的なエラーメッセージ"
}
```

### 4.2 エラー分類と対応

| エラータイプ | HTTPステータス | 対応方針 | 例 |
|-------------|---------------|----------|-----|
| 設定エラー | 500 | サーバー内部エラー | APIキー未設定 |
| バリデーションエラー | 400 | クライアントエラー | 必須項目不足 |
| NotionAPIエラー | 500 | 原因エラーをラップ | ページ不存在 |
| 不明エラー | 500 | 'Unknown error occurred' | 予期しないエラー |

### 4.3 エラーハンドリングパターン

```typescript
try {
  // API操作
  const result = await notionService.method();
  return NextResponse.json({ success: true, data: result });
} catch (error) {
  console.error('Context-specific error log:', error);
  return NextResponse.json(
    {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    },
    { status: 500 }
  );
}
```

**エラーハンドリング方針:**
- **コンテキスト保持**: エラー発生箇所の明確化
- **原因追跡**: 元のエラーメッセージを保持
- **ログ出力**: デバッグ用の詳細ログ
- **一貫性**: 全APIで統一されたエラー形式

---

## 5. 認証・セキュリティ設計

### 5.1 環境変数による認証

```typescript
const apiKey = process.env.NOTION_API_KEY;
if (!apiKey) {
  return NextResponse.json(
    { success: false, error: 'NOTION_API_KEY is not configured' },
    { status: 500 }
  );
}
```

**セキュリティ方針:**
- **環境変数管理**: APIキーの安全な管理
- **早期検証**: リクエスト処理前の認証確認
- **エラー統一**: 認証エラーの一貫した処理

### 5.2 セキュリティ考慮事項

| 脅威 | 対策 | 実装箇所 |
|------|------|----------|
| APIキー漏洩 | 環境変数での管理 | 各route.ts |
| 不正アクセス | Notion API権限による制御 | NotionService |
| データ漏洩 | 最小権限の原則 | API設計 |

---

## 6. レスポンス設計

### 6.1 統一レスポンス構造

```typescript
interface NotionApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
```

### 6.2 データ型定義

```typescript
// データベースレスポンス
interface NotionDatabaseData {
  id: string;
  title: string;
  pages: NotionPageData[];
}

// ページレスポンス
interface NotionPageData {
  id: string;
  title: string;
  keywords: string[];
  content?: string;
  createdTime: string;
  lastEditedTime: string;
}
```

### 6.3 HTTPステータスコード

| 操作 | 成功時 | エラー時 | 理由 |
|------|-------|---------|------|
| GET | 200 | 500 | 標準的な取得操作 |
| POST | 201 | 400/500 | リソース作成の明示 |
| PUT | 200 | 500 | 更新操作の完了 |

---

## 7. 型安全性の実装

### 7.1 TypeScript活用

```typescript
// 厳密な型定義
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ databaseId: string }> }
): Promise<NextResponse<NotionApiResponse<NotionDatabaseData>>> {
  // 実装
}
```

### 7.2 型安全性のメリット

- **コンパイル時エラー検出**: 実行前のバグ発見
- **インテリセンス支援**: 開発効率の向上
- **リファクタリング安全性**: 型による変更影響の把握
- **ドキュメント性**: 型自体がドキュメントとして機能

---

## 8. パフォーマンス考慮事項

### 8.1 効率的なデータ取得

```typescript
// データベース取得時の最適化
const database = await notionService.getDatabase(databaseId);
// → 内部で一括クエリによる効率化
```

### 8.2 パフォーマンス最適化

| 項目 | 最適化手法 | 効果 |
|------|-----------|------|
| API呼び出し | バッチ処理 | レスポンス時間短縮 |
| データ変換 | 効率的ライブラリ | CPU使用量削減 |
| エラー処理 | 早期リターン | 無駄な処理の削減 |

---

## 9. 使用方法とサンプルコード

### 9.1 データベース取得

```javascript
// フロントエンドからの呼び出し
async function fetchDatabase(databaseId) {
  try {
    const response = await fetch(`/api/notion/database/${databaseId}`);
    const result = await response.json();
    
    if (result.success) {
      console.log('データベース情報:', result.data);
      console.log('ページ数:', result.data.pages.length);
      return result.data;
    } else {
      console.error('エラー:', result.error);
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('データベース取得エラー:', error);
    throw error;
  }
}

// 使用例
const database = await fetchDatabase('550e8400-e29b-41d4-a716-446655440000');
```

### 9.2 ページ操作の統合例

```javascript
class NotionPageManager {
  constructor() {
    this.baseUrl = '/api/notion';
  }
  
  // ページ詳細取得
  async getPage(pageId) {
    const response = await fetch(`${this.baseUrl}/page/${pageId}`);
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error);
    }
    
    return result.data;
  }
  
  // ページ作成
  async createPage(databaseId, title, content, keywords = []) {
    const response = await fetch(`${this.baseUrl}/page`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        databaseId,
        title,
        content,
        keywords,
      }),
    });
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error);
    }
    
    return result.data;
  }
  
  // ページ更新
  async updatePage(pageId, updates) {
    const response = await fetch(`${this.baseUrl}/page/${pageId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error);
    }
    
    return result.data;
  }
}

// 使用例
const pageManager = new NotionPageManager();

// 新しいページの作成
const newPage = await pageManager.createPage(
  'database-id',
  'APIドキュメント',
  '# APIドキュメント\n\n## 概要\n...',
  ['API', 'ドキュメント', '開発']
);

// ページの更新
const updatedPage = await pageManager.updatePage(newPage.id, {
  title: 'APIドキュメント（更新版）',
  content: '# APIドキュメント（更新版）\n\n更新内容...'
});
```

### 9.3 エラーハンドリングの実装例

```javascript
// 統一エラーハンドリング
async function safeApiCall(apiCall, context) {
  try {
    const result = await apiCall();
    return result;
  } catch (error) {
    console.error(`${context}でエラーが発生:`, error);
    
    // エラー種別による処理分岐
    if (error.message?.includes('NOTION_API_KEY')) {
      alert('APIキーの設定を確認してください');
    } else if (error.message?.includes('required fields')) {
      alert('必須項目が不足しています');
    } else {
      alert('エラーが発生しました。しばらく後でお試しください。');
    }
    
    throw error;
  }
}

// 使用例
await safeApiCall(
  () => pageManager.createPage(databaseId, title, content),
  'ページ作成'
);
```

### 9.4 React.jsでの統合例

```jsx
import React, { useState, useEffect } from 'react';

function NotionDatabaseViewer({ databaseId }) {
  const [database, setDatabase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const response = await fetch(`/api/notion/database/${databaseId}`);
        const result = await response.json();
        
        if (result.success) {
          setDatabase(result.data);
        } else {
          setError(result.error);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    if (databaseId) {
      fetchData();
    }
  }, [databaseId]);
  
  if (loading) return <div>読み込み中...</div>;
  if (error) return <div>エラー: {error}</div>;
  if (!database) return <div>データベースが見つかりません</div>;
  
  return (
    <div>
      <h1>{database.title}</h1>
      <p>ページ数: {database.pages.length}</p>
      
      <div>
        {database.pages.map(page => (
          <div key={page.id} style={{ border: '1px solid #ccc', margin: '10px', padding: '10px' }}>
            <h3>{page.title}</h3>
            <p>キーワード: {page.keywords.join(', ')}</p>
            <p>更新日: {new Date(page.lastEditedTime).toLocaleDateString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default NotionDatabaseViewer;
```

---