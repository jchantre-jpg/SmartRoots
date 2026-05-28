/**
 * Bloque hero del laboratorio: titular, copy, CTA y gráfica decorativa (una sola tarjeta).
 */
import { useId } from 'react'
import { useTheme } from '../ThemeContext.jsx'

/** Puntos de la curva (x, y); el eje horizontal está en y = AXIS_Y. */
const AXIS_Y = 140
const ROOT_X = 218
const ROOT_Y = AXIS_Y
const CURVE_D = `M 32 ${AXIS_Y} C 48 ${AXIS_Y}, 78 44, 112 56 C 148 70, 188 128, ${ROOT_X} ${ROOT_Y} C 252 ${AXIS_Y}, 278 58, 292 72`

function HeroGraphic() {
  const { colorMode } = useTheme()
  const isLight = colorMode === 'light'
  const gradId = useId().replace(/:/g, '')

  return (
    <div className="relative mx-auto w-full max-w-[440px] select-none" aria-hidden>
      <div
        className={`pointer-events-none absolute -inset-4 rounded-3xl opacity-80 blur-2xl ${
          isLight ? 'bg-[color-mix(in_srgb,var(--sr-accent)_14%,transparent)]' : 'bg-blue-600/20'
        }`}
      />
      <div
        className={`sr-lab-hero-preview relative rounded-2xl border sr-border-accent p-5 shadow-xl backdrop-blur-md ${
          isLight ? '' : 'bg-gradient-to-b from-slate-900/95 to-[#050a14]/98 ring-1 ring-white/10'
        }`}
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider sr-text-accent">f(x) = 0</span>
          <span className="rounded-full sr-bg-accent-mid px-2.5 py-0.5 text-[10px] font-semibold uppercase sr-text-accent-soft">
            demo
          </span>
        </div>

        <svg
          viewBox="0 0 320 168"
          className="w-full"
          role="img"
          aria-label="Curva de función con raíz aproximada"
        >
          <defs>
            <linearGradient id={`${gradId}-stroke`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--sr-accent-soft)" stopOpacity="0.5" />
              <stop offset="45%" stopColor="var(--sr-accent-bright)" />
              <stop offset="100%" stopColor="var(--sr-accent-mid)" stopOpacity="0.85" />
            </linearGradient>
            <linearGradient id={`${gradId}-fill`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--sr-accent-bright)" stopOpacity="0.22" />
              <stop offset="100%" stopColor="var(--sr-accent-bright)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* rejilla suave */}
          {[52, 80, 108, AXIS_Y].map((y) => (
            <line
              key={y}
              x1="28"
              y1={y}
              x2="292"
              y2={y}
              stroke={isLight ? '#94a3b8' : '#64748b'}
              strokeOpacity="0.22"
              strokeWidth="1"
            />
          ))}

          {/* eje x (f(x) = 0) */}
          <line
            x1="28"
            y1={AXIS_Y}
            x2="292"
            y2={AXIS_Y}
            stroke={isLight ? '#64748b' : '#94a3b8'}
            strokeOpacity="0.5"
            strokeWidth="1.5"
          />

          {/* área bajo la curva hasta el eje */}
          <path d={`${CURVE_D} L 292 ${AXIS_Y} L 32 ${AXIS_Y} Z`} fill={`url(#${gradId}-fill)`} />

          {/* curva f(x) */}
          <path
            d={CURVE_D}
            fill="none"
            stroke={`url(#${gradId}-stroke)`}
            strokeWidth="2.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* raíz r: cruce curva ∩ eje x */}
          <line
            x1={ROOT_X}
            y1={ROOT_Y - 18}
            x2={ROOT_X}
            y2={ROOT_Y + 6}
            stroke="var(--sr-accent-bright)"
            strokeOpacity="0.35"
            strokeWidth="1.5"
            strokeDasharray="3 2"
          />
          <circle cx={ROOT_X} cy={ROOT_Y} r="5.5" fill="var(--sr-accent-bright)" />
          <circle
            cx={ROOT_X}
            cy={ROOT_Y}
            r="10"
            fill="none"
            stroke="var(--sr-accent-bright)"
            strokeOpacity="0.5"
            strokeWidth="2"
          />
          <text
            x={ROOT_X}
            y={ROOT_Y - 14}
            textAnchor="middle"
            fill="var(--sr-accent-mid)"
            fontSize="11"
            fontWeight="700"
          >
            r
          </text>
        </svg>

        <div className="mt-1 flex flex-wrap justify-center gap-2">
          {['Raíces', 'Horner', 'Lagrange'].map((label) => (
            <span
              key={label}
              className={`rounded-lg px-2.5 py-1 text-[10px] font-semibold ${
                isLight
                  ? 'border border-slate-300/80 bg-slate-100 text-slate-700'
                  : 'border border-white/10 bg-white/5 text-slate-300'
              }`}
            >
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

export function LabHero({ onStartRoots, onScrollWorkflow }) {
  const { colorMode } = useTheme()
  const isLight = colorMode === 'light'
  const ctaText = isLight ? 'text-white' : 'text-[var(--sr-nav-pill-fg)]'

  return (
    <section className="relative overflow-x-clip pb-12 pt-6 sm:pb-16 sm:pt-10">
      <div className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[min(100%,900px)] -translate-x-1/2 rounded-full bg-[color:color-mix(in_srgb,var(--sr-accent)_8%,transparent)] blur-[100px]" />
      <div className="pointer-events-none absolute -right-32 top-20 h-64 w-64 rounded-full bg-blue-600/15 blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 lg:grid-cols-2 lg:gap-14 sm:px-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.35em] sr-text-accent">SmartRoots</p>
          <h1 className="mt-3 font-display text-4xl font-bold leading-[1.08] tracking-tight sr-surface-heading sm:text-5xl lg:text-[3.25rem]">
            Laboratorio numérico
            <span className="mt-2 block bg-gradient-to-r from-[var(--sr-accent-soft)] via-[var(--sr-accent-bright)] to-blue-400 bg-clip-text text-transparent drop-shadow-[0_0_24px_color-mix(in_srgb,var(--sr-accent-bright)_25%,transparent)]">
              raíces, polinomios e interpolación
            </span>
          </h1>
          <p className="sr-lab-lead sr-lead-text mt-5 text-sm text-slate-400 sm:text-base">
            Ingresa tu ejercicio, analiza con el asistente y obtén tablas paso a paso, operaciones explicadas y gráficas
            listas para el curso — todo en una interfaz clara y moderna.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <button
              type="button"
              onClick={onStartRoots}
              className={`sr-btn-primary inline-flex min-h-[48px] items-center gap-2 rounded-2xl px-7 text-sm font-bold ${ctaText} shadow-lg transition hover:brightness-110 active:scale-[0.98]`}
            >
              Empezar ahora
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              onClick={onScrollWorkflow}
              className="sr-btn-ghost inline-flex min-h-[48px] items-center gap-2 rounded-2xl border sr-border-accent-strong sr-bg-accent-dim px-6 text-sm font-semibold sr-text-accent-soft shadow-[0_0_20px_-6px_color-mix(in_srgb,var(--sr-accent-bright)_35%,transparent)] transition hover:brightness-110"
            >
              Ver flujo de trabajo
              <svg className="h-4 w-4 opacity-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
                <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
        <HeroGraphic />
      </div>
    </section>
  )
}
