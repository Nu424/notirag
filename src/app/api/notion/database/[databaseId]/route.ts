import { NextRequest, NextResponse } from 'next/server';
import { NotionService } from '@/services/notion';
import type { NotionApiResponse, NotionDatabaseData } from '@/types/notion';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ databaseId: string }> }
): Promise<NextResponse<NotionApiResponse<NotionDatabaseData>>> {
  try {
    const { databaseId } = await params;

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

    // データベースを取得
    const database = await notionService.getDatabase(databaseId);

    return NextResponse.json({
      success: true,
      data: database,
    });
  } catch (error) {
    console.error('Database API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
} 