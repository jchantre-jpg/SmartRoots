/**
 * Tabla HTML de iteraciones devueltas por `/api/solve`; columnas según `method` y `iterationCols.js`.
 * Incluye exportación rápida a CSV y LaTeX vía portapapeles.
 */
import { useCallback, useState } from 'react'
import { MathStep } from './Math.jsx'
import { iterationsToCsv, iterationsToLatex } from '../lib/exportIterations'
import { COLS, LABELS } from '../lib/iterationCols'

function fmt(v) {
  if (v === null || v === undefined) return '—'
  if (typeof v === 'number' && Number.isFinite(v)) {
    const ax = Math.abs(v)
    if (ax !== 0 && (ax < 1e-6 || ax > 1e6)) return v.toExponential(5)
    return v.toPrecision(8)
  }
  return String(v)
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

export function IterationTable({ method, rows, showExport = true }) {
  const [copied, setCopied] = useState('')
  const keys = COLS[method] || Object.keys(rows[0]).filter((k) => k !== 'paso')

  const onCopyCsv = useCallback(async () => {
    const t = iterationsToCsv(method, rows)
    const ok = await copyText(t)
    setCopied(ok ? 'csv' : '')
    window.setTimeout(() => setCopied(''), 2000)
  }, [method, rows])

  const onCopyLatex = useCallback(async () => {
    const t = iterationsToLatex(method, rows)
    const ok = await copyText(t)
    setCopied(ok ? 'tex' : '')
    window.setTimeout(() => setCopied(''), 2000)
  }, [method, rows])

  if (!rows?.length) return null

  return (
    <div className="space-y-2">
      {showExport ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Exportar</span>
          <button
            type="button"
            onClick={onCopyCsv}
            className="sr-btn-secondary rounded-xl px-3 py-2 text-xs font-semibold"
          >
            {copied === 'csv' ? '¡Copiado!' : 'Copiar CSV'}
          </button>
          <button
            type="button"
            onClick={onCopyLatex}
            className="sr-btn-secondary rounded-xl px-3 py-2 text-xs font-semibold"
          >
            {copied === 'tex' ? '¡Copiado!' : 'Copiar LaTeX'}
          </button>
        </div>
      ) : null}
      <div className="sr-table-zone max-h-[min(78vh,900px)] overflow-auto rounded-2xl border sr-border-accent ring-1 ring-white/10 [html.sr-light_&]:ring-slate-500/35">
        <table className="sr-workspace-text w-full min-w-[880px] border-collapse text-left text-[13px] leading-snug text-slate-200 [html.sr-light_&]:text-slate-900">
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-white/10 bg-slate-950/98 shadow-sm shadow-black/40 backdrop-blur-md [html.sr-light_&]:border-slate-400/55 [html.sr-light_&]:bg-slate-200/95 [html.sr-light_&]:shadow-none [html.sr-light_&]:backdrop-blur-none">
              {keys.map((key) => (
                <th key={key} className="whitespace-nowrap px-3 py-3 font-semibold sr-text-accent-soft">
                  {LABELS[key] || key}
                </th>
              ))}
              <th className="min-w-[320px] px-3 py-3 font-semibold sr-text-accent-soft">Operación (paso a paso)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr
                key={row.k ?? idx}
                className="border-b border-white/[0.06] transition [html.sr-light_&]:border-slate-300/70"
              >
                {keys.map((key) => (
                  <td key={key} className="whitespace-nowrap px-3 py-2.5 font-mono tabular-nums">
                    {fmt(row[key])}
                  </td>
                ))}
                <td className="sr-table-step-cell whitespace-normal px-3 py-2.5 text-slate-400 [html.sr-light_&]:text-slate-700">
                  <MathStep tex={row.paso} display={false} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
