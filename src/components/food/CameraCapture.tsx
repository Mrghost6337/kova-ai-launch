import { CameraOff, ImagePlus, Loader2, ScanLine, SwitchCamera } from "lucide-react";
import { useRef } from "react";
import { useCamera } from "@/hooks/use-camera";
import { cn } from "@/lib/utils";

/**
 * Premium live camera for Scan-with-AI. Full-screen on phones, a large framed
 * panel on desktop. Shows the real preview only — no fake camera states.
 */
export function CameraCapture({
  active,
  onCaptured,
  compact,
}: {
  active: boolean;
  onCaptured: (file: File) => void;
  /** Compact layout inside the desktop dialog. */
  compact?: boolean;
}) {
  const { videoRef, state, error, facing, facingSupported, flip, capture, openGalleryPicker } = useCamera(active);
  const busyRef = useRef(false);

  const handleCapture = async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    try {
      const file = await capture();
      if (file) onCaptured(file);
    } finally {
      busyRef.current = false;
    }
  };

  const shell = compact ? "rounded-[1.5rem]" : "flex-1";

  return (
    <div className={cn("relative overflow-hidden bg-black", shell)}>
      {/* Live preview */}
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className={cn(
          "size-full object-cover transition-opacity duration-500",
          facing === "user" && "-scale-x-100",
          state === "live" ? "opacity-100" : "opacity-0",
        )}
      />

      {/* Framing guide */}
      {state === "live" && (
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-x-8 top-1/2 -translate-y-1/2" style={{ aspectRatio: "4 / 3" }}>
            <span className="absolute left-0 top-0 h-7 w-7 rounded-tl-2xl border-l-2 border-t-2 border-white/70" />
            <span className="absolute right-0 top-0 h-7 w-7 rounded-tr-2xl border-r-2 border-t-2 border-white/70" />
            <span className="absolute bottom-0 left-0 h-7 w-7 rounded-bl-2xl border-b-2 border-l-2 border-white/70" />
            <span className="absolute bottom-0 right-0 h-7 w-7 rounded-br-2xl border-b-2 border-r-2 border-white/70" />
          </div>
          <p className="absolute inset-x-0 top-5 text-center text-[11px] font-medium uppercase tracking-[0.18em] text-white/60">
            Fill the frame with your meal
          </p>
        </div>
      )}

      {/* Non-live states */}
      {state === "requesting" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/70">
          <Loader2 className="size-7 animate-spin" />
          <p className="text-sm">Requesting camera access…</p>
        </div>
      )}
      {(state === "denied" || state === "error" || state === "unsupported") && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-8 text-center text-white/70">
          <CameraOff className="size-7 text-white/40" />
          <p className="text-sm leading-6">{error ?? "The camera is not available."}</p>
        </div>
      )}

      {/* Controls */}
      {state === "live" && (
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between px-7 pb-[max(env(safe-area-inset-bottom),20px)] pt-5">
          <button
            type="button"
            onClick={() => openGalleryPicker((file) => file && onCaptured(file))}
            className="flex size-12 items-center justify-center rounded-full bg-white/10 text-white/85 backdrop-blur-md transition-colors hover:bg-white/20"
            aria-label="Choose from gallery"
          >
            <ImagePlus className="size-5" />
          </button>
          <button
            type="button"
            onClick={() => void handleCapture()}
            className="group relative flex size-[76px] items-center justify-center rounded-full border-[3px] border-white/85 bg-white/10 backdrop-blur-sm transition-transform active:scale-95"
            aria-label="Capture photo"
          >
            <span className="size-[58px] rounded-full bg-white shadow-[0_4px_24px_rgba(255,255,255,0.35)] transition-transform group-active:scale-90" />
          </button>
          <button
            type="button"
            onClick={flip}
            disabled={!facingSupported}
            className={cn(
              "flex size-12 items-center justify-center rounded-full bg-white/10 text-white/85 backdrop-blur-md transition-colors hover:bg-white/20",
              !facingSupported && "opacity-30",
            )}
            aria-label="Switch camera"
          >
            <SwitchCamera className="size-5" />
          </button>
        </div>
      )}

      {/* Gallery escape hatch when camera is unavailable */}
      {state !== "live" && state !== "requesting" && (
        <div className="absolute inset-x-0 bottom-0 flex justify-center pb-[max(env(safe-area-inset-bottom),20px)] pt-5">
          <button
            type="button"
            onClick={() => openGalleryPicker((file) => file && onCaptured(file))}
            className="inline-flex h-12 items-center gap-2.5 rounded-full bg-white px-6 text-xs font-semibold uppercase tracking-[0.12em] text-black"
          >
            <ImagePlus className="size-4" />Choose from gallery
          </button>
        </div>
      )}

      {/* Brand mark */}
      {state === "live" && (
        <span className="pointer-events-none absolute left-5 top-5 inline-flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/80 backdrop-blur-md">
          <ScanLine className="size-3" />KOVA scan
        </span>
      )}
    </div>
  );
}
