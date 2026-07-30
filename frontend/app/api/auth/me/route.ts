import { NextResponse } from 'next/server';
import { getServerToken } from '../../../lib/session';

const API_URL = 'http://localhost:3001';

export async function GET() {
  const token = await getServerToken();
  if (!token) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  const res = await fetch(API_URL + '/auth/me', {
    headers: { Authorization: 'Bearer ' + token },
  });

  if (!res.ok) {
    return NextResponse.json({ message: 'Session invalid' }, { status: 401 });
  }

  const data = await res.json();
  return NextResponse.json(data);
}
