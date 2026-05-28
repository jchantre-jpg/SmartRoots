/**
 * Pestañas horizontales bajo la cabecera: secciones del laboratorio.
 * En pantallas grandes van centradas dentro de un carril tipo “segmented control”; en móvil, scroll horizontal con snap.
 */
import { useTheme } from '../ThemeContext.jsx'
import { SECTION_ICON, SrIcon } from '../icons/SrIcons.jsx'

const NAV = [
  { id: 'lab', label: 'Inicio', sub: 'Guía del curso' },
  { id: 'roots', label: 'Raíces', sub: 'Capítulo 5' },
  { id: 'poly', label: 'Polinomios', sub: 'Unidad 6' },
  { id: 'interp', label: 'Interpolación', sub: 'Capítulo 7' },
  { id: 'concepts', label: 'Conceptos', sub: 'Teoría y fórmulas' },
  { id: 'about', label: 'Acerca', sub: 'Proyecto' },
]

export function SectionTabs({ activeTab, onTab }) {
  const { colorMode } = useTheme()
  const isLight = colorMode === 'light'

  return (
    <div
      className={
        isLight
          ? 'border-t border-slate-300/90 bg-gradient-to-b from-slate-200/85 via-slate-100/90 to-slate-200/70'
          : 'border-t border-white/[0.07] bg-gradient-to-b from-[#070d18]/98 to-[#050a14]/90'
      }
    >
      <div className="mx-auto w-full max-w-7xl px-3 py-2.5 sm:px-6 sm:py-3">
        <div
          className={
            isLight
              ? 'rounded-2xl border border-slate-400/35 bg-gradient-to-b from-white to-slate-100/95 p-1 shadow-md ring-1 ring-slate-400/30 sm:p-1.5'
              : 'rounded-2xl border border-white/[0.1] bg-[rgba(6,10,20,0.78)] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md sm:p-1.5'
          }
        >
          <nav
            role="tablist"
            aria-label="Secciones del laboratorio"
            className="scrollbar-none flex snap-x snap-mandatory gap-1 overflow-x-auto [-webkit-overflow-scrolling:touch] sm:snap-none sm:flex-nowrap sm:justify-center sm:gap-1.5 sm:overflow-visible sm:px-0.5"
          >
            {NAV.map((item) => {
              const on = activeTab === item.id
              const icon = SECTION_ICON[item.id] || 'info'
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  id={`sr-tab-${item.id}`}
                  title={`${item.label} — ${item.sub}`}
                  onClick={() => onTab(item.id)}
                  className={`flex min-h-[48px] min-w-[5.75rem] max-w-[9.25rem] shrink-0 snap-center flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-2 text-center transition duration-200 sm:min-h-[52px] sm:min-w-0 sm:max-w-none sm:flex-1 sm:basis-0 sm:flex-row sm:gap-2 sm:px-3 sm:py-2.5 sm:text-left ${
                    on ? 'sr-method-active' : 'sr-cs-nav-idle sr-cs-nav-idle-hover'
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 sm:h-9 sm:w-9 ${
                      on ? 'sr-cs-nav-icon-active' : 'sr-bg-accent-dim sr-border-accent opacity-90'
                    }`}
                  >
                    <SrIcon name={icon} />
                  </span>
                  <span className="min-w-0 sm:flex-1">
                    <span className="block truncate text-[11px] font-semibold leading-tight sm:text-sm">{item.label}</span>
                    <span
                      className={`mt-0.5 hidden truncate text-[10px] leading-tight sm:block ${isLight ? 'text-slate-600' : 'text-slate-500'}`}
                    >
                      {item.sub}
                    </span>
                  </span>
                </button>
              )
            })}
          </nav>
        </div>
      </div>
    </div>
  )
}
