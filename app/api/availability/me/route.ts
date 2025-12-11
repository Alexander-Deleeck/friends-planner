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
      SELECT id, user_id, start_date, end_date, reason, created_at
      FROM blocked_periods
      WHERE user_id = ?
    `;
    const params: (string | number)[] = [user.id];

    if (from && to) {
      query += ` AND (
        (start_date <= ? AND end_date >= ?) OR
        (start_date >= ? AND start_date <= ?) OR
        (end_date >= ? AND end_date <= ?)
      )`;
      params.push(to, from, from, to, from, to);
    } else if (from) {
      query += ` AND end_date >= ?`;
      params.push(from);
    } else if (to) {
      query += ` AND start_date <= ?`;
      params.push(to);
    }

    query += ` ORDER BY start_date ASC`;

    const periods = db.prepare(query).all(...params) as Array<{
      id: number;
      user_id: number;
      start_date: string;
      end_date: string;
      reason: string | null;
      created_at: string;
    }>;

    return NextResponse.json(
      periods.map((p) => ({
        id: p.id,
        userId: p.user_id,
        startDate: p.start_date,
        endDate: p.end_date,
        reason: p.reason,
        createdAt: p.created_at,
      })),
    );
  } catch (err) {
    console.error('Error fetching blocked periods:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

