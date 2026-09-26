import { AnimatePresence, motion } from "framer-motion";
import { Check, Loader2, X } from "lucide-react";
import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/use-theme";
import type { Theme } from "@/hooks/use-theme";

/* ————————————————————————————————————————————————————————————————————————
   KOVA liquid-glass primitives. One visual system for the whole app:
   GlassButton, GlassCard, GlassChip, GlassField, GlassToggle, ThemeSwitch,
   GlassSegmented, GlassSkeleton, GlassProgress, GlassMetric, GlassModal.
   Mobile keeps its own shell; these primitives are safe there too.
   ———————————————————————————————————————————————————————————————————————— */

/* ——— Button ————————————————————————————————————————————————————————— */

type GlassButtonVariant = "solid" | "primary" | "ghost" | "danger";

const BUTTON_VARIANTS: Record<GlassButtonVariant, string> = {
  solid: "glass-btn--solid",
  primary: "glass-btn--primary",
  ghost: "glass-btn--ghost",
  danger: "glass-btn--danger",
};

export interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: GlassButtonVariant;
  size?: "sm" | "md" | "lg";
  busy?: boolean;
}

export function GlassButton({
  variant = "ghost",
  size = "md",
  busy = false,
  className,
  children,
  disabled,
  ...rest
}: GlassButtonProps) {
  const sizeClass =
    size === "sm" ? "h-9 px-4" : size === "lg" ? "h-13 px-7" : "h-11 px-5";
  return (
    <button
      type="button"
      disabled={disabled || busy}
      className={cn("glass-btn t-btn", BUTTON_VARIANTS[variant], sizeClass, className)}
      {...rest}
    >
      {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
      {children}
    </button>
  );
}

/* ——— Card ——————————————————————————————————————————————————————————— */

export function GlassCard({
  className,
  interactive = false,
  children,
  ...rest
}: { interactive?: boolean } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("glass-card", interactive && "glass-card--hover", className)}
      {...rest}
    >
      {children}
    </div>
  );
}

export function SectionHeader({
  icon: Icon,
  label,
  action,
}: {
  icon?: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        {Icon ? <Icon className="size-3.5 text-white/40" strokeWidth={1.7} /> : null}
        <span className="t-label">{label}</span>
      </div>
      {action}
    </div>
  );
}

/* ——— Chip ——————————————————————————————————————————————————————————— */

export interface GlassChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
}

export function GlassChip({ selected = false, className, children, ...rest }: GlassChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn("glass-chip h-9 px-4 text-xs font-medium", className)}
      {...rest}
    >
      {children}
    </button>
  );
}

/* ——— Fields ————————————————————————————————————————————————————————— */

export interface GlassFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
}

export function GlassField({ label, hint, className, id, ...rest }: GlassFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  return (
    <label htmlFor={fieldId} className="block">
      {label ? <span className="mb-2 block text-xs text-white/45">{label}</span> : null}
      <input id={fieldId} className={cn("glass-field h-12 px-4 text-sm", className)} {...rest} />
      {hint ? <span className="mt-1.5 block text-[11px] text-white/30">{hint}</span> : null}
    </label>
  );
}

export function GlassTextarea({
  label,
  className,
  id,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  return (
    <label htmlFor={fieldId} className="block">
      {label ? <span className="mb-2 block text-xs text-white/45">{label}</span> : null}
      <textarea id={fieldId} className={cn("glass-field min-h-28 resize-y p-4 text-sm leading-6", className)} {...rest} />
    </label>
  );
}

/* ——— Toggle switch (physical glass) ————————————————————————————————— */

export function GlassToggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="glass-toggle-track"
    >
      <span className="glass-toggle-knob" />
    </button>
  );
}

export function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-6 py-4">
      <span className="min-w-0">
        <span className="block text-sm text-white/75">{label}</span>
        <span className="mt-1 block text-xs leading-5 text-white/35">{description}</span>
      </span>
      <GlassToggle checked={checked} onChange={onChange} label={label} />
    </div>
  );
}

/* ——— Theme switch ——————————————————————————————————————————————————— */

const THEME_OPTIONS: Array<{ value: Theme; label: string; icon: typeof Check }> = [
  { value: "dark", label: "Dark", icon: X },
  { value: "light", label: "Light", icon: Check },
  { value: "system", label: "Auto", icon: Check },
];

