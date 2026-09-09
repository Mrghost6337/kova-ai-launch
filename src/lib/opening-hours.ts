// Compact parser for the common OpenStreetMap `opening_hours` patterns used by gyms.
// Full OSM syntax (holidays, weeks, comments) is intentionally out of scope: when a
// rule cannot be parsed we return "unknown" instead of guessing wrong.

export type HoursEntry = { days: number[]; ranges: Array<[number, number]> };
export type GymHours = HoursEntry[];

const DAY_INDEX: Record<string, number> = { mo: 0, tu: 1, we: 2, th: 3, fr: 4, sa: 5, su: 6 };
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function parseOpeningHours(value: string | null | undefined): GymHours | null {
  if (!value) return null;
  const cleaned = value.replace(/\([^)]*\)/g, "").toLowerCase().trim();
  if (!cleaned) return null;
  if (cleaned === "24/7" || cleaned === "24h" || cleaned === "open" || cleaned === "always") {
    return [{ days: [0, 1, 2, 3, 4, 5, 6], ranges: [[0, 1440]] }];
  }

  const schedule: GymHours = [];
  for (const rawRule of cleaned.split(";")) {
    const rule = rawRule.trim();
    if (!rule || rule.includes("off") || rule === "closed") continue;

    const ranges: Array<[number, number]> = [];
    const timeRe = /(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/g;
    let dayPart = rule;
    let match: RegExpExecArray | null;
    while ((match = timeRe.exec(rule)) !== null) {
      const start = Number(match[1]) * 60 + Number(match[2]);
      let end = Number(match[3]) * 60 + Number(match[4]);
      if (end <= start) end += 1440; // crosses midnight
      ranges.push([start, end]);
      dayPart = dayPart.replace(match[0], " ");
    }
    if (!ranges.length) continue;

    dayPart = dayPart.replace(/[,/]+/g, " ").replace(/\s+/g, " ").trim();
    let days: number[];
    if (!dayPart) {
      days = [0, 1, 2, 3, 4, 5, 6];
    } else {
      const expanded = expandDayExpression(dayPart);
      if (!expanded) return null; // unparseable day expression -> unknown
      days = expanded;
    }
    schedule.push({ days, ranges });
  }

  return schedule.length ? schedule : null;
}

function expandDayExpression(expr: string): number[] | null {
  const out = new Set<number>();
  for (const token of expr.split(" ")) {
    if (!token) continue;
    const m = token.match(/^([a-z]{2})(?:-([a-z]{2}))?$/);
    if (!m) return null;
    const a = DAY_INDEX[m[1]];
    const b = m[2] ? DAY_INDEX[m[2]] : a;
    if (a === undefined || b === undefined) return null;
    let i = a;
    for (;;) {
      out.add(i);
      if (i === b) break;
      i = (i + 1) % 7;
      if (i === a) break;
    }
  }
  return out.size ? [...out] : null;
}

function fmtTime(minutes: number): string {
  const m = ((minutes % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

function formatRange(start: number, end: number): string {
  const close = end > 1440 ? end - 1440 : end;
  return `${fmtTime(start)} – ${fmtTime(close)}`;
}

export type GymStatus = {
  state: "open" | "closed" | "unknown";
  statusLabel: string;
  hoursToday: string | null;
  nextChange: string | null;
};

export function gymStatus(openingHours: string | null | undefined, now: Date): GymStatus {
  const schedule = parseOpeningHours(openingHours);
  if (!schedule) return { state: "unknown", statusLabel: "Hours unknown", hoursToday: null, nextChange: null };

  const todayIndex = (now.getDay() + 6) % 7; // Mo = 0 .. Su = 6
  const minutes = now.getHours() * 60 + now.getMinutes();
  const today = schedule.filter((entry) => entry.days.includes(todayIndex));

  const isInRange = (start: number, end: number) =>
    end > 1440 ? minutes >= start || minutes < end - 1440 : minutes >= start && minutes < end;

  const openNow = today.some((entry) => entry.ranges.some(([start, end]) => isInRange(start, end)));
  const hoursToday = today.length
    ? [...new Set(today.flatMap((entry) => entry.ranges.map(([s, e]) => formatRange(s, e))))].join(", ")
    : "Closed";

  if (openNow) {
    let closes: number | null = null;
    for (const entry of today) {
      for (const [start, end] of entry.ranges) {
        if (!isInRange(start, end)) continue;
        const close = end > 1440 ? end - 1440 : end;
        closes = closes === null ? close : Math.min(closes, close);
      }
    }
    return {
      state: "open",
      statusLabel: "Open now",
      hoursToday,
      nextChange: closes !== null ? `Closes ${fmtTime(closes)}` : null,
    };
  }

  // Closed: find the next opening time today, then tomorrow, then later this week.
  for (let offset = 0; offset <= 7; offset++) {
    const day = (todayIndex + offset) % 7;
    const entries = schedule.filter((entry) => entry.days.includes(day));
    const candidates = entries
      .flatMap((entry) => entry.ranges.map(([start]) => start))
      .filter((start) => (offset === 0 ? start > minutes : true))
      .sort((a, b) => a - b);
    if (candidates.length) {
      const first = candidates[0];
      const when = offset === 0 ? `Opens ${fmtTime(first)}` : offset === 1 ? `Opens tomorrow ${fmtTime(first)}` : `Opens ${DAY_NAMES[day]} ${fmtTime(first)}`;
      return { state: "closed", statusLabel: "Closed now", hoursToday, nextChange: when };
    }
  }

  return { state: "closed", statusLabel: "Closed now", hoursToday, nextChange: null };
}