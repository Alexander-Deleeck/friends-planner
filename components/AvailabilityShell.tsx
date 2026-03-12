"use client";

import { useCallback, useState } from "react";

import { CalendarActionsProvider, type CreateAvailabilityInput, type CreateEventInput } from "@/contexts/calendar-actions-context";
import { CalendarProvider } from "@/contexts/calendar-context";
import { ScrollArea } from "@/components/ui/scroll-area";
import CalendarShell from "@/components/CalendarShell";
import Sidebar from "@/components/Sidebar";
import type { IEvent, IUser } from "@/types/interfaces";

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

export default function AvailabilityShell({ initialData }: Props) {
  const [data, setData] = useState<CalendarFeed>(initialData);
  const [submitting, setSubmitting] = useState(false);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/calendar", { cache: "no-store" });
    if (!res.ok) return;
    const next = (await res.json()) as CalendarFeed;
    setData(next);
  }, []);

  const rsvp = useCallback(async (eventId: string, status: "invited" | "going" | "maybe" | "declined") => {
    const numericId = eventIdToNumeric(eventId);
    await fetch(`/api/events/${numericId}/rsvp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  }, []);

  const deleteEvent = useCallback(async (eventId: string) => {
    if (eventId.startsWith("availability-")) {
      const numericId = eventIdToNumeric(eventId);
      await fetch(`/api/availability/${numericId}`, { method: "DELETE" });
      return;
    }
    const numericId = eventIdToNumeric(eventId);
    await fetch(`/api/events/${numericId}`, { method: "DELETE" });
  }, []);

  const createAvailability = useCallback(
    async (input: CreateAvailabilityInput) => {
      setSubmitting(true);
      try {
        await fetch("/api/availability", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            start: new Date(input.start).toISOString(),
            end: new Date(input.end).toISOString(),
            reason: input.reason || undefined,
          }),
        });
        await refresh();
      } finally {
        setSubmitting(false);
      }
    },
    [refresh]
  );

  const createEvent = useCallback(
    async (input: CreateEventInput) => {
      setSubmitting(true);
      try {
        await fetch("/api/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: input.title,
            description: input.description ?? "",
            start: new Date(input.start).toISOString(),
            end: new Date(input.end).toISOString(),
            invitees: input.invitees,
          }),
        });
        await refresh();
      } finally {
        setSubmitting(false);
      }
    },
    [refresh]
  );

  return (
    <CalendarActionsProvider value={{ currentUserId: data.currentUserId, refresh, rsvp, deleteEvent, createAvailability, createEvent, submitting }}>
      <CalendarProvider users={data.users} events={data.events}>
        <div className="flex min-h-[calc(100dvh-56px)] w-full bg-background/50">
          <aside className="hidden w-[340px] shrink-0 border-r border-border/40 bg-card/60 backdrop-blur-md md:block">
            <ScrollArea className="h-[calc(100dvh-56px)]">
              <div className="p-4">
                <Sidebar users={data.users} />
              </div>
            </ScrollArea>
          </aside>

          <div className="flex min-w-0 flex-1 flex-col">
            <div className="p-3 sm:p-6">
              <CalendarShell />
            </div>
          </div>
        </div>
      </CalendarProvider>
    </CalendarActionsProvider>
  );
}


