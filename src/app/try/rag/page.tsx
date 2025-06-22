'use client';

import { useState, useEffect } from 'react';
import type { RAGResponse, RAGServiceConfig } from '@/types/rag';

interface RAGPageConfig {
  databaseId: string;
  ragConfig: Partial<RAGServiceConfig>;
}

export default function RAGPage() {
  // 設定状態
  const [config, setConfig] = useState<RAGPageConfig>({
    databaseId: '',
    ragConfig: {
      llmModel: 'gpt-4o-mini',
      relevanceThreshold: 0.3,
      maxContextLength: 4000,
      maxResults: 5,
      temperature: 0.1,
    }
  });

  // UI状態
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<RAGResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(true);

  // localStorage から設定を読み込み
  useEffect(() => {
    const savedConfig = localStorage.getItem('rag-config');
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        setConfig(prev => ({ ...prev, ...parsed }));
        setShowConfig(false);
      } catch (error) {
        console.error('Failed to parse saved config:', error);
      }
    }
  }, []);

  // 設定を保存
  const saveConfig = () => {
    localStorage.setItem('rag-config', JSON.stringify(config));
    setShowConfig(false);
  };

  // RAG実行
  const executeRAG = async () => {
    if (!query.trim()) {
      setError('クエリを入力してください');
      return;
    }

    if (!config.databaseId) {
      setError('データベースIDを設定してください');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResponse(null);

    try {
      const result = await fetch('/api/rag', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          databaseId: config.databaseId,
          ragConfig: config.ragConfig,
        }),
      });

      const data = await result.json();

      if (!result.ok) {
        throw new Error(data.error || 'RAG処理に失敗しました');
      }

      setResponse(data);
    } catch (error) {
      console.error('RAG execution error:', error);
      setError(error instanceof Error ? error.message : 'エラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Notion RAG テストページ
          </h1>
          <p className="text-gray-600">
            NotionデータベースをRAGのデータソースとして使用し、質問に対する回答を生成します
          </p>
        </div>

        {/* 設定セクション */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">設定</h2>
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              {showConfig ? '非表示' : '表示'}
            </button>
          </div>

          {showConfig && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  データベースID
                </label>
                <input
                  type="text"
                  value={config.databaseId}
                  onChange={(e) => setConfig(prev => ({ ...prev, databaseId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  placeholder="550e8400-e29b-41d4-a716-446655440000"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    関連性閾値
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={config.ragConfig.relevanceThreshold}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      ragConfig: { ...prev.ragConfig, relevanceThreshold: parseFloat(e.target.value) }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    最大結果数
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={config.ragConfig.maxResults}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      ragConfig: { ...prev.ragConfig, maxResults: parseInt(e.target.value) }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  />
                </div>
              </div>

              <button
                onClick={saveConfig}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                設定を保存
              </button>
            </div>
          )}
        </div>

        {/* クエリ入力セクション */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">質問入力</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                質問・クエリ
              </label>
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                rows={3}
                placeholder="例: 新製品のアイデアについて教えて"
              />
            </div>

            <button
              onClick={executeRAG}
              disabled={isLoading}
              className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '処理中...' : 'RAG実行'}
            </button>
          </div>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="text-red-800">
                <strong>エラー:</strong> {error}
              </div>
            </div>
          </div>
        )}

        {/* 結果表示 */}
        {response && (
          <div className="space-y-6">
            {/* 回答 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">回答</h2>
              <div className="prose max-w-none">
                <div className="text-gray-800 whitespace-pre-wrap">
                  {response.answer}
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-500">
                処理時間: {response.metadata.processingTime}ms
              </div>
            </div>

            {/* 参考情報 */}
            {response.sources && response.sources.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  参考情報 ({response.sources.length}件)
                </h2>
                <div className="space-y-4">
                  {response.sources.map((source, index) => (
                    <div key={source.page.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-gray-900">
                          【{index + 1}】{source.page.title}
                        </h3>
                        <span className="text-sm text-gray-500">
                          関連度: {(source.relevanceScore * 100).toFixed(1)}%
                        </span>
                      </div>

                      {source.matchedKeywords.length > 0 && (
                        <div className="mb-2">
                          <span className="text-sm text-gray-600">マッチしたキーワード: </span>
                          {source.matchedKeywords.map((keyword, idx) => (
                            <span key={idx} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mr-1">
                              {keyword}
                            </span>
                          ))}
                        </div>
                      )}

                      {source.page.content && (
                        <div className="text-sm text-gray-600 mt-2">
                          <div className="max-h-32 overflow-y-auto">
                            {source.page.content.substring(0, 200)}
                            {source.page.content.length > 200 && '...'}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 使用方法 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
          <h2 className="text-lg font-semibold text-blue-900 mb-3">使用方法</h2>
          <ol className="list-decimal list-inside space-y-2 text-blue-800">
            <li>対象のNotionデータベースIDを入力します</li>
            <li>設定を保存します（localStorage に保存されます）</li>
            <li>質問やクエリを入力します</li>
            <li>「RAG実行」ボタンをクリックして結果を確認します</li>
          </ol>
          <div className="mt-4 text-sm text-blue-700">
            <strong>注意:</strong> 設定はブラウザのローカルストレージに保存されます。
            セキュリティを考慮し、テスト終了後は設定をクリアすることをお勧めします。
          </div>
        </div>
      </div>
    </div>
  );
}
