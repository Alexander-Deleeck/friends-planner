import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { readUserFromCookieStore } from '@/lib/auth/user';
import { getDb } from '@/lib/db';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const cookieStore = await cookies();
    const user = readUserFromCookieStore(cookieStore);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const periodId = parseInt(id, 10);
    if (isNaN(periodId)) {
      return NextResponse.json({ error: 'Invalid period ID' }, { status: 400 });
    }

    const db = getDb();

    // Verify ownership
    const period = db
      .prepare(
        `
        SELECT id, user_id
        FROM blocked_periods
        WHERE id = ?
      `,
      )
      .get(periodId) as { id: number; user_id: number } | undefined;

    if (!period) {
      return NextResponse.json({ error: 'Blocked period not found' }, { status: 404 });
    }

    if (period.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    db.prepare('DELETE FROM blocked_periods WHERE id = ?').run(periodId);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error deleting blocked period:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

