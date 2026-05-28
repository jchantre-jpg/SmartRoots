/**
 * Popover “Temas”: paleta de acento, modo automático por sección y conmutador claro/oscuro.
 */
import { useRef, useState } from 'react'
import { PALETTES, useTheme } from '../ThemeContext.jsx'

export function ThemeControls({ className = '' }) {
  const { palette, setPaletteManual, colorMode, setColorMode, autoBySection, setAutoBySection } = useTheme()
  const isLight = colorMode === 'light'
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)

  return (
    <div className={`relative ${className}`} ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`sr-btn-secondary flex min-h-[40px] items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold ${
          isLight
            ? 'border-slate-400/45 bg-gradient-to-b from-white to-slate-100 text-slate-800'
            : ''
        }`}
        style={
          isLight
            ? undefined
            : {
                borderColor: 'color-mix(in srgb, var(--sr-accent) 28%, transparent)',
                backgroundColor: 'color-mix(in srgb, var(--sr-accent) 10%, transparent)',
                color: 'var(--sr-accent-soft)',
              }
        }
        title="Temas y apariencia"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M12 3c1.928 0 3.646.783 4.899 2.051l-1.414 1.414C14.73 5.67 13.401 5 12 5 9.239 5 7 7.239 7 10c0 1.401.67 2.73 1.465 3.485L7.05 14.899C5.783 13.646 5 11.928 5 10c0-3.866 3.134-7 7-7zm0 18c-1.928 0-3.646-.783-4.899-2.051l1.414-1.414C9.27 18.33 10.599 19 12 19c2.761 0 5-2.239 5-5 0-1.401-.67-2.73-1.465-3.485l1.414-1.414C18.217 8.354 19 10.072 19 12c0 3.866-3.134 7-7 7z" />
        </svg>
        <span className="hidden sm:inline">Temas</span>
      </button>

      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[90] cursor-default bg-black/40 lg:bg-transparent"
            aria-label="Cerrar menú de temas"
            onClick={() => setOpen(false)}
          />
          <div
            className={`absolute right-0 top-[calc(100%+8px)] z-[95] w-[min(100vw-2rem,20rem)] rounded-2xl border bg-[var(--sr-popover-bg)] p-4 shadow-2xl ring-1 backdrop-blur-xl ${
              isLight ? 'border-slate-400/45 ring-slate-400/30' : 'border-white/10 ring-white/10'
            }`}
            role="dialog"
            aria-label="Selector de tema"
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Paleta de acento</p>
            <div className="mt-2 grid gap-2">
              {PALETTES.map((p) => {
                const on = p.id === palette.id
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setPaletteManual(p.id)
                      setOpen(false)
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                      on
                        ? 'border-[color-mix(in_srgb,var(--sr-accent)_55%,transparent)] bg-[color-mix(in_srgb,var(--sr-accent)_14%,transparent)]'
                        : isLight
                          ? 'border-slate-400/40 hover:border-slate-500/55 hover:bg-slate-200/80'
                          : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                    }`}
                  >
                    <span
                      className={`h-8 w-8 shrink-0 rounded-lg ring-2 ${isLight ? 'ring-slate-400/45' : 'ring-white/20'}`}
                      style={{ background: `linear-gradient(135deg, ${p.accentBright}, ${p.accentMid})` }}
                      aria-hidden
                    />
                    <span className={`font-medium ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>{p.label}</span>
                  </button>
                )
              })}
            </div>

            <label
              className={`mt-4 flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5 ${
                isLight ? 'border-slate-400/40 bg-slate-100/95' : 'border-white/10 bg-white/[0.03]'
              }`}
            >
              <input
                type="checkbox"
                className={`mt-0.5 h-4 w-4 rounded ${
                  isLight
                    ? 'border-slate-400 bg-white accent-[var(--sr-accent)]'
                    : 'border-white/20 bg-slate-900 accent-[var(--sr-accent)]'
                }`}
                checked={autoBySection}
                onChange={(e) => setAutoBySection(e.target.checked)}
              />
              <span className={`text-xs leading-snug ${isLight ? 'text-slate-800' : 'text-slate-400'}`}>
                Ajustar color automáticamente al módulo (Raíces → púrpura, Polinomios → verde, etc.)
              </span>
            </label>

            <div
              className={`mt-4 flex items-center justify-between gap-2 border-t pt-4 ${
                isLight ? 'border-slate-400/40' : 'border-white/10'
              }`}
            >
              <span className={`text-xs font-medium ${isLight ? 'text-slate-700' : 'text-slate-500'}`}>Apariencia</span>
              <div
                className={`flex rounded-lg border p-0.5 ${
                  isLight ? 'border-slate-400/40 bg-slate-100' : 'border-white/10'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setColorMode('dark')}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                    colorMode === 'dark' ? 'bg-white/15 text-white' : 'text-slate-500'
                  }`}
                >
                  Oscuro
                </button>
                <button
                  type="button"
                  onClick={() => setColorMode('light')}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                    isLight ? 'bg-slate-300/90 text-slate-900 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  Claro
                </button>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}
