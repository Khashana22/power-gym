import { NextRequest, NextResponse } from 'next/server';
import { setServerToken } from '../../../lib/session';

const API_URL = 'http://localhost:3001';

export async function POST(req: NextRequest) {
  const body = await req.json();

  const res = await fetch(API_URL + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json(data, { status: res.status });
  }

  await setServerToken(data.accessToken);

  return NextResponse.json({ user: data.user });
}

