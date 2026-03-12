"use client";

import { format, parseISO } from "date-fns";
import { cva } from "class-variance-authority";
import { Clock, Text, User } from "lucide-react";

import { useCalendar } from "@/contexts/calendar-context";

import { EventDetailsDialog } from "@/components/base-calendar/dialogs/event-details-dialog";
import { getEventClasses } from "@/components/base-calendar/event-style";

import type { IEvent } from "@/types/interfaces";

const agendaEventCardVariants = cva(
  "flex select-none items-center justify-between gap-3 rounded-sm p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring backdrop-blur-sm transition-all shadow-sm ring-1 ring-inset ring-opacity-25 hover:shadow-md hover:ring-opacity-40"
);

interface IProps {
  event: IEvent;
  eventCurrentDay?: number;
  eventTotalDays?: number;
}

export function AgendaEventCard({ event, eventCurrentDay, eventTotalDays }: IProps) {
  const { badgeVariant } = useCalendar();

  const startDate = parseISO(event.startDate);
  const endDate = parseISO(event.endDate);

  const colorClasses = getEventClasses(event, badgeVariant);
  const agendaEventCardClasses = `${agendaEventCardVariants()} ${colorClasses}`;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (e.currentTarget instanceof HTMLElement) e.currentTarget.click();
    }
  };

  return (
    <EventDetailsDialog event={event}>
      <div role="button" tabIndex={0} className={agendaEventCardClasses} onKeyDown={handleKeyDown}>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5">
            {["mixed", "dot"].includes(badgeVariant) && (
              <svg width="8" height="8" viewBox="0 0 8 8" className="event-dot shrink-0">
                <circle cx="4" cy="4" r="4" />
              </svg>
            )}

            <p className="font-medium">
              {eventCurrentDay && eventTotalDays && (
                <span className="mr-1 text-xs">
                  Day {eventCurrentDay} of {eventTotalDays} •{" "}
                </span>
              )}
              {event.title}
            </p>
          </div>

          <div className="mt-1 flex items-center gap-1">
            <User className="size-3 shrink-0" />
            <p className="text-xs text-foreground">{event.user.name}</p>
          </div>

          <div className="flex items-center gap-1">
            <Clock className="size-3 shrink-0" />
            <p className="text-xs text-foreground">
              {format(startDate, "h:mm a")} - {format(endDate, "h:mm a")}
            </p>
          </div>

          <div className="flex items-center gap-1">
            <Text className="size-3 shrink-0" />
            <p className="text-xs text-foreground">{event.description}</p>
          </div>
        </div>
      </div>
    </EventDetailsDialog>
  );
}
