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
};

type MouseState = {
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  speed: number;
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
  const sizeRef = useRef({ w: 0, h: 0, offsetX: 0, offsetY: 0 });
  const mouseRef = useRef<MouseState>({
    x: -9999,
    y: -9999,
    prevX: -9999,
    prevY: -9999,
    speed: 0,
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

    const buildDots = (width: number, height: number) => {
      const props = propsRef.current;
      const step = props.dotRadius + props.dotSpacing;
      const columns = Math.floor(width / step);
      const rows = Math.floor(height / step);
      const padX = (width % step) / 2;
      const padY = (height % step) / 2;
      const dots = new Array<Dot>(rows * columns);
      let index = 0;

      for (let row = 0; row < rows; row += 1) {
        for (let column = 0; column < columns; column += 1) {
          const x = padX + column * step + step / 2;
          const y = padY + row * step + step / 2;
          dots[index] = { ax: x, ay: y, sx: x, sy: y, vx: 0, vy: 0, x, y };
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
      mouseRef.current.x = event.pageX - size.offsetX;
      mouseRef.current.y = event.pageY - size.offsetY;
    };

    const updateMouseSpeed = () => {
      const mouse = mouseRef.current;
      const dx = mouse.prevX - mouse.x;
      const dy = mouse.prevY - mouse.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      mouse.speed += (distance - mouse.speed) * 0.5;
      if (mouse.speed < 0.001) mouse.speed = 0;
      mouse.prevX = mouse.x;
      mouse.prevY = mouse.y;
    };

    const speedInterval = window.setInterval(updateMouseSpeed, 20);
    let frameCount = 0;

    const tick = () => {
      frameCount += 1;
      const dots = dotsRef.current;
      const mouse = mouseRef.current;
      const { w: width, h: height } = sizeRef.current;
      const props = propsRef.current;
      const time = frameCount * 0.02;
      const targetEngagement = Math.min(mouse.speed / 5, 1);

      engagementRef.current += (targetEngagement - engagementRef.current) * 0.06;
      if (engagementRef.current < 0.001) engagementRef.current = 0;
      const engagement = engagementRef.current;

      glowOpacityRef.current += (engagement - glowOpacityRef.current) * 0.08;
      if (glowRef.current) {
        glowRef.current.setAttribute("cx", String(mouse.x));
        glowRef.current.setAttribute("cy", String(mouse.y));
        glowRef.current.style.opacity = String(glowOpacityRef.current);
      }

      context.clearRect(0, 0, width, height);
      const gradient = context.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, props.gradientFrom);
      gradient.addColorStop(1, props.gradientTo);
      context.fillStyle = gradient;
      context.beginPath();

      const cursorRadiusSquared = props.cursorRadius * props.cursorRadius;
      const radius = props.dotRadius / 2;

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
            dot.sx += (dot.ax - Math.cos(angle) * push - dot.sx) * 0.15;
            dot.sy += (dot.ay - Math.sin(angle) * push - dot.sy) * 0.15;
          } else {
            const angle = Math.atan2(dy, dx);
            const move = (500 / Math.max(distance, 1)) * (mouse.speed * props.cursorForce);
            dot.vx += Math.cos(angle) * -move;
            dot.vy += Math.sin(angle) * -move;
          }
        } else if (props.bulgeOnly) {
          dot.sx += (dot.ax - dot.sx) * 0.1;
          dot.sy += (dot.ay - dot.sy) * 0.1;
        }

        if (!props.bulgeOnly) {
          dot.vx *= 0.9;
          dot.vy *= 0.9;
          dot.x = dot.ax + dot.vx;
          dot.y = dot.ay + dot.vy;
          dot.sx += (dot.x - dot.sx) * 0.1;
          dot.sy += (dot.y - dot.sy) * 0.1;
        }

        let drawX = dot.sx;
        let drawY = dot.sy;
        if (props.waveAmplitude > 0) {
          drawY += Math.sin(dot.ax * 0.03 + time) * props.waveAmplitude;
          drawX += Math.cos(dot.ay * 0.03 + time * 0.7) * props.waveAmplitude * 0.5;
        }

        const drawRadius = props.sparkle && ((index * 2654435761 ^ (frameCount >> 3)) >>> 0) % 100 < 3
          ? radius * 1.8
          : radius;
        context.moveTo(drawX + drawRadius, drawY);
        context.arc(drawX, drawY, drawRadius, 0, TWO_PI);
      }

      context.fill();
      rafRef.current = requestAnimationFrame(tick);
    };

    resizeCanvas();
    window.addEventListener("resize", scheduleResize);
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      window.clearInterval(speedInterval);
      if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current);
      window.removeEventListener("resize", scheduleResize);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;

    const rect = parent.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const props = propsRef.current;
    const step = props.dotRadius + props.dotSpacing;
    const columns = Math.floor(rect.width / step);
    const rows = Math.floor(rect.height / step);
    const padX = (rect.width % step) / 2;
    const padY = (rect.height % step) / 2;
    const dots: Dot[] = [];

    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const x = padX + column * step + step / 2;
        const y = padY + row * step + step / 2;
        dots.push({ ax: x, ay: y, sx: x, sy: y, vx: 0, vy: 0, x, y });
      }
    }
    dotsRef.current = dots;
  }, [dotRadius, dotSpacing]);

  return (
    <div className={["dot-field-container", className].filter(Boolean).join(" ")} {...rest}>
      <canvas ref={canvasRef} aria-hidden="true" />
      <svg aria-hidden="true" className="dot-field-glow">
        <defs>
          <radialGradient id={glowIdRef.current}>
            <stop offset="0%" stopColor={glowColor} />
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
