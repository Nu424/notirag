'use client';

import { useState, useCallback, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Alert from '@/components/ui/Alert';
import type { NotionDatabaseData } from '@/types/notion';

interface AppendResponse {
  success: boolean;
  pageId: string;
  title: string;
  message: string;
}

export default function AppendPage() {
  // State management
  const [databaseId, setDatabaseId] = useState('');
  const [database, setDatabase] = useState<NotionDatabaseData | null>(null);
  const [selectedPageId, setSelectedPageId] = useState<string>('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // localStorage からデータベースIDを読み込み
  useEffect(() => {
    const savedDatabaseId = localStorage.getItem('append-database-id');
    if (savedDatabaseId) {
      setDatabaseId(savedDatabaseId);
    }
  }, []);

  // データベースを読み込む
  const loadDatabase = useCallback(async () => {
    if (!databaseId.trim()) {
      setMessage({ type: 'error', text: 'データベースIDを入力してください。' });
      return;
    }

    setLoading(true);
    setMessage(null);
    
    try {
      const response = await fetch(`/api/notion/database/${databaseId}`);
      const result = await response.json();

      if (result.success) {
        setDatabase(result.data);
        setSelectedPageId(''); // リセット
        
        // データベースIDをlocalStorageに保存
        localStorage.setItem('append-database-id', databaseId);
        
        setMessage({ type: 'success', text: `データベース "${result.data.title}" を読み込みました。${result.data.pages.length}個のページが見つかりました。` });
      } else {
        setMessage({ type: 'error', text: `データベースの読み込みに失敗しました: ${result.error}` });
        setDatabase(null);
      }
    } catch (error) {
      console.error('Database load error:', error);
      setMessage({ type: 'error', text: 'データベースの読み込み中にエラーが発生しました。' });
      setDatabase(null);
    } finally {
      setLoading(false);
    }
  }, [databaseId]);

  // 情報を追加する
  const appendContent = useCallback(async () => {
    if (!database) {
      setMessage({ type: 'error', text: 'まずデータベースを読み込んでください。' });
      return;
    }

    if (!content.trim()) {
      setMessage({ type: 'error', text: '追加する内容を入力してください。' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const requestBody = {
        databaseId: database.id,
        content: content.trim(),
        ...(selectedPageId && { targetPageId: selectedPageId })
      };

      const response = await fetch('/api/append', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (result.success) {
        const data: AppendResponse = result.data;
        setMessage({ 
          type: 'success', 
          text: `${data.message} (ページ: "${data.title}")` 
        });
        setContent(''); // フォームをリセット
      } else {
        setMessage({ type: 'error', text: `情報の追加に失敗しました: ${result.error}` });
      }
    } catch (error) {
      console.error('Append error:', error);
      setMessage({ type: 'error', text: '情報の追加中にエラーが発生しました。' });
    } finally {
      setLoading(false);
    }
  }, [database, content, selectedPageId]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            情報追加
          </h1>
          <p className="text-lg text-gray-600">
            Notionデータベースに情報を適切に追加します。追加先ページを指定するか、AIが関連性を分析して最適なページを自動選択します。
          </p>
        </div>
        
        {/* データベース読み込みセクション */}
        <Card className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            1. データベースの読み込み
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                データベースID
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={databaseId}
                  onChange={(e) => setDatabaseId(e.target.value)}
                  placeholder="550e8400-e29b-41d4-a716-446655440000"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                  disabled={loading}
                />
                <Button
                  onClick={loadDatabase}
                  loading={loading}
                  disabled={loading}
                >
                  読み込み
                </Button>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                データベースIDはブラウザのローカルストレージに自動保存されます
              </p>
            </div>

            {database && (
              <div className="border border-gray-200 rounded-lg p-4 bg-green-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      {database.title}
                    </p>
                    <p className="text-sm text-gray-600">
                      {database.pages.length}個のページが見つかりました
                    </p>
                  </div>
                  <div className="text-green-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* 情報追加セクション */}
        {database && (
          <Card className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              2. 情報の追加
            </h2>

            <div className="space-y-6">
              {/* 追加先ページ選択 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  追加先ページ（オプション）
                </label>
                <select
                  value={selectedPageId}
                  onChange={(e) => setSelectedPageId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                  disabled={loading}
                >
                  <option value="">自動選択（関連性分析により最適なページを選択）</option>
                  {database.pages.map((page) => (
                    <option key={page.id} value={page.id}>
                      {page.title}
                    </option>
                  ))}
                </select>
                <p className="text-sm text-gray-500 mt-2">
                  ページを選択しない場合、AIが内容を分析して最も関連性の高いページに自動で追加します
                </p>
              </div>

              {/* コンテンツ入力 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  追加する内容
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="追加したい情報を入力してください（Markdown形式対応）"
                  rows={8}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white resize-vertical"
                  disabled={loading}
                />
                <p className="text-sm text-gray-500 mt-2">
                  Markdown形式での記述が可能です
                </p>
              </div>

              {/* 実行ボタン */}
              <Button
                onClick={appendContent}
                loading={loading}
                disabled={loading || !content.trim()}
                variant="secondary"
                size="lg"
                className="w-full"
              >
                情報を追加
              </Button>
            </div>
          </Card>
        )}

        {/* メッセージ表示 */}
        {message && (
          <Alert
            variant={message.type === 'success' ? 'success' : 'error'}
            title={message.type === 'success' ? '成功' : 'エラー'}
            onClose={() => setMessage(null)}
            className="mb-6"
          >
            {message.text}
          </Alert>
        )}

        {/* 使用方法の説明 */}
        <Card variant="bordered" className="bg-blue-50">
          <h2 className="text-lg font-semibold text-blue-900 mb-3">
            使用方法
          </h2>
          <ol className="list-decimal list-inside space-y-2 text-blue-800">
            <li><strong>データベース読み込み:</strong> NotionデータベースのIDを入力して「読み込み」ボタンをクリックします。</li>
            <li><strong>追加先選択:</strong> 特定のページに追加したい場合はドロップダウンから選択してください。選択しない場合、AIが最適なページを自動選択します。</li>
            <li><strong>内容入力:</strong> 追加したい情報を入力します。Markdown形式での記述が可能です。</li>
            <li><strong>実行:</strong> 「情報を追加」ボタンをクリックして処理を実行します。</li>
          </ol>
          <div className="mt-4 text-sm text-blue-700">
            <strong>注意:</strong> 追加先が未指定の場合、AIが関連性分析を行い最適なページを自動選択します。
            関連するページが見つからない場合は、新しいページが作成されます。
          </div>
        </Card>
      </div>
    </div>
  );
} 