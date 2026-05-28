import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const KEY = 'smartroots.theme.v1';

const PALETTES = {
  cyan: { primary: '#5eead4', soft: '#99f6e4', dim: 'rgba(94,234,212,0.15)' },
  violet: { primary: '#a78bfa', soft: '#c4b5fd', dim: 'rgba(167,139,250,0.15)' },
  emerald: { primary: '#34d399', soft: '#6ee7b7', dim: 'rgba(52,211,153,0.15)' },
  amber: { primary: '#fbbf24', soft: '#fcd34d', dim: 'rgba(251,191,36,0.15)' },
};

const SECTION_PALETTE = {
  lab: 'cyan',
  roots: 'violet',
  poly: 'emerald',
  interp: 'amber',
  concepts: 'cyan',
  about: 'cyan',
};

const ThemeContext = createContext(null);

export function ThemeProvider({ children, activeSection = 'lab' }) {
  const [colorMode, setColorMode] = useState('dark');
  const [paletteId, setPaletteId] = useState('auto');

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((raw) => {
      if (!raw) return;
      try {
        const p = JSON.parse(raw);
        if (p.colorMode) setColorMode(p.colorMode);
        if (p.paletteId) setPaletteId(p.paletteId);
      } catch {
        /* ignore */
      }
    });
  }, []);

  const persist = useCallback((mode, pal) => {
    AsyncStorage.setItem(KEY, JSON.stringify({ colorMode: mode, paletteId: pal })).catch(() => {});
  }, []);

  const toggleMode = useCallback(() => {
    setColorMode((m) => {
      const next = m === 'dark' ? 'light' : 'dark';
      persist(next, paletteId);
      return next;
    });
  }, [paletteId, persist]);

  const setPalette = useCallback(
    (id) => {
      setPaletteId(id);
      persist(colorMode, id);
    },
    [colorMode, persist],
  );

  const effectivePalette =
    paletteId === 'auto' ? PALETTES[SECTION_PALETTE[activeSection] || 'cyan'] : PALETTES[paletteId] || PALETTES.cyan;

  const colors = useMemo(() => {
    const light = colorMode === 'light';
    return {
      light,
      bg: light ? '#f1f5f9' : '#0b1020',
      card: light ? 'rgba(255,255,255,0.95)' : 'rgba(15,23,42,0.65)',
      text: light ? '#0f172a' : '#f8fafc',
      muted: light ? '#64748b' : '#94a3b8',
      border: light ? 'rgba(15,23,42,0.12)' : 'rgba(255,255,255,0.1)',
      primary: effectivePalette.primary,
      primarySoft: effectivePalette.soft,
      primaryDim: effectivePalette.dim,
      chartLine: effectivePalette.primary,
      chartGrid: light ? 'rgba(15,23,42,0.08)' : 'rgba(255,255,255,0.06)',
    };
  }, [colorMode, effectivePalette]);

  const value = useMemo(
    () => ({ colorMode, paletteId, colors, toggleMode, setPalette, PALETTES }),
    [colorMode, paletteId, colors, toggleMode, setPalette],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme dentro de ThemeProvider');
  return ctx;
}
