/**
 * Exportación de tablas de iteración (raíces) a CSV y LaTeX.
 * Las columnas deben coincidir con `iterationCols.js` y con lo que devuelve `/api/solve`.
 */
import { COLS } from './iterationCols'

/** CSV con separador ; para Excel en locale ES. */
export function iterationsToCsv(method, rows) {
  if (!rows?.length) return ''
  const keys = COLS[method] || Object.keys(rows[0]).filter((k) => k !== 'paso')
  const header = [...keys, 'paso'].join(';')
  const lines = rows.map((row) =>
    [...keys, 'paso'].map((k) => String(row[k] ?? '').replaceAll(';', ',')).join(';'),
  )
  return [header, ...lines].join('\n')
}

const latexCellHint = /\\[a-zA-Z]|\\frac|_\{|\\text/

function escCell(key, v) {
  const s = String(v ?? '—')
  if (key === 'paso' && latexCellHint.test(s)) {
    return `$${s.replaceAll('&', '\\&')}$`
  }
  return s.replaceAll('\\', '\\textbackslash{}').replaceAll('&', '\\&')
}

export function iterationsToLatex(method, rows) {
  if (!rows?.length) return ''
  const keys = COLS[method] || Object.keys(rows[0]).filter((k) => k !== 'paso')
  const esc = (v) => String(v ?? '—').replaceAll('\\', '\\textbackslash{}').replaceAll('&', '\\&')
  const head = [...keys, 'paso'].map((k) => esc(k)).join(' & ') + ' \\\\'
  const body = rows
    .map((row) => [...keys, 'paso'].map((k) => escCell(k, row[k])).join(' & ') + ' \\\\')
    .join('\n')
  const spec = `${'l'.repeat(keys.length + 1)}`
  return `\\begin{tabular}{${spec}}\n\\hline\n${head}\\hline\n${body}\\hline\n\\end{tabular}`
}
