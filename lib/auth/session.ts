import { createHmac } from 'crypto';
import { cookies } from 'next/headers';

export type SessionPayload = {
  userId: number;
  issuedAt: number;
};

const COOKIE_NAME = 'session';
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

const getSecret = (): string => {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error('SESSION_SECRET is not set');
  }
  return secret;
};

const sign = (payload: SessionPayload): string => {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = createHmac('sha256', getSecret()).update(data).digest('base64url');
  return `${data}.${sig}`;
};

const verify = (value?: string | null): SessionPayload | null => {
  if (!value) return null;
  const parts = value.split('.');
  if (parts.length !== 2) return null;
  const [data, sig] = parts;
  const expected = createHmac('sha256', getSecret()).update(data).digest('base64url');
  if (expected !== sig) return null;
  try {
    const parsed = JSON.parse(Buffer.from(data, 'base64url').toString('utf8')) as SessionPayload;
    if (typeof parsed.userId !== 'number' || typeof parsed.issuedAt !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
};

type CookieStore = Awaited<ReturnType<typeof cookies>>;

export const setSessionCookie = (
  store: CookieStore,
  payload: SessionPayload,
  maxAgeSeconds = COOKIE_MAX_AGE_SECONDS,
) => {
  store.set(COOKIE_NAME, sign(payload), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: maxAgeSeconds,
  });
};

export const clearSessionCookie = (store: CookieStore) => {
  store.delete(COOKIE_NAME);
};

export const readSessionFromCookies = (store: CookieStore): SessionPayload | null => {
  const value = store.get(COOKIE_NAME)?.value;
  return verify(value);
};

export const getSession = async (): Promise<SessionPayload | null> => {
  const store = await cookies();
  return readSessionFromCookies(store);
};

