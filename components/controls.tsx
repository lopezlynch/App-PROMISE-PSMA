"use client";

import type { ReactNode } from "react";

export function SectionCard({
  step,
  title,
  subtitle,
  badge,
  children,
}: {
  step: string;
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <header className="flex items-start justify-between gap-4 border-b px-5 py-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">
            {step}
          </span>
          <div>
            <h2 className="text-base font-semibold leading-tight">{title}</h2>
            {subtitle ? (
              <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>
        </div>
        {badge}
      </header>
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}

export function CategoryBadge({ value }: { value: string }) {
  const positive = value !== "T0" && value !== "N0" && value !== "M0";
  return (
    <span
      className={[
        "inline-flex items-center rounded-md px-2.5 py-1 font-mono text-sm font-semibold tabular-nums",
        positive
          ? "bg-positive-surface text-positive"
          : "bg-muted text-muted-foreground",
      ].join(" ")}
    >
      {value}
    </span>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={[
        "flex w-full items-center justify-between gap-3 rounded-md border px-3 py-2.5 text-left transition-colors",
        checked
          ? "border-positive/40 bg-positive-surface"
          : "border-border bg-background hover:bg-muted",
      ].join(" ")}
    >
      <span>
        <span
          className={[
            "block text-sm font-medium",
            checked ? "text-positive" : "text-foreground",
          ].join(" ")}
        >
          {label}
        </span>
        {hint ? (
          <span className="mt-0.5 block text-xs text-muted-foreground">{hint}</span>
        ) : null}
      </span>
      <span
        aria-hidden
        className={[
          "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
          checked ? "bg-positive" : "bg-input",
        ].join(" ")}
      >
        <span
          className={[
            "inline-block size-4 transform rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-4" : "translate-x-0.5",
          ].join(" ")}
        />
      </span>
    </button>
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

const fieldClasses =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none transition focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50";

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={fieldClasses} />;
}

export function Select({
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={fieldClasses}>
      {children}
    </select>
  );
}

export function LateralPair({
  label,
  left,
  right,
  onLeft,
  onRight,
}: {
  label: string;
  left: boolean;
  right: boolean;
  onLeft: (v: boolean) => void;
  onRight: (v: boolean) => void;
}) {
  const btn = (active: boolean) =>
    [
      "flex-1 rounded-md border px-2.5 py-1.5 text-xs font-semibold transition-colors",
      active
        ? "border-positive/40 bg-positive text-positive-foreground"
        : "border-border bg-background text-muted-foreground hover:bg-muted",
    ].join(" ");
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border bg-background px-3 py-2">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex w-32 gap-1.5">
        <button type="button" className={btn(left)} onClick={() => onLeft(!left)}>
          Izq.
        </button>
        <button type="button" className={btn(right)} onClick={() => onRight(!right)}>
          Der.
        </button>
      </div>
    </div>
  );
}
