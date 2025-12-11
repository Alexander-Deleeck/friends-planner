import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { readUserFromCookieStore } from '@/lib/auth/user';
import { validateDateTimeRange } from '@/lib/validation/dates';

type EventStatus = 'proposed' | 'confirmed' | 'cancelled';
type AttendeeStatus = 'invited' | 'going' | 'maybe' | 'declined';

type EventRow = {
  id: number;
  created_by: number;
  title: string;
  description: string;
  location: string | null;
  start_datetime: string;
  end_datetime: string;
  status: EventStatus;
  created_at: string;
  creator_name?: string;
};

const DEFAULT_STATUS: EventStatus = 'proposed';

const mapEventRow = (row: EventRow) => ({
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
    .all(eventId) as Array<{ user_id: number; status: AttendeeStatus; updated_at: string; display_name: string }>;

  return rows.map((r) => ({
    userId: r.user_id,
    name: r.display_name,
    status: r.status,
    updatedAt: r.updated_at,
  }));
};

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    let query = `
      SELECT e.id, e.created_by, e.title, e.description, e.location, e.start_datetime, e.end_datetime, e.status, e.created_at,
             creator.display_name as creator_name
      FROM events e
      JOIN users creator ON creator.id = e.created_by
    `;

    const params: (string | number)[] = [];
    const whereClauses: string[] = [];

    if (from && to) {
      whereClauses.push('(e.start_datetime <= ? AND e.end_datetime >= ?)');
      params.push(to, from);
    } else if (from) {
      whereClauses.push('e.end_datetime >= ?');
      params.push(from);
    } else if (to) {
      whereClauses.push('e.start_datetime <= ?');
      params.push(to);
    }

    if (whereClauses.length) {
      query += ` WHERE ${whereClauses.join(' AND ')}`;
    }

    query += ' ORDER BY e.start_datetime ASC';

    const rows = db.prepare(query).all(...params) as EventRow[];

    const events = rows.map((row) => ({
      ...mapEventRow(row),
      creatorName: row.creator_name,
      attendees: getAttendees(db, row.id),
    }));

    return NextResponse.json(events);
  } catch (err) {
    console.error('Error listing events:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const user = readUserFromCookieStore(cookieStore);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await req.json().catch(() => null)) as
      | {
          title?: string;
          description?: string;
          location?: string | null;
          start?: string;
          end?: string;
          status?: EventStatus;
          invitees?: number[];
          color?: string;
        }
      | null;

    if (!body?.title || !body?.start || !body?.end) {
      return NextResponse.json({ error: 'title, start, and end are required' }, { status: 400 });
    }

    const validation = validateDateTimeRange(body.start, body.end);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const db = getDb();

    const result = db
      .prepare(
        `
        INSERT INTO events (created_by, title, description, location, start_datetime, end_datetime, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      )
      .run(
        user.id,
        body.title,
        body.description || '',
        body.location || null,
        validation.startIso,
        validation.endIso,
        body.status || DEFAULT_STATUS,
      );

    const eventId = Number(result.lastInsertRowid);

    const invitees = Array.isArray(body.invitees) ? body.invitees : [];
    const insertAttendee = db.prepare(
      `
      INSERT INTO event_attendees (event_id, user_id, status)
      VALUES (?, ?, ?)
      ON CONFLICT(event_id, user_id) DO UPDATE SET status=excluded.status, updated_at=datetime('now')
    `,
    );

    // Creator defaults to going
    insertAttendee.run(eventId, user.id, 'going');
    invitees.forEach((inviteeId) => {
      if (inviteeId === user.id) return;
      insertAttendee.run(eventId, inviteeId, 'invited');
    });

    const created = db
      .prepare(
        `
        SELECT id, created_by, title, description, location, start_datetime, end_datetime, status, created_at
        FROM events
        WHERE id = ?
      `,
      )
      .get(eventId) as EventRow;

    return NextResponse.json({
      ...mapEventRow(created),
      attendees: getAttendees(db, eventId),
    });
  } catch (err) {
    console.error('Error creating event:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

