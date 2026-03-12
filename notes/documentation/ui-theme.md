# UI Theme Documentation (Pastel Glass)

This app uses a custom visual system built on Tailwind v4.1 semantics.

## Tokens & Theme

Defined in `app/globals.css` via `@theme inline`. We map CSS variables to standard semantic classes.

- **Radius**: `rounded-sm` (0.6rem) for primitives, `rounded-lg` for cards.
- **Backgrounds**: Layered and translucent.
  - Page: `bg-background` (with subtle gradient in light mode)
  - Card: `bg-card/60 backdrop-blur-md`
- **Borders**: Softened. Use `border-border/40` or `divide-border/40`.

## Primitives

UI components (`components/ui/*`) are customized:

- **Buttons**: `rounded-sm`, softer outline variant (`bg-background/60`).
- **Inputs**: `rounded-sm`, `bg-background/60`, `backdrop-blur-sm`.
- **Badges**: `rounded-sm`, soft borders.

## Event Styling

Events use a **pastel + glass** aesthetic.

- Helper: `components/base-calendar/event-style.ts` -> `getEventClasses(event, variant)`
- Logic:
  - Maps standard colors (blue, green, etc.) to `bg-{color}-500/15 text-{color}-800 ring-{color}-500/25`
  - Adds `backdrop-blur-sm` and `hover:shadow-md`
  - **Availability** events are special-cased to use a neutral gray pastel style rather than a black bar.

### Adding a new color

1. Add the color to the `pastelColorMap` in `components/base-calendar/event-style.ts`.
2. Ensure the color exists in your Tailwind theme or is a standard Tailwind color.
3. Update types in `types/types.ts` if needed.

