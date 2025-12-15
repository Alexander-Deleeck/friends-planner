"use client";

import { useState } from "react";

import { ClientContainer } from "@/components/base-calendar/client-container";
import { ChangeBadgeVariantInput } from "@/components/base-calendar/change-badge-variant-input";
import type { TCalendarView } from "@/types/types";

export default function CalendarShell() {
  const [view, setView] = useState<TCalendarView>("month");

  return (
    <div className="rounded-2xl border border-border bg-card shadow-xl">
      <div className="flex flex-col gap-3 border-b border-border px-4 py-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Calendar</p>
          <p className="text-sm text-muted-foreground">Switch badge styles to match the examples.</p>
        </div>
        <ChangeBadgeVariantInput />
      </div>
      <div className="p-2">
        <ClientContainer view={view} onChangeView={setView} />
      </div>
    </div>
  );
}

