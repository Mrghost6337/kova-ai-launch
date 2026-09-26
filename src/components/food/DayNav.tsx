import { ArrowLeft, ArrowRight } from "lucide-react";
import { todayKey } from "@/hooks/use-nutrition";
import { cn } from "@/lib/utils";

/** Shifts a YYYY-MM-DD key by the given number of days (local time). */
export function shiftDateKey(date: string, days: number): string {
  const next = new Date(`${date}T12:00:00`);
  next.setDate(next.getDate() + days);
  return todayKey(next);
}

export function DayNav({ date, onChange }: { date: string; onChange: (next: string) => void }) {
  const today = todayKey();
  const relative =
    date === today ? "Today" : date === shiftDateKey(today, -1) ? "Yesterday" : date === shiftDateKey(today, 1) ? "Tomorrow" : null;
  const pretty = new Date(`${date}T12:00:00`).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.035] p-1">
      <button
        type="button"
        onClick={() => onChange(shiftDateKey(date, -1))}
        className="flex size-9 items-center justify-center rounded-full text-white/50 transition-colors hover:bg-white/[0.08] hover:text-white"
        aria-label="Previous day"
      >
        <ArrowLeft className="size-4" />
      </button>
      <div className="min-w-[150px] text-center">
        {relative && <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/40">{relative}</p>}
        <p className={cn("text-xs text-white/75", !relative && "py-1")}>{pretty}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(shiftDateKey(date, 1))}
        disabled={date >= today}
        className="flex size-9 items-center justify-center rounded-full text-white/50 transition-colors hover:bg-white/[0.08] hover:text-white disabled:opacity-25 disabled:hover:bg-transparent disabled:hover:text-white/50"
        aria-label="Next day"
      >
        <ArrowRight className="size-4" />
      </button>
    </div>
  );
}
