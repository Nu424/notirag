'use client';

import { useState } from 'react';
import type { NotionApiResponse, NotionDatabaseData, NotionPageData, CreatePageRequest, UpdatePageRequest } from '@/types/notion';

export default function NotionApiTestPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');

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
  };

  // 1. データベース取得 (GET /api/notion/database/[databaseId])
  const testGetDatabase = async () => {
    if (!databaseId.trim()) {
      alert('Database IDを入力してください');
      return;
    }

    setLoading(true);
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

  // 2. ページ取得 (GET /api/notion/page/[pageId])
  const testGetPage = async () => {
    if (!pageId.trim()) {
      alert('Page IDを入力してください');
      return;
    }

    setLoading(true);
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

  // 3. ページ作成 (POST /api/notion/page)
  const testCreatePage = async () => {
    if (!createForm.databaseId.trim() || !createForm.title.trim() || !createForm.content.trim()) {
      alert('Database ID、Title、Contentは必須です');
      return;
    }

    setLoading(true);
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

  // 4. ページ更新 (PUT /api/notion/page/[pageId])
  const testUpdatePage = async () => {
    if (!pageId.trim()) {
      alert('Page IDを入力してください');
      return;
    }

    if (!updateForm.title && !updateForm.content && (!updateForm.keywords || updateForm.keywords.length === 0)) {
      alert('更新する内容を少なくとも1つ入力してください');
      return;
    }

    setLoading(true);
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
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Notion API テストページ</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 左側: APIテストフォーム */}
          <div className="space-y-8">
            
            {/* 1. データベース取得 */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h2 className="text-xl font-semibold mb-4 text-blue-700">1. データベース取得</h2>
              <p className="text-sm text-gray-600 mb-4">GET /api/notion/database/[databaseId]</p>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Database ID"
                  value={databaseId}
                  onChange={(e) => setDatabaseId(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-500 text-gray-700"
                />
                <button
                  onClick={testGetDatabase}
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {loading ? '実行中...' : 'データベース取得'}
                </button>
              </div>
            </div>

            {/* 2. ページ取得 */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h2 className="text-xl font-semibold mb-4 text-green-700">2. ページ取得</h2>
              <p className="text-sm text-gray-600 mb-4">GET /api/notion/page/[pageId]</p>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Page ID"
                  value={pageId}
                  onChange={(e) => setPageId(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder:text-gray-500 text-gray-700"
                />
                <button
                  onClick={testGetPage}
                  disabled={loading}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400"
                >
                  {loading ? '実行中...' : 'ページ取得'}
                </button>
              </div>
            </div>

            {/* 3. ページ作成 */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h2 className="text-xl font-semibold mb-4 text-purple-700">3. ページ作成</h2>
              <p className="text-sm text-gray-600 mb-4">POST /api/notion/page</p>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Database ID (必須)"
                  value={createForm.databaseId}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, databaseId: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder:text-gray-500 text-gray-700"
                />
                <input
                  type="text"
                  placeholder="Title (必須)"
                  value={createForm.title}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder:text-gray-500 text-gray-700"
                />
                <input
                  type="text"
                  placeholder="Keywords (カンマ区切り、任意)"
                  value={createForm.keywords?.join(', ') || ''}
                  onChange={(e) => updateKeywords(e.target.value, true)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder:text-gray-500 text-gray-700"
                />
                <textarea
                  placeholder="Content - Markdown形式 (必須)"
                  value={createForm.content}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, content: e.target.value }))}
                  rows={4}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder:text-gray-500 text-gray-700"
                />
                <button
                  onClick={testCreatePage}
                  disabled={loading}
                  className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:bg-gray-400"
                >
                  {loading ? '実行中...' : 'ページ作成'}
                </button>
              </div>
            </div>

            {/* 4. ページ更新 */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h2 className="text-xl font-semibold mb-4 text-orange-700">4. ページ更新</h2>
              <p className="text-sm text-gray-600 mb-4">PUT /api/notion/page/[pageId]</p>
              <div className="space-y-3">
                <p className="text-sm text-gray-500">※上記「ページ取得」で入力したPage IDを使用します</p>
                <input
                  type="text"
                  placeholder="Title (更新する場合)"
                  value={updateForm.title || ''}
                  onChange={(e) => setUpdateForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent placeholder:text-gray-500 text-gray-700"
                />
                <input
                  type="text"
                  placeholder="Keywords (カンマ区切り、更新する場合)"
                  value={updateForm.keywords?.join(', ') || ''}
                  onChange={(e) => updateKeywords(e.target.value, false)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent placeholder:text-gray-500 text-gray-700"
                />
                <textarea
                  placeholder="Content - Markdown形式 (更新する場合)"
                  value={updateForm.content || ''}
                  onChange={(e) => setUpdateForm(prev => ({ ...prev, content: e.target.value }))}
                  rows={4}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent placeholder:text-gray-500 text-gray-700"
                />
                <button
                  onClick={testUpdatePage}
                  disabled={loading}
                  className="w-full bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 disabled:bg-gray-400"
                >
                  {loading ? '実行中...' : 'ページ更新'}
                </button>
              </div>
            </div>
          </div>

          {/* 右側: 結果表示 */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">API実行結果</h2>
            <div className="bg-gray-100 p-4 rounded-md min-h-96 max-h-96 overflow-auto">
              <pre className="text-sm text-gray-800 whitespace-pre-wrap">
                {result || 'APIを実行すると結果がここに表示されます'}
              </pre>
            </div>
            <button
              onClick={() => setResult('')}
              className="mt-3 text-sm text-gray-500 hover:text-gray-700"
            >
              結果をクリア
            </button>
          </div>
        </div>

        {/* 使用方法の説明 */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-800 mb-3">使用方法</h3>
          <div className="text-sm text-yellow-700 space-y-2">
            <p><strong>1. データベース取得:</strong> NotionのDatabase IDを入力してデータベース内の全ページを取得します</p>
            <p><strong>2. ページ取得:</strong> NotionのPage IDを入力してページの詳細（Markdown形式）を取得します</p>
            <p><strong>3. ページ作成:</strong> 指定したデータベースに新しいページを作成します（Database ID、Title、Contentは必須）</p>
            <p><strong>4. ページ更新:</strong> 既存のページを更新します（少なくとも1つのフィールドの入力が必要）</p>
            <p className="mt-3 font-medium">※ 事前にNOTION_API_KEYが環境変数として設定されている必要があります</p>
          </div>
        </div>
      </div>
    </div>
  );
} 