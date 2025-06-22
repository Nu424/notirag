/*
# rag.ts
RAG（Retrieval Augmented Generation）機能を提供するサービスクラス

## 概要
RAGServiceクラスは、Notionデータベースを情報源とした高度な情報検索・回答生成機能を提供します。
以下の主要な機能を実装しています：

### 主要機能
- **関連性分析**: 入力クエリに関連するページの抽出と関連度判定
- **コンテンツマージ**: 既存コンテンツと新規コンテンツの適切な統合
- **回答生成**: コンテキストを考慮した自然言語での回答生成
- **バッチ処理**: 大量データの効率的な処理
- **キャッシュ機能**: パフォーマンス向上のためのインテリジェントキャッシング

### 技術スタック
- LangChain.js: LLM操作とプロンプト管理
- NotionService: Notionデータベースとの連携
- TypeScript: 型安全な実装

### 使用方法
```typescript
const ragService = new RAGService(llmModel, notionService, config);

// 関連ページの分析
const relevantPages = await ragService.analyzeRelevance(query, database);

// コンテンツのマージ
const mergedContent = await ragService.mergeContent(original, additional);

// 回答の生成
const response = await ragService.generateResponse(query, relevantPages);
```

### 設計思想
- パフォーマンス重視: 段階的フィルタリングとバッチ処理
- 拡張性: 戦略パターンによる柔軟な処理方式
- 保守性: NotionServiceの設計パターンを踏襲

*/

import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import type { NotionService } from './notion';
import type { NotionPageData, NotionDatabaseData } from '@/types/notion';
import type {
  PageRelevanceResult,
  RAGResponse,
  RAGServiceConfig,
  AnalysisOptions,
  MergeStrategy,
  MergeContentRequest,
  GenerateResponseRequest,
  RAGError,
  BatchProcessResult,
} from '@/types/rag';
import z from "zod";

/**
 * RAGService - 高度な情報検索・回答生成サービス
 * 
 * Notionデータベースを情報源として、入力クエリに対する
 * 関連性分析、コンテンツマージ、回答生成を行います。
 */
export class RAGService {
  private llm: ChatOpenAI;
  private notionService: NotionService;
  private config: RAGServiceConfig;
  private cache: Map<string, any>;

  // プロンプトテンプレート
  private relevancePrompt!: PromptTemplate;
  private mergePrompt!: PromptTemplate;
  private responsePrompt!: PromptTemplate;

  /**
   * RAGServiceのコンストラクタ
   * 
   * @param llmModel - LangChain.jsのLLMモデル（ChatOpenAI等）
   * @param notionService - NotionServiceのインスタンス
   * @param config - RAGサービスの設定（部分設定可能）
   * 
   * @example
   * ```typescript
   * const llm = new ChatOpenAI({ modelName: "gpt-3.5-turbo" });
   * const ragService = new RAGService(llm, notionService, {
   *   relevanceThreshold: 0.4,
   *   maxContextLength: 4000
   * });
   * ```
   */
  constructor(
    llmModel: ChatOpenAI,
    notionService: NotionService,
    config: Partial<RAGServiceConfig> = {}
  ) {
    this.llm = llmModel;
    this.notionService = notionService;
    this.config = {
      llmModel: 'gpt-4.1',
      relevanceThreshold: 0.3,
      maxContextLength: 4000,
      batchSize: 10,
      cacheEnabled: false,
      temperature: 0.1,
      maxResults: 20,
      ...config
    };
    this.cache = new Map();

    // プロンプトテンプレートの初期化
    this.initializePrompts();
  }

