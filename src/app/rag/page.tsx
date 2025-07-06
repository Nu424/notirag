'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Alert from '@/components/ui/Alert';
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            RAG検索
          </h1>
          <p className="text-lg text-gray-600">
            NotionデータベースをRAGのデータソースとして使用し、自然言語での質問に対する回答を生成します。
          </p>
        </div>

        {/* 設定セクション */}
        <Card className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">設定</h2>
            <Button
              onClick={() => setShowConfig(!showConfig)}
              variant="ghost"
              size="sm"
            >
              {showConfig ? '非表示' : '表示'}
            </Button>
          </div>

          {showConfig && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  データベースID
                </label>
                <input
                  type="text"
                  value={config.databaseId}
                  onChange={(e) => setConfig(prev => ({ ...prev, databaseId: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                  placeholder="550e8400-e29b-41d4-a716-446655440000"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                  />
                </div>
              </div>

              <Button
                onClick={saveConfig}
                variant="outline"
              >
                設定を保存
              </Button>
            </div>
          )}
        </Card>

        {/* クエリ入力セクション */}
        <Card className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">質問入力</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                質問・クエリ
              </label>
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                rows={3}
                placeholder="例: 新製品のアイデアについて教えて"
              />
            </div>

            <Button
              onClick={executeRAG}
              loading={isLoading}
              disabled={isLoading}
              variant="secondary"
              size="lg"
              className="w-full"
            >
              RAG実行
            </Button>
          </div>
        </Card>

        {/* エラー表示 */}
        {error && (
          <Alert
            variant="error"
            title="エラー"
            onClose={() => setError(null)}
            className="mb-6"
          >
            {error}
          </Alert>
        )}

        {/* 結果表示 */}
        {response && (
          <div className="space-y-6">
            {/* 回答 */}
            <Card variant="elevated">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">回答</h2>
              <div className="prose max-w-none">
                <div className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                  {response.answer}
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>処理時間: {response.metadata.processingTime}ms</span>
                  <Button
                    onClick={() => navigator.clipboard.writeText(response.answer)}
                    variant="ghost"
                    size="sm"
                  >
                    回答をコピー
                  </Button>
                </div>
              </div>
            </Card>

            {/* 参考情報 */}
            {response.sources && response.sources.length > 0 && (
              <Card variant="elevated">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  参考情報 ({response.sources.length}件)
                </h2>
                <div className="space-y-4">
                  {response.sources.map((source, index) => (
                    <div key={source.page.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-gray-900">
                          【{index + 1}】{source.page.title}
                        </h3>
                        <span className="text-sm text-gray-500 bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          関連度: {(source.relevanceScore * 100).toFixed(1)}%
                        </span>
                      </div>

                      {source.matchedKeywords.length > 0 && (
                        <div className="mb-3">
                          <span className="text-sm text-gray-600 mr-2">マッチしたキーワード:</span>
                          <div className="flex flex-wrap gap-1">
                            {source.matchedKeywords.map((keyword, idx) => (
                              <span key={idx} className="inline-block bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded-full">
                                {keyword}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {source.page.content && (
                        <div className="text-sm text-gray-600 mt-2">
                          <div className="max-h-32 overflow-y-auto bg-gray-50 p-3 rounded border">
                            {source.page.content.substring(0, 200)}
                            {source.page.content.length > 200 && '...'}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* 使用方法 */}
        <Card variant="bordered" className="mt-8 bg-blue-50">
          <h2 className="text-lg font-semibold text-blue-900 mb-3">使用方法</h2>
          <ol className="list-decimal list-inside space-y-2 text-blue-800">
            <li>対象のNotionデータベースIDを入力します</li>
            <li>必要に応じて設定を調整し、保存します（localStorage に保存されます）</li>
            <li>質問やクエリを入力します</li>
            <li>「RAG実行」ボタンをクリックして結果を確認します</li>
          </ol>
          <div className="mt-4 text-sm text-blue-700">
            <strong>注意:</strong> 設定はブラウザのローカルストレージに保存されます。
            関連性閾値を下げると、より幅広い情報を取得できますが、精度が下がる可能性があります。
          </div>
        </Card>
      </div>
    </div>
  );
} 