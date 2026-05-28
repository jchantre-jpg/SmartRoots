/**
 * Etiqueta matemática compacta (KaTeX) para botones y chips de ejemplo.
 */
import { M } from './Math.jsx'

export function MathChip({ tex, className = '' }) {
  if (!tex) return null
  return (
    <span
      className={`sr-math-chip inline-flex max-w-full items-center justify-center overflow-x-auto ${className}`}
    >
      <M tex={tex} />
    </span>
  )
}

/**
 * Botón de ejemplo con notación matemática en la etiqueta.
 */
export function MathExampleButton({ tex, title, onClick, disabled, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={
        className ||
        'sr-btn-secondary inline-flex max-w-full items-center rounded-xl px-3 py-2 text-xs font-semibold'
      }
    >
      <MathChip tex={tex} />
    </button>
  )
}
