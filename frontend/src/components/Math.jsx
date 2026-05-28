/**
 * Renderizado de notación matemática con KaTeX (LaTeX).
 */
import katex from 'katex'
import 'katex/dist/katex.min.css'
import { useMemo } from 'react'

const blockClass =
  'sr-math-block my-3 overflow-x-auto rounded-xl border border-white/[0.08] bg-slate-950/55 px-4 py-3 text-center ring-1 ring-white/[0.04] [html.sr-light_&]:border-slate-400/50 [html.sr-light_&]:bg-slate-100/90 [html.sr-light_&]:ring-slate-400/35 [html.sr-light_&]:shadow-inner'

const inlineClass = 'sr-math-inline whitespace-nowrap'

function render(tex, displayMode) {
  return katex.renderToString(tex, {
    throwOnError: false,
    displayMode,
    strict: 'ignore',
  })
}

/** Fórmula en bloque (centrada). */
export function MathBlock({ tex }) {
  const html = useMemo(() => render(tex, true), [tex])
  return <div className={blockClass} dangerouslySetInnerHTML={{ __html: html }} aria-label={tex} />
}

/** Matemática en línea dentro de un párrafo. */
export function M({ tex }) {
  const html = useMemo(() => render(tex, false), [tex])
  return <span className={inlineClass} dangerouslySetInnerHTML={{ __html: html }} />
}

const latexHint = /\\[a-zA-Z]|\\frac|_\{|\\text|\\Rightarrow|\\leftarrow/

/** Paso a paso en tablas (API devuelve LaTeX en ``paso`` / ``texto``). */
export function MathStep({ tex, display = true }) {
  const isLatex = Boolean(tex && latexHint.test(tex))
  const html = useMemo(() => (isLatex ? render(tex, display) : ''), [tex, display, isLatex])
  if (!tex) return <span>—</span>
  if (!isLatex) {
    return <span className="text-[12px] leading-relaxed">{tex}</span>
  }
  return (
    <div
      className="sr-math-step text-left text-[12px] leading-relaxed [&_.katex]:text-[0.95em] [&_.katex-display]:my-0.5"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
