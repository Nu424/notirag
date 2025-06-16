/*
# notion.ts
Notion APIを使用してデータベースやページを操作するためのサービスクラス

## 概要
NotionServiceクラスは、Notion APIを使用してNotionデータベースやページの操作を行うためのサービスクラスです。
以下の主要な機能を提供します：

### 主要機能
- **データベース操作**: データベースの取得、ページ一覧の取得
- **ページ操作**: ページの取得、作成、更新
- **コンテンツ変換**: Markdown ↔ Notion ブロック間の相互変換
- **プロパティ管理**: タイトルとキーワードプロパティの操作

### 使用されるプロパティ
- `nora_title`: ページのタイトルを格納するタイトルプロパティ
- `nora_keywords`: ページのキーワードを格納するリッチテキストプロパティ（カンマ区切り）

### 依存関係
- `@notionhq/client`: Notion APIクライアント
- `notion-to-md`: NotionページをMarkdownに変換
- `@tryfabric/martian`: MarkdownをNotionブロックに変換

### 使用方法
```typescript
const notionService = new NotionService('your-notion-api-key');

// データベースの取得
const database = await notionService.getDatabase('database-id');

// ページの取得
const page = await notionService.getPage('page-id');
console.log(page.title); // ページタイトル
console.log(page.content); // Markdown形式のコンテンツ
console.log(page.keywords); // キーワード配列

// ページの作成
const newPage = await notionService.createPage({
  databaseId: 'database-id',
  title: 'New Page Title',
  keywords: ['keyword1', 'keyword2'],
  content: '# Hello World\nThis is markdown content.'
});

// ページの更新
const updatedPage = await notionService.updatePage('page-id', {
  title: 'Updated Title',
  content: '# Updated Content'
});
```

## エラーハンドリング
すべてのパブリックメソッドは適切なエラーハンドリングを実装しており、
失敗時には詳細なエラーメッセージとともに例外をスローします。

## 制限事項
- Notion APIの制限により、一度に100個までのブロックしか追加できません
- プロパティ名は固定（nora_title, nora_keywords）
- キーワードはカンマ区切りの文字列として格納されます

*/

import { Client, isFullPageOrDatabase } from '@notionhq/client';
import { NotionToMarkdown } from 'notion-to-md';
import { markdownToBlocks, markdownToRichText } from '@tryfabric/martian';
import type {
  NotionPageData,
  NotionDatabaseData,
  CreatePageRequest,
  UpdatePageRequest
} from '@/types/notion';

const titleProperty = "nora_title";
const keywordsProperty = "nora_keywords";

export class NotionService {
  private notion: Client;
  private n2m: NotionToMarkdown;

  /**
   * NotionServiceのコンストラクタ
   * 
   * @param apiKey - Notion APIキー（Integration APIキー）
   * 
   * @example
   * ```typescript
   * const notionService = new NotionService('secret_xxxxxxxxxxxxx');
   * ```
   */
  constructor(apiKey: string) {
    this.notion = new Client({ auth: apiKey });
    this.n2m = new NotionToMarkdown({ notionClient: this.notion });
  }

  /**
   * 指定されたデータベースを取得し、その中のすべてのページ情報を含むデータベースデータを返します
   * 
   * @param databaseId - 取得するNotionデータベースのID
   * @returns データベース情報とページ一覧を含むNotionDatabaseDataオブジェクト
   * 
   * @throws データベースの取得に失敗した場合はエラーをスロー
   * 
   * @example
   * ```typescript
   * const database = await notionService.getDatabase('550e8400-e29b-41d4-a716-446655440000');
   * console.log(database.title); // データベースタイトル
   * console.log(database.pages.length); // ページ数
   * ```
   */
  async getDatabase(databaseId: string): Promise<NotionDatabaseData> {
    try {
      // データベース情報を取得
      const database = await this.notion.databases.retrieve({
        database_id: databaseId,
      });

      // データベース内のページ一覧を取得
      const response = await this.notion.databases.query({
        database_id: databaseId,
      });

      const pages: NotionPageData[] = [];

      // 全てのページに対してプロパティを抽出（個別リクエストなし）
      for (const page of response.results) {
        if (isFullPageOrDatabase(page) && 'properties' in page) {
          // Databaseクエリからプロパティデータをそのまま抽出
          const pageData = this.extractPageData(page, 'database');
          pages.push(pageData);
        }
      }

      return {
        id: databaseId,
        title: this.extractDatabaseTitle(database),
        pages,
      };
    } catch (error) {
      console.error('Error fetching database:', error);
      throw new Error(`Failed to fetch database: ${error}`);
    }
  }

