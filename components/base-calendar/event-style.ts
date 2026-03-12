import { cva } from "class-variance-authority";
import type { IEvent } from "@/types/interfaces";
import type { TBadgeVariant } from "@/types/types";

// Base styles shared by all event variants (pastel + translucent glass)
const baseEventStyles =
  "backdrop-blur-sm transition-all shadow-sm ring-1 ring-inset ring-opacity-25 hover:shadow-md hover:ring-opacity-40 select-none";

// Map each color to a pastel class set (bg-500/15 + text-800 + ring-500/25)
// Adjust "gray" for non-availability to be distinct (e.g. diagonal stripes or muted glass)
const pastelColorMap: Record<string, string> = {
  blue: "bg-blue-500/15 text-blue-700 dark:text-blue-300 ring-blue-500/25",
  green: "bg-green-500/15 text-green-700 dark:text-green-300 ring-green-500/25",
  red: "bg-red-500/15 text-red-700 dark:text-red-300 ring-red-500/25",
  yellow: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-300 ring-yellow-500/25",
  purple: "bg-purple-500/15 text-purple-700 dark:text-purple-300 ring-purple-500/25",
  orange: "bg-orange-500/15 text-orange-700 dark:text-orange-300 ring-orange-500/25",
  gray: "bg-zinc-500/15 text-zinc-700 dark:text-zinc-300 ring-zinc-500/25",
};

// Dot variants (lighter background, colored dot)
const dotColorMap: Record<string, string> = {
  blue: "[&_.event-dot]:fill-blue-500",
  green: "[&_.event-dot]:fill-green-500",
  red: "[&_.event-dot]:fill-red-500",
  yellow: "[&_.event-dot]:fill-yellow-500",
  purple: "[&_.event-dot]:fill-purple-500",
  orange: "[&_.event-dot]:fill-orange-500",
  gray: "[&_.event-dot]:fill-zinc-500",
};

export const getEventClasses = (event: IEvent, badgeVariant: TBadgeVariant) => {
  const isDot = badgeVariant === "dot";
  const colorKey = event.color || "blue";

  if (isDot) {
    // Dot style: cleaner background, colored SVG dot
    return `bg-background/80 border border-border/50 text-foreground ${dotColorMap[colorKey] ?? dotColorMap.blue}`;
  }

  // Colored / Mixed style: use pastel map
  // If unavailable, force gray pastel
  if (event.kind === "availability") {
    return pastelColorMap.gray;
  }

  return pastelColorMap[colorKey] ?? pastelColorMap.blue;
};

