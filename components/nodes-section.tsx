"use client";

import type { NodeState, ReportState } from "@/lib/promise";
import { nCategory } from "@/lib/promise";
import { CategoryBadge, LateralPair, SectionCard, Toggle } from "./controls";

export function NodesSection({
  nodes,
  patch,
}: {
  nodes: NodeState;
  patch: (p: Partial<ReportState>) => void;
}) {
  const set = (p: Partial<NodeState>) => patch({ nodes: { ...nodes, ...p } });
  const n = nCategory(nodes);

  return (
    <SectionCard
      step="N"
      title="Ganglios linfáticos pélvicos"
      subtitle="Regiones ganglionares regionales (por debajo de la bifurcación aórtica)"
      badge={<CategoryBadge value={n.category} />}
    >
      <div className="flex flex-col gap-2.5">
        <LateralPair
          label="Ilíaco externo"
          left={nodes.extIliacL}
          right={nodes.extIliacR}
          onLeft={(v) => set({ extIliacL: v })}
          onRight={(v) => set({ extIliacR: v })}
        />
        <LateralPair
          label="Ilíaco interno"
          left={nodes.intIliacL}
          right={nodes.intIliacR}
          onLeft={(v) => set({ intIliacL: v })}
          onRight={(v) => set({ intIliacR: v })}
        />
        <LateralPair
          label="Obturador"
          left={nodes.obturatorL}
          right={nodes.obturatorR}
          onLeft={(v) => set({ obturatorL: v })}
          onRight={(v) => set({ obturatorR: v })}
        />
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <Toggle
            checked={nodes.presacral}
            onChange={(v) => set({ presacral: v })}
            label="Presacro"
          />
          <Toggle
            checked={nodes.otherPelvic}
            onChange={(v) => set({ otherPelvic: v })}
            label="Otros ganglios pélvicos"
          />
        </div>
        <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
          {n.description}
          {n.tokens.length ? ` · ${n.tokens.join(", ")}` : ""}
        </p>
      </div>
    </SectionCard>
  );
}