export function ThemeSwitch({ className }: { className?: string }) {
  const { theme, resolved, setTheme } = useTheme();
  return (
    <div className={cn("theme-switch", className)} role="radiogroup" aria-label="Theme">
      <span
        className="theme-switch__thumb transition-all duration-500 [transition-timing-function:var(--ease-app)]"
        style={{
          width: `calc((100% - 6px) / ${THEME_OPTIONS.length})`,
          left: `calc(${THEME_OPTIONS.findIndex((option) => option.value === theme)} * (100% - 6px) / ${THEME_OPTIONS.length} + 3px)`,
        }}
        aria-hidden
      />
      {THEME_OPTIONS.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={theme === value}
          onClick={() => setTheme(value)}
          className={cn(
            "relative z-10 flex-1 rounded-full px-4 py-1.5 text-xs font-medium transition-colors",
            theme === value
              ? resolved === "light"
                ? "text-[rgba(12,12,15,0.9)]"
                : "text-white"
              : "text-white/45 hover:text-white/75",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

/* ——— Segmented control ————————————————————————————————————————————— */

export function GlassSegmented<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  const index = Math.max(0, options.findIndex((option) => option.value === value));
  return (
    <div className={cn("glass-segmented", className)} role="tablist">
      <span
        className="glass-segmented__thumb transition-all duration-500 [transition-timing-function:var(--ease-app)]"
        style={{
          width: `calc((100% - 6px) / ${options.length})`,
          left: `calc(${index} * (100% - 6px) / ${options.length} + 3px)`,
        }}
        aria-hidden
      />
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={option.value === value}
          data-active={option.value === value}
          onClick={() => onChange(option.value)}
          className="glass-segmented__item"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

/* ——— Skeletons ——————————————————————————————————————————————————————— */

export function GlassSkeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} aria-hidden />;
}

/* ——— Progress ———————————————————————————————————————————————————————— */

export function GlassProgress({
  value,
  tone = "default",
  className,
}: {
  /** 0–100 */
  value: number;
  tone?: "default" | "over";
  className?: string;
}) {
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("h-1.5 overflow-hidden rounded-full bg-white/[0.08]", className)}
    >
      <div
        className={cn(
          "h-full rounded-full transition-all duration-700 [transition-timing-function:var(--ease-app)]",
          tone === "over" ? "bg-[var(--accent-rose)]" : "bg-white/85",
        )}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

/* ——— Metric ————————————————————————————————————————————————————————— */

export function GlassMetric({
  value,
  caption,
  className,
}: {
  value: ReactNode;
  caption: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="t-metric text-4xl">{value}</p>
      <p className="t-caption mt-2">{caption}</p>
    </div>
  );
}

/* ——— Modal ——————————————————————————————————————————————————————————— */

const ModalStackContext = createContext<{ register: () => () => void } | null>(null);

export function useModalStack() {
  const context = useContext(ModalStackContext);
  const stackRef = useRef(new Set<symbol>());
  if (!context) return { hasOpenModals: () => false };
  return {
    hasOpenModals: () => stackRef.current.size > 0,
  };
}

export function GlassModal({
  open,
  onClose,
  title,
  eyebrow,
  children,
  width = "max-w-2xl",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  eyebrow?: string;
  children: ReactNode;
  width?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className="fixed inset-0 z-[70] overflow-y-auto bg-black/70 backdrop-blur-md"
          onClick={onClose}
        >
          <div className="flex min-h-full items-center justify-center p-4 sm:p-8">
            <motion.div
              initial={{ opacity: 0, y: 22, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 14, scale: 0.985 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className={cn("glass-card w-full bg-[var(--surface-solid)]/85 p-5 sm:p-8", width)}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  {eyebrow ? <p className="t-label">{eyebrow}</p> : null}
                  <h2 className="t-h2 mt-3">{title}</h2>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close dialog"
                  className="glass-chip size-9 shrink-0 !rounded-full p-0"
                >
                  <X className="size-4" />
                </button>
              </div>
              <div className="mt-6">{children}</div>
            </motion.div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

/* ——— Selection card (option picker used in onboarding / wizards) ———— */

export function SelectCard({
  selected,
  title,
  description,
  onClick,
  className,
}: {
  selected: boolean;
  title: string;
  description?: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.985 }}
      aria-pressed={selected}
      className={cn(
        "glass-card glass-card--hover relative w-full p-4 text-left sm:p-5",
        className,
      )}
    >
      <AnimatePresence>
        {selected ? (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-0 rounded-[inherit] border border-white/35 bg-white/[0.06]"
          />
        ) : null}
      </AnimatePresence>
      <span className="relative flex items-center justify-between gap-3">
        <span className="min-w-0">
          <span className={cn("block text-sm", selected ? "text-white" : "text-white/78")}>{title}</span>
          {description ? <span className="mt-1 block text-xs leading-5 text-white/38">{description}</span> : null}
        </span>
        {selected ? (
          <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-white text-black">
            <Check className="size-3" strokeWidth={2.4} />
          </span>
        ) : null}
      </span>
    </motion.button>
  );
}

export function NumberDial({
  value,
  onChange,
  min,
  max,
  label,
  suffix,
}: {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  label: string;
  suffix?: string;
}) {
  const clamp = (next: number) => Math.min(max, Math.max(min, next));
  return (
    <div className="glass-card p-5 text-center">
      <p className="t-label">{label}</p>
      <div className="mt-3 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => onChange(clamp(value - 1))}
          disabled={value <= min}
          aria-label={`Decrease ${label}`}
          className="glass-chip size-9 !rounded-full p-0 text-base"
        >
          −
        </button>
        <p className="t-metric w-24 text-4xl tabular-nums">
          {value}
          {suffix ? <span className="ml-0.5 text-base text-white/40">{suffix}</span> : null}
        </p>
        <button
          type="button"
          onClick={() => onChange(clamp(value + 1))}
          disabled={value >= max}
          aria-label={`Increase ${label}`}
          className="glass-chip size-9 !rounded-full p-0 text-base"
        >
          +
        </button>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(clamp(Number(event.target.value)))}
        aria-label={label}
        className="glass-range mt-4"
      />
    </div>
  );
}
