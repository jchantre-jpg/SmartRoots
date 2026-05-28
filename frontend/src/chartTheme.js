/**
 * Tokens de color y escalas para Chart.js según tema claro/oscuro del ``ThemeContext``.
 * Las funciones ``*ForMode`` las consumen los componentes de gráficas.
 */
export const chartGrid = 'rgba(0, 245, 255, 0.065)'
export const chartTicks = '#94a3b8'
export const chartLegendText = '#cbd5e1'

const GRID_LIGHT = 'rgba(15, 23, 42, 0.09)'
const TICKS_LIGHT = '#0f172a'
const LEGEND_LIGHT = '#020617'

export const scalesLinear = {
  x: {
    type: 'linear',
    ticks: { color: chartTicks },
    grid: { color: chartGrid },
  },
  y: {
    type: 'linear',
    ticks: { color: chartTicks },
    grid: { color: chartGrid },
  },
}

/** Escalas lineales para Chart.js según `colorMode` del ThemeContext. */
export function scalesLinearForMode(colorMode) {
  const light = colorMode === 'light'
  const ticks = light ? TICKS_LIGHT : chartTicks
  const grid = light ? GRID_LIGHT : chartGrid
  return {
    x: {
      type: 'linear',
      ticks: { color: ticks },
      grid: { color: grid },
    },
    y: {
      type: 'linear',
      ticks: { color: ticks },
      grid: { color: grid },
    },
  }
}

export function pluginsLegendForMode(colorMode) {
  return {
    legend: { labels: { color: colorMode === 'light' ? LEGEND_LIGHT : chartLegendText } },
  }
}

export const pluginsLegend = {
  legend: { labels: { color: chartLegendText } },
}

/** Color de borde de puntos en gráficas (contrasta con fondo claro u oscuro). */
export function chartPointBorder(colorMode) {
  return colorMode === 'light' ? '#ffffff' : '#050a14'
}

/** Series secundarias (Runge, comparaciones, etc.) */
export const COLORS = {
  cyan: '#06b6d4',
  cyanBright: '#22d3ee',
  cyanFill: 'rgba(34, 211, 238, 0.22)',
  electric: '#0ea5e9',
  electricFill: 'rgba(14, 165, 233, 0.2)',
  amber: '#f59e0b',
  amberFill: 'rgba(245, 158, 11, 0.22)',
  rose: '#f43f5e',
  orange: '#f97316',
}
