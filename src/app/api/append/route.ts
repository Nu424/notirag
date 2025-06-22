import { NextRequest, NextResponse } from 'next/server';
import { ChatOpenAI } from "@langchain/openai";
import { NotionService } from '@/services/notion';
import { RAGService } from '@/services/rag';
import type { NotionApiResponse } from '@/types/notion';
import { PromptTemplate } from '@langchain/core/prompts';

interface AppendRequest {
    databaseId: string;
    content: string;
    targetPageId?: string; // 指定されていない場合は関連性分析で自動選択
}

interface AppendResponse {
    success: boolean;
    pageId: string;
    title: string;
    message: string;
}

export async function POST(
    request: NextRequest
): Promise<NextResponse<NotionApiResponse<AppendResponse>>> {
    try {
        const body: AppendRequest = await request.json();
        const { databaseId, content, targetPageId } = body;

        // 入力検証
        if (!databaseId || !content) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'databaseId and content are required',
                },
                { status: 400 }
            );
        }

        // APIキーを環境変数から取得
        const apiKey = process.env.NOTION_API_KEY;
        const openaiApiKey = process.env.OPENAI_API_KEY;

        if (!apiKey || !openaiApiKey) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'API keys are not configured',
                },
                { status: 500 }
            );
        }

        // サービスを初期化
        const notionService = new NotionService(apiKey);
        const llm = new ChatOpenAI({
            openAIApiKey: openaiApiKey,
            modelName: process.env.OPENAI_MODEL || "gpt-4o-mini",
        });
        const ragService = new RAGService(llm, notionService);

        let selectedPageId: string;
        let selectedPageTitle: string;

        if (targetPageId) {
            // 追加先ページが指定されている場合
            console.log(`Target page specified: ${targetPageId}`);
            const targetPage = await notionService.getPage(targetPageId);
            selectedPageId = targetPageId;
            selectedPageTitle = targetPage.title;

            // 既存コンテンツと新規コンテンツをマージ
            const mergedContent = await ragService.mergeContent({
                originalContent: targetPage.content || '',
                additionalContent: content,
            });

            // ページを更新
            await notionService.updatePage(targetPageId, {
                content: mergedContent
            });

        } else {
            // 追加先ページが指定されていない場合 - 関連性分析で自動選択
            console.log('No target page specified, analyzing relevance...');

            // データベースを取得
            const database = await notionService.getDatabase(databaseId);

            if (database.pages.length === 0) {
                return NextResponse.json(
                    {
                        success: false,
                        error: 'No pages found in the database',
                    },
                    { status: 404 }
                );
            }

            // 関連性分析を実行
            const relevantPages = await ragService.analyzeRelevance(content, database, {
                threshold: 0.1, // 低い閾値で少なくとも1つは見つかるように
                maxResults: 1
            });

            if (relevantPages.length === 0) {
                // 関連ページが見つからない場合は新しいページを作成
                console.log('No relevant pages found, creating new page...');
                const [newTitle, newKeywords] = await Promise.all([
                    createPageTitle(content),
                    createPageKeywords(content)
                ]);
                // console.log("--------------------------------")
                // console.log('newTitle');
                // console.log(newTitle);
                // console.log("--------------------------------")
                // console.log('newKeywords');
                // console.log(newKeywords);
                // console.log("--------------------------------")
                const newPage = await notionService.createPage({
                    databaseId,
                    title: newTitle,
                    keywords: newKeywords,
                    content
                });

                selectedPageId = newPage.id;
                selectedPageTitle = newPage.title;
            } else {
                // 最も関連性の高いページを選択
                const mostRelevantPage = relevantPages[0];
                selectedPageId = mostRelevantPage.page.id;
                selectedPageTitle = mostRelevantPage.page.title;

                console.log(`Most relevant page selected: ${selectedPageTitle} (score: ${mostRelevantPage.relevanceScore})`);

                // 既存コンテンツと新規コンテンツをマージ
                const fullPage = await notionService.getPage(selectedPageId);
                const mergedContent = await ragService.mergeContent({
                    originalContent: fullPage.content || '',
                    additionalContent: content,
                });

                // ページを更新
                await notionService.updatePage(selectedPageId, {
                    content: mergedContent
                });
            }
        }

        return NextResponse.json({
            success: true,
            data: {
                success: true,
                pageId: selectedPageId,
                title: selectedPageTitle,
                message: targetPageId
                    ? '指定されたページに情報を追加しました'
                    : '関連性分析により最適なページに情報を追加しました'
            },
        });

    } catch (error) {
        console.error('Append API Error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            },
            { status: 500 }
        );
    }
}

async function createPageKeywords(content: string): Promise<string[]> {
    // ---プロンプトの用意
    const promptTemplate = PromptTemplate.fromTemplate(`
以下の内容をもとに、キーワードを抽出してください。
このテキストの目的を理解し、可能な限り詳細かつ網羅的に抽出してください。
あとから探しやすいように、質の高いキーワードを数を絞って作成することを心がけてください。
出力はカンマ区切りの文字列としてください。

## 内容
{content}
  `.trim());
    const prompt = await promptTemplate.format({ content });

    // ---LLMの用意・実行
    const llm = new ChatOpenAI({
        openAIApiKey: process.env.OPENAI_API_KEY,
        modelName: process.env.OPENAI_MODEL || "gpt-4o-mini",
    });
    const response = await llm.invoke(prompt);

    // ---値の返却
    const keywords = typeof response.content === 'string'
        ? response.content.split(',')
        : String(response.content).split(',');
    return keywords;
}

async function createPageTitle(content: string): Promise<string> {
    // ---プロンプトの用意
    const promptTemplate = PromptTemplate.fromTemplate(`
以下の内容を簡潔かつ過不足なく表現するタイトルを作成してください。
あとから探しやすいように、質の高いタイトルを作成することを心がけてください。

## 内容
{content}
    `.trim());
    const prompt = await promptTemplate.format({ content });

    // ---LLMの用意・実行
    const llm = new ChatOpenAI({
        openAIApiKey: process.env.OPENAI_API_KEY,
        modelName: process.env.OPENAI_MODEL || "gpt-4o-mini",
    });
    const response = await llm.invoke(prompt);

    // ---値の返却
    const title = typeof response.content === 'string'
        ? response.content
        : String(response.content);
    return title;
}