import { NextRequest, NextResponse } from 'next/server';
import { createLoginToken } from '@/lib/auth/tokens';
import { findUserByEmail } from '@/lib/auth/user';

const baseUrl = () => process.env.BASE_URL || 'http://localhost:3000';

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { email?: string } | null;
  const email = body?.email?.trim().toLowerCase();

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  const user = findUserByEmail(email);
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const { token, expiresAt } = createLoginToken(user.id);

  const loginUrl = new URL('/api/auth/consume', baseUrl());
  loginUrl.searchParams.set('token', token);

  return NextResponse.json({
    loginUrl: loginUrl.toString(),
    expiresAt,
    user: {
      id: user.id,
      email: user.email,
      displayName: user.display_name,
    },
  });
}

