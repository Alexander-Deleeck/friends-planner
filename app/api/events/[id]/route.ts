import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { readUserFromCookieStore } from '@/lib/auth/user';
import { validateDateTimeRange } from '@/lib/validation/dates';

type EventStatus = 'proposed' | 'confirmed' | 'cancelled';

const mapEventRow = (row: any) => ({
  id: row.id,
  createdBy: row.created_by,
  title: row.title,
  description: row.description,
  location: row.location,
  start: row.start_datetime,
  end: row.end_datetime,
  status: row.status as EventStatus,
  createdAt: row.created_at,
});

const getAttendees = (db: ReturnType<typeof getDb>, eventId: number) => {
  const rows = db
    .prepare(
      `
      SELECT ea.user_id, ea.status, ea.updated_at, u.display_name
      FROM event_attendees ea
      JOIN users u ON u.id = ea.user_id
      WHERE ea.event_id = ?
      ORDER BY u.display_name ASC
    `,
    )
    .all(eventId) as Array<{ user_id: number; status: string; updated_at: string; display_name: string }>;

  return rows.map((r) => ({
    userId: r.user_id,
    name: r.display_name,
    status: r.status,
    updatedAt: r.updated_at,
  }));
};

const fetchEvent = (db: ReturnType<typeof getDb>, id: number) => {
  const row = db
    .prepare(
      `
      SELECT e.*, u.display_name as creator_name
      FROM events e
      JOIN users u ON u.id = e.created_by
      WHERE e.id = ?
    `,
    )
    .get(id);

  if (!row) return null;
  return {
    ...mapEventRow(row),
    creatorName: row.creator_name,
    attendees: getAttendees(db, id),
  };
};

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const eventId = Number(id);
    const db = getDb();
    const event = fetchEvent(db, eventId);
    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    return NextResponse.json(event);
  } catch (err) {
    console.error('Error fetching event:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const eventId = Number(id);

    const cookieStore = await cookies();
    const user = readUserFromCookieStore(cookieStore);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = getDb();
    const existing = db.prepare('SELECT * FROM events WHERE id = ?').get(eventId) as any;
    if (!existing) return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    if (existing.created_by !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = (await req.json().catch(() => null)) as
      | {
          title?: string;
          description?: string;
          location?: string | null;
          start?: string;
          end?: string;
          status?: EventStatus;
          invitees?: number[];
        }
      | null;

    const updates: string[] = [];
    const paramsArr: any[] = [];

    if (body?.title !== undefined) {
      updates.push('title = ?');
      paramsArr.push(body.title);
    }
    if (body?.description !== undefined) {
      updates.push('description = ?');
      paramsArr.push(body.description);
    }
    if (body?.location !== undefined) {
      updates.push('location = ?');
      paramsArr.push(body.location);
    }
    if (body?.status !== undefined) {
      updates.push('status = ?');
      paramsArr.push(body.status);
    }
    if (body?.start || body?.end) {
      const validation = validateDateTimeRange(body?.start ?? existing.start_datetime, body?.end ?? existing.end_datetime);
      if (!validation.valid || !validation.startIso || !validation.endIso) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }
      updates.push('start_datetime = ?', 'end_datetime = ?');
      paramsArr.push(validation.startIso, validation.endIso);
    }

    if (updates.length > 0) {
      paramsArr.push(eventId);
      db.prepare(`UPDATE events SET ${updates.join(', ')} WHERE id = ?`).run(...paramsArr);
    }

    // Update invitees if provided
    if (Array.isArray(body?.invitees)) {
      const insertAttendee = db.prepare(
        `
        INSERT INTO event_attendees (event_id, user_id, status)
        VALUES (?, ?, ?)
        ON CONFLICT(event_id, user_id) DO UPDATE SET status=excluded.status, updated_at=datetime('now')
      `,
      );

      // Ensure creator remains going
      insertAttendee.run(eventId, user.id, 'going');
      body.invitees.forEach((inviteeId) => {
        if (inviteeId === user.id) return;
        insertAttendee.run(eventId, inviteeId, 'invited');
      });
    }

    const updated = fetchEvent(db, eventId);
    return NextResponse.json(updated);
  } catch (err) {
    console.error('Error updating event:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const eventId = Number(id);

    const cookieStore = await cookies();
    const user = readUserFromCookieStore(cookieStore);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = getDb();
    const existing = db.prepare('SELECT created_by FROM events WHERE id = ?').get(eventId) as { created_by: number } | undefined;
    if (!existing) return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    if (existing.created_by !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    db.prepare('DELETE FROM event_attendees WHERE event_id = ?').run(eventId);
    db.prepare('DELETE FROM events WHERE id = ?').run(eventId);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error deleting event:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

