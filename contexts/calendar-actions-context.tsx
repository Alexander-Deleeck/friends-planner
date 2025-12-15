"use client";

import { createContext, useContext } from "react";

export type AttendeeStatus = "invited" | "going" | "maybe" | "declined";

type CalendarActionsContextValue = {
  currentUserId: string | null;
  refresh: () => Promise<void>;
  rsvp: (eventId: string, status: AttendeeStatus) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;
};

const CalendarActionsContext = createContext<CalendarActionsContextValue | null>(null);

export function CalendarActionsProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: CalendarActionsContextValue;
}) {
  return <CalendarActionsContext.Provider value={value}>{children}</CalendarActionsContext.Provider>;
}

export function useCalendarActions(): CalendarActionsContextValue {
  const ctx = useContext(CalendarActionsContext);
  if (!ctx) throw new Error("useCalendarActions must be used within CalendarActionsProvider");
  return ctx;
}