  /**
   * 指定されたページを取得し、Markdown形式のコンテンツとともにページデータを返します
   * 
   * @param pageId - 取得するNotionページのID
   * @returns ページ情報とMarkdown形式のコンテンツを含むNotionPageDataオブジェクト
   * 
   * @throws ページの取得に失敗した場合、または無効なページ形式の場合はエラーをスロー
   * 
   * @example
   * ```typescript
   * const page = await notionService.getPage('550e8400-e29b-41d4-a716-446655440001');
   * console.log(page.title); // ページタイトル
   * console.log(page.content); // Markdown形式のコンテンツ
   * console.log(page.keywords); // キーワード配列
   * ```
   */
  async getPage(pageId: string): Promise<NotionPageData> {
    try {
      const page = await this.notion.pages.retrieve({ page_id: pageId });
      console.log((page as any).properties[keywordsProperty]) // TODO

      if (!('properties' in page)) {
        throw new Error('Invalid page format');
      }

      // ページコンテンツをMarkdown形式で取得
      const mdBlocks = await this.n2m.pageToMarkdown(pageId);
      const content = this.n2m.toMarkdownString(mdBlocks);

      return this.extractPageData(page, 'page', content.parent);
    } catch (error) {
      console.error('Error fetching page:', error);
      throw new Error(`Failed to fetch page: ${error}`);
    }
  }

  /**
   * 指定されたページを更新します。タイトル、キーワード、コンテンツ（Markdown形式）を更新可能です
   * 
   * @param pageId - 更新するNotionページのID
   * @param updateData - 更新するデータ（title, keywords, content）
   * @returns 更新後のページデータ
   * 
   * @throws ページの更新に失敗した場合はエラーをスロー
   * 
   * @example
   * ```typescript
   * const updatedPage = await notionService.updatePage('page-id', {
   *   title: '新しいタイトル',
   *   keywords: ['新しいキーワード1', '新しいキーワード2'],
   *   content: '# 更新されたコンテンツ\n新しい内容です。'
   * });
   * ```
   */
  async updatePage(pageId: string, updateData: UpdatePageRequest): Promise<NotionPageData> {
    try {
      // ページのプロパティを更新
      const updateProperties: any = {};

      if (updateData.title) {
        // タイトルはプレーンテキストのみなので、そのまま設定
        updateProperties[titleProperty] = {
          title: [
            {
              text: {
                content: updateData.title,
              },
            },
          ],
        };
      }

      if (updateData.keywords) {
        const keywordAll = updateData.keywords.join(',');
        updateProperties[keywordsProperty] = {
          rich_text: [
            {
              type: 'text',
              text: {
                content: keywordAll
              },
            },
          ]
        };
      }

      await this.notion.pages.update({
        page_id: pageId,
        properties: updateProperties,
      });

      // コンテンツの更新（MarkdownからNotionブロックに変換）
      if (updateData.content) {
        await this.updatePageContent(pageId, updateData.content);
      }

      // 更新後のページを取得して返す
      return await this.getPage(pageId);
    } catch (error) {
      console.error('Error updating page:', error);
      throw new Error(`Failed to update page: ${error}`);
    }
  }

