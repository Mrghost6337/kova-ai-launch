import { useEffect, useState } from "react";

/**
 * True only on phone-sized screens (≤767px). Tablets and desktop stay on the
 * existing desktop/tablet interface — the mobile app shell never activates
 * above the breakpoint.
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(max-width: 767px)").matches : false,
  );

  useEffect(() => {
    const query = window.matchMedia("(max-width: 767px)");
    const update = (event: MediaQueryListEvent | MediaQueryList) => setIsMobile(event.matches);
    update(query);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return isMobile;
}
