import { NextResponse } from 'next/server';

import { NotionToMarkdown } from "notion-to-md";
import { markdownToBlocks, markdownToRichText } from '@tryfabric/martian';

// GET /api/try
export async function GET(request: Request) {
    console.log(request);
    const users = [{ id: 1, name: 'John Doe' }];
    return NextResponse.json(users);
}

// POST /api/try
export async function POST(request: Request) {
    const data = await request.json();
    // ... データベースへの保存処理など
    return NextResponse.json({ message: 'User created', data }, { status: 201 });
}

/*
# Notionデータベースとの連携ToDo

## Notion形式<->md形式の変換
### 入力
- Notion形式のデータ or md形式のデータ
### 出力
- md形式のデータ or Notion形式のデータ
### メモ
- Notion->mdは、notion-to-mdを使う
- md->Notionは、martianを使う

## データベースの取得
### 入力
- データベースID
- APIキー
### 出力
- データベースの各ページの情報(オブジェクトとして取得)

## ページの取得
### 入力
- ページID
- APIキー
### 出力
- ページのデータ(タイトル、キーワードフィールド、中身)
    - ページの中身は、md形式で出力する

## ページの更新
### 入力
- ページID
- APIキー
- 更新内容
    - 更新内容は、md形式で入力する
### 出力
- 更新後のページのデータ(タイトル、キーワードフィールド、中身)

## ページの作成
### 入力
- データベースID
- APIキー
- 作成内容
    - 作成内容は、md形式で入力する
### 出力
- 作成後のページのデータ(タイトル、キーワードフィールド、中身)

*/
