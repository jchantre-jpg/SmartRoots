/**
 * Página de inicio (guía del curso): grid de módulos clicables y sección “flujo de trabajo”.
 * Cada tarjeta llama `onOpenChapter(tab)` para saltar a Raíces, Polinomios, Interpolación, Conceptos o Acerca.
 */
import { SECTION_ICON, SrIcon } from '../icons/SrIcons.jsx'

const FEATURES = [
  {
    id: 'roots',
    num: '01',
    title: 'Métodos de raíces',
    blurb: 'Bisección, punto fijo, Newton, secante y posición falsa con recomendación, tablas completas y gráficas de convergencia.',
    tab: 'roots',
  },
  {
    id: 'poly',
    num: '02',
    title: 'Polinomios',
    blurb: 'Horner, división sintética paso a paso, deflación Newton–Horner y gráfica de P(x).',
    tab: 'poly',
  },
  {
    id: 'interp',
    num: '03',
    title: 'Interpolación',
    blurb: 'Lagrange con desglose, tabla de Neville, curva del polinomio y demo Weierstrass / Runge.',
    tab: 'interp',
  },
  {
    id: 'concepts',
    num: '04',
    title: 'Conceptos y fórmulas',
    blurb: 'Teoría compacta por tema: hipótesis, pasos iterativos y notación alineada con el laboratorio.',
    tab: 'concepts',
  },
  {
    id: 'about',
    num: '05',
    title: 'Acerca del laboratorio',
    blurb: 'Qué hace SmartRoots, stack técnico y cómo usar cada parte del laboratorio.',
    tab: 'about',
  },
]

const STEPS = [
  { n: '1', title: 'Ingresa datos', desc: 'f(x), intervalo, semillas o nodos según el bloque.' },
  { n: '2', title: 'Analiza', desc: 'Recomendación heurística y curvas cuando aplica.' },
  { n: '3', title: 'Resuelve', desc: 'Un clic: un método, todo el bloque de polinomios o interpolación completa.' },
  { n: '4', title: 'Comprende', desc: 'Operaciones, tablas con scroll y gráficas coherentes.' },
]

export function CurriculumGuide({ onOpenChapter }) {
  return (
    <div className="space-y-16 pb-10">
      <div className="mx-auto grid max-w-7xl auto-rows-fr gap-5 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-5">
        {FEATURES.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => onOpenChapter(f.tab)}
            aria-label={`Abrir sección: ${f.title}`}
            className="group sr-feature-card relative flex min-h-[12.5rem] flex-col rounded-2xl border sr-border-accent bg-gradient-to-b from-slate-900/80 to-[#050a14]/90 p-6 text-left shadow-xl shadow-black/40 ring-1 ring-white/5 transition hover:border-[color:color-mix(in_srgb,var(--sr-accent)_40%,transparent)] hover:shadow-[0_0_40px_-12px_color-mix(in_srgb,var(--sr-accent-bright)_35%,transparent)]"
          >
            <span className="flex items-start justify-between gap-3">
              <span className="font-display text-4xl font-bold tabular-nums sr-text-accent drop-shadow-[0_0_12px_color-mix(in_srgb,var(--sr-accent-bright)_45%,transparent)]">
                {f.num}
              </span>
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border sr-border-accent sr-bg-accent-dim sr-text-accent-bright ring-1">
                <SrIcon name={SECTION_ICON[f.tab] || 'info'} className="h-6 w-6" />
              </span>
            </span>
            <h3 className="mt-3 font-display text-lg font-bold tracking-tight text-white">{f.title}</h3>
            <p className="sr-lead-text mt-2 flex-1 text-sm text-slate-400">{f.blurb}</p>
            <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold sr-text-accent-soft">
              Abrir
              <span className="transition group-hover:translate-x-1" aria-hidden>
                →
              </span>
            </span>
          </button>
        ))}
      </div>

      <section
        id="flujo-trabajo"
        className="sr-workflow-section relative mx-auto max-w-7xl scroll-mt-36 overflow-hidden rounded-3xl border sr-border-accent-strong bg-gradient-to-br from-slate-900/70 via-[#050a14]/90 to-blue-950/40 px-5 py-10 shadow-2xl ring-1 sr-border-accent sm:px-10"
      >
        <div className="pointer-events-none absolute -right-20 top-0 h-48 w-48 rounded-full bg-[color:color-mix(in_srgb,var(--sr-accent)_10%,transparent)] blur-3xl" />
        <p className="text-xs font-bold uppercase tracking-[0.35em] sr-text-accent">Flujo de trabajo</p>
        <h2 className="mt-2 font-display text-2xl font-bold text-white sm:text-3xl">De los datos a la gráfica</h2>
        <p className="sr-lead-text mt-2 text-sm text-slate-400">
          Cuatro pasos para trabajar cualquier ejercicio del curso con el mismo ritmo en todas las secciones.
        </p>

        <div className="relative mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          <div className="pointer-events-none absolute left-0 right-0 top-10 hidden h-px bg-gradient-to-r from-transparent via-[color:color-mix(in_srgb,var(--sr-accent)_25%,transparent)] to-transparent lg:block" aria-hidden />
          {STEPS.map((s) => (
            <div
              key={s.n}
              className="sr-workflow-step relative flex min-h-[10.5rem] flex-col rounded-2xl border border-white/10 bg-[#050a14]/50 p-5 ring-1 ring-[color:color-mix(in_srgb,var(--sr-accent)_10%,transparent)] backdrop-blur-sm sm:p-6"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border sr-border-accent-strong sr-bg-accent-mid text-sm font-bold sr-text-accent-bright shadow-[0_0_20px_-6px_color-mix(in_srgb,var(--sr-accent-bright)_40%,transparent)]">
                {s.n}
              </div>
              <h3 className="font-display text-base font-bold text-white">{s.title}</h3>
              <p className="sr-lead-text mt-2 flex-1 text-sm text-slate-400">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
