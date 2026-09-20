"use client";

import { useEffect, useState } from "react";
import { buildReport, initialState, type ReportState } from "@/lib/promise";
import { PatientHeader } from "./patient-header";
import { LocalTumorSection } from "./local-tumor-section";
import { NodesSection } from "./nodes-section";
import { MetastasisSection } from "./metastasis-section";
import { PsmaSection } from "./psma-section";
import { ReportPanel } from "./report-panel";

const STORAGE_KEY = "promise-psma:state";

export function ReportTool() {
  const [state, setState] = useState<ReportState>(initialState);
  const [hydrated, setHydrated] = useState(false);

  // Restore any browser-saved session on mount (client-only, no backend).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState({ ...initialState, ...JSON.parse(raw) });
    } catch {
      /* ignore malformed storage */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage may be unavailable (private mode) */
    }
  }, [state, hydrated]);

  const patch = (p: Partial<ReportState>) => setState((s) => ({ ...s, ...p }));
  const reset = () => setState(initialState);

  const report = buildReport(state);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
      <div className="flex flex-col gap-5">
        <PatientHeader state={state} patch={patch} />
        <LocalTumorSection tumor={state.tumor} patch={patch} />
        <NodesSection nodes={state.nodes} patch={patch} />
        <MetastasisSection m1a={state.m1a} bone={state.bone} organs={state.organs} patch={patch} />
        <PsmaSection psma={state.psma} patch={patch} />
      </div>
      <div className="lg:sticky lg:top-6 lg:h-fit">
        <ReportPanel report={report} onReset={reset} />
      </div>
    </div>
  );
}
