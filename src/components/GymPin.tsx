export function GymPin({ dark, pulse = false }: { dark: boolean; pulse?: boolean }) {
  const pin = dark ? "#ffffff" : "#0a0a0a";
  const ring = dark ? "#0a0a0a" : "#ffffff";
  const dot = dark ? "#0a0a0a" : "#ffffff";
  return (
    <div className={`relative ${pulse ? "kova-pin-pulse" : ""}`}>
      {pulse && <span className="kova-pin-ring" />}
      <svg width="36" height="46" viewBox="0 0 36 46" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative drop-shadow-lg">
        <path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 28 18 28s18-14.5 18-28C36 8.06 27.94 0 18 0z" fill={pin} stroke={ring} strokeWidth="2" />
        <circle cx="18" cy="17" r="6.5" fill={dot} />
      </svg>
    </div>
  );
}