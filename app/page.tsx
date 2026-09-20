import { ReportTool } from "@/components/report-tool";

export default function Page() {
  return (
    <main className="mx-auto min-h-dvh w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6 flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-primary px-2 py-0.5 font-mono text-xs font-bold text-primary-foreground">
            miTNM
          </span>
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            PROMISE V2
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          PROMISE-PSMA
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Registrá los hallazgos del PET/CT con PSMA y obtené el código de
          estadificación miTNM en vivo. Todo el procesamiento ocurre en tu
          navegador.
        </p>
      </header>
      <ReportTool />
    </main>
  );
}
