/**
 * Gráfica de la curva `f(x)` devuelta por `/api/sample_curve` (pares x,y filtrados a finitos).
 */
import { useMemo } from 'react'
import { Line } from 'react-chartjs-2'
import { useTheme } from '../ThemeContext.jsx'
import { pluginsLegendForMode, scalesLinearForMode } from '../chartTheme'

function finitePairs(xs, ys) {
  if (!xs?.length || !ys?.length) return []
  const out = []
  const n = Math.min(xs.length, ys.length)
  for (let i = 0; i < n; i++) {
    const x = Number(xs[i])
    const y = ys[i]
    const yv = typeof y === 'number' ? y : Number(y)
    if (Number.isFinite(x) && Number.isFinite(yv)) out.push({ x, y: yv })
  }
  return out
}

export function FunctionCurveChart({ curve }) {
  const { chartPrimary, chartFill, colorMode } = useTheme()
  const pts = useMemo(() => finitePairs(curve?.x, curve?.y), [curve])
  const scales = useMemo(() => scalesLinearForMode(colorMode), [colorMode])
  const legend = useMemo(() => pluginsLegendForMode(colorMode), [colorMode])

  if (!pts.length) {
    return <p className="sr-chart-empty text-sm">No hay puntos finitos para graficar en este intervalo.</p>
  }

  return (
    <div className="sr-chart-shell h-80 w-full min-h-[240px]">
      <Line
        data={{
          datasets: [
            {
              label: 'f(x)',
              data: pts,
              borderColor: chartPrimary,
              backgroundColor: chartFill,
              borderWidth: 2.25,
              pointRadius: 0,
              tension: 0.12,
              fill: false,
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          parsing: false,
          interaction: { mode: 'nearest', intersect: false },
          plugins: {
            ...legend,
            tooltip: {
              callbacks: {
                label: (ctx) => {
                  const { parsed } = ctx
                  if (!parsed) return ''
                  return ` (${parsed.x?.toFixed?.(4)}, ${parsed.y?.toFixed?.(4)})`
                },
              },
            },
          },
          scales,
        }}
      />
    </div>
  )
}
