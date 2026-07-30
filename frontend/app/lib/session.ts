import { cookies } from 'next/headers';

const COOKIE_NAME = 'pg_token';

export async function getServerToken() {
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value ?? null;
}

export async function setServerToken(token: string) {
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24,
  });
}

export async function clearServerToken() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

