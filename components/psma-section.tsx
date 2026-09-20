"use client";

import type { PsmaLevel, PsmaState, ReportState } from "@/lib/promise";
import { Field, SectionCard, Select } from "./controls";

const LEVELS: { value: PsmaLevel; label: string }[] = [
  { value: -1, label: "n/a" },
  { value: 0, label: "0 · sin captación" },
  { value: 1, label: "1 · ≤ hígado" },
  { value: 2, label: "2 · > hígado, ≤ parótida" },
  { value: 3, label: "3 · > parótida" },
];

export function PsmaSection({
  psma,
  patch,
}: {
  psma: PsmaState;
  patch: (p: Partial<ReportState>) => void;
}) {
  const set = (p: Partial<PsmaState>) => {
    const next = { ...psma, ...p };
    // Keep lowest <= highest when both are assessed.
    if (next.lowest >= 0 && next.highest >= 0 && next.lowest > next.highest) {
      if (p.lowest !== undefined) next.highest = next.lowest;
      else next.lowest = next.highest;
    }
    patch({ psma: next });
  };

  return (
    <SectionCard
      step="E"
      title="Score de expresión PSMA (miPSMA)"
      subtitle="Sólo para lesiones de ≥ 1 cm de diámetro"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Expresión más baja" htmlFor="psma-low">
          <Select
            id="psma-low"
            value={String(psma.lowest)}
            onChange={(e) => set({ lowest: Number(e.target.value) as PsmaLevel })}
          >
            {LEVELS.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Expresión más alta" htmlFor="psma-high">
          <Select
            id="psma-high"
            value={String(psma.highest)}
            onChange={(e) => set({ highest: Number(e.target.value) as PsmaLevel })}
          >
            {LEVELS.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>
    </SectionCard>
  );
}
