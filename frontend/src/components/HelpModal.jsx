/**
 * Ayuda contextual breve (lista de bullets); estilos distintos en tema claro u oscuro.
 */
import { useTheme } from '../ThemeContext.jsx'

export function HelpModal({ open, onClose }) {
  const { colorMode } = useTheme()
  if (!open) return null

  const titleCls = colorMode === 'light' ? 'text-slate-900' : 'text-white'

  const overlayCls = colorMode === 'light' ? 'bg-slate-900/30' : 'bg-black/55'
  const panelCls =
    colorMode === 'light'
      ? 'border-slate-400/45 ring-slate-400/30 shadow-[0_24px_60px_-20px_rgba(15,23,42,0.22)]'
      : 'border-white/10 ring-white/10'
  const closeHoverCls =
    colorMode === 'light' ? 'hover:bg-slate-100 hover:text-slate-800' : 'hover:bg-white/10 hover:text-white'
  const kbdCls =
    colorMode === 'light'
      ? 'rounded border border-slate-200 bg-slate-100 px-1 text-xs text-slate-800'
      : 'rounded bg-slate-800 px-1 text-xs'

  return (
    <div
      className={`fixed inset-0 z-[120] flex items-end justify-center p-4 backdrop-blur-sm sm:items-center ${overlayCls}`}
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-labelledby="sr-help-title"
        className={`max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border bg-[var(--sr-popover-bg)] p-6 shadow-2xl ring-1 ${panelCls}`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id="sr-help-title" className={`font-display text-lg font-bold ${titleCls}`}>
            Ayuda rápida
          </h2>
          <button
            type="button"
            onClick={onClose}
            className={`rounded-lg p-1.5 text-slate-400 transition ${closeHoverCls}`}
            aria-label="Cerrar"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>
        <ul className={`sr-lead-text mt-4 list-disc space-y-2 pl-5 text-sm ${colorMode === 'light' ? 'text-slate-800' : 'text-slate-300'}`}>
          <li>
            <strong className={colorMode === 'light' ? 'text-slate-800' : 'text-slate-200'}>Raíces:</strong>{' '} define f(x), intervalo o semillas; el panel sugiere un método. Usa la columna de métodos para comparar tablas y gráficas de convergencia.
          </li>
          <li>
            <strong className={colorMode === 'light' ? 'text-slate-800' : 'text-slate-200'}>Polinomios:</strong>{' '} coeficientes de mayor a menor grado; Horner, división sintética y deflación con trazas.
          </li>
          <li>
            <strong className={colorMode === 'light' ? 'text-slate-800' : 'text-slate-200'}>Interpolación:</strong>{' '} nodos (xᵢ, yᵢ), Lagrange, Neville y comparación Runge / Chebyshev.
          </li>
          <li>
            Atajos: <kbd className={kbdCls}>Ctrl</kbd>+<kbd className={kbdCls}>Enter</kbd> en Raíces para analizar.
          </li>
          <li>
            El servidor Flask debe estar en marcha (puerto 5000); en desarrollo Vite reenvía <code className="sr-text-accent-bright">/api</code>.
          </li>
        </ul>
        <p className="mt-4 text-xs text-slate-500">
          Temas: botón «Temas» en la barra superior — puedes fijar una paleta o dejar que cambie con cada módulo.
        </p>
      </div>
    </div>
  )
}
