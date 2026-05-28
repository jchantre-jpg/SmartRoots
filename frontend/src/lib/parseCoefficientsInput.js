/**
 * Valida la entrada de coeficientes del módulo Polinomios (solo números; orden mayor → menor grado).
 * Detecta si el usuario pegó una expresión f(x) o texto no numérico y devuelve mensajes orientativos.
 */

/** @param {string} s */
function tokenLooksLikeExpression(s) {
  const t = String(s).trim()
  if (!t) return false
  if (/[xX]/.test(t)) return true
  if (/\*\*|[\^]/.test(t)) return true
  if (/\b(sin|cos|tan|log|ln|sqrt|exp|pi)\b/i.test(t)) return true
  if (/[()]/.test(t)) return true
  if (/[a-df-wyzA-DF-WYZ]/.test(t)) return true
  return false
}

/**
 * @param {string} raw
 * @returns {{ ok: boolean, values: number[], message: string, hint?: string }}
 */
export function parseCoefficientsInput(raw) {
  const str = String(raw ?? '').trim()
  if (!str) {
    return {
      ok: false,
      values: [],
      message: 'Ingresa los coeficientes del polinomio (al menos uno).',
      hint: 'Formato: números separados por coma o espacio, de mayor a menor grado (aₙ, aₙ₋₁, …, a₀).',
    }
  }

  const parts = str.split(/[,;\s]+/).map((s) => s.trim()).filter(Boolean)
  if (!parts.length) {
    return { ok: false, values: [], message: 'No se detectaron coeficientes.', hint: 'Ejemplo: 1, 0, -5, 0, 4' }
  }

  if (parts.length === 1 && tokenLooksLikeExpression(parts[0])) {
    return {
      ok: false,
      values: [],
      message: 'Esto parece una expresión f(x), no una lista de coeficientes.',
      hint: 'En Polinomios solo se admiten números. Si quieres resolver f(x) = 0 o ver métodos de raíces, abre la pestaña Raíces.',
    }
  }

  const values = parts.map((p) => Number(p))
  const badIdx = values.findIndex((n) => Number.isNaN(n))
  if (badIdx !== -1) {
    const bad = parts[badIdx]
    if (tokenLooksLikeExpression(bad)) {
      return {
        ok: false,
        values: [],
        message: `El fragmento «${bad.length > 40 ? `${bad.slice(0, 40)}…` : bad}» no es un coeficiente numérico.`,
        hint: 'Quita letras, x, paréntesis y operadores: aquí solo van números (y separadores coma/espacio). Para expresiones usa Raíces.',
      }
    }
    return {
      ok: false,
      values: [],
      message: 'Cada coeficiente debe ser un número válido.',
      hint: 'Usa punto decimal (ej. -1.5), sin letras. Si pegaste varios datos en una sola celda, sepáralos por coma.',
    }
  }

  if (values.length > 120) {
    return {
      ok: false,
      values: [],
      message: `Demasiados coeficientes (${values.length}). El límite en esta demo es 120.`,
      hint: 'Revisa que no hayas pegado dos filas seguidas o texto extra.',
    }
  }

  return { ok: true, values, message: '', hint: '' }
}

function splitTokens(raw) {
  return String(raw ?? '')
    .split(/[,;\s]+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

/**
 * Nodos de interpolación: solo números; mismas longitudes; x distintos.
 * @param {string} nodesX
 * @param {string} nodesY
 * @returns {{ ok: boolean, message: string, hint?: string }}
 */
export function validateInterpNodes(nodesX, nodesY) {
  const tx = splitTokens(nodesX)
  const ty = splitTokens(nodesY)
  const xa = tx.map((t) => Number(t))
  const ya = ty.map((t) => Number(t))

  const nxBad = tx.findIndex((t) => Number.isNaN(Number(t)))
  const nyBad = ty.findIndex((t) => Number.isNaN(Number(t)))
  if (nxBad !== -1 || nyBad !== -1) {
    const badTok = nxBad !== -1 ? tx[nxBad] : ty[nyBad]
    const looksExpr = tokenLooksLikeExpression(badTok)
    return {
      ok: false,
      message: looksExpr
        ? `«${badTok.length > 36 ? `${badTok.slice(0, 36)}…` : badTok}» no es un número: parece una fórmula o texto simbólico.`
        : 'Todos los nodos deben ser números válidos (dígitos, punto decimal y signo).',
      hint: looksExpr
        ? 'Interpolación usa tablas (xᵢ, yᵢ). Para una expresión f(x) abre Raíces; para coeficientes de un polinomio, Polinomios.'
        : 'Si usaste coma como separador decimal, cámbiala por punto. Revisa espacios o caracteres extraños.',
    }
  }
  if (xa.length !== ya.length) {
    return {
      ok: false,
      message: `Misma cantidad de nodos x e y (ahora: ${xa.length} frente a ${ya.length}).`,
      hint: 'Cada par (xᵢ, yᵢ) debe alinearse: mismo número de valores en ambas cajas, en el mismo orden.',
    }
  }
  if (xa.length < 2) {
    return {
      ok: false,
      message: 'Se necesitan al menos 2 nodos.',
      hint: 'Ejemplo: x = -1, 0, 1, 2 e y con cuatro valores correspondientes.',
    }
  }
  const seen = new Set()
  for (const xv of xa) {
    const k = String(xv)
    if (seen.has(k)) {
      return {
        ok: false,
        message: 'Los nodos x deben ser distintos entre sí.',
        hint: 'Dos abscisas iguales no permiten el polinomio interpolante usual de grado n−1.',
      }
    }
    seen.add(k)
  }
  return { ok: true, message: '', hint: '' }
}
