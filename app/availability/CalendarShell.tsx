"use client";

import { useCallback, useMemo, useState } from "react";

import { ClientContainer } from "@/calendar/components/client-container";
import { CalendarProvider } from "@/calendar/contexts/calendar-context";
import { CalendarActionsProvider } from "@/calendar/contexts/calendar-actions-context";
import type { IEvent, IUser } from "@/calendar/interfaces";
import type { TCalendarView } from "@/calendar/types";

type CalendarFeed = {
  users: IUser[];
  events: IEvent[];
  currentUserId: string | null;
};

type Props = {
  initialData: CalendarFeed;
};

const eventIdToNumeric = (id: string) => {
  if (id.startsWith("event-")) return id.replace("event-", "");
  if (id.startsWith("availability-")) return id.replace("availability-", "");
  return id;
};

export default function CalendarShell({ initialData }: Props) {
  const [data, setData] = useState<CalendarFeed>(initialData);
  const [view, setView] = useState<TCalendarView>("month");

  const [availStart, setAvailStart] = useState("");
  const [availEnd, setAvailEnd] = useState("");
  const [availReason, setAvailReason] = useState("");
  const [eventTitle, setEventTitle] = useState("");
  const [eventDesc, setEventDesc] = useState("");
  const [eventStart, setEventStart] = useState("");
  const [eventEnd, setEventEnd] = useState("");
  const [invitees, setInvitees] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/calendar", { cache: "no-store" });
    if (!res.ok) return;
    const next = (await res.json()) as CalendarFeed;
    setData(next);
  }, []);

  const rsvp = useCallback(
    async (eventId: string, status: "going" | "maybe" | "declined") => {
      const numericId = eventIdToNumeric(eventId);
      await fetch(`/api/events/${numericId}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
    },
    [],
  );

  const deleteEvent = useCallback(async (eventId: string) => {
    if (eventId.startsWith("availability-")) {
      const numericId = eventIdToNumeric(eventId);
      await fetch(`/api/availability/${numericId}`, { method: "DELETE" });
      return;
    }
    const numericId = eventIdToNumeric(eventId);
    await fetch(`/api/events/${numericId}`, { method: "DELETE" });
  }, []);

  const onCreateAvailability = async () => {
    if (!availStart || !availEnd) return;
    setSubmitting(true);
    try {
      await fetch("/api/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          start: new Date(availStart).toISOString(),
          end: new Date(availEnd).toISOString(),
          reason: availReason || undefined,
        }),
      });
      setAvailReason("");
      setAvailStart("");
      setAvailEnd("");
      await refresh();
    } finally {
      setSubmitting(false);
    }
  };

  const onCreateEvent = async () => {
    if (!eventStart || !eventEnd || !eventTitle) return;
    setSubmitting(true);
    try {
      await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: eventTitle,
          description: eventDesc,
          start: new Date(eventStart).toISOString(),
          end: new Date(eventEnd).toISOString(),
          invitees: invitees.map(id => Number(id)),
        }),
      });
      setEventTitle("");
      setEventDesc("");
      setEventStart("");
      setEventEnd("");
      setInvitees([]);
      await refresh();
    } finally {
      setSubmitting(false);
    }
  };

  const availableInvitees = useMemo(() => data.users ?? [], [data.users]);

  return (
    <CalendarActionsProvider value={{ currentUserId: data.currentUserId, refresh, rsvp, deleteEvent }}>
      <CalendarProvider users={data.users} events={data.events}>
        <div className="mx-auto flex max-w-6xl flex-col gap-6">
          <div className="grid gap-4 rounded-xl border bg-white p-4 shadow-sm md:grid-cols-2">
            <div className="space-y-3">
              <h2 className="text-lg font-semibold">Add non-availability</h2>
              <label className="flex flex-col gap-1 text-sm">
                Start
                <input className="rounded border px-3 py-2" type="datetime-local" value={availStart} onChange={e => setAvailStart(e.target.value)} />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                End
                <input className="rounded border px-3 py-2" type="datetime-local" value={availEnd} onChange={e => setAvailEnd(e.target.value)} />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Reason (optional)
                <input className="rounded border px-3 py-2" type="text" value={availReason} onChange={e => setAvailReason(e.target.value)} />
              </label>
              <button
                onClick={onCreateAvailability}
                disabled={submitting || !availStart || !availEnd}
                className="inline-flex items-center justify-center rounded bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                Add non-availability
              </button>
            </div>

            <div className="space-y-3">
              <h2 className="text-lg font-semibold">Create shared event</h2>
              <label className="flex flex-col gap-1 text-sm">
                Title
                <input className="rounded border px-3 py-2" type="text" value={eventTitle} onChange={e => setEventTitle(e.target.value)} />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Description
                <textarea className="rounded border px-3 py-2" value={eventDesc} onChange={e => setEventDesc(e.target.value)} />
              </label>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="flex flex-col gap-1 text-sm">
                  Start
                  <input className="rounded border px-3 py-2" type="datetime-local" value={eventStart} onChange={e => setEventStart(e.target.value)} />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  End
                  <input className="rounded border px-3 py-2" type="datetime-local" value={eventEnd} onChange={e => setEventEnd(e.target.value)} />
                </label>
              </div>
              <div className="flex flex-col gap-2 text-sm">
                Invitees (multi-select)
                <div className="flex flex-wrap gap-2">
                  {availableInvitees.map(u => (
                    <label key={u.id} className="flex items-center gap-1 rounded border px-2 py-1">
                      <input
                        type="checkbox"
                        checked={invitees.includes(u.id)}
                        onChange={e => {
                          if (e.target.checked) setInvitees(prev => [...prev, u.id]);
                          else setInvitees(prev => prev.filter(id => id !== u.id));
                        }}
                      />
                      <span>{u.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <button
                onClick={onCreateEvent}
                disabled={submitting || !eventTitle || !eventStart || !eventEnd}
                className="inline-flex items-center justify-center rounded bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                Create event
              </button>
            </div>
          </div>

          <ClientContainer view={view} onChangeView={setView} />
        </div>
      </CalendarProvider>
    </CalendarActionsProvider>
  );
}

