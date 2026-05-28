/**
 * Entrada de f(x) o g(x): editor MathLive (teclado en pantalla + teclado del dispositivo).
 * El valor para el backend es SymPy; solo se actualiza cuando la conversión es válida.
 */
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { convertExpr } from '../lib/exprConvert.js'
import { MathChip } from './MathChip.jsx'
import { M } from './Math.jsx'

const DEBOUNCE_MS = 420

/** f(x) y g(x) comparten un solo teclado MathLive en la página */
let mathKeyboardDismissed = false

export function MathExprInput({
  label,
  hint,
  value,
  onChange,
  id: idProp,
  examples = [
    { latex: 'x^{2}-2' },
    { latex: 'e^{x}-3x' },
    { latex: '\\sin(x)-\\frac{x}{2}' },
  ],
}) {
  const autoId = useId()
  const fieldId = idProp || `math-expr-${autoId}`
  const containerRef = useRef(null)
  const mfRef = useRef(null)
  const debounceRef = useRef(null)
  const syncingRef = useRef(false)
  const lastSyncedSympyRef = useRef(null)
  const onChangeRef = useRef(onChange)
  const valueRef = useRef(value)

  const [previewLatex, setPreviewLatex] = useState('')
  const [convertErr, setConvertErr] = useState('')
  const [ready, setReady] = useState(false)
  const [keyboardVisible, setKeyboardVisible] = useState(false)

  onChangeRef.current = onChange
  valueRef.current = value

  const pushSympy = useCallback((sympy, latex) => {
    if (latex) setPreviewLatex(latex)
    setConvertErr('')
    lastSyncedSympyRef.current = sympy
    if (sympy !== valueRef.current) onChangeRef.current(sympy)
  }, [])

  const syncFromSympy = useCallback(async (sympy) => {
    const s = (sympy || '').trim()
    if (!s) return
    try {
      const r = await convertExpr({ sympy: s })
      setPreviewLatex(r.latex || '')
      setConvertErr('')
      const mf = mfRef.current
      if (mf) {
        syncingRef.current = true
        mf.setValue(r.latex || '', { format: 'latex' })
        syncingRef.current = false
      }
    } catch {
      setConvertErr('No se pudo cargar esa expresión. Elige una plantilla o escríbela de nuevo.')
    }
  }, [])

  const showMathKeyboard = useCallback((focusField = true) => {
    mathKeyboardDismissed = false
    const kbd = typeof window !== 'undefined' ? window.mathVirtualKeyboard : null
    if (!kbd) return
    kbd.layouts = ['default', 'symbols', 'greek']
    const mf = mfRef.current
    if (focusField && mf && !mf.hasFocus?.()) mf.focus({ preventScroll: true })
    kbd.show({ animate: true })
    setKeyboardVisible(true)
  }, [])

  const hideMathKeyboard = useCallback(() => {
    mathKeyboardDismissed = true
    const mf = mfRef.current
    mf?.blur?.()
    const kbd = window.mathVirtualKeyboard
    if (kbd?.visible) {
      kbd.hide({ animate: true })
    }
    setKeyboardVisible(false)
  }, [])

  const convertFromLatex = useCallback(
    (latex) => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current)
      debounceRef.current = window.setTimeout(async () => {
        const L = (latex || '').trim()
        if (!L) {
          setConvertErr('')
          return
        }
        try {
          const r = await convertExpr({ latex: L })
          pushSympy(r.sympy, r.latex)
        } catch {
          // Mantener lo que ves en el editor; no enviar SymPy inválido al servidor.
          setConvertErr(
            'Fórmula incompleta o no válida para el cálculo. Sigue editando, usa el teclado □ o una plantilla. Solo la variable x.',
          )
        }
      }, DEBOUNCE_MS)
    },
    [pushSympy],
  )

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      const { MathfieldElement } = await import('mathlive')
      await import('mathlive/static.css')
      if (cancelled || !containerRef.current) return

      const mf = new MathfieldElement({
        'aria-label': label,
      })
      mf.className = 'sr-math-field'
      mf.id = `${fieldId}-mf`
      // manual + show(): funciona en PC y móvil (auto solo abre en táctil).
      mf.mathVirtualKeyboardPolicy = 'manual'
      mf.smartFence = true
      mf.smartSuperscript = true
      mf.defaultMode = 'math'
      mf.placeholder = '\\text{Escribe } f(x)\\text{…}'

      containerRef.current.appendChild(mf)
      mfRef.current = mf

      mf.addEventListener('input', () => {
        if (syncingRef.current) return
        const latex = mf.getValue('latex-expanded') || mf.getValue('latex') || mf.getValue()
        setPreviewLatex(latex)
        setConvertErr('')
        convertFromLatex(latex)
      })

      mf.addEventListener('focusin', () => {
        if (!mathKeyboardDismissed) showMathKeyboard(false)
      })

      if (!cancelled) {
        setReady(true)
        await syncFromSympy(valueRef.current || 'x**2 - 2')
      }
    })()

    return () => {
      cancelled = true
      if (debounceRef.current) window.clearTimeout(debounceRef.current)
      const mf = mfRef.current
      if (mf?.parentNode) mf.parentNode.removeChild(mf)
      mfRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- montaje único del math-field
  }, [fieldId, label, showMathKeyboard])

  useEffect(() => {
    if (!ready) return
    const kbd = window.mathVirtualKeyboard
    if (!kbd) return
    let wasVisible = Boolean(kbd.visible)
    const sync = () => {
      const vis = Boolean(kbd.visible)
      setKeyboardVisible(vis)
      if (wasVisible && !vis) mathKeyboardDismissed = true
      wasVisible = vis
    }
    sync()
    kbd.addEventListener('virtual-keyboard-toggle', sync)
    return () => kbd.removeEventListener('virtual-keyboard-toggle', sync)
  }, [ready])

  useEffect(() => {
    if (!ready) return
    if (value === lastSyncedSympyRef.current) return
    void syncFromSympy(value)
  }, [value, ready, syncFromSympy])

  return (
    <div className="flex flex-col gap-2 text-sm text-slate-300 [html.sr-light_&]:text-slate-700">
      <span className="text-[13px] font-medium leading-snug text-slate-200 [html.sr-light_&]:text-slate-900">
        {label}
      </span>

      <div className="space-y-2">
        <div className="flex flex-wrap items-stretch gap-2">
          <div ref={containerRef} className="sr-math-field-wrap min-w-0 flex-1" />
          <button
            type="button"
            className="sr-btn-secondary shrink-0 self-stretch rounded-xl px-3 text-[11px] font-semibold leading-tight"
            aria-pressed={keyboardVisible}
            onMouseDown={(e) => {
              if (keyboardVisible) e.preventDefault()
            }}
            onClick={() => (keyboardVisible ? hideMathKeyboard() : showMathKeyboard())}
          >
            {keyboardVisible ? 'Ocultar teclado' : 'Teclado □'}
          </button>
        </div>
        <p className="text-[11px] text-slate-500 [html.sr-light_&]:text-slate-600">
          Puedes escribir con el teclado del PC o del móvil (por ejemplo <code className="text-[10px]">sin</code>,{' '}
          <code className="text-[10px]">^</code>, <code className="text-[10px]">/</code>) o con el teclado matemático
          □ en pantalla.
        </p>
        {previewLatex ? (
          <div className="sr-math-preview rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 [html.sr-light_&]:border-slate-400/40 [html.sr-light_&]:bg-slate-100/90">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Vista previa</p>
            <div className="mt-1 overflow-x-auto">
              <M tex={previewLatex} />
            </div>
          </div>
        ) : null}
      </div>

      {convertErr ? (
        <p className="text-[12px] leading-snug text-amber-400 [html.sr-light_&]:text-amber-800" role="status">
          {convertErr}
        </p>
      ) : null}

      {hint ? (
        <span className="sr-lead-text text-[12px] text-slate-500 [html.sr-light_&]:text-slate-600">{hint}</span>
      ) : null}

      {examples?.length ? (
        <div className="flex flex-wrap gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Plantillas:</span>
          {examples.map((ex) => (
            <button
              key={ex.latex}
              type="button"
              className="sr-btn-secondary rounded-lg px-2 py-1 text-[10px] font-semibold"
              onClick={() => {
                const { latex } = ex
                if (mfRef.current) {
                  syncingRef.current = true
                  mfRef.current.setValue(latex, { format: 'latex' })
                  syncingRef.current = false
                  setPreviewLatex(latex)
                  convertFromLatex(latex)
                }
              }}
            >
              <MathChip tex={ex.latex} />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
