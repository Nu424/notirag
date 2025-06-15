import { NextRequest, NextResponse } from 'next/server';
import { NotionService } from '@/services/notion';
import type { NotionApiResponse, NotionPageData, UpdatePageRequest } from '@/types/notion';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
): Promise<NextResponse<NotionApiResponse<NotionPageData>>> {
  try {
    const { pageId } = await params;

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

    // NotionServiceを初期化
    const notionService = new NotionService(apiKey);

    // ページを取得
    const page = await notionService.getPage(pageId);

    return NextResponse.json({
      success: true,
      data: page,
    });
  } catch (error) {
    console.error('Page GET API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
): Promise<NextResponse<NotionApiResponse<NotionPageData>>> {
  try {
    const { pageId } = await params;

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
    const updateData: UpdatePageRequest = await request.json();

    // NotionServiceを初期化
    const notionService = new NotionService(apiKey);

    // ページを更新
    const updatedPage = await notionService.updatePage(pageId, updateData);

    return NextResponse.json({
      success: true,
      data: updatedPage,
    });
  } catch (error) {
    console.error('Page PUT API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
} 