  /**
   * 指定されたデータベースに新しいページを作成します
   * 
   * @param createData - 作成するページのデータ（databaseId, title, keywords, content）
   * @returns 作成されたページデータ
   * 
   * @throws ページの作成に失敗した場合はエラーをスロー
   * 
   * @example
   * ```typescript
   * const newPage = await notionService.createPage({
   *   databaseId: 'database-id',
   *   title: 'ページタイトル',
   *   keywords: ['キーワード1', 'キーワード2'],
   *   content: '# ページコンテンツ\nMarkdown形式で記述可能です。'
   * });
   * ```
   */
  async createPage(createData: CreatePageRequest): Promise<NotionPageData> {
    try {
      const properties: any = {
        [titleProperty]: {
          title: [
            {
              text: {
                content: createData.title,
              },
            },
          ],
        },
      };

      if (createData.keywords && createData.keywords.length > 0) {
        properties[keywordsProperty] = {
          rich_text: [
            {
              type: 'text',
              text: {
                content: createData.keywords.join(','),
              },
            },
          ]
        };
      }

      // ページを作成
      const response = await this.notion.pages.create({
        parent: {
          database_id: createData.databaseId,
        },
        properties,
      });

      // コンテンツを追加（MarkdownからNotionブロックに変換）
      await this.updatePageContent(response.id, createData.content);

      // 作成されたページを取得して返す
      return await this.getPage(response.id);
    } catch (error) {
      console.error('Error creating page:', error);
      throw new Error(`Failed to create page: ${error}`);
    }
  }

  /**
   * NotionページオブジェクトからNotionPageDataを抽出します
   * 
   * @private
   * @param page - Notion APIから取得されたページオブジェクト
   * @param source - データソース（'database'または'page'）
   * @param content - ページのMarkdownコンテンツ（オプション）
   * @returns 抽出されたNotionPageDataオブジェクト
   * 
   * @remarks
   * - データベースクエリから取得した場合はcontentはundefinedになります
   * - ページから直接取得した場合はcontentが含まれます
   */
  private extractPageData(
    page: any,
    source: 'database' | 'page' = 'page',
    content?: string
  ): NotionPageData {
    const title = this.extractTitle(page.properties);
    const keywords = this.extractKeywords(page.properties);

    return {
      id: page.id,
      title,
      keywords,
      // Databaseからの場合はcontentをundefinedに、Pageからの場合は提供されたcontentまたは空文字
      content: source === 'database' ? undefined : (content || ''),
      createdTime: page.created_time,
      lastEditedTime: page.last_edited_time,
    };
  }

  /**
   * ページプロパティからタイトルを抽出します
   * 
   * @private
   * @param properties - ページプロパティオブジェクト
   * @returns ページタイトル（見つからない場合は'Untitled'）
   * 
   * @remarks
   * nora_titleプロパティからタイトルを抽出します。
   * 複数のテキスト要素がある場合は連結されます。
   */
  private extractTitle(properties: any): string {
    if (properties[titleProperty] && properties[titleProperty].title) {
      const titleAll = properties[titleProperty].title.map((item: any) => item.plain_text).join('');
      return titleAll;
    }
    return 'Untitled';
    // // propertiesオブジェクトからtype="title"のプロパティを検索
    // for (const [key, value] of Object.entries(properties)) {
    //   const propertyValue = value as any;
    //   if (propertyValue.type === 'title' && propertyValue.title) {
    //     // title配列からplain_textをすべて連結
    //     const plainTextAll = propertyValue.title
    //       .map((item: any) => item.plain_text)
    //       .join('');
    //     if (plainTextAll.trim()) {
    //       return plainTextAll;
    //     }
    //   }
    // }
  }

  /**
   * ページプロパティからキーワード配列を抽出します
   * 
   * @private
   * @param properties - ページプロパティオブジェクト
   * @returns キーワード配列（見つからない場合は空配列）
   * 
   * @remarks
   * nora_keywordsプロパティからカンマ区切りのキーワードを抽出し、
   * 配列として返します。空のキーワードは除外されます。
   */
  private extractKeywords(properties: any): string[] {
    // nora_keywords プロパティ（rich_text、カンマ区切り）
    if (properties[keywordsProperty] && properties[keywordsProperty].rich_text) {
      const plainTextAll = properties[keywordsProperty].rich_text
        .map((item: any) => item.plain_text)
        .join('');
      if (plainTextAll.trim()) {
        return plainTextAll.split(',').map((keyword: string) => keyword.trim()).filter(Boolean);
      }
    }

    return [];
  }

