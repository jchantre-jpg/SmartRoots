/**
 * Gráficas de convergencia a partir de filas de `/api/solve`: aproximación vs k, |f| vs k, etc.
 * Normaliza columnas distintas por método (`approxFromRow`, `absF`).
 */
import { useMemo } from 'react'
import { Line } from 'react-chartjs-2'
import { useTheme } from '../ThemeContext.jsx'
import { COLORS, chartGrid, chartLegendText, chartTicks, chartPointBorder } from '../chartTheme'

function approxFromRow(row) {
  if (row.aproximacion !== undefined && Number.isFinite(row.aproximacion)) return row.aproximacion
  if (row.c !== undefined && Number.isFinite(row.c)) return row.c
  if (row.x_next !== undefined && Number.isFinite(row.x_next)) return row.x_next
  if (row.g_x !== undefined && Number.isFinite(row.g_x)) return row.g_x
  if (row.x !== undefined && Number.isFinite(row.x)) return row.x
  return null
}

function absF(row) {
  const v = row.f_c ?? row.f_x ?? row.f_prev
  if (typeof v === 'number' && Number.isFinite(v)) return Math.abs(v)
  return null
}

export function ConvergenceCharts({ rows }) {
  const { chartPrimary, chartFill, colorMode } = useTheme()
  const light = colorMode === 'light'
  const tickC = light ? '#475569' : chartTicks
  const gridC = light ? 'rgba(15, 23, 42, 0.07)' : chartGrid
  const legC = light ? '#334155' : chartLegendText
  const ptBorder = chartPointBorder(colorMode)

  if (!rows?.length) return null

  const labels = rows.map((r) => String(r.k))
  const errors = rows.map((r) => {
    const e = r.error
    return typeof e === 'number' && Number.isFinite(e) ? Math.max(e, 1e-16) : 0
  })
  const hasAbsF = rows.some((r) => absF(r) !== null)

  const chartOpts = useMemo(
    () => (yTitle) => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: legC, boxWidth: 12 } },
      },
      scales: {
        x: {
          title: { display: true, text: 'Iteración k', color: tickC },
          ticks: { color: tickC },
          grid: { color: gridC },
        },
        y: {
          title: { display: true, text: yTitle, color: tickC },
          ticks: { color: tickC },
          grid: { color: gridC },
          type: 'logarithmic',
        },
      },
    }),
    [tickC, gridC, legC],
  )

  const approxChartOpts = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: legC, boxWidth: 12 } },
      },
      scales: {
        x: {
          title: { display: true, text: 'Iteración k', color: tickC },
          ticks: { color: tickC },
          grid: { color: gridC },
        },
        y: {
          title: { display: true, text: 'Aproximación de la raíz', color: tickC },
          ticks: { color: tickC },
          grid: { color: gridC },
        },
      },
    }),
    [tickC, gridC, legC],
  )

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="sr-chart-shell h-64">
        <Line
          data={{
            labels,
            datasets: [
              {
                label: '|error| (eje log)',
                data: errors,
                borderColor: chartPrimary,
                backgroundColor: chartFill,
                tension: 0.2,
                fill: true,
                pointRadius: 3,
                pointBackgroundColor: chartPrimary,
                pointBorderColor: ptBorder,
                pointBorderWidth: 1,
              },
            ],
          }}
          options={chartOpts('Error')}
        />
      </div>
      <div className="sr-chart-shell h-64">
        <Line
          data={{
            labels,
            datasets: [
              {
                label: 'xₖ / cₖ (convergencia)',
                data: rows.map((r) => {
                  const v = approxFromRow(r)
                  return Number.isFinite(v) ? v : null
                }),
                spanGaps: true,
                borderColor: COLORS.electric,
                backgroundColor: COLORS.electricFill,
                tension: 0.2,
                fill: false,
                pointRadius: 3,
                pointBackgroundColor: COLORS.electric,
                pointBorderColor: ptBorder,
                pointBorderWidth: 1,
              },
            ],
          }}
          options={approxChartOpts}
        />
      </div>
      {hasAbsF ? (
        <div className="sr-chart-shell h-64 lg:col-span-2">
          <Line
            data={{
              labels,
              datasets: [
                {
                  label: '|f en el punto de trabajo|',
                  data: rows.map((r) => {
                    const v = absF(r)
                    return v === null ? 0 : Math.max(v, 1e-16)
                  }),
                  borderColor: COLORS.amber,
                  backgroundColor: COLORS.amberFill,
                  tension: 0.2,
                  fill: false,
                  pointRadius: 2,
                },
              ],
            }}
            options={chartOpts('|f| (log)')}
          />
        </div>
      ) : null}
    </div>
  )
}
