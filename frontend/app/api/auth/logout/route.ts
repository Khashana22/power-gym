import { NextResponse } from 'next/server';
import { clearServerToken } from '../../../lib/session';

export async function POST() {
  await clearServerToken();
  return NextResponse.json({ success: true });
}

