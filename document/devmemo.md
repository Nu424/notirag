# devmemo

開発中のメモを記録するmdファイル。

---
## NextjsのバックエンドAPIの実装について
- (前提: App Router時代)
- 以下の方法があるらしい
  - Route Handler
  - Server Action
  - tRPC
- Q. API Routesってなに？
  - A. Pages Router時代のもの。無視でOK。
  - App Router時代は、Route Handlerを使えば良い
  
## NotionAPIについて
- データベースの取得
  - `this.notion.databases.retrieve({ database_id: databaseId })`
  - タイトル、説明、プロパティ一覧あたりが取得できる
  - 逆に、どんなページがあるのかは、この時点ではわからない
- データベース内ページの取得

## サンプルデータ生成用プロンプト
```
以下のメモから、Notionに記録するページを作成してください。タイトルをつけるようにしてください。
----
```
```
以下の内容をもとに、キーワードを抽出してください。このテキストの目的を理解し、可能な限り詳細かつ網羅的に抽出してください。あとから探しやすいように、質の高いキーワードを数を絞って作成することを心がけてください。出力はカンマ区切りの文字列としてください。
----
```