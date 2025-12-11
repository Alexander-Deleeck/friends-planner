import type { TEventColor } from "@/calendar/types";

export interface IUser {
  id: string;
  name: string;
  picturePath: string | null;
}

export interface IEvent {
  id: string;
  startDate: string;
  endDate: string;
  title: string;
  color: TEventColor;
  description: string;
  user: IUser;
  kind?: 'availability' | 'event';
  status?: 'proposed' | 'confirmed' | 'cancelled';
  creatorId?: string;
  attendees?: Array<{ userId: string; name: string; status: 'invited' | 'going' | 'maybe' | 'declined' }>;
  rsvpStatus?: 'invited' | 'going' | 'maybe' | 'declined' | null;
  canEdit?: boolean;
}

export interface ICalendarCell {
  day: number;
  currentMonth: boolean;
  date: Date;
}
