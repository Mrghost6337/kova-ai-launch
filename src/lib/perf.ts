export type PerfTier = "high" | "low";

export type PerfInfo = {
  tier: PerfTier;
  lowPower: boolean;
  reducedMotion: boolean;
  dprCap: number;
};

let cached: PerfInfo | null = null;

/**
 * Detects the device's capability tier once per page load.
 *
 * - "low":  weak CPUs/RAM, or the user prefers reduced motion. Heavy visuals
 *           (full-screen WebGL, animated blurred orbs, dot-field simulation,
 *           scroll parallax) are frozen or simplified so weaker laptops stay
 *           smooth. The layout and look stay the same — only motion is reduced.
 * - "high": full visuals (animated silk, orbs, dot field, parallax).
 *
 * The tier never changes during a session, so it can be read as a plain
 * constant anywhere (including for gating hook calls).
 */
export function getPerf(): PerfInfo {
  if (cached) return cached;

  const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const nav = typeof navigator !== "undefined" ? navigator : undefined;
  const cores = nav?.hardwareConcurrency ?? 8;
  const deviceMemory = (nav as { deviceMemory?: number } | undefined)?.deviceMemory ?? 8;
  const lowPower = cores <= 4 || deviceMemory <= 4;

  const tier: PerfTier = reducedMotion || lowPower ? "low" : "high";

  cached = { tier, lowPower, reducedMotion, dprCap: tier === "low" ? 1 : 2 };
  return cached;
}
