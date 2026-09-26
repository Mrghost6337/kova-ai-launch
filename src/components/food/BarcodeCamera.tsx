import { Loader2, ScanLine, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Live barcode scanning with the browser's BarcodeDetector API (Chrome/Edge
 * on Android & desktop; Safari falls back to the manual entry field).
 * Detection loop runs on the video frames and reports the first stable read.
 */

type DetectedBarcode = { rawValue: string };
type BarcodeDetectorLike = { detect: (source: CanvasImageSource) => Promise<DetectedBarcode[]> };
type BarcodeDetectorConstructor = new (options?: { formats?: string[] }) => BarcodeDetectorLike;

declare global {
  interface Window {
    BarcodeDetector?: BarcodeDetectorConstructor;
  }
}

const FORMATS = ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "itf"];

type CameraState = "starting" | "scanning" | "unsupported" | "denied" | "error";

export function BarcodeCamera({
  open,
  onClose,
  onDetected,
}: {
  open: boolean;
  onClose: () => void;
  onDetected: (barcode: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef(0);
  const lastScanRef = useRef(0);
  const [state, setState] = useState<CameraState>("starting");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    const stop = () => {
      cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };

    const start = async () => {
      setState("starting");
      setError(null);
      const Detector = window.BarcodeDetector;
      if (!Detector || !navigator.mediaDevices?.getUserMedia) {
        setState("unsupported");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        stop();
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
        }
        setState("scanning");

        const detector = new Detector({ formats: FORMATS });
        const tick = async () => {
          if (cancelled) return;
          const video = videoRef.current;
          if (video && video.readyState >= 2 && Date.now() - lastScanRef.current > 180) {
            lastScanRef.current = Date.now();
            try {
              const codes = await detector.detect(video);
              const value = codes[0]?.rawValue?.replace(/\D/g, "");
              if (value && value.length >= 6) {
                cancelled = true;
                stop();
                onDetected(value);
                return;
              }
            } catch {
              // Frame not decodable — keep scanning.
            }
          }
          if (!cancelled) rafRef.current = requestAnimationFrame(() => void tick());
        };
        rafRef.current = requestAnimationFrame(() => void tick());
      } catch (cause) {
        if (cause instanceof DOMException && cause.name === "NotAllowedError") {
          setState("denied");
        } else {
          setState("error");
          setError(cause instanceof Error ? cause.message : "The camera could not be started.");
        }
      }
    };

    void start();
    return () => {
      cancelled = true;
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  return (
    <div className="relative mt-3 overflow-hidden rounded-2xl border border-white/10 bg-black">
      <video ref={videoRef} playsInline muted className="aspect-[4/3] w-full object-cover" />
      {state === "scanning" && (
        <>
          <div className="pointer-events-none absolute inset-x-8 top-1/2 h-px -translate-y-1/2 bg-white/70 shadow-[0_0_12px_rgba(255,255,255,0.8)]" />
          <p className="pointer-events-none absolute inset-x-0 bottom-3 text-center text-[11px] text-white/80">Point at a barcode — scanning…</p>
        </>
      )}
      {state === "starting" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="size-6 animate-spin text-white/70" />
        </div>
      )}
      {(state === "unsupported" || state === "denied" || state === "error") && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 px-6 text-center">
          <ScanLine className="size-5 text-white/50" />
          <p className="text-sm text-white/85">{state === "denied" ? "Camera access was denied." : state === "error" ? "The camera could not start." : "Live barcode scanning is not supported in this browser."}</p>
          <p className="text-[11px] leading-4 text-white/45">Type the digits below the barcode instead.</p>
        </div>
      )}
      <button
        type="button"
        onClick={onClose}
        className={cn("absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-black/50 text-white/85 backdrop-blur-sm transition-colors hover:text-white")}
        aria-label="Close camera"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
