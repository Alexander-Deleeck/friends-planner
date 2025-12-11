import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { readUserFromCookieStore } from '@/lib/auth/user';

type AttendeeStatus = 'invited' | 'going' | 'maybe' | 'declined';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const eventId = Number(id);

    const cookieStore = await cookies();
    const user = readUserFromCookieStore(cookieStore);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = (await req.json().catch(() => null)) as { status?: AttendeeStatus } | null;
    if (!body?.status || !['going', 'maybe', 'declined', 'invited'].includes(body.status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const db = getDb();
    const exists = db.prepare('SELECT id FROM events WHERE id = ?').get(eventId);
    if (!exists) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

    db.prepare(
      `
      INSERT INTO event_attendees (event_id, user_id, status)
      VALUES (?, ?, ?)
      ON CONFLICT(event_id, user_id) DO UPDATE SET status=excluded.status, updated_at=datetime('now')
    `,
    ).run(eventId, user.id, body.status);

    const attendees = db
      .prepare(
        `
        SELECT ea.user_id, ea.status, ea.updated_at, u.display_name
        FROM event_attendees ea
        JOIN users u ON u.id = ea.user_id
        WHERE ea.event_id = ?
        ORDER BY u.display_name ASC
      `,
      )
      .all(eventId) as Array<{ user_id: number; status: AttendeeStatus; updated_at: string; display_name: string }>;

    return NextResponse.json({
      success: true,
      attendees: attendees.map((r) => ({
        userId: r.user_id,
        name: r.display_name,
        status: r.status,
        updatedAt: r.updated_at,
      })),
    });
  } catch (err) {
    console.error('Error updating RSVP:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

