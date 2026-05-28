/**
 * Workspaces de Polinomios e Interpolación (dos exportaciones: `PolyWorkspace`, `InterpWorkspace`).
 *
 * - Polinomios: Horner, división sintética, deflación, curva P(x), historial en `sessionHistory`.
 * - Interpolación: Lagrange, Neville, Runge/Chebyshev, tablas y gráficas asociadas.
 *
 * Debajo hay helpers locales (spinner, presets, etc.) y luego cada workspace en su propia sección.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { apiGet, apiPost } from '../api'
import { clusterRootMultiplicities, effectiveDegreeFromCoeffs } from '../lib/polynomialMeta'
import { parseCoefficientsInput, validateInterpNodes } from '../lib/parseCoefficientsInput.js'
import { interpNodeHints } from '../lib/rootsSolveMeta'
import { pushPolyHistory, pushInterpHistory, readPolyHistory, readPolySession, readInterpHistory, readInterpSession, writePolySession, writeInterpSession } from '../lib/sessionHistory'
import { ConvergenceCharts } from './ConvergenceCharts'
import { GlossaryTip } from './GlossaryTip'
import { GlassCard } from './GlassCard'
import { MathChip } from './MathChip.jsx'
import { IterationTable } from './IterationTable'
import { MathStep } from './Math.jsx'
import { LagrangeCurveChart, PolynomialCurveChart } from './PolynomialLagrangeCharts'
import { SrIcon } from '../icons/SrIcons.jsx'
import { RungeComparisonChart } from './RungeComparisonChart'
import { RungeMetricsTable } from './RungeMetricsTable'

// --- UI auxiliar (spinner, presets de ejemplo, utilidades locales) ---
function Spinner() {
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

function fmtNum(v) {
  if (v === null || v === undefined) return '—'
  if (typeof v === 'number' && Number.isFinite(v)) {
    const ax = Math.abs(v)
    if (ax !== 0 && (ax < 1e-8 || ax > 1e7)) return v.toExponential(5)
    return v.toPrecision(7)
  }
  return String(v)
}

function formatValidationError(check) {
  if (!check?.message) return ''
  return check.hint ? `${check.message}\n\n• ${check.hint}` : check.message
}

function NevilleTriangleTable({ xs, table }) {
  if (!table?.length || !xs?.length) return null
  const n = xs.length
  return (
    <div className="sr-table-zone max-h-[min(70vh,720px)] overflow-auto rounded-2xl border sr-border-accent ring-1 ring-white/10 [html.sr-light_&]:ring-slate-500/35">
      <table className="sr-workspace-text w-full min-w-[480px] border-collapse text-left text-xs text-slate-200 [html.sr-light_&]:text-slate-900">
        <thead className="sticky top-0 z-10">
          <tr className="border-b border-white/10 bg-slate-950/95 shadow-sm backdrop-blur-sm">
            <th className="px-2 py-2 font-semibold sr-text-accent-soft">i</th>
            <th className="px-2 py-2 font-semibold sr-text-accent-soft">xᵢ</th>
            {Array.from({ length: n }, (_, j) => (
              <th key={j} className="px-2 py-2 font-semibold sr-text-accent-soft">
                Q<sub>i,{j}</sub>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {xs.map((xi, i) => (
            <tr key={i} className="border-b border-white/5 odd:bg-slate-950/35">
              <td className="px-2 py-2 font-mono text-slate-400">{i}</td>
              <td className="px-2 py-2 font-mono tabular-nums">{fmtNum(xi)}</td>
              {Array.from({ length: n }, (_, j) => {
                if (j > n - 1 - i) {
                  return (
                    <td key={j} className="bg-slate-950/60 px-2 py-2 text-center text-slate-600">
                      —
                    </td>
                  )
                }
                const v = table[i]?.[j]
                return (
                  <td key={j} className="px-2 py-2 font-mono tabular-nums">
                    {fmtNum(v)}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const POLY_PRESETS = [
  {
    id: 'quartic',
    label: 'Cuártico clásico',
    labelTex: 'x^4-5x^2+4',
    coeffs: '1,0,-5,0,4',
    xEval: '1.2',
    polyXmin: '-5',
    polyXmax: '5',
  },
  {
    id: 'double',
    label: 'Doble + simple (1,0,−3,2)',
    labelTex: 'x^4-3x^3+2',
    coeffs: '1,0,-3,2',
    xEval: '0.9',
    polyXmin: '-2',
    polyXmax: '3',
  },
  {
    id: 'triple',
    label: 'Triple en 0.5',
    labelTex: '\\left(x-\\tfrac{1}{2}\\right)^3',
    coeffs: '1,-1.5,0.75,-0.125',
    xEval: '0.55',
    polyXmin: '-0.5',
    polyXmax: '1.5',
  },
  {
    id: 'cubic',
    label: 'x³ − x',
    labelTex: 'x^3-x',
    coeffs: '1,0,-1,0',
    xEval: '0.5',
    polyXmin: '-2',
    polyXmax: '2',
  },
]

const INTERP_PRESETS = [
  {
    id: 'linear',
    label: 'Lineal 2 nodos',
    labelTex: 'P_1(x)\\ \\text{(2 nodos)}',
    nodesX: '-1,1',
    nodesY: '0,2',
    xStar: '0.25',
  },
  {
    id: 'parab',
    label: 'Parábola (−1,0,1)',
    labelTex: 'y=x^2\\ \\text{en }\\{-1,0,1\\}',
    nodesX: '-1,0,1',
    nodesY: '0,1,0',
    xStar: '0.5',
  },
  {
    id: 'rungeish',
    label: 'Nodos uniformes · 1/(1+25x²)',
    labelTex: 'f(x)=\\dfrac{1}{1+25x^2}',
    nodesX: '-1,-0.5,0,0.5,1',
    nodesY: '0.0384615,0.137931,1,0.137931,0.0384615',
    xStar: '0.85',
  },
  {
    id: 'cheb4',
    label: '4 nodos Chebyshev · Runge f(x)',
    labelTex: 'f(x)=\\dfrac{1}{1+25x^2}\\ \\text{(Chebyshev)}',
    nodesX: '0.9238795,0.3826834,-0.3826834,-0.9238795',
    nodesY: '0.0447617,0.2145325,0.2145325,0.0447617',
    xStar: '0.5',
  },
]

// =============================================================================
// Polinomios — coeficientes, Horner, división sintética, deflación y gráfica P(x)
// =============================================================================
export function PolyWorkspace() {
  const [coeffs, setCoeffs] = useState('1,0,-5,0,4')
  const [xEval, setXEval] = useState('1.2')
  const [horner, setHorner] = useState(null)
  const [roots, setRoots] = useState(null)
  const [hornerErr, setHornerErr] = useState('')
  const [deflateErr, setDeflateErr] = useState('')
  const [busyH, setBusyH] = useState(false)
  const [busyD, setBusyD] = useState(false)
  const [busyAll, setBusyAll] = useState(false)
  const [polyXmin, setPolyXmin] = useState('-5')
  const [polyXmax, setPolyXmax] = useState('5')
  const [polyCurve, setPolyCurve] = useState(null)
  const [histBump, setHistBump] = useState(0)
  const polyHist = useMemo(() => readPolyHistory(), [histBump])

  useEffect(() => {
    const s = readPolySession()
    if (!s || typeof s !== 'object') return
    if (typeof s.coeffs === 'string') setCoeffs(s.coeffs)
    if (s.xEval != null) setXEval(String(s.xEval))
    if (s.polyXmin != null) setPolyXmin(String(s.polyXmin))
    if (s.polyXmax != null) setPolyXmax(String(s.polyXmax))
  }, [])

  const runPolyAllRef = useRef(() => Promise.resolve())
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setHornerErr('')
        setDeflateErr('')
      }
      if (e.key !== 'Enter' || (!e.ctrlKey && !e.metaKey)) return
      const tag = e.target?.tagName
      if (tag !== 'INPUT' && tag !== 'TEXTAREA') return
      e.preventDefault()
      void runPolyAllRef.current()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const coeffParse = useMemo(() => {
    const parsed = parseCoefficientsInput(coeffs)
    if (!parsed.ok) {
      return { ok: false, values: [], message: parsed.message, hint: parsed.hint }
    }
    return { ok: true, values: parsed.values, message: '', hint: '' }
  }, [coeffs])

  const persistPolySession = useCallback(() => {
    if (!coeffParse.ok) return
    writePolySession({ coeffs, xEval, polyXmin, polyXmax })
  }, [coeffParse.ok, coeffs, xEval, polyXmin, polyXmax])

  const applyPolyPreset = useCallback((p) => {
    setCoeffs(p.coeffs)
    setXEval(String(p.xEval))
    setPolyXmin(String(p.polyXmin))
    setPolyXmax(String(p.polyXmax))
    setHornerErr('')
    setDeflateErr('')
    writePolySession({ coeffs: p.coeffs, xEval: p.xEval, polyXmin: p.polyXmin, polyXmax: p.polyXmax })
  }, [])

  const refreshPolyCurve = useCallback(async () => {
    if (!coeffParse.ok) return
    const lo = Number(polyXmin)
    const hi = Number(polyXmax)
    if (!Number.isFinite(lo) || !Number.isFinite(hi) || lo >= hi) {
      setPolyCurve(null)
      return
    }
    try {
      const d = await apiPost('/api/polynomial/sample_curve', {
        coefficients: coeffParse.values,
        xmin: lo,
        xmax: hi,
        n: 520,
      })
      setPolyCurve(d)
    } catch {
      setPolyCurve(null)
    }
  }, [coeffParse, polyXmin, polyXmax])

  async function runHorner() {
    setHornerErr('')
    if (!coeffParse.ok) {
      setHornerErr(formatValidationError(coeffParse))
      return
    }
    const xv = Number(xEval)
    if (!Number.isFinite(xv)) {
      setHornerErr('x debe ser un número válido.')
      return
    }
    setBusyH(true)
    try {
      const data = await apiPost('/api/polynomial/horner', {
        coefficients: coeffParse.values,
        x: xv,
      })
      setHorner(data)
      await refreshPolyCurve()
      persistPolySession()
    } catch (e) {
      setHornerErr(e.message)
    } finally {
      setBusyH(false)
    }
  }

  async function runDeflation() {
    setDeflateErr('')
    if (!coeffParse.ok) {
      setDeflateErr(formatValidationError(coeffParse))
      return
    }
    setBusyD(true)
    try {
      const data = await apiPost('/api/polynomial/deflate_all', { coefficients: coeffParse.values })
      setRoots(data)
      await refreshPolyCurve()
      persistPolySession()
    } catch (e) {
      setDeflateErr(e.message)
    } finally {
      setBusyD(false)
    }
  }

  async function runUnit6All() {
    setHornerErr('')
    setDeflateErr('')
    if (!coeffParse.ok) {
      const cmsg = formatValidationError(coeffParse)
      setHornerErr(cmsg)
      setDeflateErr(cmsg)
      return
    }
    const xv = Number(xEval)
    if (!Number.isFinite(xv)) {
      setHornerErr('x debe ser un número válido para Horner.')
      return
    }
    setBusyAll(true)
    setHorner(null)
    setRoots(null)
    try {
      const h = await apiPost('/api/polynomial/horner', { coefficients: coeffParse.values, x: xv })
      setHorner(h)
    } catch (e) {
      setHornerErr(e.message)
    }
    try {
      const d = await apiPost('/api/polynomial/deflate_all', { coefficients: coeffParse.values })
      setRoots(d)
    } catch (e) {
      setDeflateErr(e.message)
    } finally {
      setBusyAll(false)
    }
    await refreshPolyCurve()
    persistPolySession()
    if (coeffParse.ok) {
      pushPolyHistory({ coeffs, xEval, polyXmin, polyXmax })
      setHistBump((n) => n + 1)
    }
  }

  runPolyAllRef.current = runUnit6All

  const busy = busyH || busyD || busyAll

  return (
    <div className="space-y-8">
      <GlassCard
        title="Polinomios"
        subtitle="Coeficientes de mayor a menor grado (aₙxⁿ + … + a₀). Un clic calcula Horner en x y la deflación completa."
      >
        <div className="space-y-6">
          <div className="sr-workspace-panel p-4 sm:p-5">
            <p className="sr-form-section-label mb-4">Polinomio y evaluación</p>
            <div className="grid gap-4 lg:grid-cols-2">
          <label className="flex flex-col gap-2.5 text-sm text-slate-300 [html.sr-light_&]:text-slate-700">
            <span className="text-[13px] font-medium leading-snug text-slate-200 [html.sr-light_&]:text-slate-900">Coeficientes (coma o espacio)</span>
            <input
              value={coeffs}
              onChange={(e) => setCoeffs(e.target.value)}
              className="sr-input font-mono"
              inputMode="decimal"
              spellCheck={false}
              autoComplete="off"
            />
          </label>
          <label className="flex flex-col gap-2.5 text-sm text-slate-300 [html.sr-light_&]:text-slate-700">
            <span className="text-[13px] font-medium leading-snug text-slate-200 [html.sr-light_&]:text-slate-900">x para Horner y división sintética</span>
            <input
              value={xEval}
              onChange={(e) => setXEval(e.target.value)}
              className="sr-input font-mono"
              inputMode="decimal"
            />
          </label>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-2.5 text-sm text-slate-300 [html.sr-light_&]:text-slate-700">
            <span className="text-[13px] font-medium leading-snug text-slate-200 [html.sr-light_&]:text-slate-900">x mín (gráfica P)</span>
            <input
              value={polyXmin}
              onChange={(e) => setPolyXmin(e.target.value)}
              className="sr-input font-mono"
              inputMode="decimal"
            />
          </label>
          <label className="flex flex-col gap-2.5 text-sm text-slate-300 [html.sr-light_&]:text-slate-700">
            <span className="text-[13px] font-medium leading-snug text-slate-200 [html.sr-light_&]:text-slate-900">x máx (gráfica P)</span>
            <input
              value={polyXmax}
              onChange={(e) => setPolyXmax(e.target.value)}
              className="sr-input font-mono"
              inputMode="decimal"
            />
          </label>
        </div>
            <p className="sr-lead-text mt-4 text-xs text-slate-500 [html.sr-light_&]:text-slate-600">
              <GlossaryTip
                term="Grado efectivo"
                definition="Mayor grado con coeficiente principal distinto de cero (se ignoran ceros superiores)."
              />
              {' · '}
              <GlossaryTip
                term="Multiplicidad aproximada"
                definition="Raíces numéricas muy cercanas se agrupan; no es la multiplicidad algebraica exacta salvo que el método la resuelva."
              />
              {' · '}
              <kbd className="sr-workspace-kbd">Ctrl</kbd>
              {' + '}
              <kbd className="sr-workspace-kbd">Enter</kbd>
              {' en un campo: calcular todo · '}
              <kbd className="sr-workspace-kbd">Esc</kbd>
              {' limpia errores.'}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="w-full text-[11px] font-semibold uppercase tracking-widest text-slate-500 [html.sr-light_&]:text-slate-600">
                Cargar ejemplo
              </span>
              {POLY_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  disabled={busy}
                  onClick={() => applyPolyPreset(p)}
                  className="sr-workspace-chip inline-flex max-w-full items-center disabled:opacity-40"
                  title={p.label}
                >
                  <MathChip tex={p.labelTex || p.label} />
                </button>
              ))}
            </div>
            <details className="sr-workspace-nested sr-workspace-text mt-3 p-3 text-sm">
              <summary className="cursor-pointer select-none font-medium text-slate-200 [html.sr-light_&]:text-slate-900">
                Historial (solo este navegador)
              </summary>
              {polyHist.length ? (
                <ul className="mt-2 max-h-40 space-y-1.5 overflow-auto">
                  {polyHist.map((h, i) => (
                    <li key={`${h.coeffs}-${h.at ?? i}`} className="flex items-center justify-between gap-2 text-xs">
                      <span className="min-w-0 truncate font-mono text-slate-400 [html.sr-light_&]:text-slate-600" title={h.coeffs}>
                        {h.coeffs}
                      </span>
                      <button
                        type="button"
                        className="shrink-0 sr-text-accent-bright underline decoration-dotted underline-offset-2"
                        onClick={() =>
                          applyPolyPreset({
                            coeffs: h.coeffs,
                            xEval: h.xEval ?? '0',
                            polyXmin: h.polyXmin ?? '-5',
                            polyXmax: h.polyXmax ?? '5',
                          })
                        }
                      >
                        Restaurar
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-xs text-slate-500 [html.sr-light_&]:text-slate-600">
                  Aún no hay entradas; usa «Calcular todo» para guardar en el historial.
                </p>
              )}
            </details>
          </div>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            disabled={busy}
            onClick={runUnit6All}
            className="sr-btn-primary sr-shadow-accent order-1 inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-bold text-[var(--sr-nav-pill-fg)] shadow-lg transition hover:brightness-110 disabled:pointer-events-none disabled:opacity-50 sm:min-w-[14rem] sm:flex-none"
          >
            {busyAll ? <Spinner /> : null}
            {busyAll ? 'Calculando Horner y deflación…' : 'Calcular todo: Horner + deflación'}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={runHorner}
            className="sr-btn-secondary order-2 inline-flex flex-1 items-center justify-center gap-2 sm:order-none sm:flex-none"
          >
            {busyH && !busyAll ? <Spinner /> : <SrIcon name="horner" className="h-4 w-4" />}
            Solo Horner / sintética
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={runDeflation}
            className="sr-btn-secondary order-3 inline-flex flex-1 items-center justify-center gap-2 sm:order-none sm:flex-none"
          >
            {busyD && !busyAll ? <Spinner /> : <SrIcon name="deflation" className="h-4 w-4" />}
            Solo deflación de raíces
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => refreshPolyCurve()}
            className="sr-btn-secondary order-4 sr-border-accent sr-bg-accent-dim sr-text-accent hover:brightness-110 sm:order-none"
          >
            Actualizar gráfica P(x)
          </button>
        </div>
        {hornerErr ? (
          <p className="mt-3 sr-alert-danger" role="alert">
            {hornerErr}
          </p>
        ) : null}
        {deflateErr ? (
          <p className="mt-3 sr-alert-danger" role="alert">
            {deflateErr}
          </p>
        ) : null}
        </div>
      </GlassCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard title="Horner y división sintética" subtitle={`P(${horner?.x ?? 'x'}) y cociente si divides entre (x − x₀).`}>
          {horner ? (
            <div className="space-y-4 text-sm sr-workspace-text">
              <p>
                <span className="sr-workspace-text-muted">P(x₀) = </span>
                <span className="font-mono text-lg sr-text-accent-soft">{fmtNum(horner.P_x)}</span>
              </p>
              <p className="sr-workspace-text-muted text-xs">
                Cociente (grado −1):{' '}
                <span className="font-mono sr-workspace-strong">{(horner.synthetic_quotient || []).map((c) => fmtNum(c)).join(', ') || '—'}</span>
                {' · '}
                <span className="sr-workspace-text-muted">residuo</span>{' '}
                <span className="font-mono sr-state-score">{fmtNum(horner.remainder)}</span>
              </p>
              {horner.horner_steps?.length ? (
                <div>
                  <p className="sr-workspace-text-faint mb-2 text-xs font-semibold uppercase tracking-widest">Tabla de acumulación Horner</p>
                  <div className="sr-table-zone max-h-[min(55vh,560px)] overflow-auto rounded-2xl border sr-border-accent ring-1 ring-white/10 [html.sr-light_&]:ring-slate-500/35">
                    <table className="sr-workspace-text w-full border-collapse text-left text-xs text-slate-200 [html.sr-light_&]:text-slate-900">
                      <thead className="sticky top-0 z-10">
                        <tr className="border-b border-white/10 bg-slate-950/95 shadow-sm backdrop-blur-sm">
                          <th className="px-2 py-2 font-semibold sr-text-accent-soft">Paso</th>
                          <th className="px-2 py-2 font-semibold sr-text-accent-soft">Coef.</th>
                          <th className="px-2 py-2 font-semibold sr-text-accent-soft">Antes r</th>
                          <th className="px-2 py-2 font-semibold sr-text-accent-soft">Después r</th>
                          <th className="min-w-[200px] px-2 py-2 font-semibold sr-text-accent-soft">Operación</th>
                        </tr>
                      </thead>
                      <tbody>
                        {horner.horner_steps.map((row) => (
                          <tr key={row.paso} className="border-b border-white/5">
                            <td className="px-2 py-2 font-mono">{row.paso}</td>
                            <td className="px-2 py-2 font-mono tabular-nums">{fmtNum(row.coeficiente)}</td>
                            <td className="px-2 py-2 font-mono tabular-nums">{fmtNum(row.acumulado_antes)}</td>
                            <td className="px-2 py-2 font-mono tabular-nums sr-text-accent">{fmtNum(row.acumulado_despues)}</td>
                            <td className="sr-table-step-cell px-2 py-2 text-slate-400">
                              <MathStep tex={row.texto} display={false} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}
              {horner.synthetic_division_steps?.length ? (
                <div>
                  <p className="sr-workspace-text-faint mb-2 text-xs font-semibold uppercase tracking-widest">División sintética (x − x₀)</p>
                  <ul className="sr-workspace-nested max-h-[min(42vh,360px)] space-y-2 overflow-auto p-4">
                    {horner.synthetic_division_steps.map((row) => (
                      <li key={row.paso} className="text-[11px] leading-relaxed">
                        <span className="font-mono sr-text-accent-bright/90">{row.paso}.</span>{' '}
                        <MathStep tex={row.texto} display={false} />
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="sr-workspace-text-muted text-sm">Ejecuta Horner o «Calcular todo» para ver pasos y tablas.</p>
          )}
        </GlassCard>

        <GlassCard title="Deflación de raíces" subtitle="Newton con evaluación Horner; trazas de iteración por cada raíz hallada.">
          {roots ? (
            <div className="space-y-4 text-sm sr-workspace-text">
              <p>
                Raíces halladas ({roots.roots?.length ?? 0}):{' '}
                <span className="font-mono sr-text-accent-soft">
                  {(roots.roots || []).map((r) => (Number.isFinite(r) ? Number(r).toPrecision(10) : String(r))).join(', ') || '—'}
                </span>
              </p>
              {roots.roots?.length ? (
                <div className="sr-workspace-nested sr-workspace-text-muted border sr-border-accent p-3 text-xs">
                  <p>
                    <span className="font-medium">Grado efectivo (coef. principal no nulo): </span>
                    {effectiveDegreeFromCoeffs(coeffParse.values).degree}
                  </p>
                  <p className="mt-2">
                    <span className="font-medium">Agrupación de raíces en el eje real (ε numérico): </span>
                    <span className="font-mono sr-text-accent/85">
                      {clusterRootMultiplicities(roots.roots)
                        .map((c) => `${fmtNum(c.value)} ×${c.mult}`)
                        .join(' · ') || '—'}
                    </span>
                  </p>
                  <p className="sr-workspace-text-faint mt-1 text-[11px]">
                    Si aparece ×2 o más, el algoritmo devolvió varias raíces muy próximas; la multiplicidad algebraica exacta requeriría factorización simbólica.
                  </p>
                </div>
              ) : null}
              {(roots.deflation_log || []).map((entry, idx) => (
                <div key={idx} className="sr-workspace-nested p-4">
                  <p className="text-xs font-semibold uppercase tracking-widest sr-text-accent-bright/90">
                    Etapa deflación {entry.deflation_step + 1} · grado {entry.coeffs_degree} · estado {entry.status}
                  </p>
                  <p className="sr-workspace-text-muted mt-1 text-xs">
                    Arranque Newton: {fmtNum(entry.start)} → raíz {fmtNum(entry.root)}
                  </p>
                  {entry.newton_trace?.length ? (
                    <div className="mt-3 space-y-4">
                      <IterationTable method="newton_raphson" rows={entry.newton_trace} />
                      <div>
                        <p className="sr-workspace-text-faint mb-2 text-xs font-semibold uppercase tracking-widest">
                          Gráficas de esta etapa Newton–Horner
                        </p>
                        <ConvergenceCharts rows={entry.newton_trace} />
                      </div>
                    </div>
                  ) : (
                    <p className="sr-workspace-text-muted mt-2 text-xs">Sin traza numérica (caso degenerado o lineal).</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="sr-workspace-text-muted text-sm">Ejecuta deflación o la unidad completa.</p>
          )}
        </GlassCard>
      </div>

      {polyCurve?.x?.length ? (
        <GlassCard
          title="Gráfica · P(x)"
          subtitle="Curva por evaluación Horner en [x mín, x máx]. Marcas: raíces halladas en el eje x y el punto (x₀, P(x₀)) de Horner."
        >
          <PolynomialCurveChart
            curve={polyCurve}
            rootXs={roots?.roots || []}
            evalX={horner?.x}
            evalY={horner?.P_x}
          />
        </GlassCard>
      ) : null}
    </div>
  )
}

// =============================================================================
// Interpolación — nodos, Lagrange, Neville, Runge y métricas
// =============================================================================
export function InterpWorkspace() {
  const [nodesX, setNodesX] = useState('-1,0,1,2')
  const [nodesY, setNodesY] = useState('2,1,2,5')
  const [xStar, setXStar] = useState('0.5')
  const [lag, setLag] = useState(null)
  const [nev, setNev] = useState(null)
  const [runge, setRunge] = useState(null)
  const [lagErr, setLagErr] = useState('')
  const [nevErr, setNevErr] = useState('')
  const [rungeErr, setRungeErr] = useState('')
  const [busyL, setBusyL] = useState(false)
  const [busyN, setBusyN] = useState(false)
  const [busyR, setBusyR] = useState(false)
  const [busyAll, setBusyAll] = useState(false)
  const [lagSample, setLagSample] = useState(null)
  const [histBumpI, setHistBumpI] = useState(0)
  const interpHist = useMemo(() => readInterpHistory(), [histBumpI])
  const [xExtra, setXExtra] = useState('')
  const [yRef, setYRef] = useState('')
  const [extraProbe, setExtraProbe] = useState(null)
  const [busyExtra, setBusyExtra] = useState(false)

  const xs = useMemo(
    () =>
      nodesX
        .split(/[,;\s]+/)
        .map((s) => s.trim())
        .filter(Boolean)
        .map(Number),
    [nodesX],
  )
  const ys = useMemo(
    () =>
      nodesY
        .split(/[,;\s]+/)
        .map((s) => s.trim())
        .filter(Boolean)
        .map(Number),
    [nodesY],
  )

  const nodeCheck = useMemo(() => validateInterpNodes(nodesX, nodesY), [nodesX, nodesY])

  const nodeHints = useMemo(() => (nodeCheck.ok ? interpNodeHints(xs) : []), [nodeCheck.ok, xs])

  const persistInterpSession = useCallback(() => {
    if (!nodeCheck.ok) return
    writeInterpSession({ nodesX, nodesY, xStar })
  }, [nodeCheck.ok, nodesX, nodesY, xStar])

  const applyInterpPreset = useCallback((p) => {
    setNodesX(p.nodesX)
    setNodesY(p.nodesY)
    setXStar(String(p.xStar))
    setLagErr('')
    setNevErr('')
    setRungeErr('')
    setExtraProbe(null)
    writeInterpSession({ nodesX: p.nodesX, nodesY: p.nodesY, xStar: String(p.xStar) })
  }, [])

  useEffect(() => {
    const s = readInterpSession()
    if (!s || typeof s !== 'object') return
    if (typeof s.nodesX === 'string') setNodesX(s.nodesX)
    if (typeof s.nodesY === 'string') setNodesY(s.nodesY)
    if (s.xStar != null) setXStar(String(s.xStar))
  }, [])

  const runInterpAllRef = useRef(() => Promise.resolve())
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setLagErr('')
        setNevErr('')
        setRungeErr('')
        setExtraProbe(null)
      }
      if (e.key !== 'Enter' || (!e.ctrlKey && !e.metaKey)) return
      const tag = e.target?.tagName
      if (tag !== 'INPUT' && tag !== 'TEXTAREA') return
      e.preventDefault()
      void runInterpAllRef.current()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  async function refreshLagSample() {
    if (!nodeCheck.ok) return
    try {
      const d = await apiPost('/api/interpolation/lagrange_sample', {
        x_nodes: xs,
        y_nodes: ys,
        pad_fraction: 0.18,
        n: 520,
      })
      setLagSample(d)
    } catch {
      setLagSample(null)
    }
  }

  async function runLagrange() {
    setLagErr('')
    if (!nodeCheck.ok) {
      setLagErr(formatValidationError(nodeCheck))
      return
    }
    const xv = Number(xStar)
    if (!Number.isFinite(xv)) {
      setLagErr('El x a interpolar debe ser un número.')
      return
    }
    setBusyL(true)
    try {
      const data = await apiPost('/api/interpolation/lagrange', {
        x_nodes: xs,
        y_nodes: ys,
        x: xv,
      })
      setLag(data)
      await refreshLagSample()
      persistInterpSession()
    } catch (e) {
      setLagErr(e.message)
    } finally {
      setBusyL(false)
    }
  }

  async function runNeville() {
    setNevErr('')
    if (!nodeCheck.ok) {
      setNevErr(formatValidationError(nodeCheck))
      return
    }
    const xv = Number(xStar)
    if (!Number.isFinite(xv)) {
      setNevErr('El x a interpolar debe ser un número.')
      return
    }
    setBusyN(true)
    try {
      const data = await apiPost('/api/interpolation/neville', {
        x_nodes: xs,
        y_nodes: ys,
        x: xv,
      })
      setNev(data)
      await refreshLagSample()
      persistInterpSession()
    } catch (e) {
      setNevErr(e.message)
    } finally {
      setBusyN(false)
    }
  }

  async function loadRunge() {
    setRungeErr('')
    setBusyR(true)
    try {
      const data = await apiGet('/api/interpolation/weierstrass_runge?n=9')
      setRunge(data)
    } catch (e) {
      setRungeErr(e.message)
    } finally {
      setBusyR(false)
    }
  }

  async function runExtraProbe() {
    setExtraProbe(null)
    if (!nodeCheck.ok) {
      setExtraProbe({ error: formatValidationError(nodeCheck) })
      return
    }
    const xe = Number(xExtra)
    const yr = Number(yRef)
    if (!Number.isFinite(xe) || !Number.isFinite(yr)) {
      setExtraProbe({ error: 'Introduce x extra y la y de referencia como números.' })
      return
    }
    setBusyExtra(true)
    try {
      const data = await apiPost('/api/interpolation/lagrange', { x_nodes: xs, y_nodes: ys, x: xe })
      const err = Math.abs(Number(data.P_x) - yr)
      setExtraProbe({ xe, yr, Px: data.P_x, err })
    } catch (e) {
      setExtraProbe({ error: e.message })
    } finally {
      setBusyExtra(false)
    }
  }

  async function runChapter7All() {
    setLagErr('')
    setNevErr('')
    setRungeErr('')
    if (!nodeCheck.ok) {
      const nmsg = formatValidationError(nodeCheck)
      setLagErr(nmsg)
      setNevErr(nmsg)
      return
    }
    const xv = Number(xStar)
    if (!Number.isFinite(xv)) {
      setLagErr('El x a interpolar debe ser un número.')
      setNevErr('El x a interpolar debe ser un número.')
      return
    }
    setBusyAll(true)
    setLag(null)
    setNev(null)
    const payload = { x_nodes: xs, y_nodes: ys, x: xv }
    const [lRes, nRes, rRes] = await Promise.allSettled([
      apiPost('/api/interpolation/lagrange', payload),
      apiPost('/api/interpolation/neville', payload),
      apiGet('/api/interpolation/weierstrass_runge?n=9'),
    ])
    if (lRes.status === 'fulfilled') setLag(lRes.value)
    else setLagErr(lRes.reason?.message || 'Lagrange falló')
    if (nRes.status === 'fulfilled') setNev(nRes.value)
    else setNevErr(nRes.reason?.message || 'Neville falló')
    if (rRes.status === 'fulfilled') setRunge(rRes.value)
    else setRungeErr(rRes.reason?.message || 'Demo Runge falló')
    setBusyAll(false)
    if (nodeCheck.ok) {
      await refreshLagSample()
      persistInterpSession()
      pushInterpHistory({ nodesX, nodesY, xStar })
      setHistBumpI((n) => n + 1)
    }
  }

  runInterpAllRef.current = runChapter7All

  const busy = busyL || busyN || busyR || busyAll || busyExtra

  return (
    <div className="space-y-8">
      <GlassCard
        title="Interpolación"
        subtitle="Los mismos nodos sirven para Lagrange y Neville. Un clic calcula ambos y carga la demo gráfica Runge."
      >
        <div className="space-y-6">
          <div className="sr-workspace-panel p-4 sm:p-5">
            <p className="sr-form-section-label mb-4">Nodos y punto a interpolar</p>
            <div className="grid gap-4 lg:grid-cols-3">
          <label className="flex flex-col gap-2.5 text-sm text-slate-300 [html.sr-light_&]:text-slate-700">
            <span className="text-[13px] font-medium leading-snug text-slate-200 [html.sr-light_&]:text-slate-900">Nodos x</span>
            <input
              value={nodesX}
              onChange={(e) => setNodesX(e.target.value)}
              className="sr-input font-mono"
              inputMode="decimal"
              spellCheck={false}
              autoComplete="off"
            />
          </label>
          <label className="flex flex-col gap-2.5 text-sm text-slate-300 [html.sr-light_&]:text-slate-700">
            <span className="text-[13px] font-medium leading-snug text-slate-200 [html.sr-light_&]:text-slate-900">Nodos y</span>
            <input
              value={nodesY}
              onChange={(e) => setNodesY(e.target.value)}
              className="sr-input font-mono"
              inputMode="decimal"
              spellCheck={false}
              autoComplete="off"
            />
          </label>
          <label className="flex flex-col gap-2.5 text-sm text-slate-300 [html.sr-light_&]:text-slate-700">
            <span className="text-[13px] font-medium leading-snug text-slate-200 [html.sr-light_&]:text-slate-900">x a interpolar</span>
            <input
              value={xStar}
              onChange={(e) => setXStar(e.target.value)}
              className="sr-input font-mono"
              inputMode="decimal"
            />
          </label>
        </div>
        {!nodeCheck.ok ? (
          <p className="sr-alert-warn mt-4 whitespace-pre-line px-4 py-3 text-sm">{formatValidationError(nodeCheck)}</p>
        ) : (
          <p className="sr-alert-success mt-4 px-4 py-2 text-xs">{xs.length} nodos · listos para Lagrange, Neville y la gráfica comparativa (Runge)</p>
        )}
            {nodeHints.length ? (
              <ul className="sr-workspace-nested sr-workspace-text-muted mt-3 space-y-1 px-3 py-2 text-xs">
                {nodeHints.map((h, i) => (
                  <li key={i}>→ {h}</li>
                ))}
              </ul>
            ) : null}
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm text-slate-300 [html.sr-light_&]:text-slate-700">
                <span className="text-[12px] font-medium text-slate-200 [html.sr-light_&]:text-slate-900">
                  <GlossaryTip
                    term="Punto extra"
                    definition="Un x distinto de x* donde conoces la y exacta del modelo (p. ej. de un enunciado) para medir |P(x)−y| con el mismo polinomio interpolante."
                  />
                  {' · x extra'}
                </span>
                <input
                  value={xExtra}
                  onChange={(e) => setXExtra(e.target.value)}
                  className="sr-input font-mono"
                  inputMode="decimal"
                  placeholder="ej. 0.85"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm text-slate-300 [html.sr-light_&]:text-slate-700">
                <span className="text-[12px] font-medium text-slate-200 [html.sr-light_&]:text-slate-900">y de referencia en x extra</span>
                <input
                  value={yRef}
                  onChange={(e) => setYRef(e.target.value)}
                  className="sr-input font-mono"
                  inputMode="decimal"
                  placeholder="valor verdadero f(x_extra)"
                />
              </label>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={busy || !nodeCheck.ok}
                onClick={() => void runExtraProbe()}
                className="sr-workspace-chip py-2 disabled:opacity-40"
              >
                {busyExtra ? <Spinner /> : null}
                Error en punto extra (Lagrange)
              </button>
              {extraProbe?.error ? (
                <p className="sr-state-bad text-xs">{extraProbe.error}</p>
              ) : null}
              {extraProbe?.err != null ? (
                <p className="sr-state-ok text-xs">
                  |P({fmtNum(extraProbe.xe)}) − y_ref| = <span className="font-mono">{fmtNum(extraProbe.err)}</span> (P ={' '}
                  <span className="font-mono">{fmtNum(extraProbe.Px)}</span>)
                </p>
              ) : null}
            </div>
            <p className="sr-lead-text mt-4 text-xs text-slate-500 [html.sr-light_&]:text-slate-600">
              <GlossaryTip term="Runge" definition="Oscilaciones grandes al interpolar con nodos uniformes en [-1,1] para algunas funciones analíticas; Chebyshev suele reducir el error máximo." />
              {' · '}
              <kbd className="sr-workspace-kbd">Ctrl</kbd>
              {' + '}
              <kbd className="sr-workspace-kbd">Enter</kbd>
              {' en un campo: calcular todo · '}
              <kbd className="sr-workspace-kbd">Esc</kbd>
              {' limpia errores y la sonda.'}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="w-full text-[11px] font-semibold uppercase tracking-widest text-slate-500 [html.sr-light_&]:text-slate-600">
                Cargar ejemplo
              </span>
              {INTERP_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  disabled={busy}
                  onClick={() => applyInterpPreset(p)}
                  className="sr-workspace-chip inline-flex max-w-full items-center disabled:opacity-40"
                  title={p.label}
                >
                  <MathChip tex={p.labelTex || p.label} />
                </button>
              ))}
            </div>
            <details className="sr-workspace-nested sr-workspace-text mt-3 p-3 text-sm">
              <summary className="cursor-pointer select-none font-medium text-slate-200 [html.sr-light_&]:text-slate-900">
                Historial (solo este navegador)
              </summary>
              {interpHist.length ? (
                <ul className="mt-2 max-h-40 space-y-1.5 overflow-auto">
                  {interpHist.map((h, i) => (
                    <li key={`${h.nodesX}-${h.at ?? i}`} className="flex items-center justify-between gap-2 text-xs">
                      <span className="min-w-0 truncate font-mono text-slate-400 [html.sr-light_&]:text-slate-600" title={`${h.nodesY}`}>
                        x: {h.nodesX}
                      </span>
                      <button
                        type="button"
                        className="shrink-0 sr-text-accent-bright underline decoration-dotted underline-offset-2"
                        onClick={() =>
                          applyInterpPreset({
                            nodesX: h.nodesX,
                            nodesY: h.nodesY,
                            xStar: h.xStar ?? '0.5',
                          })
                        }
                      >
                        Restaurar
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-xs text-slate-500 [html.sr-light_&]:text-slate-600">Aún no hay entradas; usa «Calcular todo».</p>
              )}
            </details>
          </div>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            disabled={busy || !nodeCheck.ok}
            onClick={runChapter7All}
            className="sr-btn-primary sr-shadow-accent order-1 inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-bold text-[var(--sr-nav-pill-fg)] shadow-lg transition hover:brightness-110 disabled:pointer-events-none disabled:opacity-50 sm:min-w-[16rem] sm:flex-none"
          >
            {busyAll ? <Spinner /> : null}
            {busyAll ? 'Calculando Lagrange, Neville y demo…' : 'Calcular todo: Lagrange + Neville + gráfica Runge'}
          </button>
          <button
            type="button"
            disabled={busy || !nodeCheck.ok}
            onClick={runLagrange}
            className="sr-btn-secondary order-2 inline-flex flex-1 items-center justify-center gap-2 sm:order-none sm:flex-none"
          >
            <SrIcon name="lagrange" className="h-4 w-4" />
            Solo Lagrange
          </button>
          <button
            type="button"
            disabled={busy || !nodeCheck.ok}
            onClick={runNeville}
            className="sr-btn-secondary order-3 inline-flex flex-1 items-center justify-center gap-2 sm:order-none sm:flex-none"
          >
            <SrIcon name="neville" className="h-4 w-4" />
            Solo Neville
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={loadRunge}
            className="sr-btn-secondary order-4 inline-flex flex-1 items-center justify-center gap-2 border-amber-500/25 bg-amber-500/10 text-amber-200 hover:border-amber-400/35 hover:bg-amber-500/15 sm:order-none [html.sr-light_&]:border-amber-300 [html.sr-light_&]:bg-amber-50 [html.sr-light_&]:text-amber-950 [html.sr-light_&]:hover:bg-amber-100"
          >
            <SrIcon name="runge" className="h-4 w-4" />
            Solo demo Runge / Chebyshev
          </button>
          <button
            type="button"
            disabled={busy || !nodeCheck.ok}
            onClick={() => refreshLagSample()}
            className="sr-btn-secondary order-5 sr-border-accent sr-bg-accent-dim sr-text-accent hover:brightness-110 sm:order-none"
          >
            Actualizar gráfica P(x) nodos
          </button>
        </div>
        {(lagErr || nevErr || rungeErr) && (
          <div className="mt-3 space-y-2">
            {lagErr ? (
              <p className="rounded-lg sr-alert-danger px-3 py-2 text-sm">{lagErr}</p>
            ) : null}
            {nevErr ? (
              <p className="rounded-lg sr-alert-danger px-3 py-2 text-sm">{nevErr}</p>
            ) : null}
            {rungeErr ? (
              <p className="rounded-lg sr-alert-danger px-3 py-2 text-sm">{rungeErr}</p>
            ) : null}
          </div>
        )}
        </div>
      </GlassCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard title="Lagrange" subtitle="Desglose por nodo: peso Lᵢ(x) y término yᵢ·Lᵢ(x).">
          {lag ? (
            <div className="space-y-4 text-sm sr-workspace-text">
              <p>
                P({fmtNum(lag.x)}) ={' '}
                <span className="font-mono text-lg sr-text-accent-soft">{fmtNum(lag.P_x)}</span>
              </p>
              {lag.lagrange_terms?.length ? (
                <div className="sr-table-zone max-h-[min(50vh,480px)] overflow-auto rounded-2xl border sr-border-accent ring-1 ring-white/10 [html.sr-light_&]:ring-slate-500/35">
                  <table className="sr-workspace-text w-full border-collapse text-left text-xs text-slate-200 [html.sr-light_&]:text-slate-900">
                    <thead className="sticky top-0 z-10">
                      <tr className="border-b border-white/10 bg-slate-950/95 shadow-sm backdrop-blur-sm">
                        <th className="px-2 py-2 font-semibold sr-text-accent-soft">i</th>
                        <th className="px-2 py-2 font-semibold sr-text-accent-soft">xᵢ</th>
                        <th className="px-2 py-2 font-semibold sr-text-accent-soft">yᵢ</th>
                        <th className="px-2 py-2 font-semibold sr-text-accent-soft">Lᵢ(x)</th>
                        <th className="px-2 py-2 font-semibold sr-text-accent-soft">yᵢ·Lᵢ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lag.lagrange_terms.map((row) => (
                        <tr key={row.i} className="border-b border-white/5 odd:bg-slate-950/40">
                          <td className="px-2 py-2 font-mono">{row.i}</td>
                          <td className="px-2 py-2 font-mono tabular-nums">{fmtNum(row.x_i)}</td>
                          <td className="px-2 py-2 font-mono tabular-nums">{fmtNum(row.y_i)}</td>
                          <td className="px-2 py-2 font-mono tabular-nums">{fmtNum(row.L_i_en_x)}</td>
                          <td className="px-2 py-2 font-mono tabular-nums sr-text-accent">{fmtNum(row.termino)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="sr-workspace-text-muted text-sm">Sin resultados todavía.</p>
          )}
        </GlassCard>

        <GlassCard title="Neville" subtitle="Misma aproximación numérica que Lagrange en x*; la pirámide Qᵢ,ⱼ construye ese valor. La curva del polinomio es la misma que en la gráfica conjunta.">
          {nev ? (
            <div className="space-y-4 text-sm sr-workspace-text">
              <p>
                P({fmtNum(nev.x)}) = <span className="font-mono text-lg sr-text-accent-soft">{fmtNum(nev.P_x)}</span>
              </p>
              <NevilleTriangleTable xs={nev.x_nodes} table={nev.table} />
            </div>
          ) : (
            <p className="sr-workspace-text-muted text-sm">Sin tabla todavía.</p>
          )}
        </GlassCard>
      </div>

      {lagSample?.x?.length ? (
        <GlassCard
          title="Gráfica del polinomio interpolante"
          subtitle="Curva P(x) por Lagrange en un intervalo que rodea los nodos; puntos amarillos = nodos; rosa = (x*, P(x*)) con x* del formulario."
        >
          <LagrangeCurveChart
            sample={lagSample}
            highlight={
              (lag || nev) && Number.isFinite(Number(xStar))
                ? { x: Number(xStar), y: Number(lag?.P_x ?? nev?.P_x) }
                : null
            }
          />
        </GlassCard>
      ) : null}

      <GlassCard
        title="Weierstrass y fenómeno de Runge"
        subtitle="f(x) = 1/(1+25x²): polinomio interpolante con nodos uniformes vs nodos de Chebyshev."
      >
        <p className="sr-lead-text sr-workspace-text-muted mt-4 text-sm">{runge?.weierstrass_note}</p>
        {runge?.x ? (
          <div className="mt-4">
            <RungeComparisonChart runge={runge} />
            <RungeMetricsTable metrics={runge.metrics} />
          </div>
        ) : (
          <p className="sr-workspace-text-muted mt-4 text-sm">Carga la demo con el botón de arriba o «Calcular todo».</p>
        )}
      </GlassCard>
    </div>
  )
}
