import { NextRequest, NextResponse } from 'next/server';
import { getServerToken } from '../../../lib/session';

const API_URL = 'http://localhost:3001';

async function handler(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const token = await getServerToken();
  const params = await context.params;
  const path = params.path.join('/');
  const url = API_URL + '/' + path + req.nextUrl.search;

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = 'Bearer ' + token;

  const init: RequestInit = { method: req.method, headers };

  if (req.method !== 'GET' && req.method !== 'DELETE') {
    const body = await req.text();
    if (body) init.body = body;
  }

  const res = await fetch(url, init);
  const data = await res.json().catch(() => ({}));

  return NextResponse.json(data, { status: res.status });
}

export {
  handler as GET,
  handler as POST,
  handler as PATCH,
  handler as DELETE,
  handler as PUT,
};
