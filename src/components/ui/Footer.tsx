import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 brand-gradient-bg rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">N</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Notirag</span>
            </div>
            <p className="text-gray-600 text-sm max-w-md">
              NotionデータベースをRAGのデータソースとして活用し、
              散らばった情報を統合して効率的に検索・活用できるプラットフォームです。
            </p>
          </div>

          {/* Navigation Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">機能</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/append" className="text-sm text-gray-600 hover:text-gray-900">
                  情報追加
                </Link>
              </li>
              <li>
                <Link href="/rag" className="text-sm text-gray-600 hover:text-gray-900">
                  RAG検索
                </Link>
              </li>
              <li>
                <Link href="/notion-api" className="text-sm text-gray-600 hover:text-gray-900">
                  Notion API
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">リソース</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://github.com/Nu424/notirag"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  GitHub
                </a>
              </li>
              <li>
                <a
                  href="https://www.notion.so"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Notion
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-500">
              © 2025 Nu424
            </p>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <span className="text-sm text-gray-500">
                Made with Next.js & Notion API
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
} 