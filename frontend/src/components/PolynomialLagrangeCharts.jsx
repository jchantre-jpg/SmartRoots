/**
 * Gráficas Chart.js para polinomios e interpolación: curva P(x), Lagrange en x*, nodos y series auxiliares.
 * Reutiliza escalas/leyenda según `colorMode` (`chartTheme.js`).
 */
import { useMemo } from 'react'
import { Line } from 'react-chartjs-2'
import { useTheme } from '../ThemeContext.jsx'
import { COLORS, pluginsLegendForMode, scalesLinearForMode } from '../chartTheme'

function finiteXY(xs, ys) {
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

/** Curva P(x) muestreada + marcas opcionales (raíces reales, punto x₀). */
export function PolynomialCurveChart({ curve, rootXs = [], evalX = null, evalY = null }) {
  const { chartPrimary, chartFill, colorMode } = useTheme()
  const scales = useMemo(() => scalesLinearForMode(colorMode), [colorMode])
  const legend = useMemo(() => pluginsLegendForMode(colorMode), [colorMode])
  const line = useMemo(() => finiteXY(curve?.x, curve?.y), [curve])
  const rootPts = useMemo(
    () =>
      (rootXs || [])
        .map((rx) => {
          const x = Number(rx)
          if (!Number.isFinite(x)) return null
          return { x, y: 0 }
        })
        .filter(Boolean),
    [rootXs],
  )

  const evalPt = useMemo(() => {
    const x = Number(evalX)
    const y = Number(evalY)
    if (!Number.isFinite(x) || !Number.isFinite(y)) return []
    return [{ x, y }]
  }, [evalX, evalY])

  if (!line.length) {
    return <p className="sr-chart-empty text-sm">No hay curva P(x) para mostrar. Ajusta el rango o los coeficientes.</p>
  }

  const datasets = [
    {
      label: 'P(x)',
      data: line,
      borderColor: chartPrimary,
      backgroundColor: chartFill,
      borderWidth: 2.25,
      pointRadius: 0,
      tension: 0.15,
      fill: false,
    },
  ]
  if (rootPts.length) {
    datasets.push({
      label: 'Raíces en eje x',
      data: rootPts,
      borderColor: COLORS.orange,
      backgroundColor: COLORS.orange,
      pointRadius: 9,
      pointHoverRadius: 11,
      showLine: false,
      borderWidth: 0,
    })
  }
  if (evalPt.length) {
    datasets.push({
      label: 'P(x₀)',
      data: evalPt,
      borderColor: chartPrimary,
      backgroundColor: chartPrimary,
      pointRadius: 10,
      showLine: false,
      borderWidth: 0,
    })
  }

  return (
    <div className="sr-chart-shell h-80 w-full min-h-[240px]">
      <Line
        data={{ datasets }}
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
                  const p = ctx.raw
                  if (!p || typeof p.x !== 'number') return ''
                  return ` (${p.x.toFixed(5)}, ${p.y.toFixed(5)})`
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

/** Polinomio interpolante + nodos + punto evaluado (x*, P(x*)). */
export function LagrangeCurveChart({ sample, highlight }) {
  const { chartPrimary, chartFill, colorMode } = useTheme()
  const scales = useMemo(() => scalesLinearForMode(colorMode), [colorMode])
  const legend = useMemo(() => pluginsLegendForMode(colorMode), [colorMode])
  const line = useMemo(() => finiteXY(sample?.x, sample?.y), [sample])
  const nodes = useMemo(() => {
    const xn = sample?.x_nodes || []
    const yn = sample?.y_nodes || []
    return xn.map((x, i) => ({ x: Number(x), y: Number(yn[i]) })).filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y))
  }, [sample])

  const hi = useMemo(() => {
    const x = Number(highlight?.x)
    const y = Number(highlight?.y)
    if (!Number.isFinite(x) || !Number.isFinite(y)) return []
    return [{ x, y }]
  }, [highlight])

  if (!line.length) {
    return <p className="sr-chart-empty text-sm">Calcula Lagrange o pulsa «Calcular todo» arriba para generar la curva.</p>
  }

  const datasets = [
    {
      label: 'Polinomio interpolante',
      data: line,
      borderColor: chartPrimary,
      backgroundColor: chartFill,
      borderWidth: 2.25,
      pointRadius: 0,
      tension: 0.12,
      fill: false,
    },
    {
      label: 'Nodos',
      data: nodes,
      borderColor: COLORS.amber,
      backgroundColor: COLORS.amber,
      pointRadius: 8,
      showLine: false,
      borderWidth: 0,
    },
  ]
  if (hi.length) {
    datasets.push({
      label: 'x a interpolar',
      data: hi,
      borderColor: '#f472b6',
      backgroundColor: '#ec4899',
      pointRadius: 10,
      showLine: false,
      borderWidth: 0,
    })
  }

  return (
    <div className="sr-chart-shell h-80 w-full min-h-[240px]">
      <Line
        data={{ datasets }}
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
                  const p = ctx.raw
                  if (!p || typeof p.x !== 'number') return ''
                  return ` (${p.x.toFixed(5)}, ${p.y.toFixed(5)})`
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
