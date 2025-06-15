export interface NotionPageData {
  id: string;
  title: string;
  keywords: string[];
  content?: string; // Markdown形式（Databaseクエリからの場合はundefined）
  createdTime: string;
  lastEditedTime: string;
}

export interface NotionDatabaseData {
  id: string;
  title: string;
  pages: NotionPageData[];
}

export interface CreatePageRequest {
  databaseId: string;
  title: string;
  keywords?: string[];
  content: string; // Markdown形式
}

export interface UpdatePageRequest {
  title?: string;
  keywords?: string[];
  content?: string; // Markdown形式
}

export interface NotionApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
} 