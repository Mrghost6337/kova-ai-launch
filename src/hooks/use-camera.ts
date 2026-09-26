import { useCallback, useEffect, useRef, useState } from "react";

export type CameraState = "idle" | "requesting" | "live" | "denied" | "error" | "unsupported";

/**
 * Live camera access for the Scan-with-AI flow.
 *
 * Handles permission request, stream lifecycle, front/rear switching and
 * still capture to a File. Never renders a fake preview — callers render
 * video only when state === "live".
 */
export function useCamera(active: boolean) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [state, setState] = useState<CameraState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [facing, setFacing] = useState<"user" | "environment">("environment");
  const [facingSupported, setFacingSupported] = useState(false);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const start = useCallback(
    async (mode: "user" | "environment") => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setState("unsupported");
        return;
      }
      setState("requesting");
      setError(null);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: mode }, width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false,
        });
        stop();
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
        }
        setState("live");
        setFacing(mode);
        const devices = await navigator.mediaDevices.enumerateDevices().catch(() => []);
        setFacingSupported(devices.filter((device) => device.kind === "videoinput").length > 1);
      } catch (cause) {
        if (cause instanceof DOMException) {
          if (cause.name === "NotAllowedError") {
            setState("denied");
            setError("Camera access was denied. Enable it in your browser settings, or choose a photo from your gallery instead.");
            return;
          }
          if (cause.name === "NotFoundError" || cause.name === "OverconstrainedError") {
            setState("error");
            setError("No camera was found on this device. Choose a photo from your gallery instead.");
            return;
          }
        }
        setState("error");
        setError(cause instanceof Error ? cause.message : "The camera could not be started.");
      }
    },
    [stop],
  );

  // Start when the scanner becomes active; stop when it closes.
  useEffect(() => {
    if (active) void start("environment");
    else stop();
    return () => stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  // Stop the stream when the tab is backgrounded so the camera light goes out.
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) stop();
      else if (active) void start(facing);
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [active, facing, start, stop]);

  const flip = useCallback(() => {
    void start(facing === "environment" ? "user" : "environment");
  }, [facing, start]);

  /** Capture the current frame as a JPEG File (front camera is mirrored). */
  const capture = useCallback(
    async (): Promise<File | null> => {
      const video = videoRef.current;
      const stream = streamRef.current;
      if (!video || !stream || state !== "live") return null;
      const width = video.videoWidth || 1080;
      const height = video.videoHeight || 1440;
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) return null;
      if (facing === "user") {
        context.translate(width, 0);
        context.scale(-1, 1);
      }
      context.drawImage(video, 0, 0, width, height);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
      if (!blob) return null;
      return new File([blob], `kova-scan-${Date.now()}.jpg`, { type: "image/jpeg" });
    },
    [facing, state],
  );

  /** Opens the OS gallery/file picker; delivers the chosen file via callback. */
  const openGalleryPicker = useCallback((onPick: (file: File | null) => void) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = () => {
      onPick(input.files?.[0] ?? null);
    };
    input.click();
  }, []);

  return { videoRef, state, error, facing, facingSupported, flip, capture, start, stop, openGalleryPicker };
}
