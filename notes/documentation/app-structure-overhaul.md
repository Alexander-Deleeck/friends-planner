# App Structure Overhaul (Header + Availability Layout)

This document describes the new layout structure introduced for the Friends Planner app, focusing on the global header and the redesigned `/availability` page.

## Goals

- Replace the inline header in `app/layout.tsx` with a dedicated `components/AppHeader.tsx` component:
  - Breadcrumb navigation (route-aware)
  - Login/logout
  - Theme switching (light/dark)
- Redesign `/availability` to match the mock layout:
  - Left sidebar for creating events and non-availabilities
  - Calendar fills the remaining space

## High-level structure

### Global layout (`app/layout.tsx`)

- Renders the global `AppHeader`
- Initializes theme early (before interactive) to avoid light/dark “flash”
- Leaves page width management to individual pages (no global max-width constraint)

### Availability page (`app/availability/page.tsx`)

Server-side page that:

- Requires an authenticated user (redirects to `/login` otherwise)
- Fetches the initial calendar feed from `GET /api/calendar`
- Renders the client composition component `components/AvailabilityShell.tsx`

## Components

### `components/AppHeader.tsx`

Client component that renders:

- Breadcrumbs derived from the current pathname (via `usePathname`)
- Auth UI:
  - Logged out: `Login` link
  - Logged in: “Signed in as …” + `Logout` button (POSTs `/api/auth/logout`)
- Theme toggle:
  - Stores selection in `localStorage` under `theme` (`light` | `dark`)
  - Applies `dark`/`light` classes on the `<html>` element

### `components/AvailabilityShell.tsx`

Client composition/root for `/availability` that:

- Owns the fetched calendar feed state (`users`, `events`, `currentUserId`)
- Exposes “actions” through `CalendarActionsProvider`:
  - `refresh()`
  - `createEvent()`
  - `createAvailability()`
  - `rsvp()`
  - `deleteEvent()`
- Wraps the UI in `CalendarProvider` so the base calendar views work
- Renders:
  - `components/Sidebar.tsx` on the left
  - `components/CalendarShell.tsx` (calendar-only) on the right

### `components/Sidebar.tsx`

Client sidebar used on `/availability`:

- Has a simple tab switch:
  - **Non-availability**
  - **Event**
- Uses `useCalendarActions()` to call:
  - `createAvailability({ start, end, reason? })`
  - `createEvent({ title, description?, start, end, invitees })`
- Resets form state after successful creation.

### `components/CalendarShell.tsx`

Client calendar-only container:

- Manages the current view (`day|week|month|year|agenda`)
- Renders the base calendar `ClientContainer` and badge variant selector
- Assumes it is rendered inside `CalendarProvider` and `CalendarActionsProvider`

## Important implementation notes

### Refresh correctness

`CalendarProvider` previously used a local `events` state initialized from props, which meant refreshing the feed wouldn’t update the rendered calendar. It now syncs `localEvents` when the `events` prop changes (via `useEffect`), so `refresh()` updates are visible immediately.

### Dark mode

- Tailwind is configured with class-based dark mode (`darkMode: "class"`) via `tailwind.config.ts`.
- `app/globals.css` supports both system dark mode and explicit user override via `html.dark` / `html.light`.

## Steps to run

```bash
npm install
npm run dev
```

Open the app and navigate to `/availability` after logging in.


