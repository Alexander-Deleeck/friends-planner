"use client";

import { createContext, useContext } from "react";

export type AttendeeStatus = "invited" | "going" | "maybe" | "declined";

export type CreateAvailabilityInput = {
  start: string;
  end: string;
  reason?: string;
};

export type CreateEventInput = {
  title: string;
  description?: string;
  start: string;
  end: string;
  invitees: number[];
};

type CalendarActionsContextValue = {
  currentUserId: string | null;
  refresh: () => Promise<void>;
  rsvp: (eventId: string, status: AttendeeStatus) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;
  createAvailability?: (input: CreateAvailabilityInput) => Promise<void>;
  createEvent?: (input: CreateEventInput) => Promise<void>;
  submitting?: boolean;
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

