 "use client";
 
 import { useMemo, useState } from "react";
 
 import { CalendarPlus, CircleSlash2 } from "lucide-react";
 
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Textarea } from "@/components/ui/textarea";
 import { useCalendarActions } from "@/contexts/calendar-actions-context";
 import type { IUser } from "@/types/interfaces";
 
 type Mode = "availability" | "event";
 
 type Props = {
   users: IUser[];
 };
 
 export default function Sidebar({ users }: Props) {
   const actions = useCalendarActions();
   const [mode, setMode] = useState<Mode>("availability");
 
   const [availStart, setAvailStart] = useState("");
   const [availEnd, setAvailEnd] = useState("");
   const [availReason, setAvailReason] = useState("");
 
   const [eventTitle, setEventTitle] = useState("");
   const [eventDesc, setEventDesc] = useState("");
   const [eventStart, setEventStart] = useState("");
   const [eventEnd, setEventEnd] = useState("");
   const [invitees, setInvitees] = useState<string[]>([]);
 
   const submitting = actions.submitting ?? false;
 
   const availableInvitees = useMemo(() => users ?? [], [users]);
 
   const onCreateAvailability = async () => {
     if (!actions.createAvailability) throw new Error("createAvailability action not available");
     if (!availStart || !availEnd) return;
     await actions.createAvailability({ start: availStart, end: availEnd, reason: availReason || undefined });
     setAvailReason("");
     setAvailStart("");
     setAvailEnd("");
   };
 
   const onCreateEvent = async () => {
     if (!actions.createEvent) throw new Error("createEvent action not available");
     if (!eventTitle || !eventStart || !eventEnd) return;
     await actions.createEvent({
       title: eventTitle,
       description: eventDesc || undefined,
       start: eventStart,
       end: eventEnd,
       invitees: invitees.map((id) => Number(id)),
     });
     setEventTitle("");
     setEventDesc("");
     setEventStart("");
     setEventEnd("");
     setInvitees([]);
   };
 
   return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Event / not-available scheduler</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button type="button" variant={mode === "availability" ? "default" : "outline"} onClick={() => setMode("availability")}>
          <CircleSlash2 className="size-4" />
          Non-availability
        </Button>
        <Button type="button" variant={mode === "event" ? "default" : "outline"} onClick={() => setMode("event")}>
          <CalendarPlus className="size-4" />
          Event
        </Button>
      </div>

      {mode === "availability" ? (
        <div className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-foreground">Add non-availability</h2>
            <p className="text-sm text-muted-foreground">Block out time you can’t make it.</p>
          </div>

          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="avail-start">Start</Label>
              <Input id="avail-start" type="datetime-local" value={availStart} onChange={(e) => setAvailStart(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="avail-end">End</Label>
              <Input id="avail-end" type="datetime-local" value={availEnd} onChange={(e) => setAvailEnd(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="avail-reason">Reason (optional)</Label>
              <Input id="avail-reason" type="text" value={availReason} onChange={(e) => setAvailReason(e.target.value)} placeholder="e.g. work, travel" />
            </div>

            <Button type="button" onClick={onCreateAvailability} disabled={submitting || !availStart || !availEnd} className="w-full">
              Add non-availability
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-foreground">Create shared event</h2>
            <p className="text-sm text-muted-foreground">Invite people and coordinate.</p>
          </div>

          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="event-title">Title</Label>
              <Input id="event-title" type="text" value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} placeholder="e.g. Dinner" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="event-desc">Description</Label>
              <Textarea id="event-desc" value={eventDesc} onChange={(e) => setEventDesc(e.target.value)} placeholder="Optional details" />
            </div>

            <div className="grid gap-3">
              <div className="space-y-2">
                <Label htmlFor="event-start">Start</Label>
                <Input id="event-start" type="datetime-local" value={eventStart} onChange={(e) => setEventStart(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-end">End</Label>
                <Input id="event-end" type="datetime-local" value={eventEnd} onChange={(e) => setEventEnd(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Invitees (multi-select)</Label>
              <div className="flex flex-wrap gap-2">
                {availableInvitees.map((u) => (
                  <label
                    key={u.id}
                    className="flex items-center gap-2 rounded-md border border-input/60 bg-background/60 px-3 py-1.5 text-sm text-foreground shadow-sm backdrop-blur-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    <input
                      type="checkbox"
                      checked={invitees.includes(u.id)}
                      onChange={(e) => {
                        if (e.target.checked) setInvitees((prev) => [...prev, u.id]);
                        else setInvitees((prev) => prev.filter((id) => id !== u.id));
                      }}
                    />
                    <span className="max-w-[180px] truncate">{u.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <Button type="button" onClick={onCreateEvent} disabled={submitting || !eventTitle || !eventStart || !eventEnd} className="w-full">
              Create event
            </Button>

            <p className="text-xs text-muted-foreground">Invited users will appear in attendee lists.</p>
          </div>
        </div>
      )}
    </div>
   );
 }
 

