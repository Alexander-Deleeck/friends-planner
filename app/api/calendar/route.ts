import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { readUserFromCookieStore } from '@/lib/auth/user';

type AttendeeStatus = 'invited' | 'going' | 'maybe' | 'declined';
type EventStatus = 'proposed' | 'confirmed' | 'cancelled';

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const cookieStore = await cookies();
    const currentUser = readUserFromCookieStore(cookieStore);

    const users = db
      .prepare(
        `
        SELECT id, display_name, email
        FROM users
        ORDER BY display_name ASC
      `,
      )
      .all() as Array<{ id: number; display_name: string; email: string }>;

    const availabilityRows = db
      .prepare(
        `
        SELECT bp.id, bp.user_id, bp.start_datetime, bp.end_datetime, bp.reason, u.display_name
        FROM blocked_periods bp
        JOIN users u ON u.id = bp.user_id
      `,
      )
      .all() as Array<{ id: number; user_id: number; start_datetime: string; end_datetime: string; reason: string | null; display_name: string }>;

    const eventsRows = db
      .prepare(
        `
        SELECT e.id, e.created_by, e.title, e.description, e.location, e.start_datetime, e.end_datetime, e.status, u.display_name as creator_name
        FROM events e
        JOIN users u ON u.id = e.created_by
      `,
      )
      .all() as Array<{
        id: number;
        created_by: number;
        title: string;
        description: string;
        location: string | null;
        start_datetime: string;
        end_datetime: string;
        status: EventStatus;
        creator_name: string;
      }>;

    const attendeesByEvent: Record<number, Array<{ user_id: number; status: AttendeeStatus; display_name: string }>> = {};
    const attendeeRows = db
      .prepare(
        `
        SELECT ea.event_id, ea.user_id, ea.status, u.display_name
        FROM event_attendees ea
        JOIN users u ON u.id = ea.user_id
      `,
      )
      .all() as Array<{ event_id: number; user_id: number; status: AttendeeStatus; display_name: string }>;

    attendeeRows.forEach((row) => {
      attendeesByEvent[row.event_id] = attendeesByEvent[row.event_id] || [];
      attendeesByEvent[row.event_id].push(row);
    });

    const availabilityEvents = availabilityRows.map((row) => ({
      id: `availability-${row.id}`,
      startDate: row.start_datetime,
      endDate: row.end_datetime,
      title: row.reason ? `Unavailable: ${row.reason}` : 'Unavailable',
      description: row.reason ?? 'Unavailable',
      color: 'gray' as const,
      user: {
        id: String(row.user_id),
        name: row.display_name,
        picturePath: null,
      },
      kind: 'availability' as const,
      canEdit: currentUser ? currentUser.id === row.user_id : false,
    }));

    const eventItems = eventsRows.map((row) => {
      const atts = attendeesByEvent[row.id] || [];
      const currentAttendee = currentUser ? atts.find((a) => a.user_id === currentUser.id) : null;

      return {
        id: `event-${row.id}`,
        startDate: row.start_datetime,
        endDate: row.end_datetime,
        title: row.title,
        description: row.description || '',
        color: 'blue' as const,
        user: {
          id: String(row.created_by),
          name: row.creator_name,
          picturePath: null,
        },
        kind: 'event' as const,
        status: row.status,
        creatorId: String(row.created_by),
        attendees: atts.map((a) => ({
          userId: String(a.user_id),
          name: a.display_name,
          status: a.status,
        })),
        rsvpStatus: currentAttendee ? currentAttendee.status : null,
        canEdit: currentUser ? currentUser.id === row.created_by : false,
      };
    });

    return NextResponse.json({
      currentUserId: currentUser?.id ?? null,
      users: users.map((u) => ({ id: String(u.id), name: u.display_name, picturePath: null })),
      events: [...availabilityEvents, ...eventItems],
    });
  } catch (err) {
    console.error('Error building calendar feed:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

