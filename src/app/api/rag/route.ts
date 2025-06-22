import { NextRequest, NextResponse } from 'next/server';
import { ChatOpenAI } from '@langchain/openai';
import { RAGService } from '@/services/rag';
import { NotionService } from '@/services/notion';
import type { RAGResponse } from '@/types/rag';

export async function POST(request: NextRequest) {
    try {
        // ---入力の読み取り
        const body = await request.json();
        const openaiApiKey = process.env.OPENAI_API_KEY || '';
        const notionApiKey = process.env.NOTION_API_KEY || '';
        const { query, databaseId, ragConfig } = body;
        /* 以下の入力を想定している
        query: ユーザーのクエリ
        databaseId: データベースID
        ragConfig: RAG設定
        */

        // バリデーション
        if (!query || !databaseId || !openaiApiKey || !notionApiKey) {
            return NextResponse.json(
                { error: 'Missing required parameters: query, databaseId, openaiApiKey, notionApiKey' },
                { status: 400 }
            );
        }

        console.log(`Processing RAG query: "${query.substring(0, 50)}..."`);

        // ---サービスの初期化・データベースの取得
        const llm = new ChatOpenAI({
            openAIApiKey: openaiApiKey,
            modelName: ragConfig?.llmModel || process.env.OPENAI_MODEL || 'gpt-4o-mini',
            temperature: ragConfig?.temperature || 0.1,
        });

        const notionService = new NotionService(notionApiKey);
        const ragService = new RAGService(llm, notionService, ragConfig);

        // データベースの取得
        console.log('Fetching database...');
        const database = await notionService.getDatabase(databaseId);
        console.log(`Database fetched: ${database.title} with ${database.pages.length} pages`);

        // ---関連ページを抽出する
        console.log('Analyzing relevance...');
        const relevantPages = await ragService.analyzeRelevance(query, database, {
            threshold: ragConfig?.relevanceThreshold || 0.3,
            maxResults: ragConfig?.maxResults || 5,
        });

        if (relevantPages.length === 0) {
            return NextResponse.json({
                answer: 'お探しの情報に関連するページが見つかりませんでした。データベース内の他の情報をご確認いただくか、異なるキーワードで検索してみてください。',
                sources: [],
                metadata: {
                    processingTime: 0,
                }
            });
        }

        // ---すべての関連ページに対して、ページの内容を取得する
        for (const relevantPage of relevantPages) {
            await ragService.setPageContentToPageRelevanceResult(relevantPage);
        }

        // ---関連ページをコンテキストとして、回答を生成する
        console.log(`Generating response with ${relevantPages.length} relevant pages...`);
        // console.log("--------------------------------")
        // console.log(relevantPages[0].page.content)
        // console.log("--------------------------------")
        const response: RAGResponse = await ragService.generateResponse({
            query,
            relevantPages,
            includeSources: true,
        });

        console.log('RAG processing completed successfully');
        return NextResponse.json(response);

    } catch (error) {
        console.error('RAG processing error:', error);
        return NextResponse.json(
            {
                error: 'RAG処理中にエラーが発生しました',
                details: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
} 