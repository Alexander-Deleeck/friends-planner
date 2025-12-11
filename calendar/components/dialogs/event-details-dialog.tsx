"use client";

import { format, parseISO } from "date-fns";
import { Calendar, Clock, Text, User, Users, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useCalendarActions } from "@/calendar/contexts/calendar-actions-context";

import type { IEvent } from "@/calendar/interfaces";

interface IProps {
  event: IEvent;
  children: React.ReactNode;
}

export function EventDetailsDialog({ event, children }: IProps) {
  const startDate = parseISO(event.startDate);
  const endDate = parseISO(event.endDate);
  const actions = useCalendarActions();

  const handleRsvp = async (status: "going" | "maybe" | "declined") => {
    await actions.rsvp(event.id, status);
    await actions.refresh();
  };

  const handleDelete = async () => {
    await actions.deleteEvent(event.id);
    await actions.refresh();
  };

  return (
    <>
      <Dialog>
        <DialogTrigger asChild>{children}</DialogTrigger>

        <DialogContent>
          <DialogHeader>
            <DialogTitle>{event.title}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-start gap-2">
              <User className="mt-1 size-4 shrink-0" />
              <div>
                <p className="text-sm font-medium">Responsible</p>
                <p className="text-sm text-muted-foreground">{event.user.name}</p>
              </div>
            </div>

            {event.attendees && (
              <div className="flex items-start gap-2">
                <Users className="mt-1 size-4 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Attendees</p>
                  <div className="mt-1 space-y-1">
                    {event.attendees.map(att => (
                      <div key={att.userId} className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{att.name}</span>
                        <span className="uppercase text-xs font-semibold">{att.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-start gap-2">
              <Calendar className="mt-1 size-4 shrink-0" />
              <div>
                <p className="text-sm font-medium">Start Date</p>
                <p className="text-sm text-muted-foreground">{format(startDate, "MMM d, yyyy h:mm a")}</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Clock className="mt-1 size-4 shrink-0" />
              <div>
                <p className="text-sm font-medium">End Date</p>
                <p className="text-sm text-muted-foreground">{format(endDate, "MMM d, yyyy h:mm a")}</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Text className="mt-1 size-4 shrink-0" />
              <div>
                <p className="text-sm font-medium">Description</p>
                <p className="text-sm text-muted-foreground">{event.description}</p>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            {event.kind === "event" && actions.currentUserId && (
              <>
                <div className="flex flex-1 justify-start gap-2">
                  <Button type="button" variant={event.rsvpStatus === "going" ? "default" : "outline"} onClick={() => handleRsvp("going")}>
                    Going
                  </Button>
                  <Button type="button" variant={event.rsvpStatus === "maybe" ? "default" : "outline"} onClick={() => handleRsvp("maybe")}>
                    Maybe
                  </Button>
                  <Button type="button" variant={event.rsvpStatus === "declined" ? "default" : "outline"} onClick={() => handleRsvp("declined")}>
                    Decline
                  </Button>
                </div>
                {event.canEdit && (
                  <Button type="button" variant="destructive" onClick={handleDelete}>
                    <Trash2 className="mr-1 size-4" />
                    Delete
                  </Button>
                )}
              </>
            )}
            {event.kind === "availability" && event.canEdit && (
              <Button type="button" variant="destructive" onClick={handleDelete}>
                <Trash2 className="mr-1 size-4" />
                Delete
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
