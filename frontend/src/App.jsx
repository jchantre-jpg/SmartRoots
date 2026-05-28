/**
 * Raíz de la interfaz: cabecera con pestañas horizontales (secciones) y área de trabajo
 * según la pestaña activa, con ThemeProvider.
 */
import { useCallback, useEffect, useState } from 'react'
import { ThemeProvider } from './ThemeContext.jsx'
import { AppShellHeader } from './components/AppShellHeader.jsx'
import { BackendStatus } from './components/BackendStatus'
import { ConceptsWorkspace } from './components/ConceptsWorkspace.jsx'
import { CurriculumGuide } from './components/CurriculumGuide'
import { ErrorBoundary } from './components/ErrorBoundary'
import { InterpWorkspace, PolyWorkspace } from './components/PolyInterpWorkspace'
import { LabHero } from './components/LabHero'
import { RootsWorkspace } from './components/RootsWorkspace'
import { AuthModal } from './components/AuthModal.jsx'

export default function App() {
  const [tab, setTab] = useState('lab')
  const [authOpen, setAuthOpen] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const p = new URLSearchParams(window.location.search)
    if (p.get('e') || p.get('t') === 'roots') setTab('roots')
    if (p.get('t') === 'concepts') setTab('concepts')
  }, [])

  const scrollToWorkflow = useCallback(() => {
    requestAnimationFrame(() => {
      document.getElementById('flujo-trabajo')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }, [])

  return (
    <ThemeProvider activeSection={tab}>
      <div className="flex min-h-screen flex-col pb-16 sm:pb-20">
        <AppShellHeader activeTab={tab} onTab={setTab} onOpenAuth={() => setAuthOpen(true)} />

        <div className="mx-auto flex w-full max-w-[1920px] min-w-0 flex-1 flex-col">
          {tab === 'lab' ? (
            <LabHero onStartRoots={() => setTab('roots')} onScrollWorkflow={scrollToWorkflow} />
          ) : null}

          <BackendStatus />

          <main className="sr-page-main w-full flex-1 px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
            <div className="mx-auto max-w-7xl">
              <ErrorBoundary>
                {tab === 'lab' ? <CurriculumGuide onOpenChapter={setTab} /> : null}
                {tab === 'roots' ? <RootsWorkspace /> : null}
                {tab === 'poly' ? <PolyWorkspace /> : null}
                {tab === 'interp' ? <InterpWorkspace /> : null}
                {tab === 'concepts' ? <ConceptsWorkspace /> : null}
              </ErrorBoundary>
              {tab === 'about' ? (
                <section className="sr-about-panel sr-about mt-8 rounded-3xl border sr-border-accent-strong p-8 shadow-2xl ring-1 ring-white/10 backdrop-blur-md sm:p-10">
                  <h2 className="sr-surface-heading font-display text-2xl font-bold sm:text-3xl">Acerca de SmartRoots</h2>
                  <p className="sr-lead-text sr-surface-muted mt-4 text-sm sm:text-base">
                    Herramienta para métodos numéricos: raíces de ecuaciones (bisección, punto fijo, Newton–Raphson,
                    secante, posición falsa), polinomios con esquema de Horner, división sintética paso a paso y
                    deflación, e interpolación (Lagrange con desglose, Neville en tabla piramidal, demo Weierstrass /
                    Runge). El asistente propone un método según intervalo, semillas y derivadas; en Raíces puedes
                    comparar algoritmos desde la columna «Métodos».
                  </p>
                  <ul className="mt-8 grid gap-4 text-sm sm:grid-cols-2 sr-about-list">
                    <li className="sr-about-card rounded-2xl border sr-border-accent p-5 ring-1 ring-white/5">
                      <p className="text-xs font-bold uppercase tracking-widest sr-text-accent">Raíces</p>
                      <p className="sr-lead-text sr-surface-muted mt-2">
                        Bisección, iteración de punto fijo, Newton–Raphson, secante, posición falsa: recomendación +
                        tablas + gráficas de convergencia.
                      </p>
                    </li>
                    <li className="sr-about-card rounded-2xl border sr-border-accent p-5 ring-1 ring-white/5">
                      <p className="text-xs font-bold uppercase tracking-widest sr-text-accent">Polinomios</p>
                      <p className="sr-lead-text sr-surface-muted mt-2">
                        Horner, división sintética detallada y deflación con trazas Newton–Horner.
                      </p>
                    </li>
                    <li className="sr-about-card rounded-2xl border sr-border-accent p-5 ring-1 ring-white/5 sm:col-span-2">
                      <p className="text-xs font-bold uppercase tracking-widest sr-text-accent">Interpolación</p>
                      <p className="sr-lead-text sr-surface-muted mt-2">
                        Lagrange (términos), Neville (tabla), comparación gráfica nodos uniformes vs Chebyshev (Runge).
                      </p>
                    </li>
                  </ul>
                  <p className="sr-lead-text sr-surface-muted mt-8 border-t border-white/10 pt-6 text-sm">
                    by <span className="font-semibold text-white/90">Juliana Chantre Astudillo</span>
                  </p>
                </section>
              ) : null}
            </div>
          </main>
        </div>
      </div>
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </ThemeProvider>
  )
}
