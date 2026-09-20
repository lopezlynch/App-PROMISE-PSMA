"use client";

import type { Focality, PrimaryScore, ReportState, TumorState } from "@/lib/promise";
import { tCategory } from "@/lib/promise";
import { CategoryBadge, Field, SectionCard, Select, Toggle } from "./controls";

const FOCALITY: { value: Focality; label: string }[] = [
  { value: "none", label: "Sin foco intraprostático" },
  { value: "unifocal", label: "Unifocal (T2u)" },
  { value: "multifocal", label: "Multifocal (T2m)" },
];

export function LocalTumorSection({
  tumor,
  patch,
}: {
  tumor: TumorState;
  patch: (p: Partial<ReportState>) => void;
}) {
  const set = (p: Partial<TumorState>) => patch({ tumor: { ...tumor, ...p } });
  const removed = tumor.prostateRemoved;
  const t = tCategory(tumor);

  return (
    <SectionCard
      step="T"
      title="Tumor local"
      subtitle="Compromiso prostático y extensión local"
      badge={<CategoryBadge value={t.category} />}
    >
      <div className="flex flex-col gap-4">
        <Toggle
          checked={removed}
          onChange={(v) => set({ prostateRemoved: v })}
          label="La próstata fue removida (prostatectomía)"
          hint="Si hay captación en el lecho, se reporta como recurrencia (Tr)."
        />

        {!removed && (
          <Field label="Foco intraprostático" htmlFor="focality">
            <Select
              id="focality"
              value={tumor.focality}
              onChange={(e) => set({ focality: e.target.value as Focality })}
            >
              {FOCALITY.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </Select>
          </Field>
        )}

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <Toggle
            checked={tumor.extracapsular}
            onChange={(v) => set({ extracapsular: v })}
            label="Extensión extracapsular"
            hint="T3a"
          />
          <Toggle
            checked={tumor.svLeft || tumor.svRight}
            onChange={(v) => set({ svLeft: v, svRight: v })}
            label="Vesículas seminales"
            hint="T3b"
          />
          <Toggle
            checked={tumor.adjacent}
            onChange={(v) => set({ adjacent: v })}
            label="Estructuras adyacentes"
            hint="Vejiga / recto / pared pélvica — T4"
          />
        </div>

        {!removed && (
          <Field
            label="Score PRIMARY"
            htmlFor="primary"
            hint="Puntaje de captación del tumor primario (opcional)."
          >
            <Select
              id="primary"
              value={tumor.primary}
              onChange={(e) => set({ primary: e.target.value as PrimaryScore })}
            >
              <option value="">n/a</option>
              <option value="3">3 · Zona de transición focal</option>
              <option value="4">4 · Zona periférica focal</option>
              <option value="5">5 · Intensidad muy alta</option>
            </Select>
          </Field>
        )}

        <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
          {t.description}
        </p>
      </div>
    </SectionCard>
  );
}
