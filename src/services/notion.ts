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

  constructor(apiKey: string) {
    this.notion = new Client({ auth: apiKey });
    this.n2m = new NotionToMarkdown({ notionClient: this.notion });
  }

  /**
 * データベースの取得✅️
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
   * ページの取得（Markdown形式で出力）✅️
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
   * ページの更新（Markdown形式で入力）✅️
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
   * ページの作成（Markdown形式で入力）✅️
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
   * ページデータの抽出（DatabaseクエリオブジェクトまたはPageオブジェクト対応）✅️
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
   * タイトルの抽出✅️
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
   * キーワードの抽出✅️
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
   * データベースタイトルの抽出✅️
   */
  private extractDatabaseTitle(database: any): string {
    if (database.title && database.title[0]) {
      return database.title[0].text.content;
    }
    return 'Untitled Database';
  }

  /**
   * ページコンテンツの更新（MarkdownをNotionブロックに変換）✅️
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
   * MartianライブラリでMarkdownをNotionブロックに変換✅️
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