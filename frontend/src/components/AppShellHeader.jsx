/**
 * Cabecera fija: marca SmartRoots, ayuda, temas y usuario.
 * La sección activa se indica solo con las pestañas horizontales (sin título duplicado).
 */
import { useState } from 'react'
import { useTheme } from '../ThemeContext.jsx'
import { AuthBlock } from './AuthBlock.jsx'
import { HelpModal } from './HelpModal.jsx'
import { SectionTabs } from './SectionTabs.jsx'
import { ThemeControls } from './ThemeControls.jsx'

function BrandMark({ isLight }) {
  return (
    <>
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border shadow-sm ${
          isLight
            ? 'border-slate-300/80 bg-gradient-to-br from-white to-slate-100'
            : 'border-white/12 bg-gradient-to-br from-white/10 to-white/[0.03]'
        }`}
        aria-hidden
      >
        <svg className="h-6 w-6" viewBox="0 0 32 32" fill="none">
          <path
            d="M4 24 C10 8 22 8 28 24"
            stroke="var(--sr-accent-bright)"
            strokeWidth="2.25"
            strokeLinecap="round"
          />
          <circle cx="22" cy="11" r="2.25" fill="var(--sr-accent-soft)" />
          <path
            d="M8 26 L24 26"
            stroke="var(--sr-accent-mid)"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.55"
          />
        </svg>
      </span>
      <span className="min-w-0 font-display text-lg font-bold leading-none tracking-tight sm:text-xl">
        <span className="bg-gradient-to-r from-[var(--sr-accent-soft)] via-[var(--sr-accent-bright)] to-[var(--sr-accent-mid)] bg-clip-text text-transparent">
          Smart
        </span>
        <span className={isLight ? 'text-slate-900' : 'text-white'}>Roots</span>
      </span>
    </>
  )
}

export function AppShellHeader({ activeTab, onTab, onOpenAuth }) {
  const [helpOpen, setHelpOpen] = useState(false)
  const { colorMode } = useTheme()
  const isLight = colorMode === 'light'

  return (
    <>
      <header
        className={`sr-topnav sticky top-0 z-50 border-b sr-border-accent backdrop-blur-2xl ${isLight ? '' : 'bg-[#050a14]/88'}`}
      >
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6 sm:py-3">
          <button
            type="button"
            onClick={() => onTab('lab')}
            className="group flex min-w-0 items-center gap-2.5 rounded-xl py-1 text-left transition hover:opacity-90"
            aria-label="Ir a inicio"
          >
            <BrandMark isLight={isLight} />
          </button>

          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setHelpOpen(true)}
              className="sr-btn-secondary !min-h-[40px] gap-2 py-2 text-xs"
              title="Ayuda"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z" />
              </svg>
              <span className="hidden sm:inline">Ayuda</span>
            </button>
            <ThemeControls />
            <AuthBlock onOpenAuth={onOpenAuth} />
          </div>
        </div>
        <SectionTabs activeTab={activeTab} onTab={onTab} />
      </header>
      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
    </>
  )
}
