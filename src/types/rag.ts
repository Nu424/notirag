import type { NotionPageData, NotionDatabaseData } from './notion';

/**
 * ページと入力内容の関連性分析結果
 */
export interface PageRelevanceResult {
  /** 関連するページデータ */
  page: NotionPageData;
  /** 関連性スコア (0-1) */
  relevanceScore: number;
  /** マッチしたキーワード */
  matchedKeywords: string[];
}

/**
 * RAG回答結果
 */
export interface RAGResponse {
  /** 生成された回答 */
  answer: string;
  /** 回答の根拠となったページ情報 */
  sources: PageRelevanceResult[];
  /** 処理メタデータ */
  metadata: {
    /** 処理時間（ミリ秒） */
    processingTime: number;
  };
}

/**
 * コンテンツマージ戦略
 */
export interface MergeStrategy {
  /** マージタイプ */
  type: 'append' | 'prepend' | 'integrate' | 'replace';
  /** セクション処理方法 */
  sectionHandling: 'preserve' | 'merge' | 'override';
  /** 重複コンテンツの処理方法 */
  duplicateHandling: 'ignore' | 'merge' | 'highlight';
}

/**
 * RAGサービス設定
 */
export interface RAGServiceConfig {
  /** 使用するLLMモデル名 */
  llmModel: string;
  /** 関連性判定の閾値 (0-1) */
  relevanceThreshold: number;
  /** 最大コンテキスト長（文字数） */
  maxContextLength: number;
  /** バッチ処理サイズ */
  batchSize: number;
  /** キャッシュ機能の有効/無効 */
  cacheEnabled: boolean;
  /** LLMの温度設定 */
  temperature: number;
  /** 最大結果数 */
  maxResults: number;
}

/**
 * 関連性分析のオプション
 */
export interface AnalysisOptions {
  /** 関連性判定の閾値（設定より優先） */
  threshold?: number;
  /** 最大結果数（設定より優先） */
  maxResults?: number;
  /** 詳細分析を行うか */
  includeReasoning?: boolean;
}

/**
 * RAG分析パラメータ
 */
export interface RAGAnalysisParams {
  /** 入力クエリ */
  input: string;
  /** 対象データベース */
  database: NotionDatabaseData;
  /** 分析オプション */
  options?: AnalysisOptions;
}

/**
 * コンテンツマージリクエスト
 */
export interface MergeContentRequest {
  /** 元のコンテンツ */
  originalContent: string;
  /** 追加するコンテンツ */
  additionalContent: string;
}

/**
 * 回答生成リクエスト
 */
export interface GenerateResponseRequest {
  /** ユーザーのクエリ */
  query: string;
  /** 関連ページ情報 */
  relevantPages: PageRelevanceResult[];
  /** 回答生成オプション */
  includeSources: boolean;
}

/**
 * エラー情報
 */
export interface RAGError {
  /** エラーコード */
  code: string;
  /** エラーメッセージ */
  message: string;
  /** 詳細情報 */
  details?: any;
  /** 発生箇所 */
  source: 'analysis' | 'merge' | 'generation' | 'llm' | 'system';
}

/**
 * バッチ処理結果
 */
export interface BatchProcessResult<T> {
  /** 成功した結果 */
  successful: T[];
  /** 失敗した項目 */
  failed: { item: any; error: RAGError }[];
  /** 処理統計 */
  stats: {
    total: number;
    successful: number;
    failed: number;
    processingTime: number;
  };
} 