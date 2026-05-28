/**
 * Conversión LaTeX ↔ SymPy vía `/api/expr/convert`.
 */
import { apiPost } from '../api.js'

export async function convertExpr({ latex, sympy }) {
  return apiPost('/api/expr/convert', {
    ...(latex != null ? { latex } : {}),
    ...(sympy != null ? { sympy } : {}),
  })
}
