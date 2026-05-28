/**
 * Comparación visual Runge: f(x), polinomio con nodos uniformes vs Chebyshev (datos de `/api/interpolation/weierstrass_runge`).
 */
import { useMemo } from 'react'
import { Line } from 'react-chartjs-2'
import { useTheme } from '../ThemeContext.jsx'
import { COLORS, pluginsLegendForMode, scalesLinearForMode } from '../chartTheme'

function series(xs, ys) {
  if (!xs?.length || !ys?.length) return []
  const out = []
  const n = Math.min(xs.length, ys.length)
  for (let i = 0; i < n; i++) {
    const x = Number(xs[i])
    const yv = Number(ys[i])
    if (Number.isFinite(x) && Number.isFinite(yv)) out.push({ x, y: yv })
  }
  return out
}

export function RungeComparisonChart({ runge }) {
  const { chartPrimary, colorMode } = useTheme()
  const scales = useMemo(() => scalesLinearForMode(colorMode), [colorMode])
  const legend = useMemo(() => pluginsLegendForMode(colorMode), [colorMode])
  const titleColor = colorMode === 'light' ? '#334155' : '#e2e8f0'
  const datasets = useMemo(() => {
    if (!runge?.x) return []
    const x = runge.x
    return [
      {
        label: 'f(x) real',
        data: series(x, runge.y_true),
        borderColor: COLORS.amber,
        backgroundColor: COLORS.amberFill,
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.12,
        fill: false,
      },
      {
        label: 'Lagrange · nodos uniformes',
        data: series(x, runge.uniform_nodes?.poly_y),
        borderColor: COLORS.rose,
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.12,
        fill: false,
      },
      {
        label: 'Lagrange · nodos Chebyshev',
        data: series(x, runge.chebyshev_nodes?.poly_y),
        borderColor: chartPrimary,
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.12,
        fill: false,
      },
    ]
  }, [runge, chartPrimary])

  if (!datasets.some((d) => d.data.length)) {
    return <p className="sr-chart-empty text-sm">No hay datos válidos para la gráfica.</p>
  }

  return (
    <div className="sr-chart-shell h-96 w-full min-h-[280px]">
      <Line
        data={{ datasets }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          parsing: false,
          interaction: { mode: 'nearest', intersect: false },
          plugins: {
            ...legend,
            legend: { ...legend.legend, position: 'bottom' },
            title: {
              display: true,
              text: runge?.function ?? '',
              color: titleColor,
              font: { size: 13 },
            },
          },
          scales,
        }}
      />
    </div>
  )
}
