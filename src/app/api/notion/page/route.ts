import { NextRequest, NextResponse } from 'next/server';
import { NotionService } from '@/services/notion';
import type { NotionApiResponse, NotionPageData, CreatePageRequest } from '@/types/notion';

export async function POST(
  request: NextRequest
): Promise<NextResponse<NotionApiResponse<NotionPageData>>> {
  try {
    // APIキーを環境変数から取得
    const apiKey = process.env.NOTION_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'NOTION_API_KEY is not configured',
        },
        { status: 500 }
      );
    }

    // リクエストボディを取得
    const createData: CreatePageRequest = await request.json();

    // 必須フィールドの検証
    if (!createData.databaseId || !createData.title || !createData.content) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: databaseId, title, and content are required',
        },
        { status: 400 }
      );
    }

    // NotionServiceを初期化
    const notionService = new NotionService(apiKey);

    // ページを作成
    const createdPage = await notionService.createPage(createData);

    return NextResponse.json(
      {
        success: true,
        data: createdPage,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Page POST API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
} 