  /**
   * データベースオブジェクトからタイトルを抽出します
   * 
   * @private
   * @param database - Notion APIから取得されたデータベースオブジェクト
   * @returns データベースタイトル（見つからない場合は'Untitled Database'）
   */
  private extractDatabaseTitle(database: any): string {
    if (database.title && database.title[0]) {
      return database.title[0].text.content;
    }
    return 'Untitled Database';
  }

  /**
   * ページのコンテンツをMarkdown形式で更新します
   * 
   * @private
   * @param pageId - 更新するページのID
   * @param markdownContent - Markdown形式のコンテンツ
   * 
   * @throws ブロックの削除や追加に失敗した場合はエラーをスロー
   * 
   * @remarks
   * - 既存のコンテンツは完全に削除されます
   * - Markdownは@tryfabric/martianライブラリを使用してNotionブロックに変換されます
   * - Notion APIの制限により、一度に100個までのブロックしか追加できません
   */
  private async updatePageContent(pageId: string, markdownContent: string): Promise<void> {
    try {
      // 既存のコンテンツを削除
      const blocks = await this.notion.blocks.children.list({
        block_id: pageId,
      });

      if (blocks.results.length > 0) {
        for (const block of blocks.results) {
          await this.notion.blocks.delete({
            block_id: block.id,
          });
        }
      }

      // MartianライブラリでMarkdownをNotionブロックに変換
      const notionBlocks = this.convertMarkdownToNotionBlocks(markdownContent);

      if (notionBlocks.length > 0) {
        // Notionの制限により、一度に100個までのブロックしか追加できないため、分割して追加
        const chunkSize = 100;
        for (let i = 0; i < notionBlocks.length; i += chunkSize) {
          const chunk = notionBlocks.slice(i, i + chunkSize);
          await this.notion.blocks.children.append({
            block_id: pageId,
            children: chunk,
          });
        }
      }
    } catch (error) {
      console.error('Error updating page content:', error);
      throw error;
    }
  }

  /**
   * Markdown文字列をNotionブロック配列に変換します
   * 
   * @private
   * @param markdown - 変換するMarkdown文字列
   * @returns Notionブロック配列
   * 
   * @remarks
   * - @tryfabric/martianライブラリを使用してMarkdownをNotionブロックに変換
   * - GFMアラート（> [!NOTE] 形式）に対応
   * - 変換に失敗した場合は、シンプルな段落ブロックとしてフォールバック
   * - 空のマークダウンの場合は空配列を返す
   */
  private convertMarkdownToNotionBlocks(markdown: string): any[] {
    try {
      // Martianのオプション設定
      const options = {
        // GFMアラートを有効化（> [!NOTE] 形式のブロッククォート）
        enableEmojiCallouts: true,
        // Notionの制限を自動処理
        notionLimits: {
          truncate: true,
          onError: (err: Error) => {
            console.warn('Notion limits warning:', err.message);
          },
        },
        // 無効な画像URLを自動修正
        strictImageUrls: true,
      };

      // MarkdownをNotionブロックに変換
      const blocks = markdownToBlocks(markdown, options);

      return blocks;
    } catch (error) {
      console.error('Error converting markdown to Notion blocks:', error);
      // フォールバック: 空の場合は単純な段落として扱う
      if (markdown.trim()) {
        return [
          {
            type: 'paragraph',
            paragraph: {
              rich_text: [
                {
                  type: 'text',
                  text: {
                    content: markdown,
                  },
                  annotations: {
                    bold: false,
                    italic: false,
                    strikethrough: false,
                    underline: false,
                    code: false,
                    color: 'default',
                  },
                },
              ],
            },
          },
        ];
      }
      return [];
    }
  }
} 