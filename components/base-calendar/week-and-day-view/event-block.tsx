import { cva } from "class-variance-authority";
import { format, differenceInMinutes, parseISO } from "date-fns";

import { useCalendar } from "@/contexts/calendar-context";

import { DraggableEvent } from "@/components/base-calendar/dnd/draggable-event";
import { EventDetailsDialog } from "@/components/base-calendar/dialogs/event-details-dialog";
import { getEventClasses } from "@/components/base-calendar/event-style";

import { cn } from "@/lib/utils";

import type { HTMLAttributes } from "react";
import type { IEvent } from "@/types/interfaces";
import type { VariantProps } from "class-variance-authority";

const calendarWeekEventCardVariants = cva(
  "flex select-none flex-col gap-0.5 truncate whitespace-nowrap rounded-sm px-2 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring backdrop-blur-sm transition-all shadow-sm ring-1 ring-inset ring-opacity-25 hover:shadow-md hover:ring-opacity-40"
);

interface IProps extends HTMLAttributes<HTMLDivElement> {
  event: IEvent;
}

export function EventBlock({ event, className }: IProps) {
  const { badgeVariant } = useCalendar();

  const start = parseISO(event.startDate);
  const end = parseISO(event.endDate);
  const durationInMinutes = differenceInMinutes(end, start);
  const heightInPixels = (durationInMinutes / 60) * 96 - 8;

  const colorClasses = getEventClasses(event, badgeVariant);
  const calendarWeekEventCardClasses = cn(
    calendarWeekEventCardVariants(),
    colorClasses,
    className,
    durationInMinutes < 35 && "py-0 justify-center"
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (e.currentTarget instanceof HTMLElement) e.currentTarget.click();
    }
  };

  return (
    <DraggableEvent event={event}>
      <EventDetailsDialog event={event}>
        <div role="button" tabIndex={0} className={calendarWeekEventCardClasses} style={{ height: `${heightInPixels}px` }} onKeyDown={handleKeyDown}>
          <div className="flex items-center gap-1.5 truncate">
            {["mixed", "dot"].includes(badgeVariant) && (
              <svg width="8" height="8" viewBox="0 0 8 8" className="event-dot shrink-0">
                <circle cx="4" cy="4" r="4" />
              </svg>
            )}

            <p className="truncate font-semibold">{event.title}</p>
          </div>

          {durationInMinutes > 25 && (
            <p>
              {format(start, "h:mm a")} - {format(end, "h:mm a")}
            </p>
          )}
        </div>
      </EventDetailsDialog>
    </DraggableEvent>
  );
}
