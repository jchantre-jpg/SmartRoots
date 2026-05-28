/**
 * Tema visual global: paletas (cyan / violeta / esmeralda / ámbar), modo claro u oscuro
 * y opción de cambiar acento automáticamente según la sección del curso.
 * Escribe variables CSS (--sr-accent-*, --sr-glow-*) en ``document.documentElement``.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

/* eslint-disable react-refresh/only-export-components -- utilidades compartidas con el provider */

const STORAGE_PALETTE = 'smartroots.theme.palette.v1'
const STORAGE_MODE = 'smartroots.theme.mode.v1'
const STORAGE_AUTO = 'smartroots.theme.autoBySection.v1'

/** Paletas alineadas con los mockups: neón general, púrpura raíces, verde polinomios, ámbar interpolación. */
export const PALETTES = [
  {
    id: 'cyan',
    label: 'Neón SmartRoots',
    section: null,
    accent: '#22d3ee',
    accentBright: '#00f5ff',
    accentMid: '#06b6d4',
    accentSoft: '#67e8f9',
  },
  {
    id: 'violet',
    label: 'Raíces · púrpura',
    section: 'roots',
    accent: '#6d28d9',
    accentBright: '#7c3aed',
    accentMid: '#5b21b6',
    accentSoft: '#e9d5ff',
  },
  {
    id: 'emerald',
    label: 'Polinomios · verde',
    section: 'poly',
    accent: '#34d399',
    accentBright: '#10b981',
    accentMid: '#059669',
    accentSoft: '#a7f3d0',
  },
  {
    id: 'amber',
    label: 'Interpolación · ámbar',
    section: 'interp',
    accent: '#fb923c',
    accentBright: '#fbbf24',
    accentMid: '#ea580c',
    accentSoft: '#fde68a',
  },
]

function readStored(key, fallback) {
  if (typeof window === 'undefined') return fallback
  try {
    const v = window.localStorage.getItem(key)
    return v ?? fallback
  } catch {
    return fallback
  }
}

function writeStored(key, value) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, value)
  } catch {
    /* ignore */
  }
}

export function hexToRgb(hex) {
  const h = (hex || '').replace('#', '')
  if (h.length !== 6) return { r: 34, g: 211, b: 238 }
  const n = parseInt(h, 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

export function chartFillFromHex(hex, alpha = 0.14) {
  const { r, g, b } = hexToRgb(hex)
  return `rgba(${r},${g},${b},${alpha})`
}

const ThemeContext = createContext(null)

const SECTION_TO_PALETTE = { roots: 'violet', poly: 'emerald', interp: 'amber', lab: 'cyan', about: 'cyan', concepts: 'cyan' }

export function ThemeProvider({ children, activeSection = 'lab' }) {
  const [paletteId, setPaletteIdState] = useState(() => readStored(STORAGE_PALETTE, 'cyan'))
  const [colorMode, setColorModeState] = useState(() => readStored(STORAGE_MODE, 'dark'))
  const [autoBySection, setAutoBySectionState] = useState(() => readStored(STORAGE_AUTO, '1') === '1')

  const resolvedPaletteId = useMemo(() => {
    if (autoBySection) return SECTION_TO_PALETTE[activeSection] ?? 'cyan'
    return paletteId
  }, [autoBySection, activeSection, paletteId])

  const palette = useMemo(
    () => PALETTES.find((p) => p.id === resolvedPaletteId) ?? PALETTES[0],
    [resolvedPaletteId],
  )

  /** Elige paleta y desactiva el modo automático por sección. */
  const setPaletteManual = useCallback((id) => {
    setAutoBySectionState(false)
    writeStored(STORAGE_AUTO, '0')
    setPaletteIdState(id)
    writeStored(STORAGE_PALETTE, id)
  }, [])

  const setColorMode = useCallback((mode) => {
    setColorModeState(mode)
    writeStored(STORAGE_MODE, mode)
  }, [])

  const setAutoBySection = useCallback((v) => {
    setAutoBySectionState(v)
    writeStored(STORAGE_AUTO, v ? '1' : '0')
  }, [])

  useEffect(() => {
    if (!autoBySection) return
    const id = SECTION_TO_PALETTE[activeSection] ?? 'cyan'
    writeStored(STORAGE_PALETTE, id)
  }, [activeSection, autoBySection])

  useEffect(() => {
    const root = document.documentElement
    const { r, g, b } = hexToRgb(palette.accent)
    const { r: r2, g: g2, b: b2 } = hexToRgb(palette.accentBright)
    root.style.setProperty('--sr-accent', palette.accent)
    root.style.setProperty('--sr-accent-bright', palette.accentBright)
    root.style.setProperty('--sr-accent-mid', palette.accentMid)
    root.style.setProperty('--sr-accent-soft', palette.accentSoft)
    root.style.setProperty('--sr-accent-rgb', `${r} ${g} ${b}`)
    root.style.setProperty('--sr-accent-bright-rgb', `${r2} ${g2} ${b2}`)
    root.style.setProperty('--sr-chart-primary', palette.accentBright)
    const chartFillAlpha = colorMode === 'light' ? 0.22 : 0.16
    root.style.setProperty('--sr-chart-fill', chartFillFromHex(palette.accentBright, chartFillAlpha))

    if (colorMode === 'light') {
      /* Halos un poco más visibles: el fondo claro gana atmósfera sin volverse sucio */
      root.style.setProperty('--sr-glow-a', `rgba(${r}, ${g}, ${b}, 0.17)`)
      root.style.setProperty('--sr-glow-b', `rgba(${r2}, ${g2}, ${b2}, 0.13)`)
      root.style.setProperty('--sr-glow-c', `rgba(${r}, ${g}, ${b}, 0.09)`)
    } else {
      root.style.setProperty('--sr-glow-a', `rgba(${r}, ${g}, ${b}, 0.1)`)
      root.style.setProperty('--sr-glow-b', `rgba(${r2}, ${g2}, ${b2}, 0.09)`)
      root.style.setProperty('--sr-glow-c', `rgba(${r}, ${g}, ${b}, 0.06)`)
    }

    root.classList.toggle('sr-light', colorMode === 'light')
  }, [palette, colorMode])

  const value = useMemo(
    () => ({
      palette,
      setPaletteManual,
      colorMode,
      setColorMode,
      autoBySection,
      setAutoBySection,
      chartPrimary: palette.accentBright,
      chartFill: chartFillFromHex(palette.accentBright, colorMode === 'light' ? 0.26 : 0.16),
    }),
    [palette, setPaletteManual, colorMode, setColorMode, autoBySection, setAutoBySection],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme debe usarse dentro de ThemeProvider')
  return ctx
}
