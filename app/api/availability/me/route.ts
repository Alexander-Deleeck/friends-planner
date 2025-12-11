import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { readUserFromCookieStore } from '@/lib/auth/user';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const user = readUserFromCookieStore(cookieStore);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const db = getDb();
    let query = `
      SELECT id, user_id, start_date, end_date, start_datetime, end_datetime, reason, created_at
      FROM blocked_periods
      WHERE user_id = ?
    `;
    const params: (string | number)[] = [user.id];

    if (from && to) {
      query += ` AND (
        (start_datetime <= ? AND end_datetime >= ?) OR
        (start_datetime >= ? AND start_datetime <= ?) OR
        (end_datetime >= ? AND end_datetime <= ?)
      )`;
      params.push(to, from, from, to, from, to);
    } else if (from) {
      query += ` AND end_datetime >= ?`;
      params.push(from);
    } else if (to) {
      query += ` AND start_datetime <= ?`;
      params.push(to);
    }

    query += ` ORDER BY start_datetime ASC`;

    const periods = db.prepare(query).all(...params) as Array<{
      id: number;
      user_id: number;
      start_date: string;
      end_date: string;
      start_datetime: string;
      end_datetime: string;
      reason: string | null;
      created_at: string;
    }>;

    return NextResponse.json(
      periods.map((p) => ({
        id: p.id,
        userId: p.user_id,
        startDate: p.start_date,
        endDate: p.end_date,
        start: p.start_datetime,
        end: p.end_datetime,
        reason: p.reason,
        createdAt: p.created_at,
      })),
    );
  } catch (err) {
    console.error('Error fetching blocked periods:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

