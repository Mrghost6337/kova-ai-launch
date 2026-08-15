import { memo, useEffect, useRef, type HTMLAttributes } from "react";
import "./DotField.css";

const TWO_PI = Math.PI * 2;

type DotFieldProps = HTMLAttributes<HTMLDivElement> & {
  dotRadius?: number;
  dotSpacing?: number;
  cursorRadius?: number;
  cursorForce?: number;
  bulgeOnly?: boolean;
  bulgeStrength?: number;
  glowRadius?: number;
  sparkle?: boolean;
  waveAmplitude?: number;
  gradientFrom?: string;
  gradientTo?: string;
  glowColor?: string;
};

type Dot = {
  ax: number;
  ay: number;
  sx: number;
  sy: number;
  vx: number;
  vy: number;
  x: number;
  y: number;
  phase: number;
  size: number;
};

type MouseState = {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  prevTargetX: number;
  prevTargetY: number;
  speed: number;
  inside: boolean;
};

const DotField = memo(function DotField({
  dotRadius = 1.5,
  dotSpacing = 14,
  cursorRadius = 500,
  cursorForce = 0.1,
  bulgeOnly = true,
  bulgeStrength = 67,
  glowRadius = 160,
  sparkle = false,
  waveAmplitude = 0,
  gradientFrom = "rgba(255, 255, 255, 0.14)",
  gradientTo = "rgba(255, 255, 255, 0.025)",
  glowColor = "#ffffff",
  className,
  ...rest
}: DotFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glowRef = useRef<SVGCircleElement>(null);
  const dotsRef = useRef<Dot[]>([]);
  const rafRef = useRef<number | null>(null);
  const resizeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rebuildRef = useRef<(() => void) | null>(null);
  const sizeRef = useRef({ w: 0, h: 0, offsetX: 0, offsetY: 0 });
  const mouseRef = useRef<MouseState>({
    x: -9999,
    y: -9999,
    targetX: -9999,
    targetY: -9999,
    prevTargetX: -9999,
    prevTargetY: -9999,
    speed: 0,
    inside: false,
  });
  const glowOpacityRef = useRef(0);
  const engagementRef = useRef(0);
  const propsRef = useRef({
    dotRadius,
    dotSpacing,
    cursorRadius,
    cursorForce,
    bulgeOnly,
    bulgeStrength,
    sparkle,
    waveAmplitude,
    gradientFrom,
    gradientTo,
  });
  propsRef.current = {
    dotRadius,
    dotSpacing,
    cursorRadius,
    cursorForce,
    bulgeOnly,
    bulgeStrength,
    sparkle,
    waveAmplitude,
    gradientFrom,
    gradientTo,
  };

  const glowIdRef = useRef(`dot-field-glow-${Math.random().toString(36).slice(2, 9)}`);

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;

    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const buildDots = (width: number, height: number) => {
      const props = propsRef.current;
      const step = Math.max(props.dotRadius * 2 + 2, props.dotSpacing);
      const columns = Math.ceil(width / step) + 1;
      const rows = Math.ceil(height / step) + 1;
      const padX = (width - (columns - 1) * step) / 2;
      const padY = (height - (rows - 1) * step) / 2;
      const dots = new Array<Dot>(rows * columns);
      let index = 0;

      for (let row = 0; row < rows; row += 1) {
        for (let column = 0; column < columns; column += 1) {
          const x = padX + column * step;
          const y = padY + row * step;
          const seed = (row * 17 + column * 31) % 100;
          dots[index] = {
            ax: x,
            ay: y,
            sx: x,
            sy: y,
            vx: 0,
            vy: 0,
            x,
            y,
            phase: ((row * 0.87 + column * 1.31) % 12) * 0.52,
            size: 0.72 + seed / 330,
          };
          index += 1;
        }
      }

      dotsRef.current = dots;
    };

    const resizeCanvas = () => {
      const rect = parent.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      sizeRef.current = {
        w: width,
        h: height,
        offsetX: rect.left + window.scrollX,
        offsetY: rect.top + window.scrollY,
      };

      buildDots(width, height);
    };

    const scheduleResize = () => {
      if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current);
      resizeTimerRef.current = setTimeout(resizeCanvas, 100);
    };

    const handleMouseMove = (event: MouseEvent) => {
      const size = sizeRef.current;
      const x = event.pageX - size.offsetX;
      const y = event.pageY - size.offsetY;
      const inside = x >= -40 && x <= size.w + 40 && y >= -40 && y <= size.h + 40;
      const mouse = mouseRef.current;

      mouse.inside = inside;
      if (inside) {
        mouse.targetX = x;
        mouse.targetY = y;
      }
    };

    const updateMouseSpeed = () => {
      const mouse = mouseRef.current;
      if (!mouse.inside) {
        mouse.speed *= 0.86;
        return;
      }

      const dx = mouse.prevTargetX - mouse.targetX;
      const dy = mouse.prevTargetY - mouse.targetY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      mouse.speed += (Math.min(distance, 40) - mouse.speed) * 0.35;
      if (mouse.speed < 0.001) mouse.speed = 0;
      mouse.prevTargetX = mouse.targetX;
      mouse.prevTargetY = mouse.targetY;
    };

    const speedInterval = window.setInterval(updateMouseSpeed, 20);
    let frameCount = 0;

    const tick = () => {
      frameCount += 1;
      const dots = dotsRef.current;
      const mouse = mouseRef.current;
      const { w: width, h: height } = sizeRef.current;
      const props = propsRef.current;
      const time = frameCount * (reducedMotion ? 0 : 0.014);
      const motionScale = reducedMotion ? 0 : 1;
      const targetEngagement = mouse.inside ? Math.min(0.28 + mouse.speed / 16, 1) : 0;

      mouse.x += (mouse.targetX - mouse.x) * 0.14;
      mouse.y += (mouse.targetY - mouse.y) * 0.14;
      engagementRef.current += (targetEngagement - engagementRef.current) * 0.075;
      if (engagementRef.current < 0.001) engagementRef.current = 0;
      const engagement = engagementRef.current;

      glowOpacityRef.current += (engagement - glowOpacityRef.current) * 0.08;
      if (glowRef.current) {
        glowRef.current.setAttribute("cx", String(mouse.x));
        glowRef.current.setAttribute("cy", String(mouse.y));
        glowRef.current.style.opacity = String(glowOpacityRef.current * 0.7);
      }

      context.clearRect(0, 0, width, height);

      const ambient = context.createRadialGradient(
        width * 0.5,
        height * 0.38,
        0,
        width * 0.5,
        height * 0.38,
        Math.max(width, height) * 0.8,
      );
      ambient.addColorStop(0, "rgba(255, 255, 255, 0.045)");
      ambient.addColorStop(0.48, "rgba(255, 255, 255, 0.012)");
      ambient.addColorStop(1, "rgba(0, 0, 0, 0)");
      context.fillStyle = ambient;
      context.fillRect(0, 0, width, height);

      const gradient = context.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, props.gradientFrom);
      gradient.addColorStop(0.48, "rgba(255, 255, 255, 0.07)");
      gradient.addColorStop(1, props.gradientTo);
      context.fillStyle = gradient;
      context.beginPath();

      const cursorRadiusSquared = props.cursorRadius * props.cursorRadius;
      const baseRadius = props.dotRadius / 2;

      for (let index = 0; index < dots.length; index += 1) {
        const dot = dots[index];
        const dx = mouse.x - dot.ax;
        const dy = mouse.y - dot.ay;
        const distanceSquared = dx * dx + dy * dy;

        if (distanceSquared < cursorRadiusSquared && engagement > 0.01) {
          const distance = Math.sqrt(distanceSquared);
          if (props.bulgeOnly) {
            const influence = 1 - distance / props.cursorRadius;
            const push = influence * influence * props.bulgeStrength * engagement;
            const angle = Math.atan2(dy, dx);
            dot.sx += (dot.ax - Math.cos(angle) * push - dot.sx) * 0.16;
            dot.sy += (dot.ay - Math.sin(angle) * push - dot.sy) * 0.16;
          } else {
            const angle = Math.atan2(dy, dx);
            const move = (500 / Math.max(distance, 1)) * (mouse.speed * props.cursorForce);
            dot.vx += Math.cos(angle) * -move;
            dot.vy += Math.sin(angle) * -move;
          }
        } else if (props.bulgeOnly) {
          dot.sx += (dot.ax - dot.sx) * 0.085;
          dot.sy += (dot.ay - dot.sy) * 0.085;
        }

        if (!props.bulgeOnly) {
          dot.vx *= 0.9;
          dot.vy *= 0.9;
          dot.x = dot.ax + dot.vx;
          dot.y = dot.ay + dot.vy;
          dot.sx += (dot.x - dot.sx) * 0.1;
          dot.sy += (dot.y - dot.sy) * 0.1;
        }

        const edgeFade = Math.min(
          1,
          Math.max(0, dot.sx / 100),
          Math.max(0, (width - dot.sx) / 100),
          Math.max(0, dot.sy / 100),
          Math.max(0, (height - dot.sy) / 100),
        );
        if (edgeFade <= 0.02) continue;

        const wave = Math.sin(dot.ax * 0.018 + time + dot.phase) * props.waveAmplitude * motionScale;
        const drawX = dot.sx + Math.cos(dot.ay * 0.014 + time * 0.7 + dot.phase) * props.waveAmplitude * 0.28 * motionScale;
        const drawY = dot.sy + wave;
        const pulse = 0.9 + Math.sin(time * 1.4 + dot.phase) * 0.08 * motionScale;
        const drawRadius = baseRadius * dot.size * edgeFade * pulse;

        context.moveTo(drawX + drawRadius, drawY);
        context.arc(drawX, drawY, drawRadius, 0, TWO_PI);
      }

      context.globalAlpha = 0.95;
      context.fill();
      context.globalAlpha = 1;

      context.beginPath();
      for (let index = 0; index < dots.length; index += 29) {
        const dot = dots[index];
        const drawX = dot.sx;
        const drawY = dot.sy + Math.sin(dot.ax * 0.018 + time + dot.phase) * props.waveAmplitude * motionScale;
        const edgeFade = Math.min(1, Math.max(0, drawX / 120), Math.max(0, (width - drawX) / 120), Math.max(0, drawY / 120), Math.max(0, (height - drawY) / 120));
        const highlightRadius = baseRadius * (1.5 + Math.sin(time + dot.phase) * 0.25) * edgeFade;
        if (highlightRadius > 0.02) {
          context.moveTo(drawX + highlightRadius, drawY);
          context.arc(drawX, drawY, highlightRadius, 0, TWO_PI);
        }
      }
      context.fillStyle = "rgba(255, 255, 255, 0.22)";
      context.globalCompositeOperation = "screen";
      context.globalAlpha = 0.65;
      context.fill();
      context.globalAlpha = 1;
      context.globalCompositeOperation = "source-over";

      rafRef.current = requestAnimationFrame(tick);
    };

    resizeCanvas();
    rebuildRef.current = () => {
      const { w, h } = sizeRef.current;
      if (w > 0 && h > 0) buildDots(w, h);
    };

    const resizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resizeCanvas) : null;
    resizeObserver?.observe(parent);
    window.addEventListener("resize", scheduleResize);
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      window.clearInterval(speedInterval);
      if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current);
      resizeObserver?.disconnect();
      window.removeEventListener("resize", scheduleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      rebuildRef.current = null;
    };
  }, []);

  useEffect(() => {
    rebuildRef.current?.();
  }, [dotRadius, dotSpacing]);

  return (
    <div className={["dot-field-container", className].filter(Boolean).join(" ")} {...rest}>
      <canvas ref={canvasRef} aria-hidden="true" />
      <svg aria-hidden="true" className="dot-field-glow">
        <defs>
          <radialGradient id={glowIdRef.current}>
            <stop offset="0%" stopColor={glowColor} />
            <stop offset="42%" stopColor={glowColor} stopOpacity="0.18" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>
        <circle
          ref={glowRef}
          cx="-9999"
          cy="-9999"
          r={glowRadius}
          fill={`url(#${glowIdRef.current})`}
          style={{ opacity: 0, willChange: "opacity" }}
        />
      </svg>
    </div>
  );
});

DotField.displayName = "DotField";

export default DotField;
