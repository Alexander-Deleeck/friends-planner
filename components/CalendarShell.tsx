"use client";

import { useCallback, useMemo, useState } from "react";

import { ClientContainer } from "@/components/base-calendar/client-container";
import { ChangeBadgeVariantInput } from "@/components/base-calendar/change-badge-variant-input";
import { CalendarProvider } from "@/contexts/calendar-context";
import { CalendarActionsProvider, type AttendeeStatus } from "@/contexts/calendar-actions-context";
import type { IEvent, IUser } from "@/types/interfaces";
import type { TCalendarView } from "@/types/types";

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
    async (eventId: string, status: AttendeeStatus) => {
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
        <div className="min-h-screen bg-slate-50 py-8">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4">
            <div className="grid gap-6 rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-lg backdrop-blur-sm md:grid-cols-2">
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Availability</p>
                  <h2 className="text-xl font-semibold text-slate-900">Add non-availability</h2>
                </div>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-slate-700">Start</span>
                  <input
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none"
                    type="datetime-local"
                    value={availStart}
                    onChange={e => setAvailStart(e.target.value)}
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-slate-700">End</span>
                  <input
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none"
                    type="datetime-local"
                    value={availEnd}
                    onChange={e => setAvailEnd(e.target.value)}
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-slate-700">Reason (optional)</span>
                  <input
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none"
                    type="text"
                    value={availReason}
                    onChange={e => setAvailReason(e.target.value)}
                  />
                </label>
                <button
                  onClick={onCreateAvailability}
                  disabled={submitting || !availStart || !availEnd}
                  className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
                >
                  Add non-availability
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Shared events</p>
                  <h2 className="text-xl font-semibold text-slate-900">Create shared event</h2>
                </div>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-slate-700">Title</span>
                  <input
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none"
                    type="text"
                    value={eventTitle}
                    onChange={e => setEventTitle(e.target.value)}
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-slate-700">Description</span>
                  <textarea
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none"
                    value={eventDesc}
                    onChange={e => setEventDesc(e.target.value)}
                  />
                </label>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="text-slate-700">Start</span>
                    <input
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none"
                      type="datetime-local"
                      value={eventStart}
                      onChange={e => setEventStart(e.target.value)}
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="text-slate-700">End</span>
                    <input
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none"
                      type="datetime-local"
                      value={eventEnd}
                      onChange={e => setEventEnd(e.target.value)}
                    />
                  </label>
                </div>
                <div className="flex flex-col gap-2 text-sm">
                  <span className="text-slate-700">Invitees (multi-select)</span>
                  <div className="flex flex-wrap gap-2">
                    {availableInvitees.map(u => (
                      <label key={u.id} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1 text-slate-800 shadow-sm">
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
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={onCreateEvent}
                    disabled={submitting || !eventTitle || !eventStart || !eventEnd}
                    className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
                  >
                    Create event
                  </button>
                  <span className="text-xs text-slate-500">Invited users will appear in attendee lists.</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white/90 shadow-xl backdrop-blur-sm">
              <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Calendar</p>
                  <p className="text-sm text-slate-600">Switch badge styles to match the examples.</p>
                </div>
                <ChangeBadgeVariantInput />
              </div>
              <div className="p-2">
                <ClientContainer view={view} onChangeView={setView} />
              </div>
            </div>
          </div>
        </div>
      </CalendarProvider>
    </CalendarActionsProvider>
  );
}

