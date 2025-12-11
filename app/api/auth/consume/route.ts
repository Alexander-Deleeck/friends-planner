import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { consumeLoginToken } from '@/lib/auth/tokens';
import { clearSessionCookie, setSessionCookie } from '@/lib/auth/session';
import { getUserById } from '@/lib/auth/user';

const redirectWithError = (req: NextRequest, error: string) => {
  const url = new URL('/login', req.url);
  url.searchParams.set('error', error);
  return NextResponse.redirect(url);
};

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  if (!token) return redirectWithError(req, 'missing_token');

  const result = consumeLoginToken(token);
  if (!result.ok) return redirectWithError(req, result.reason);

  const user = getUserById(result.userId);
  if (!user) return redirectWithError(req, 'user_missing');

  const store = await cookies();
  clearSessionCookie(store); // avoid duplicate cookies
  setSessionCookie(store, { userId: user.id, issuedAt: Date.now() });

  const redirectTo = new URL('/', req.url);
  return NextResponse.redirect(redirectTo);
}

