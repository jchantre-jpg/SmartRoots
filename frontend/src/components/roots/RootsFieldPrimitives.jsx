/**
 * Campos de formulario reutilizables en el workspace de raíces.
 */
export function Field({ label, hint, ...props }) {
  return (
    <label className="flex flex-col gap-2 text-sm text-slate-300 [html.sr-light_&]:text-slate-700">
      <span className="text-[13px] font-medium leading-snug text-slate-200 [html.sr-light_&]:text-slate-900">{label}</span>
      <input className="sr-input w-full" {...props} />
      {hint ? (
        <span className="text-[12px] leading-snug text-slate-500 [html.sr-light_&]:text-slate-600">{hint}</span>
      ) : null}
    </label>
  )
}

export function Spinner() {
  return (
    <svg className="inline h-4 w-4 animate-spin" viewBox="0 0 24 24" aria-hidden>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}
