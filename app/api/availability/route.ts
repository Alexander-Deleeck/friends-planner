import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getCurrentUserOrThrow, readUserFromCookieStore } from '@/lib/auth/user';
import { getDb } from '@/lib/db';
import { validateDateRange } from '@/lib/validation/dates';

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const user = readUserFromCookieStore(cookieStore);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await req.json().catch(() => null)) as
      | { startDate?: string; endDate?: string; reason?: string }
      | null;

    if (!body?.startDate || !body?.endDate) {
      return NextResponse.json({ error: 'startDate and endDate are required' }, { status: 400 });
    }

    const validation = validateDateRange(body.startDate, body.endDate);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const db = getDb();
    const result = db
      .prepare(
        `
        INSERT INTO blocked_periods (user_id, start_date, end_date, reason)
        VALUES (?, ?, ?, ?)
      `,
      )
      .run(user.id, body.startDate, body.endDate, body.reason || null);

    const inserted = db
      .prepare(
        `
        SELECT id, user_id, start_date, end_date, reason, created_at
        FROM blocked_periods
        WHERE id = ?
      `,
      )
      .get(result.lastInsertRowid) as {
      id: number;
      user_id: number;
      start_date: string;
      end_date: string;
      reason: string | null;
      created_at: string;
    };

    return NextResponse.json({
      id: inserted.id,
      userId: inserted.user_id,
      startDate: inserted.start_date,
      endDate: inserted.end_date,
      reason: inserted.reason,
      createdAt: inserted.created_at,
    });
  } catch (err) {
    console.error('Error creating blocked period:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

