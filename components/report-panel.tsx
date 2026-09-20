"use client";

import { useState } from "react";
import type { PromiseReport } from "@/lib/promise";

function copyText(text: string): Promise<void> {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text).catch(() => legacyCopy(text));
  }
  return legacyCopy(text);
}

function legacyCopy(text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.cssText = "position:fixed;top:-9999px;left:-9999px;opacity:0;";
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch {
      ok = false;
    }
    ta.remove();
    ok ? resolve() : reject(new Error("copy failed"));
  });
}

export function ReportPanel({
  report,
  onReset,
}: {
  report: PromiseReport;
  onReset: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    copyText(report.code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  const rows: { label: string; value: string }[] = [
    { label: "Tumor local", value: `${report.t.category}${report.primary ? ` · ${report.primary}` : ""}` },
    { label: "Ganglios", value: report.n.category + (report.n.tokens.length ? ` (${report.n.tokens.join(",")})` : "") },
    { label: "Metástasis", value: report.m.category === "M0" ? "M0" : report.m.parts.join(" ") },
  ];
  if (report.psma) rows.push({ label: "Expresión PSMA", value: report.psma.replace("PSMA expression score ", "") });

  return (
    <div className="flex flex-col gap-4 rounded-lg border bg-card p-5 shadow-sm">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Código miTNM
        </h2>
        <p className="mt-2 break-words rounded-md bg-foreground px-4 py-3 font-mono text-base font-semibold leading-snug text-background">
          {report.code}
        </p>
      </div>

      <dl className="flex flex-col divide-y divide-border overflow-hidden rounded-md border">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between gap-3 px-3 py-2">
            <dt className="text-sm text-muted-foreground">{r.label}</dt>
            <dd className="text-right font-mono text-sm font-medium">{r.value}</dd>
          </div>
        ))}
      </dl>

      <div className="flex gap-2.5">
        <button
          type="button"
          onClick={handleCopy}
          className="flex-1 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          {copied ? "Copiado" : "Copiar código"}
        </button>
        <button
          type="button"
          onClick={onReset}
          className="rounded-md border border-input bg-background px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          Restablecer
        </button>
      </div>

      <p className="text-xs leading-relaxed text-muted-foreground">
        Herramienta educativa basada en los criterios PROMISE V2 (miTNM). No
        reemplaza el juicio clínico ni el informe del médico nuclear.
      </p>
    </div>
  );
}
