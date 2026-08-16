import { useId } from "react";

export function KovaLogo({ className = "" }: { className?: string }) {
  const gradientId = useId().replace(/[^a-zA-Z0-9_-]/g, "");

  return (
    <svg
      viewBox="0 0 512 512"
      className={className}
      role="img"
      aria-label="KOVA AI"
    >
      <defs>
        <radialGradient id={gradientId} cx="50%" cy="42%" r="75%">
          <stop offset="0%" stopColor="#262626" />
          <stop offset="55%" stopColor="#101010" />
          <stop offset="100%" stopColor="#000000" />
        </radialGradient>
      </defs>
      <rect width="512" height="512" rx="118" fill={`url(#${gradientId})`} />
      <g fill="#FFFFFF">
        <path d="M156 108 H196 V268 L140 240 V140 Q140 108 156 108 Z" />
        <path d="M140 272 L196 300 V404 H140 Z" />
        <path d="M192 216 L384 124 L384 196 L192 268 Z" />
        <path d="M192 300 L384 316 L384 404 L192 384 Z" />
      </g>
    </svg>
  );
}
