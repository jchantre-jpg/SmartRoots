/**
 * Módulo “Raíces”: entrada de f(x), intervalo/semillas, recomendación (`/api/recommend`), resolución (`/api/solve`),
 * comparación de métodos, tablas, curvas y textos de interpretación heurística en cliente.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiPost } from '../api'
import { ConvergenceCharts } from './ConvergenceCharts'
import { FunctionCurveChart } from './FunctionCurveChart'
import { GlassCard } from './GlassCard'
import { GlossaryTip } from './GlossaryTip'
import { IterationTable } from './IterationTable'
import { StatCard } from './StatCard'
import { MathExampleButton } from './MathChip.jsx'
import { MathExprInput } from './MathExprInput.jsx'
import { Field, Spinner } from './roots/RootsFieldPrimitives.jsx'
import { RootsMethodNav } from './roots/RootsMethodNav.jsx'
import { MethodGlyph } from './roots/RootsMethodGlyph.jsx'
import { buildSolvePayload, parseOptNum, parseTolMax } from './roots/rootsWorkspacePayload.js'
import { rootsDecisionAssist } from '../lib/rootsDecisionAssist'
import { rootsInterpretationBullets } from '../lib/rootsInterpretation'
import {
  bracketMethodsViable,
  buildRootsMarkdownReport,
  buildRootsReproJson,
  compareScore,
  pickBestMethodFromCompare,
  queryStringToRootsState,
  rootAgreementStats,
  rootsStateToQueryString,
  summarizeCompareRow,
} from '../lib/rootsSolveMeta'
import { METHOD_BUTTONS, ROOT_PRESETS } from '../lib/rootsMethodExamples.js'
import { pushRootsHistory, readRootsHistory, readRootsSession, writeRootsSession } from '../lib/sessionHistory'

function fmtRootDisplay(v) {
  if (typeof v === 'number' && Number.isFinite(v)) {
    const ax = Math.abs(v)
    if (ax !== 0 && (ax < 1e-8 || ax > 1e8)) return v.toExponential(10)
    return v.toPrecision(14)
  }
  return String(v ?? '—')
}

function fmtIterError(v) {
  if (v == null || !Number.isFinite(v)) return '—'
  if (v === 0) return '0'
  const ax = Math.abs(v)
  if (ax < 1e-14 || ax > 1e6) return v.toExponential(4)
  return v.toPrecision(5)
}

async function postSolve(mId, expression, fieldsSnapshot) {
  const ex = expression.trim()
  if (!ex) return { ok: false, error: 'Escribe primero f(x) en el formulario.' }
  const num = parseTolMax(fieldsSnapshot)
  if (!num.ok) return { ok: false, error: num.error }
  const built = buildSolvePayload(mId, ex, fieldsSnapshot, num)
  if (!built.ok) return { ok: false, error: built.error }
  try {
    const data = await apiPost('/api/solve', built.body)
    return { ok: true, data }
  } catch (e) {
    return { ok: false, error: e.message }
  }
}

// -----------------------------------------------------------------------------
// Componente principal exportado (pestaña Raíces en App.jsx)
// -----------------------------------------------------------------------------
export function RootsWorkspace() {
  const [expr, setExpr] = useState('x**2 - 2')
  const [a, setA] = useState('1')
  const [b, setB] = useState('2')
  const [x0, setX0] = useState('1')
  const [x1, setX1] = useState('1.5')
  const [xmin, setXmin] = useState('-4')
  const [xmax, setXmax] = useState('4')
  const [gExpr, setGExpr] = useState('0.5*(x + 2/x)')
  const [highlightContractive, setHighlightContractive] = useState(false)
  const [tolStr, setTolStr] = useState('1e-10')
  const [maxIterStr, setMaxIterStr] = useState('120')
  const [rec, setRec] = useState(null)
  const [solve, setSolve] = useState(null)
  const [curve, setCurve] = useState(null)
  const [method, setMethod] = useState('bisection')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [okHint, setOkHint] = useState('')
  const [autoHint, setAutoHint] = useState('')
  const [compareBusy, setCompareBusy] = useState(false)
  const [compareRows, setCompareRows] = useState(null)
  const [multiNewton, setMultiNewton] = useState(null)
  const [multiBusy, setMultiBusy] = useState(false)
  const [multiSecant, setMultiSecant] = useState(null)
  const [multiSecBusy, setMultiSecBusy] = useState(false)
  const [signCheck, setSignCheck] = useState(null)
  const [historyOpen, setHistoryOpen] = useState(false)

  const fields = { a, b, x0, x1, gExpr, tolStr, maxIterStr }

  const persistSession = useCallback(() => {
    const payload = {
      expr,
      a,
      b,
      x0,
      x1,
      xmin,
      xmax,
      gExpr,
      highlightContractive,
      tolStr,
      maxIterStr,
    }
    writeRootsSession(payload)
    pushRootsHistory(payload)
  }, [expr, a, b, x0, x1, xmin, xmax, gExpr, highlightContractive, tolStr, maxIterStr])

  useEffect(() => {
    const url = queryStringToRootsState(window.location.search)
    if (url?.expr) {
      setExpr(url.expr)
      setA(url.a ?? '')
      setB(url.b ?? '')
      setX0(url.x0 ?? '')
      setX1(url.x1 ?? '')
      setXmin(url.xmin ?? '')
      setXmax(url.xmax ?? '')
      setGExpr(url.gExpr ?? '')
      if (url.tolStr) setTolStr(url.tolStr)
      if (url.maxIterStr) setMaxIterStr(url.maxIterStr)
      setHighlightContractive(Boolean(url.highlightContractive))
      return
    }
    const saved = readRootsSession()
    if (!saved || typeof saved !== 'object') return
    if (saved.expr != null) setExpr(String(saved.expr))
    if (saved.a != null) setA(String(saved.a))
    if (saved.b != null) setB(String(saved.b))
    if (saved.x0 != null) setX0(String(saved.x0))
    if (saved.x1 != null) setX1(String(saved.x1))
    if (saved.xmin != null) setXmin(String(saved.xmin))
    if (saved.xmax != null) setXmax(String(saved.xmax))
    if (saved.gExpr != null) setGExpr(String(saved.gExpr))
    if (saved.tolStr != null) setTolStr(String(saved.tolStr))
    if (saved.maxIterStr != null) setMaxIterStr(String(saved.maxIterStr))
    if (saved.highlightContractive != null) setHighlightContractive(Boolean(saved.highlightContractive))
  }, [])

  useEffect(() => {
    const t = setTimeout(() => {
      const qs = rootsStateToQueryString({
        expr,
        a,
        b,
        x0,
        x1,
        xmin,
        xmax,
        gExpr,
        highlightContractive,
        tolStr,
        maxIterStr,
      })
      if (!qs) return
      const next = `?${qs}&t=roots`
      if (typeof window !== 'undefined' && window.location.search !== next) {
        window.history.replaceState({}, '', `${window.location.pathname}${next}`)
      }
    }, 600)
    return () => clearTimeout(t)
  }, [expr, a, b, x0, x1, xmin, xmax, gExpr, highlightContractive, tolStr, maxIterStr])

  const analyze = useCallback(async () => {
    setErr('')
    setOkHint('')
    setAutoHint('')
    const ex = expr.trim()
    if (!ex) {
      setErr('Escribe una expresión para f(x).')
      return
    }
    const lo = parseOptNum(xmin)
    const hi = parseOptNum(xmax)
    if (Number.isNaN(lo) || Number.isNaN(hi)) {
      setErr('x mín y x máx deben ser números válidos.')
      return
    }
    if (lo >= hi) {
      setErr('x mín debe ser menor que x máx para graficar.')
      return
    }
    const num = parseTolMax(fields)
    if (!num.ok) {
      setErr(num.error)
      return
    }

    setBusy(true)
    setRec(null)
    setSolve(null)
    setCurve(null)
    setCompareRows(null)
    setSignCheck(null)
    let data
    try {
      const gTrim = (gExpr || '').trim()
      data = await apiPost('/api/recommend', {
        expression: ex,
        a: a === '' ? null : Number(a),
        b: b === '' ? null : Number(b),
        x0: x0 === '' ? null : Number(x0),
        x1: x1 === '' ? null : Number(x1),
        g_expression: gTrim || null,
        highlight_contractive: highlightContractive,
      })
      setRec(data)
      const m = data.recommended?.method || 'bisection'
      setMethod(m)
      try {
        const na = Number(a)
        const nb = Number(b)
        if (Number.isFinite(na) && Number.isFinite(nb)) {
          setSignCheck(await apiPost('/api/interval_sign', { expression: ex, a: na, b: nb }))
        } else {
          setSignCheck(null)
        }
      } catch {
        setSignCheck(null)
      }
    } catch (e) {
      setErr(e.message)
      setBusy(false)
      return
    }
    try {
      const c = await apiPost('/api/sample_curve', { expression: ex, xmin: lo, xmax: hi, n: 240 })
      setCurve(c)
      setOkHint('Recomendación y curva de f(x) listas.')
    } catch (e) {
      setErr(`Recomendación lista, pero el gráfico de f falló: ${e.message}`)
      setOkHint('Ajusta [x mín, x máx] si hay asíntotas o valores no reales.')
    }

    const mRun = data?.recommended?.method || 'bisection'
    const r = await postSolve(mRun, ex, fields)
    if (r.ok) {
      setSolve(r.data)
      setOkHint('Recomendación, curva de f(x) y tabla/gráficas del método recomendado listas.')
      persistSession()
    } else {
      setSolve(null)
      setAutoHint(
        r.error.startsWith('Escribe')
          ? `${r.error} Pulsa un método cuando esté listo.`
          : `No se pudo ejecutar automáticamente el método recomendado: ${r.error} Corrige datos o elige otro método.`,
      )
    }
    setBusy(false)
  }, [expr, xmin, xmax, a, b, x0, x1, gExpr, highlightContractive, fields, persistSession])

  const runSolveWithMethod = useCallback(
    async (mId) => {
      setMethod(mId)
      setErr('')
      setAutoHint('')
      setOkHint('')
      const ex = expr.trim()
      setBusy(true)
      try {
        const r = await postSolve(mId, ex, fields)
        if (!r.ok) {
          setErr(r.error)
          setSolve(null)
          return
        }
        setSolve(r.data)
        setOkHint(
          r.data.status === 'ok'
            ? `«${r.data.method_label || mId}»: operaciones, tabla y gráficas listas.`
            : `«${r.data.method_label || mId}»: tabla y gráficas listas (estado: ${r.data.status}).`,
        )
        persistSession()
      } finally {
        setBusy(false)
      }
    },
    [expr, fields, persistSession],
  )

  const runMultiNewtonSweep = useCallback(async () => {
    setErr('')
    setOkHint('')
    const lo = Number(a)
    const hi = Number(b)
    if (!Number.isFinite(lo) || !Number.isFinite(hi) || lo >= hi) {
      setErr('Para barrer x₀ en Newton, rellena a y b con números y asegúrate de que a < b.')
      return
    }
    const ex = expr.trim()
    if (!ex) {
      setErr('Escribe f(x) antes de barrer Newton.')
      return
    }
    const num = parseTolMax(fields)
    if (!num.ok) {
      setErr(num.error)
      return
    }
    const span = hi - lo
    const seeds = [lo, lo + 0.25 * span, lo + 0.5 * span, lo + 0.75 * span, hi]
    setMultiBusy(true)
    setMultiNewton(null)
    try {
      const results = await Promise.all(
        seeds.map(async (s) => {
          const fieldsS = { ...fields, x0: String(s) }
          const r = await postSolve('newton_raphson', ex, fieldsS)
          return { x0: s, ...r }
        }),
      )
      setMultiNewton(results)
      setOkHint('Barrido Newton: 5 valores de x₀ en [a, b]. Revisa cuál converge con menos iteraciones.')
    } catch (e) {
      setErr(e.message || 'Error al barrer Newton.')
    } finally {
      setMultiBusy(false)
    }
  }, [a, b, expr, fields])

  const runMultiSecantSweep = useCallback(async () => {
    setErr('')
    setOkHint('')
    const lo = Number(a)
    const hi = Number(b)
    if (!Number.isFinite(lo) || !Number.isFinite(hi) || lo >= hi) {
      setErr('Para barrer la secante, rellena a y b con números y asegúrate de que a < b.')
      return
    }
    const ex = expr.trim()
    if (!ex) {
      setErr('Escribe f(x) antes de barrer la secante.')
      return
    }
    const num = parseTolMax(fields)
    if (!num.ok) {
      setErr(num.error)
      return
    }
    const span = hi - lo
    const pairs = [
      [lo, lo + 0.22 * span],
      [lo + 0.36 * span, lo + 0.58 * span],
      [lo + 0.72 * span, hi],
    ]
    setMultiSecBusy(true)
    setMultiSecant(null)
    try {
      const results = await Promise.all(
        pairs.map(async ([s0, s1]) => {
          if (s0 === s1) return { x0: s0, x1: s1, ok: false, error: 'par degenerado' }
          const fieldsS = { ...fields, x0: String(s0), x1: String(s1) }
          const r = await postSolve('secant', ex, fieldsS)
          return { x0: s0, x1: s1, ...r }
        }),
      )
      setMultiSecant(results)
      setOkHint('Barrido secante: 3 pares (x₀, x₁) dentro de [a, b].')
    } catch (e) {
      setErr(e.message || 'Error al barrer secante.')
    } finally {
      setMultiSecBusy(false)
    }
  }, [a, b, expr, fields])

  const compareAllMethods = useCallback(async () => {
    setErr('')
    setOkHint('')
    const ex = expr.trim()
    if (!ex) {
      setErr('Escribe f(x) antes de comparar.')
      return
    }
    const num = parseTolMax(fields)
    if (!num.ok) {
      setErr(num.error)
      return
    }
    setCompareBusy(true)
    setCompareRows(null)
    try {
      let sg = null
      try {
        const na = Number(a)
        const nb = Number(b)
        if (Number.isFinite(na) && Number.isFinite(nb)) {
          sg = await apiPost('/api/interval_sign', { expression: ex, a: na, b: nb })
        }
      } catch {
        sg = null
      }
      setSignCheck(sg)
      const results = await Promise.all(
        METHOD_BUTTONS.map(async (m) => {
          const r = await postSolve(m.id, ex, fields)
          return { id: m.id, label: m.short, ...r }
        }),
      )
      setCompareRows(results)
      setOkHint('Comparación lista: revisa la tabla y abre cada método para ver el detalle.')
      persistSession()
    } catch (e) {
      setErr(e.message || 'Error al comparar métodos.')
    } finally {
      setCompareBusy(false)
    }
  }, [expr, fields, persistSession])

  const applyExampleFields = useCallback((f) => {
    setExpr(f.expr)
    setA(f.a)
    setB(f.b)
    setX0(f.x0)
    setX1(f.x1)
    setXmin(f.xmin)
    setXmax(f.xmax)
    setGExpr(f.gExpr)
    setHighlightContractive(Boolean(f.highlightContractive))
    setErr('')
    setOkHint('Ejemplo cargado. Pulsa «Analizar y graficar».')
  }, [])

  const restoreHistoryEntry = useCallback((h) => {
    setExpr(h.expr)
    setA(h.a)
    setB(h.b)
    setX0(h.x0)
    setX1(h.x1)
    setXmin(h.xmin)
    setXmax(h.xmax)
    setGExpr(h.gExpr)
    setHighlightContractive(Boolean(h.highlightContractive))
    if (h.tolStr) setTolStr(h.tolStr)
    if (h.maxIterStr) setMaxIterStr(h.maxIterStr)
    setHistoryOpen(false)
    setErr('')
    setOkHint('Valores restaurados desde el historial.')
  }, [])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setErr('')
        setOkHint('')
        setAutoHint('')
        setMultiNewton(null)
        setMultiSecant(null)
      }
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        if (!busy) void analyze()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [analyze, busy])

  const bracketText =
    rec?.bracket && Number.isFinite(rec.bracket.a) && Number.isFinite(rec.bracket.b)
      ? `[${rec.bracket.a.toFixed(4)}, ${rec.bracket.b.toFixed(4)}]`
      : null

  const interpBullets = rootsInterpretationBullets({ solve, rec })
  const hist = readRootsHistory()

  const compareDisplay = useMemo(() => {
    if (!compareRows?.length) return null
    return [...compareRows]
      .map((r) => ({ r, s: summarizeCompareRow(r) }))
      .sort((A, B) => {
        const okA = A.s.ok && A.s.status === 'ok'
        const okB = B.s.ok && B.s.status === 'ok'
        const scoreA = okA ? compareScore(A.s) : Number.POSITIVE_INFINITY
        const scoreB = okB ? compareScore(B.s) : Number.POSITIVE_INFINITY
        if (scoreA !== scoreB) return scoreA - scoreB
        if (A.s.ok !== B.s.ok) return A.s.ok ? -1 : 1
        return (A.r.label || '').localeCompare(B.r.label || '')
      })
  }, [compareRows])

  const decisionAssist = useMemo(
    () => rootsDecisionAssist({ rec, compareRows, curve, solve }),
    [rec, compareRows, curve, solve],
  )
  const pickBest = useMemo(() => pickBestMethodFromCompare(compareRows), [compareRows])
  const agreement = useMemo(() => rootAgreementStats(compareRows), [compareRows])
  const viableBracket = useMemo(() => bracketMethodsViable(signCheck), [signCheck])

  const copyReproJson = useCallback(async () => {
    setErr('')
    try {
      const txt = buildRootsReproJson({ expr, fields, xmin, xmax, highlightContractive })
      await navigator.clipboard.writeText(txt)
      setOkHint('Configuración copiada al portapapeles (JSON). Pégala en un informe o chat para reproducir el caso.')
    } catch {
      setErr('No se pudo copiar (permiso del navegador o portapapeles).')
    }
  }, [expr, fields, xmin, xmax, highlightContractive])

  const downloadMarkdownReport = useCallback(() => {
    const md = buildRootsMarkdownReport({
      expr,
      fields,
      xmin,
      xmax,
      compareRows,
      signCheck,
      highlightContractive,
    })
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
    const u = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = u
    a.download = 'smartroots-informe.md'
    a.click()
    URL.revokeObjectURL(u)
    setOkHint('Descargado smartroots-informe.md (tablas y parámetros).')
  }, [expr, fields, xmin, xmax, compareRows, signCheck, highlightContractive])

  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
      <RootsMethodNav method={method} rec={rec} busy={busy} onSelectMethod={runSolveWithMethod} />

      <div className="min-w-0 flex-1 space-y-8">
        <div className="flex flex-col gap-8 lg:gap-10">
          <GlassCard
            title="Raíces de ecuaciones"
            subtitle="Analiza f(x), intervalo y semillas; sugiere un método y lo ejecuta si los datos lo permiten. Usa la columna «Métodos» para comparar tablas y gráficas."
          >
            <div className="space-y-6">
              <div>
                <p className="sr-form-section-label mb-2">Ejemplos rápidos</p>
                <div className="flex flex-wrap gap-2">
                  {ROOT_PRESETS.map((p) => (
                    <MathExampleButton
                      key={p.id}
                      tex={p.labelTex || p.label}
                      title={p.expr}
                      onClick={() => applyExampleFields(p)}
                    />
                  ))}
                </div>
              </div>

              {hist.length ? (
                <div>
                  <button
                    type="button"
                    onClick={() => setHistoryOpen(!historyOpen)}
                    className="text-xs font-semibold uppercase tracking-wider sr-text-accent hover:brightness-125"
                  >
                    Historial ({hist.length}) {historyOpen ? '▲' : '▼'}
                  </button>
                  {historyOpen ? (
                    <ul className="mt-2 max-h-40 space-y-1 overflow-auto rounded-xl border border-white/10 bg-slate-950/50 p-2 text-xs [html.sr-light_&]:border-slate-400/50 [html.sr-light_&]:bg-slate-200/55 [html.sr-light_&]:shadow-inner">
                      {hist.map((h, i) => (
                        <li key={`${h.at}-${i}`}>
                          <button
                            type="button"
                            className="w-full truncate rounded-lg px-2 py-1.5 text-left text-slate-300 hover:bg-white/10 [html.sr-light_&]:text-slate-900 [html.sr-light_&]:hover:bg-slate-300/70"
                            onClick={() => restoreHistoryEntry(h)}
                            title={h.expr}
                          >
                            {h.expr.slice(0, 48)}
                            {h.expr.length > 48 ? '…' : ''}
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ) : null}

              <div className="sr-workspace-panel p-4 sm:p-5">
                <p className="sr-form-section-label mb-4">Función y datos</p>
                <div className="grid gap-4">
                  <MathExprInput
                    label="f(x)"
                    hint="Editor matemático: teclado en pantalla o teclado del dispositivo. Solo la variable x."
                    value={expr}
                    onChange={setExpr}
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="a (intervalo)" value={a} onChange={(e) => setA(e.target.value)} inputMode="decimal" />
                    <Field label="b (intervalo)" value={b} onChange={(e) => setB(e.target.value)} inputMode="decimal" />
                    <Field label="x₀" value={x0} onChange={(e) => setX0(e.target.value)} inputMode="decimal" />
                    <Field label="x₁ (secante)" value={x1} onChange={(e) => setX1(e.target.value)} inputMode="decimal" />
                  </div>
                </div>
              </div>

              <div className="sr-workspace-panel p-4 sm:p-5">
                <p className="sr-form-section-label mb-4">Ventana del gráfico f(x)</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="x mín" value={xmin} onChange={(e) => setXmin(e.target.value)} inputMode="decimal" />
                  <Field label="x máx" value={xmax} onChange={(e) => setXmax(e.target.value)} inputMode="decimal" />
                </div>
              </div>

              <div className="sr-workspace-panel p-4 sm:p-5">
                <p className="sr-form-section-label mb-4">Punto fijo</p>
                <MathExprInput
                  label="g(x) — punto fijo"
                  hint="Reescribe x = g(x) en el editor. Ejemplo Newton √2: 0.5·(x + 2/x)."
                  value={gExpr}
                  onChange={setGExpr}
                  examples={[
                    { latex: '\\cos(x)' },
                    { latex: 'e^{-x}' },
                    { latex: '0.5\\left(x+\\frac{2}{x}\\right)' },
                  ]}
                />
                <label className="mt-3 flex cursor-pointer items-start gap-2.5 text-[11px] leading-snug text-slate-400 [html.sr-light_&]:text-slate-600">
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/20 bg-slate-900/80 text-[var(--sr-accent)] focus:ring-[var(--sr-accent)] [html.sr-light_&]:border-slate-300 [html.sr-light_&]:bg-white"
                    checked={highlightContractive}
                    onChange={(e) => setHighlightContractive(e.target.checked)}
                  />
                  <span>
                    En «Analizar», si marcas esto y{' '}
                    <code className="rounded bg-slate-800/90 px-1 text-slate-200 [html.sr-light_&]:bg-slate-200 [html.sr-light_&]:text-slate-900">
                      g
                    </code>{' '}
                    cumple |g′(x₀)| &lt; 1, el asistente puede priorizar{' '}
                    <strong className="text-slate-300 [html.sr-light_&]:text-slate-900">punto fijo</strong> frente a Newton (útil al
                    experimentar con x = g(x)).
                  </span>
                </label>
              </div>

              <div className="sr-workspace-panel p-4 sm:p-5">
                <p className="sr-form-section-label mb-4">
                  Precisión (
                  <GlossaryTip
                    term="tolerancia"
                    definition="Criterio de parada: cuando el error estimado es menor que este valor, el método suele detenerse."
                  >
                    tolerancia
                  </GlossaryTip>
                  , iteraciones)
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field
                    label="Tolerancia (tol)"
                    hint="Ej.: 1e-10, 1e-8, 0.0001"
                    value={tolStr}
                    onChange={(e) => setTolStr(e.target.value)}
                    spellCheck={false}
                  />
                  <Field
                    label="Máx. iteraciones"
                    hint="Entre 8 y 600"
                    value={maxIterStr}
                    onChange={(e) => setMaxIterStr(e.target.value)}
                    inputMode="numeric"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={busy}
                  onClick={analyze}
                  aria-busy={busy}
                  className="sr-btn-primary sr-shadow-accent inline-flex min-h-[48px] min-w-[12rem] items-center justify-center gap-2 rounded-2xl px-6 text-sm font-bold text-[var(--sr-nav-pill-fg)] shadow-lg disabled:pointer-events-none disabled:opacity-50"
                >
                  {busy ? <Spinner /> : null}
                  {busy ? 'Analizando…' : 'Analizar y graficar'}
                </button>
                <button
                  type="button"
                  disabled={busy || compareBusy}
                  onClick={compareAllMethods}
                  className="sr-btn-secondary min-h-[48px] px-4 text-sm font-semibold"
                >
                  {compareBusy ? <Spinner /> : null}
                  {compareBusy ? 'Comparando…' : 'Comparar todos los métodos'}
                </button>
                <button
                  type="button"
                  disabled={busy || compareBusy || multiBusy || multiSecBusy}
                  onClick={() => void runMultiNewtonSweep()}
                  className="sr-btn-secondary min-h-[48px] border-violet-500/25 bg-violet-500/10 px-4 text-sm font-semibold text-violet-200 hover:border-violet-400/35 [html.sr-light_&]:border-violet-400/50 [html.sr-light_&]:bg-violet-200/75 [html.sr-light_&]:text-violet-950 [html.sr-light_&]:hover:bg-violet-200"
                >
                  {multiBusy ? <Spinner /> : null}
                  {multiBusy ? 'Barrido Newton…' : 'Newton: 5× x₀ en [a,b]'}
                </button>
                <button
                  type="button"
                  disabled={busy || compareBusy || multiSecBusy || multiBusy}
                  onClick={() => void runMultiSecantSweep()}
                  className="sr-btn-secondary min-h-[48px] border-teal-500/25 bg-teal-500/10 px-4 text-sm font-semibold text-teal-200 hover:border-teal-400/35 [html.sr-light_&]:border-teal-500/45 [html.sr-light_&]:bg-teal-200/75 [html.sr-light_&]:text-teal-950 [html.sr-light_&]:hover:bg-teal-200"
                >
                  {multiSecBusy ? <Spinner /> : null}
                  {multiSecBusy ? 'Secante…' : 'Secante: 3 pares en [a,b]'}
                </button>
                <button
                  type="button"
                  disabled={busy || !compareRows?.length}
                  onClick={() => downloadMarkdownReport()}
                  className="sr-btn-secondary min-h-[48px] px-4 text-sm font-semibold"
                >
                  Descargar informe .md
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void copyReproJson()}
                  className="sr-btn-secondary min-h-[48px] px-4 text-sm font-semibold"
                >
                  Copiar JSON (reproducir)
                </button>
              </div>
              {okHint ? <p className="sr-alert-success">{okHint}</p> : null}
              {autoHint ? <p className="sr-alert-warn">{autoHint}</p> : null}
              {err ? (
                <p className="sr-alert-danger" role="alert">
                  {err}
                </p>
              ) : null}
            </div>
          </GlassCard>

          <GlassCard
            title="Recomendación y método"
            subtitle="Tras analizar, el asistente marca el sugerido (★) en la lista de métodos. El ranking ayuda a comparar enfoques."
          >
            {rec ? (
              <div className="space-y-4 text-left text-sm sr-workspace-text">
                <div className="sr-rec-hero">
                  <p className="text-xs uppercase tracking-widest sr-text-accent-soft">Sugerido</p>
                  <p className="sr-workspace-strong mt-1 text-lg font-semibold">{rec.recommended?.label}</p>
                  <p className="sr-workspace-text mt-2">{rec.recommended?.when}</p>
                  {bracketText ? (
                    <p className="sr-workspace-text-muted mt-2 text-xs">Intervalo con cambio de signo: {bracketText}</p>
                  ) : null}
                  <p className="sr-workspace-text-faint mt-2 text-xs">
                    Curva en [x mín, x máx]:{' '}
                    <span
                      className={
                        decisionAssist.curveLevel === 'warn'
                          ? 'text-amber-300 [html.sr-light_&]:text-amber-800'
                          : decisionAssist.curveLevel === 'ok'
                            ? 'text-emerald-300/90 [html.sr-light_&]:text-emerald-800'
                            : 'text-slate-500 [html.sr-light_&]:text-slate-600'
                      }
                    >
                      {decisionAssist.curveLevel === 'warn'
                        ? 'revisar (hay advertencias en el muestreo).'
                        : decisionAssist.curveLevel === 'ok'
                          ? 'muestreo sin advertencias fuertes.'
                          : 'aún sin curva o sin analizar.'}
                    </span>
                  </p>
                </div>
                {rec.notes?.length ? (
                  <ul className="sr-workspace-text-muted list-disc space-y-1 pl-5">
                    {rec.notes.map((n, i) => (
                      <li key={i}>{n}</li>
                    ))}
                  </ul>
                ) : null}
                {rec.ranked?.length ? (
                  <div>
                    <p className="sr-workspace-text-faint mb-2 text-xs uppercase tracking-widest">Ranking heurístico</p>
                    <ol className="space-y-2">
                      {rec.ranked.map((c) => (
                        <li
                          key={c.method}
                          className="sr-workspace-nested flex items-center justify-between px-3 py-2"
                        >
                          <span>{c.label}</span>
                          <span className="tabular-nums sr-text-accent-bright">{c.score}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                ) : null}
                {rec.fixed_point_hint ? (
                  <p className="sr-workspace-text-faint text-xs">{rec.fixed_point_hint}</p>
                ) : null}
              </div>
            ) : (
              <p className="sr-workspace-text-muted text-sm">Pulsa &quot;Analizar y graficar&quot; para ver la recomendación.</p>
            )}
          </GlassCard>
        </div>

        {compareRows && compareDisplay ? (
          <GlassCard
            title="Comparación de métodos"
            subtitle={`Misma f(x) y mismos parámetros · tol=${tolStr}, máx. iter.=${maxIterStr}. #f / #f′ / #g = conteos reales del servidor. Filas ordenadas por score (menor = mejor entre «ok»).`}
          >
            {signCheck && typeof signCheck === 'object' && !signCheck.error ? (
              <p className="sr-workspace-panel sr-workspace-text mb-3 px-3 py-2 text-xs">
                En [a, b]: f(a) ≈ {fmtIterError(signCheck.f_a)}, f(b) ≈ {fmtIterError(signCheck.f_b)}.{' '}
                {signCheck.opposite_signs ? (
                  <span className="sr-state-ok">Hay cambio de signo: bisección y posición falsa son coherentes con el intervalo.</span>
                ) : (
                  <span className="sr-state-warn">No hay cambio de signo en los extremos: bisección / posición falsa suelen rechazar el caso.</span>
                )}
              </p>
            ) : null}
            {agreement.count >= 2 ? (
              <p
                className={`mb-3 px-3 py-2 text-sm ${
                  agreement.agree ? 'sr-alert-success' : 'sr-alert-warn'
                }`}
              >
                {agreement.agree
                  ? `Las raíces con estado «ok» están alineadas (dispersión ≈ ${agreement.spread?.toExponential(3) ?? '—'}).`
                  : `Atención: las raíces «ok» difieren (dispersión ≈ ${agreement.spread?.toExponential(3) ?? '—'}). Puede haber varias raíces o sensibilidad al método / datos.`}
              </p>
            ) : null}
            <div className="sr-table-zone overflow-auto rounded-2xl border sr-border-accent ring-1 ring-white/10 [html.sr-light_&]:ring-slate-500/35">
              <table className="sr-workspace-text w-full min-w-[980px] border-collapse text-left text-sm text-slate-200 [html.sr-light_&]:text-slate-900">
                <thead>
                  <tr className="border-b border-white/10 bg-slate-950/95">
                    <th className="px-3 py-2.5 font-semibold sr-text-accent-soft">Método</th>
                    <th className="px-3 py-2.5 font-semibold sr-text-accent-soft" title="Cambio de signo en [a,b] para métodos de intervalo">
                      Viable [a,b]
                    </th>
                    <th className="px-3 py-2.5 font-semibold sr-text-accent-soft">Estado</th>
                    <th className="px-3 py-2.5 font-semibold sr-text-accent-soft">Raíz</th>
                    <th className="px-3 py-2.5 font-semibold sr-text-accent-soft">Iter.</th>
                    <th className="px-3 py-2.5 font-semibold sr-text-accent-soft">#f</th>
                    <th className="px-3 py-2.5 font-semibold sr-text-accent-soft">#f′</th>
                    <th className="px-3 py-2.5 font-semibold sr-text-accent-soft">#g</th>
                    <th className="px-3 py-2.5 font-semibold sr-text-accent-soft">|Residual|</th>
                    <th className="px-3 py-2.5 font-semibold sr-text-accent-soft">Últ. Δ</th>
                    <th className="px-3 py-2.5 font-semibold sr-text-accent-soft">Parada</th>
                    <th className="px-3 py-2.5 font-semibold sr-text-accent-soft">Score</th>
                    <th className="max-w-[min(180px,22vw)] px-3 py-2.5 font-semibold sr-text-accent-soft">Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  {compareDisplay.map(({ r, s }) => (
                    <tr key={r.id} className="border-b border-white/5 odd:bg-slate-950/40">
                      <td className="sr-workspace-strong px-3 py-2 font-medium">
                        <span className="inline-flex items-center gap-2">
                          <MethodGlyph id={r.id} className="h-4 w-4 shrink-0 sr-text-accent-bright" />
                          {r.label}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs">
                        {r.id === 'bisection' || r.id === 'false_position' ? (
                          viableBracket === true ? (
                            <span className="sr-state-ok">Sí</span>
                          ) : viableBracket === false ? (
                            <span className="sr-state-warn">No</span>
                          ) : (
                            '—'
                          )
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {r.ok ? (
                          <span className="sr-state-ok">{r.data?.status ?? '—'}</span>
                        ) : (
                          <span className="sr-state-bad">error</span>
                        )}
                      </td>
                      <td className="px-3 py-2 font-mono text-xs tabular-nums sr-text-accent-soft">
                        {r.ok && r.data ? fmtRootDisplay(r.data.root) : '—'}
                      </td>
                      <td className="px-3 py-2 tabular-nums">{s.iters}</td>
                      <td className="px-3 py-2 tabular-nums text-slate-400">{s.cost.f}</td>
                      <td className="px-3 py-2 tabular-nums text-slate-400">{s.cost.df}</td>
                      <td className="px-3 py-2 tabular-nums text-slate-400">{s.cost.g}</td>
                      <td className="px-3 py-2 font-mono text-xs tabular-nums text-slate-200">{fmtIterError(s.residual)}</td>
                      <td className="px-3 py-2 font-mono text-xs tabular-nums text-slate-300">{fmtIterError(s.lastErr)}</td>
                      <td className="max-w-[min(160px,20vw)] px-3 py-2 text-[11px] text-slate-400">
                        {s.stopReasonLabel || '—'}
                      </td>
                      <td className="sr-state-score px-3 py-2 font-mono text-xs tabular-nums">
                        {s.ok && s.status === 'ok' ? compareScore(s).toFixed(2) : '—'}
                      </td>
                      <td className="max-w-[min(180px,22vw)] px-3 py-2 text-xs text-slate-500">{s.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="sr-workspace-text-muted mt-2 text-xs">
              Score = iter + 0,001·(#f+2#f′+#g) + 0,02·log10(últ.Δ) + 0,12·log10(|residual|) (solo filas «ok»; heurística de ordenación).
            </p>
          </GlassCard>
        ) : null}

        {(rec || compareRows) && (
          <GlassCard
            title="Cómo elegir (guía visible)"
            subtitle="Reglas heurísticas a partir del bracket, la curva y la última comparación. Ajusta datos y vuelve a comparar."
          >
            {decisionAssist.bullets.length ? (
              <ul className="sr-workspace-text list-disc space-y-1.5 pl-5 text-sm">
                {decisionAssist.bullets.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            ) : null}
            {pickBest?.best ? (
              <div className="sr-workspace-text mt-4 rounded-2xl border sr-border-accent-strong sr-bg-accent-dim p-4 text-sm">
                <p className="text-[11px] font-bold uppercase tracking-wider sr-text-accent-bright">Tras la última comparación</p>
                <p className="mt-2">
                  Mejor balance aproximado según score:{' '}
                  <span className="sr-workspace-strong font-semibold">{pickBest.best.label}</span> (~{pickBest.best.iters} iter.
                  {(() => {
                    const c = pickBest.best.cost
                    const p = []
                    if (c.f) p.push(`~${c.f} f`)
                    if (c.df) p.push(`~${c.df} f′`)
                    if (c.g) p.push(`~${c.g} g`)
                    return p.length ? `, ${p.join(', ')}` : ''
                  })()}
                  ).
                </p>
                <p className="sr-workspace-text-muted mt-1 text-xs">{pickBest.reason}</p>
              </div>
            ) : compareRows ? (
              <p className="sr-workspace-text-muted mt-3 text-sm">
                Ningún método quedó en estado «ok» en la tabla: revisa intervalo, semillas o tolerancia antes de elegir un «ganador».
              </p>
            ) : null}
          </GlassCard>
        )}

        {multiNewton?.length ? (
          <GlassCard
            title="Newton con varios x₀ en [a, b]"
            subtitle="Cinco semillas equiespaciadas; misma tolerancia e iteraciones máx. que en el formulario."
          >
            <div className="sr-table-zone overflow-auto rounded-2xl border border-violet-500/15 ring-1 ring-white/10 [html.sr-light_&]:ring-slate-500/35">
              <table className="sr-workspace-text w-full min-w-[480px] border-collapse text-left text-sm text-slate-200 [html.sr-light_&]:text-slate-900">
                <thead>
                  <tr className="border-b border-white/10 bg-slate-950/95">
                    <th className="sr-table-heading-violet px-3 py-2 font-semibold">x₀</th>
                    <th className="sr-table-heading-violet px-3 py-2 font-semibold">Resultado</th>
                    <th className="sr-table-heading-violet px-3 py-2 font-semibold">Raíz</th>
                    <th className="sr-table-heading-violet px-3 py-2 font-semibold">Iter.</th>
                  </tr>
                </thead>
                <tbody>
                  {multiNewton.map((row, i) => (
                    <tr key={i} className="border-b border-white/5 odd:bg-slate-950/40">
                      <td className="px-3 py-2 font-mono tabular-nums text-slate-300">{fmtRootDisplay(row.x0)}</td>
                      <td className="px-3 py-2 text-xs">
                        {row.ok ? (
                          <span className="sr-state-ok">{row.data?.status ?? '—'}</span>
                        ) : (
                          <span className="sr-state-bad">{row.error?.slice(0, 80) ?? 'error'}</span>
                        )}
                      </td>
                      <td className="px-3 py-2 font-mono text-xs tabular-nums sr-text-accent-soft">
                        {row.ok && row.data ? fmtRootDisplay(row.data.root) : '—'}
                      </td>
                      <td className="px-3 py-2 tabular-nums">
                        {row.ok && row.data ? String(row.data.iterations_count ?? row.data.iterations?.length ?? '—') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        ) : null}

        {multiSecant?.length ? (
          <GlassCard
            title="Secante con varios pares (x₀, x₁)"
            subtitle="Tres pares dentro de [a, b]; misma tolerancia e iteraciones máx."
          >
            <div className="sr-table-zone overflow-auto rounded-2xl border border-teal-500/15 ring-1 ring-white/10 [html.sr-light_&]:ring-slate-500/35">
              <table className="sr-workspace-text w-full min-w-[520px] border-collapse text-left text-sm text-slate-200 [html.sr-light_&]:text-slate-900">
                <thead>
                  <tr className="border-b border-white/10 bg-slate-950/95">
                    <th className="sr-table-heading-teal px-3 py-2 font-semibold">x₀</th>
                    <th className="sr-table-heading-teal px-3 py-2 font-semibold">x₁</th>
                    <th className="sr-table-heading-teal px-3 py-2 font-semibold">Resultado</th>
                    <th className="sr-table-heading-teal px-3 py-2 font-semibold">Raíz</th>
                    <th className="sr-table-heading-teal px-3 py-2 font-semibold">Iter.</th>
                  </tr>
                </thead>
                <tbody>
                  {multiSecant.map((row, i) => (
                    <tr key={i} className="border-b border-white/5 odd:bg-slate-950/40">
                      <td className="px-3 py-2 font-mono text-xs tabular-nums text-slate-300">{fmtRootDisplay(row.x0)}</td>
                      <td className="px-3 py-2 font-mono text-xs tabular-nums text-slate-300">{fmtRootDisplay(row.x1)}</td>
                      <td className="px-3 py-2 text-xs">
                        {row.ok ? (
                          <span className="sr-state-ok">{row.data?.status ?? '—'}</span>
                        ) : (
                          <span className="sr-state-bad">{row.error?.slice(0, 80) ?? 'error'}</span>
                        )}
                      </td>
                      <td className="px-3 py-2 font-mono text-xs tabular-nums sr-text-accent-soft">
                        {row.ok && row.data ? fmtRootDisplay(row.data.root) : '—'}
                      </td>
                      <td className="px-3 py-2 tabular-nums">
                        {row.ok && row.data ? String(row.data.iterations_count ?? row.data.iterations?.length ?? '—') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        ) : null}

        {curve?.x ? (
          <GlassCard title="Curva f(x)" subtitle="Muestreo numérico en el rango elegido.">
            {curve.warnings?.length ? (
              <ul className="sr-alert-warn mb-4 list-disc space-y-1 pl-5 text-sm">
                {curve.warnings.map((w, i) => (
                  <li key={i}>⚠ {w}</li>
                ))}
              </ul>
            ) : null}
            <FunctionCurveChart curve={curve} />
          </GlassCard>
        ) : null}

        {solve?.iterations?.length ? (
          <GlassCard
            title={`Paso a paso · ${solve.method_label || solve.method}`}
            subtitle={`f(x) = ${solve.expression} · Tabla completa con scroll y gráficas de convergencia.`}
          >
            <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <StatCard label="Raíz aproximada" value={fmtRootDisplay(solve.root)} />
              <StatCard label="Iteraciones" value={String(solve.iterations_count ?? solve.iterations.length)} />
              <StatCard label="Estado" value={String(solve.status)} />
              <StatCard
                label={solve.residual_caption || '|Residual|'}
                value={
                  typeof solve.residual_abs === 'number' && Number.isFinite(solve.residual_abs)
                    ? fmtIterError(solve.residual_abs)
                    : '—'
                }
              />
              <StatCard label="Parada" value={String(solve.stop_reason_label || solve.stop_reason || '—')} />
              <StatCard
                label="Evaluaciones (servidor)"
                value={
                  solve.eval_counts
                    ? `#f ${solve.eval_counts.f} · #f′ ${solve.eval_counts.df} · #g ${solve.eval_counts.g}`
                    : '—'
                }
              />
            </div>
            {solve.diagnostics?.length ? (
              <ul className="sr-alert-warn mb-5 list-disc space-y-1 pl-5 text-sm">
                {solve.diagnostics.map((d, i) => (
                  <li key={i}>⚠ {d}</li>
                ))}
              </ul>
            ) : null}
            {interpBullets.length ? (
              <div className="sr-workspace-text mb-5 rounded-2xl border sr-border-accent sr-bg-accent-dim px-4 py-3 text-sm">
                <p className="text-[11px] font-bold uppercase tracking-wider sr-text-accent">Qué mirar</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {interpBullets.map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            <IterationTable method={solve.method} rows={solve.iterations} />
            <p className="sr-workspace-text-faint mt-6 text-xs font-semibold uppercase tracking-[0.2em]">Gráficas de convergencia</p>
            <div className="mt-2">
              <ConvergenceCharts rows={solve.iterations} />
            </div>
          </GlassCard>
        ) : null}
      </div>
    </div>
  )
}