  /**
   * 入力クエリに関連するページを分析し、関連度付きで返します✅️
   * 
   * @param input - 分析対象の入力クエリ
   * @param database - 検索対象のNotionデータベース
   * @param options - 分析オプション
   * @returns 関連度付きページ結果の配列
   * 
   * @throws 分析処理に失敗した場合はエラーをスロー
   * 
   * @example
   * ```typescript
   * const relevantPages = await ragService.analyzeRelevance(
   *   "新製品のアイデアについて教えて",
   *   database,
   *   { threshold: 0.4, maxResults: 3 }
   * );
   * ```
   */
  async analyzeRelevance(
    input: string,
    database: NotionDatabaseData,
    options: AnalysisOptions = {}
  ): Promise<PageRelevanceResult[]> {
    try {
      console.log(`Starting relevance analysis for: "${input.substring(0, 50)}..."`);
      const startTime = Date.now();

      // キャッシュチェック
      // 「{入力}|{データベースID}|{オプション}」というキーでキャッシュを管理する
      // キャッシュに保存されている場合は、それを返す
      const cacheKey = this.generateCacheKey('relevance', input, database.id, options);
      if (this.config.cacheEnabled && this.cache.has(cacheKey)) {
        console.log('Returning cached relevance results');
        return this.cache.get(cacheKey);
      }

      // 設定とオプションのマージ
      const effectiveOptions = {
        threshold: options.threshold ?? this.config.relevanceThreshold,
        maxResults: options.maxResults ?? this.config.maxResults,
        includeReasoning: options.includeReasoning ?? false
      };

      // 段階的フィルタリング
      let candidatePages = database.pages;

      // 2. LLMによる関連性判定（バッチ処理）
      const relevanceResults = await this.batchAnalyzeRelevance(
        input,
        candidatePages,
      );

      // 3. フィルタリングとソート
      const finalResults = relevanceResults
        .filter(result => result.relevanceScore >= effectiveOptions.threshold)
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, effectiveOptions.maxResults);

      // キャッシュに保存
      if (this.config.cacheEnabled) {
        this.cache.set(cacheKey, finalResults);
      }

      const processingTime = Date.now() - startTime;
      console.log(`Relevance analysis completed in ${processingTime}ms, found ${finalResults.length} relevant pages`);

      return finalResults;
    } catch (error) {
      console.error('Error in relevance analysis:', error);
      throw this.createRAGError('RELEVANCE_ANALYSIS_FAILED', `Failed to analyze relevance: ${error}`, 'analysis', error);
    }
  }

  /**
   * PageRelevanceResultオブジェクトに、読み込んだページの内容をセットする✅️
   * 
   * @param pageRelevanceResult - 関連ページの結果
   * @returns 関連ページの結果
   * @note analyzeRelevanceでは、ページのキーワードだけを読み込んでおり、ページの内容は読み込んでいない
   * @note このメソッドを呼び出すことで、ページの内容を読み込むことができる
   */
  public async setPageContentToPageRelevanceResult(pageRelevanceResult: PageRelevanceResult): Promise<PageRelevanceResult> {
    const page = await this.notionService.getPage(pageRelevanceResult.page.id);
    pageRelevanceResult.page.content = page.content || '';
    return pageRelevanceResult;
  }

  /**
   * 既存コンテンツと新規コンテンツを適切にマージします✅️
   * 
   * @param request - マージリクエスト（元コンテンツ、追加コンテンツ、戦略）
   * @returns マージされたコンテンツ
   * 
   * @throws マージ処理に失敗した場合はエラーをスロー
   * 
   * @example
   * ```typescript
   * const merged = await ragService.mergeContent({
   *   originalContent: "既存の内容",
   *   additionalContent: "追加する内容",
   *   strategy: { type: 'integrate', sectionHandling: 'merge' }
   * });
   * ```
   */
  async mergeContent(request: MergeContentRequest): Promise<string> {
    try {
      console.log('Starting content merge');
      const startTime = Date.now();

      // マージプロンプトの作成
      const mergePrompt = await this.createMergePrompt(
        request.originalContent,
        request.additionalContent,
      );

      // LLMによるマージ実行
      const mergedContent = await this.llm.invoke(mergePrompt);

      const processingTime = Date.now() - startTime;
      console.log(`Content merge completed in ${processingTime}ms`);

      return typeof mergedContent.content === 'string'
        ? mergedContent.content
        : String(mergedContent.content);
    } catch (error) {
      console.error('Error in content merge:', error);
      throw this.createRAGError('CONTENT_MERGE_FAILED', `Failed to merge content: ${error}`, 'merge', error);
    }
  }

  /**
   * 関連ページ情報を基に、入力クエリに対する回答を生成します✅️
   * 
   * @param request - 回答生成リクエスト
   * @returns 生成された回答とメタデータ
   * 
   * @throws 回答生成に失敗した場合はエラーをスロー
   * 
   * @example
   * ```typescript
   * const response = await ragService.generateResponse({
   *   query: "新製品のアイデアは何がありますか？",
   *   relevantPages: relevantPages,
   *   options: { responseLength: 'medium', includeSources: true }
   * });
   * ```
   */
  async generateResponse(request: GenerateResponseRequest): Promise<RAGResponse> {
    try {
      console.log(`Generating response for: "${request.query.substring(0, 50)}..."`);
      const startTime = Date.now();

      // 文字数制限でコンテキストをカットする(長さでカットする)
      const optimizedContext = this.optimizeContext(
        request.relevantPages,
        this.config.maxContextLength
      );

      // 回答生成プロンプトの作成
      const responsePrompt = await this.createResponsePrompt(
        request.query,
        optimizedContext,
        request.includeSources ?? false
      );
      // console.log("--------------------------------")
      // console.log('responsePrompt');
      // console.log(responsePrompt);
      // console.log("--------------------------------")
      // LLMによる回答生成
      const answer = await this.llm.invoke(responsePrompt);

      const processingTime = Date.now() - startTime;
      const answerText = typeof answer.content === 'string'
        ? answer.content
        : String(answer.content);

      console.log(`Response generated in ${processingTime}ms`);

      return {
        answer: typeof answer.content === 'string'
          ? answer.content
          : String(answer.content),
        sources: optimizedContext,
        metadata: {
          processingTime,
        }
      };
    } catch (error) {
      console.error('Error in response generation:', error);
      throw this.createRAGError('RESPONSE_GENERATION_FAILED', `Failed to generate response: ${error}`, 'generation', error);
    }
  }

  /**
   * プロンプトテンプレートを初期化します
   * 
   * @private
   */
  private initializePrompts(): void {
    // 関連性分析用プロンプト
    this.relevancePrompt = PromptTemplate.fromTemplate(`
あなたは情報検索の専門家です。以下の入力クエリと、ページのキーワードを分析し、関連性を判定してください。

入力クエリ: {input}
ページタイトル: {title}
ページキーワード: {keywords}

関連性を0から1の数値で判定し、以下のJSON形式で回答してください：
{{
  "reasoning": "判定理由をここに記載",
  "matchedKeywords": ["マッチしたキーワード1", "マッチしたキーワード2"],
  "relevanceScore": 0.X
}}

関連性の基準：
- 1.0: 完全に一致・直接関連
- 0.7-0.9: 強い関連性
- 0.4-0.6: 中程度の関連性
- 0.1-0.3: 弱い関連性
- 0.0: 関連性なし
`);

    // コンテンツマージ用プロンプト
    this.mergePrompt = PromptTemplate.fromTemplate(`
あなたは文書編集の専門家です。以下の2つのコンテンツの情報を適切にマージしてください。

元のコンテンツ:
{originalContent}

追加するコンテンツ:
{additionalContent}

以下の点に注意してマージしてください：
1. 重複する情報は統合する
2. 構造的な整合性を保つ
3. Markdown形式を維持する
4. 情報の論理的な流れを確保する

マージされたコンテンツのみを出力してください：
`);

    // 回答生成用プロンプト  
    this.responsePrompt = PromptTemplate.fromTemplate(`
あなたは知識豊富なアシスタントです。以下の質問に対して、提供されたコンテキスト情報を基に回答してください。

## 質問
{query}

## 参考情報
{context}

## 回答の要求事項
- 情報源は、{includeSources}

質問に対して正確で有用な回答を生成してください。情報源が明示されている場合は、どの情報を参考にしたかを明記してください。
`);
  }


  /**
   * 各ページに対して、関連性を判定する(バッチ処理)✅️
   * 
   * @private
   */
  private async batchAnalyzeRelevance(
    input: string,
    pages: NotionPageData[],
  ): Promise<PageRelevanceResult[]> {
    const results: PageRelevanceResult[] = [];
    const batches = this.chunkArray(pages, this.config.batchSize);

    for (const batch of batches) {
      try {
        const batchPromises = batch.map(async (page) => {

          const relevanceSchema = z.object({
            relevanceScore: z.number().min(0).max(1).describe('関連性スコア（0-1）'),
            matchedKeywords: z.array(z.string()).describe('マッチしたキーワード'),
            reasoning: z.string().describe('判定理由')
          });
          const llm = this.llm.withStructuredOutput(relevanceSchema);

          const relevanceData = await this.relevancePrompt.format({
            input: input,
            title: page.title,
            keywords: page.keywords.join(', ')
          });

          const response = await llm.invoke(relevanceData);

          try {
            return {
              page,
              relevanceScore: response.relevanceScore || 0,
              matchedKeywords: response.matchedKeywords || [],
            };
          } catch (parseError) {
            console.warn(`Failed to parse LLM response for page ${page.id}:`, parseError);
            return {
              page,
              relevanceScore: 0,
              matchedKeywords: [],
            };
          }
        });

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        // レート制限を考慮した待機
        if (batches.indexOf(batch) < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.error('Batch processing error:', error);
        // エラーが発生したバッチは空の結果として扱う
        const emptyResults = batch.map(page => ({
          page,
          relevanceScore: 0,
          matchedKeywords: [],
          reasoningContext: undefined
        }));
        results.push(...emptyResults);
      }
    }

    return results;
  }

  /**
   * PageRelevanceResultの配列から、文字列の長さを考慮して、コンテキストを最適化する(長さでカットする)✅️
   * 
   * @private
   */
  private optimizeContext(
    pages: PageRelevanceResult[],
    maxLength: number
  ): PageRelevanceResult[] {
    let currentLength = 0;
    const optimized: PageRelevanceResult[] = [];

    // 関連度の高い順にソート
    pages.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // 関連度の高い順にソート済みの前提で処理
    for (const pageResult of pages) {
      const pageContent = pageResult.page.content || '';
      const pageLength = pageContent.length;

      if (currentLength + pageLength <= maxLength) {
        optimized.push(pageResult);
        currentLength += pageLength;
      } else {
        // 残り容量に応じて部分的に含める
        const remainingLength = maxLength - currentLength;
        if (remainingLength > 100) { // 最小100文字は確保
          const truncatedPage = {
            ...pageResult,
            page: {
              ...pageResult.page,
              content: pageContent.substring(0, remainingLength) + '...'
            }
          };
          optimized.push(truncatedPage);
        }
        break;
      }
    }

    return optimized;
  }

  /**
   * 既存の内容と、追加する内容とをマージする際のプロンプトを作成する✅️
   * 
   * @private
   */
  private async createMergePrompt(
    originalContent: string,
    additionalContent: string,
  ): Promise<string> {
    return await this.mergePrompt.format({
      originalContent,
      additionalContent,
    });
  }

  /**
   * 回答生成プロンプトを作成する✅️
   * 
   * @private
   */
  private async createResponsePrompt(
    query: string,
    context: PageRelevanceResult[],
    includeSources: boolean = false
  ): Promise<string> {
    const contextText = context.map((result, index) =>
      `【${index + 1}】${result.page.title}\n${result.page.content || '内容なし'}`
    ).join('\n\n---\n\n');

    return await this.responsePrompt.format({
      query,
      context: contextText,
      includeSources: includeSources ? '参考情報番号で明示してください。' : '明示する必要はありません。'
    });
  }

  /**
   * 配列を指定サイズのチャンクに分割
   * 
   * @private
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * キャッシュキーの生成
   * 
   * @private
   */
  private generateCacheKey(operation: string, ...args: any[]): string {
    const hash = args.map(arg =>
      typeof arg === 'string' ? arg : JSON.stringify(arg)
    ).join('|');
    return `${operation}:${hash}`;
  }

  /**
   * RAGエラーの作成
   * 
   * @private
   */
  private createRAGError(
    code: string,
    message: string,
    source: RAGError['source'],
    details?: any
  ): Error {
    const error = new Error(message);
    (error as any).code = code;
    (error as any).source = source;
    (error as any).details = details;
    return error;
  }
} 