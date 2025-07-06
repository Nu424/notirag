import Link from 'next/link';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-violet-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              <span className="brand-gradient">
                Notirag
              </span>
              <br />
              <span className="text-3xl md:text-4xl">
                Notion × RAG プラットフォーム
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              散らばった情報をNotionデータベースに統合し、AIが効率的に検索・活用。
              <br />
              すべての情報が一箇所に集まり、必要な時に瞬時にアクセスできます。
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/append">
                <Button size="lg" className="w-full sm:w-auto">
                  今すぐ始める
                </Button>
              </Link>
              <Link href="/rag">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  RAG検索を試す
                </Button>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute top-0 right-1/3 w-96 h-96 bg-violet-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              主要機能
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Notiragは3つの核となる機能で、あなたの情報管理を革新します
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1: Append */}
            <Card variant="elevated" className="text-center hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                情報追加
              </h3>
              <p className="text-gray-600 mb-6">
                AIが関連性を分析し、適切なページに自動で情報を追加。
                手動でページを指定することも可能です。
              </p>
              <Link href="/append">
                <Button variant="secondary" className="w-full">
                  情報を追加する
                </Button>
              </Link>
            </Card>

            {/* Feature 2: Notion API */}
            <Card variant="elevated" className="text-center hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Notion API
              </h3>
              <p className="text-gray-600 mb-6">
                Notionデータベースとページの作成・読み取り・更新を
                直感的なインターフェースで操作できます。
              </p>
              <Link href="/notion-api">
                <Button variant="primary" className="w-full">
                  APIを試す
                </Button>
              </Link>
            </Card>

            {/* Feature 3: RAG */}
            <Card variant="elevated" className="text-center hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                RAG検索
              </h3>
              <p className="text-gray-600 mb-6">
                自然言語での質問に対し、Notionデータベースから
                関連情報を抽出して的確な回答を生成します。
              </p>
              <Link href="/rag">
                <Button variant="outline" className="w-full">
                  検索を試す
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              仕組み
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              シンプルな3ステップで、あなたの情報管理が劇的に改善されます
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                1
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                情報を統合
              </h3>
              <p className="text-gray-600">
                散らばった情報をNotionデータベースに集約し、
                AIが適切にキーワードと概要を生成
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                2
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                関連性分析
              </h3>
              <p className="text-gray-600">
                質問やクエリに対し、キーワードベースで
                関連性の高い情報を効率的に抽出
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-violet-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                3
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                回答生成
              </h3>
              <p className="text-gray-600">
                抽出した情報を基に、AIが文脈を理解した
                正確で有用な回答を自動生成
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-blue-600 to-violet-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            今すぐNotiragを始めましょう
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            あなたの情報管理を次のレベルへ。
            NotionとAIの力で、必要な情報に瞬時にアクセス。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/append">
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full sm:w-auto bg-white text-blue-600 hover:bg-gray-50 border-white"
              >
                情報追加から始める
              </Button>
            </Link>
            <Link href="/rag">
              <Button 
                variant="ghost" 
                size="lg" 
                className="w-full sm:w-auto text-white hover:bg-white/10"
              >
                RAG検索を体験
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
