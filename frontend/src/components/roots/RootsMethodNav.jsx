/**
 * Columna lateral de métodos (ejecutar solve por método, marca recomendado ★).
 */
import { MethodGlyph } from './RootsMethodGlyph.jsx'
import { METHOD_BUTTONS } from '../../lib/rootsMethodExamples.js'

export function RootsMethodNav({ method, rec, busy, onSelectMethod }) {
  return (
    <aside className="sr-methods-sidebar shrink-0 lg:sticky lg:top-36 lg:w-60">
      <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500 [html.sr-light_&]:text-slate-600">
        Métodos
      </p>
      <nav
        className="scrollbar-none flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:gap-1.5 lg:overflow-visible"
        aria-label="Métodos numéricos"
      >
        {METHOD_BUTTONS.map((m) => {
          const isActive = method === m.id
          const isRec = Boolean(rec?.recommended?.method === m.id)
          return (
            <div key={m.id} className="relative shrink-0 lg:w-full">
              <button
                type="button"
                disabled={busy}
                onClick={() => onSelectMethod(m.id)}
                className={`flex w-full min-h-[48px] min-w-[11rem] items-center gap-3 rounded-xl px-3 py-2.5 text-left transition disabled:pointer-events-none disabled:opacity-50 lg:min-w-0 ${
                  isActive ? 'sr-method-active' : 'sr-method-nav-idle'
                }`}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg sr-bg-accent-dim ring-1 sr-border-accent">
                  <MethodGlyph id={m.id} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold leading-tight">{m.short}</span>
                </span>
                {isRec ? (
                  <span className="shrink-0 text-sm text-amber-400 [html.sr-light_&]:text-amber-600" title="Recomendado">
                    ★
                  </span>
                ) : null}
              </button>
            </div>
          )
        })}
      </nav>
      <p className="sr-lead-text mt-4 hidden text-[11px] text-slate-500 [html.sr-light_&]:text-slate-600 lg:block">
        Un clic ejecuta el método con la misma f(x) y los datos del formulario.
      </p>
      <p className="mt-3 text-[10px] text-slate-500 [html.sr-light_&]:text-slate-600">
        Atajo: <kbd className="sr-workspace-kbd">Ctrl</kbd>+<kbd className="sr-workspace-kbd">Enter</kbd> analiza ·{' '}
        <kbd className="sr-workspace-kbd">Esc</kbd> limpia avisos
      </p>
    </aside>
  )
}
