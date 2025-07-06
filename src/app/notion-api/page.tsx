'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Alert from '@/components/ui/Alert';
import type { NotionApiResponse, NotionDatabaseData, NotionPageData, CreatePageRequest, UpdatePageRequest } from '@/types/notion';

export default function NotionApiPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // フォームの状態管理
  const [databaseId, setDatabaseId] = useState('');
  const [pageId, setPageId] = useState('');
  const [createForm, setCreateForm] = useState<CreatePageRequest>({
    databaseId: '',
    title: '',
    keywords: [],
    content: ''
  });
  const [updateForm, setUpdateForm] = useState<UpdatePageRequest>({
    title: '',
    keywords: [],
    content: ''
  });

  // レスポンス表示用のヘルパー関数
  const displayResult = (data: any) => {
    setResult(JSON.stringify(data, null, 2));
    if (data.success) {
      setMessage({ type: 'success', text: 'API実行が成功しました' });
    } else {
      setMessage({ type: 'error', text: data.error || 'API実行に失敗しました' });
    }
  };

  // 1. データベース取得
  const testGetDatabase = async () => {
    if (!databaseId.trim()) {
      setMessage({ type: 'error', text: 'Database IDを入力してください' });
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/notion/database/${databaseId}`);
      const data: NotionApiResponse<NotionDatabaseData> = await response.json();
      displayResult(data);
    } catch (error) {
      displayResult({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  // 2. ページ取得
  const testGetPage = async () => {
    if (!pageId.trim()) {
      setMessage({ type: 'error', text: 'Page IDを入力してください' });
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/notion/page/${pageId}`);
      const data: NotionApiResponse<NotionPageData> = await response.json();
      displayResult(data);
    } catch (error) {
      displayResult({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  // 3. ページ作成
  const testCreatePage = async () => {
    if (!createForm.databaseId.trim() || !createForm.title.trim() || !createForm.content.trim()) {
      setMessage({ type: 'error', text: 'Database ID、Title、Contentは必須です' });
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch('/api/notion/page', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...createForm,
          keywords: createForm.keywords?.filter(k => k.trim()) || []
        }),
      });
      const data: NotionApiResponse<NotionPageData> = await response.json();
      displayResult(data);
    } catch (error) {
      displayResult({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  // 4. ページ更新
  const testUpdatePage = async () => {
    if (!pageId.trim()) {
      setMessage({ type: 'error', text: 'Page IDを入力してください' });
      return;
    }

    if (!updateForm.title && !updateForm.content && (!updateForm.keywords || updateForm.keywords.length === 0)) {
      setMessage({ type: 'error', text: '更新する内容を少なくとも1つ入力してください' });
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const requestData: UpdatePageRequest = {};
      if (updateForm.title?.trim()) requestData.title = updateForm.title;
      if (updateForm.content?.trim()) requestData.content = updateForm.content;
      if (updateForm.keywords?.length) requestData.keywords = updateForm.keywords.filter(k => k.trim());

      const response = await fetch(`/api/notion/page/${pageId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });
      const data: NotionApiResponse<NotionPageData> = await response.json();
      displayResult(data);
    } catch (error) {
      displayResult({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  // キーワード配列の管理
  const updateKeywords = (value: string, isCreate: boolean) => {
    const keywords = value.split(',').map(k => k.trim()).filter(k => k);
    if (isCreate) {
      setCreateForm(prev => ({ ...prev, keywords }));
    } else {
      setUpdateForm(prev => ({ ...prev, keywords }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Notion API テスト
          </h1>
          <p className="text-lg text-gray-600">
            Notion APIの各機能をテストできます。データベースやページの作成・読み取り・更新を直感的に操作できます。
          </p>
        </div>

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
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 左側: APIテストフォーム */}
          <div className="space-y-6">
            
            {/* 1. データベース取得 */}
            <Card>
              <h2 className="text-xl font-semibold mb-4 text-blue-700">1. データベース取得</h2>
              <p className="text-sm text-gray-600 mb-4">GET /api/notion/database/[databaseId]</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Database ID
                  </label>
                  <input
                    type="text"
                    placeholder="Database ID"
                    value={databaseId}
                    onChange={(e) => setDatabaseId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                  />
                </div>
                <Button
                  onClick={testGetDatabase}
                  loading={loading}
                  disabled={loading}
                  className="w-full"
                >
                  データベース取得
                </Button>
              </div>
            </Card>

            {/* 2. ページ取得 */}
            <Card>
              <h2 className="text-xl font-semibold mb-4 text-green-700">2. ページ取得</h2>
              <p className="text-sm text-gray-600 mb-4">GET /api/notion/page/[pageId]</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Page ID
                  </label>
                  <input
                    type="text"
                    placeholder="Page ID"
                    value={pageId}
                    onChange={(e) => setPageId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 bg-white"
                  />
                </div>
                <Button
                  onClick={testGetPage}
                  loading={loading}
                  disabled={loading}
                  variant="secondary"
                  className="w-full"
                >
                  ページ取得
                </Button>
              </div>
            </Card>

            {/* 3. ページ作成 */}
            <Card>
              <h2 className="text-xl font-semibold mb-4 text-purple-700">3. ページ作成</h2>
              <p className="text-sm text-gray-600 mb-4">POST /api/notion/page</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Database ID (必須)
                  </label>
                  <input
                    type="text"
                    placeholder="Database ID"
                    value={createForm.databaseId}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, databaseId: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title (必須)
                  </label>
                  <input
                    type="text"
                    placeholder="Title"
                    value={createForm.title}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Keywords (カンマ区切り、任意)
                  </label>
                  <input
                    type="text"
                    placeholder="keyword1, keyword2, keyword3"
                    value={createForm.keywords?.join(', ') || ''}
                    onChange={(e) => updateKeywords(e.target.value, true)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content - Markdown形式 (必須)
                  </label>
                  <textarea
                    placeholder="# 見出し&#10;&#10;内容をMarkdown形式で記述してください"
                    value={createForm.content}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, content: e.target.value }))}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 bg-white"
                  />
                </div>
                <Button
                  onClick={testCreatePage}
                  loading={loading}
                  disabled={loading}
                  className="w-full bg-purple-600 hover:bg-purple-700 focus:ring-purple-500"
                >
                  ページ作成
                </Button>
              </div>
            </Card>

            {/* 4. ページ更新 */}
            <Card>
              <h2 className="text-xl font-semibold mb-4 text-orange-700">4. ページ更新</h2>
              <p className="text-sm text-gray-600 mb-4">PUT /api/notion/page/[pageId]</p>
              <div className="space-y-4">
                <p className="text-sm text-gray-500">※上記「ページ取得」で入力したPage IDを使用します</p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title (更新する場合)
                  </label>
                  <input
                    type="text"
                    placeholder="新しいタイトル"
                    value={updateForm.title || ''}
                    onChange={(e) => setUpdateForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Keywords (カンマ区切り、更新する場合)
                  </label>
                  <input
                    type="text"
                    placeholder="keyword1, keyword2, keyword3"
                    value={updateForm.keywords?.join(', ') || ''}
                    onChange={(e) => updateKeywords(e.target.value, false)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content - Markdown形式 (更新する場合)
                  </label>
                  <textarea
                    placeholder="更新する内容をMarkdown形式で記述"
                    value={updateForm.content || ''}
                    onChange={(e) => setUpdateForm(prev => ({ ...prev, content: e.target.value }))}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 bg-white"
                  />
                </div>
                <Button
                  onClick={testUpdatePage}
                  loading={loading}
                  disabled={loading}
                  className="w-full bg-orange-600 hover:bg-orange-700 focus:ring-orange-500"
                >
                  ページ更新
                </Button>
              </div>
            </Card>
          </div>

          {/* 右側: 結果表示 */}
          <div className="lg:sticky lg:top-8 lg:self-start">
            <Card className="h-fit">
              <h2 className="text-xl font-semibold mb-4 text-gray-700">API実行結果</h2>
              <div className="bg-gray-100 p-4 rounded-md min-h-96 max-h-96 overflow-auto">
                <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
                  {result || 'APIを実行すると結果がここに表示されます'}
                </pre>
              </div>
              <div className="mt-4 flex justify-between items-center">
                <Button
                  onClick={() => setResult('')}
                  variant="outline"
                  size="sm"
                >
                  結果をクリア
                </Button>
                {result && (
                  <Button
                    onClick={() => navigator.clipboard.writeText(result)}
                    variant="ghost"
                    size="sm"
                  >
                    コピー
                  </Button>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* 使用方法の説明 */}
        <Card variant="bordered" className="mt-8 bg-yellow-50">
          <h3 className="text-lg font-semibold text-yellow-800 mb-3">使用方法</h3>
          <div className="text-sm text-yellow-700 space-y-2">
            <p><strong>1. データベース取得:</strong> NotionのDatabase IDを入力してデータベース内の全ページを取得します</p>
            <p><strong>2. ページ取得:</strong> NotionのPage IDを入力してページの詳細（Markdown形式）を取得します</p>
            <p><strong>3. ページ作成:</strong> 指定したデータベースに新しいページを作成します（Database ID、Title、Contentは必須）</p>
            <p><strong>4. ページ更新:</strong> 既存のページを更新します（少なくとも1つのフィールドの入力が必要）</p>
            <p className="mt-3 font-medium">※ 事前にNOTION_API_KEYが環境変数として設定されている必要があります</p>
          </div>
        </Card>
      </div>
    </div>
  );
} 