import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { readUserFromCookieStore } from '@/lib/auth/user';
import { getDb } from '@/lib/db';
import { validateDateTimeRange, normalizeToDate } from '@/lib/validation/dates';

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const user = readUserFromCookieStore(cookieStore);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await req.json().catch(() => null)) as
      | { start?: string; end?: string; startDate?: string; endDate?: string; reason?: string }
      | null;

    const startInput = body?.start ?? body?.startDate;
    const endInput = body?.end ?? body?.endDate;

    if (!startInput || !endInput) {
      return NextResponse.json({ error: 'start and end are required' }, { status: 400 });
    }

    const validation = validateDateTimeRange(startInput, endInput);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { startIso, endIso } = validation;
    const startDate = normalizeToDate(startInput, false)?.slice(0, 10) ?? startIso.slice(0, 10);
    const endDate = normalizeToDate(endInput, true)?.slice(0, 10) ?? endIso.slice(0, 10);

    const db = getDb();
    const result = db
      .prepare(
        `
        INSERT INTO blocked_periods (user_id, start_date, end_date, start_datetime, end_datetime, reason)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      )
      .run(user.id, startDate, endDate, startIso, endIso, body?.reason || null);

    const inserted = db
      .prepare(
        `
        SELECT id, user_id, start_date, end_date, start_datetime, end_datetime, reason, created_at
        FROM blocked_periods
        WHERE id = ?
      `,
      )
      .get(result.lastInsertRowid) as {
      id: number;
      user_id: number;
      start_date: string;
      end_date: string;
      start_datetime: string;
      end_datetime: string;
      reason: string | null;
      created_at: string;
    };

    return NextResponse.json({
      id: inserted.id,
      userId: inserted.user_id,
      startDate: inserted.start_date,
      endDate: inserted.end_date,
      start: inserted.start_datetime,
      end: inserted.end_datetime,
      reason: inserted.reason,
      createdAt: inserted.created_at,
    });
  } catch (err) {
    console.error('Error creating blocked period:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

