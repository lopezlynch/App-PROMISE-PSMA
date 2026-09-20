"use client";

import type { BoneState, M1aState, OrganState, ReportState } from "@/lib/promise";
import { boneSpread, mResult } from "@/lib/promise";
import { CategoryBadge, Field, SectionCard, Select, Toggle } from "./controls";

export function MetastasisSection({
  m1a,
  bone,
  organs,
  patch,
}: {
  m1a: M1aState;
  bone: BoneState;
  organs: OrganState;
  patch: (p: Partial<ReportState>) => void;
}) {
  const setM1a = (p: Partial<M1aState>) => patch({ m1a: { ...m1a, ...p } });
  const setBone = (p: Partial<BoneState>) => patch({ bone: { ...bone, ...p } });
  const setOrgans = (p: Partial<OrganState>) => patch({ organs: { ...organs, ...p } });

  const m = mResult(m1a, bone, organs);
  const spread = boneSpread(bone.count);
  const spreadLabel =
    spread === "uni"
      ? "unifocal"
      : spread === "oligo"
        ? "oligometastásico (2–3)"
        : spread === "diss"
          ? "diseminado (>3)"
          : "";

  return (
    <SectionCard
      step="M"
      title="Metástasis a distancia"
      subtitle="Ganglios extrapélvicos (M1a), hueso (M1b) y órganos (M1c)"
      badge={<CategoryBadge value={m.category} />}
    >
      <div className="flex flex-col gap-5">
        <fieldset className="flex flex-col gap-2.5">
          <legend className="mb-1 text-sm font-semibold">
            M1a · Ganglios extrapélvicos
          </legend>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <Toggle
              checked={m1a.commonIliacL || m1a.commonIliacR}
              onChange={(v) => setM1a({ commonIliacL: v, commonIliacR: v })}
              label="Ilíaco común"
            />
            <Toggle
              checked={m1a.retroperitoneal}
              onChange={(v) => setM1a({ retroperitoneal: v })}
              label="Retroperitoneal"
            />
            <Toggle
              checked={m1a.supradiaphragmatic}
              onChange={(v) => setM1a({ supradiaphragmatic: v })}
              label="Supradiafragmático"
            />
            <Toggle
              checked={m1a.inguinalOther}
              onChange={(v) => setM1a({ inguinalOther: v })}
              label="Inguinal / otro extrapélvico"
            />
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-2.5">
          <legend className="mb-1 text-sm font-semibold">M1b · Hueso</legend>
          <Field
            label="Número de lesiones óseas"
            htmlFor="bone-count"
            hint={
              spreadLabel
                ? `Clasificación: ${spreadLabel}`
                : "0 lesiones · sin compromiso óseo focal"
            }
          >
            <Select
              id="bone-count"
              value={String(bone.count)}
              onChange={(e) => setBone({ count: Number(e.target.value) })}
            >
              <option value="0">0</option>
              <option value="1">1 (unifocal)</option>
              <option value="2">2 (oligo)</option>
              <option value="3">3 (oligo)</option>
              <option value="4">4 o más (diseminado)</option>
            </Select>
          </Field>
          <Toggle
            checked={bone.diffuseMarrow}
            onChange={(v) => setBone({ diffuseMarrow: v })}
            label="Compromiso difuso de médula ósea"
            hint="dmi"
          />
        </fieldset>

        <fieldset className="flex flex-col gap-2.5">
          <legend className="mb-1 text-sm font-semibold">M1c · Órganos</legend>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <Toggle checked={organs.liver} onChange={(v) => setOrgans({ liver: v })} label="Hígado" hint="hep" />
            <Toggle checked={organs.lung} onChange={(v) => setOrgans({ lung: v })} label="Pulmón" hint="pul" />
            <Toggle checked={organs.adrenal} onChange={(v) => setOrgans({ adrenal: v })} label="Suprarrenal" hint="adr" />
            <Toggle checked={organs.brain} onChange={(v) => setOrgans({ brain: v })} label="Cerebro" hint="brain" />
            <Toggle checked={organs.other} onChange={(v) => setOrgans({ other: v })} label="Otros órganos" hint="other" />
          </div>
        </fieldset>

        <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
          {m.descriptions.join(" · ")}
        </p>
      </div>
    </SectionCard>
  );
}
