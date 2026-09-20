"use client";

import type { Reason, ReportState } from "@/lib/promise";
import { Field, Select, TextInput } from "./controls";

const REASONS: { value: Reason; label: string }[] = [
  { value: "initial", label: "Estadificación inicial" },
  { value: "bcr", label: "BCR (recurrencia bioquímica)" },
  { value: "nmcrpc", label: "nmCRPC (no metastásico)" },
  { value: "mhspc", label: "mHSPC (sensible a hormonas)" },
  { value: "mcrpc", label: "mCRPC (resistente a castración)" },
];

export function PatientHeader({
  state,
  patch,
}: {
  state: ReportState;
  patch: (p: Partial<ReportState>) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 rounded-lg border bg-card px-5 py-4 shadow-sm sm:grid-cols-3">
      <Field label="Paciente / ID" htmlFor="patient-id">
        <TextInput
          id="patient-id"
          placeholder="Ej. 00123 / iniciales"
          value={state.patientId}
          onChange={(e) => patch({ patientId: e.target.value })}
        />
      </Field>
      <Field label="Fecha del PET" htmlFor="pet-date">
        <TextInput
          id="pet-date"
          type="date"
          value={state.petDate}
          onChange={(e) => patch({ petDate: e.target.value })}
        />
      </Field>
      <Field label="Motivo del estudio" htmlFor="reason">
        <Select
          id="reason"
          value={state.reason}
          onChange={(e) => patch({ reason: e.target.value as Reason | "" })}
        >
          <option value="">Sin especificar</option>
          {REASONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </Select>
      </Field>
    </div>
  );
}
