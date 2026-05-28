/**
 * Tarjeta compacta para métricas (p. ej. error, iteraciones) en la columna de resumen de Raíces.
 */
export function StatCard({ label, value, hint }) {
  return (
    <div className="sr-stat-panel flex min-h-[5.25rem] flex-col justify-center rounded-2xl border sr-border-accent px-4 py-3.5 shadow-inner ring-1 ring-white/5 [html.sr-light_&]:ring-slate-400/35">
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 [html.sr-light_&]:text-slate-700">{label}</p>
      <p className="mt-1.5 break-words font-mono text-base font-semibold tracking-tight sr-text-accent-bright tabular-nums sm:text-lg">
        {value}
      </p>
      {hint ? (
        <p className="mt-1.5 text-[12px] leading-snug text-slate-500 [html.sr-light_&]:text-slate-700">{hint}</p>
      ) : null}
    </div>
  )
}
