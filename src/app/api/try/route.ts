import { NextResponse } from 'next/server';

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
