/**
 * Textos de apoyo para elegir método (heurísticos, transparentes).
 * @param {{ rec: any, compareRows: any[] | null, curve: any, solve: any }} p
 * @returns {{ bullets: string[], curveLevel: 'ok' | 'warn' | 'unknown' }}
 */
export function rootsDecisionAssist({ rec, compareRows, curve, solve }) {
  const bullets = []

  if (rec?.bracket && Number.isFinite(rec.bracket.a) && Number.isFinite(rec.bracket.b)) {
    bullets.push(
      'Hay intervalo con cambio de signo (o detectado por barrido): bisección y posición falsa son opciones seguras si f es continua en ese tramo.',
    )
  } else {
    bullets.push(
      'No hay bracket claro en [a,b] con los datos actuales: prioriza semillas buenas (Newton / secante) o amplía y acota el intervalo.',
    )
  }

  if (rec?.notes?.length) {
    const n = rec.notes[0]
    if (typeof n === 'string' && n.length < 220) bullets.push(`Nota del analizador: ${n}`)
  }

  if (curve?.warnings?.length) {
    bullets.push(
      'La curva muestra advertencias (no finito / no real / variación extrema): interpreta raíces con cautela y revisa el rango [x mín, x máx].',
    )
  }

  if (compareRows?.length) {
    const okRoots = compareRows.filter((r) => r.ok && r.data?.status === 'ok' && Number.isFinite(r.data?.root))
    if (okRoots.length >= 2) {
      const vals = okRoots.map((r) => r.data.root)
      const spread = Math.max(...vals) - Math.min(...vals)
      const med = vals.sort((a, b) => a - b)[Math.floor(vals.length / 2)]
      const tol = 1e-5 * (1 + Math.abs(med))
      if (spread > tol * 5) {
        bullets.push(
          'Los métodos que convergieron dan raíces bastante distintas: puede haber varias raíces en el rango, o métodos sensibles al arranque / intervalo.',
        )
      } else {
        bullets.push('Los métodos convergentes coinciden en la raíz en primera aproximación: refuerza la confianza en el resultado.')
      }
    }
    const failed = compareRows.filter((r) => !r.ok)
    if (failed.length) {
      bullets.push(
        `${failed.length} método(s) no se ejecutaron con estos datos (p. ej. falta de cambio de signo): eso no los descalifica en general, solo en este caso.`,
      )
    }
  } else if (solve?.method) {
    bullets.push(
      'Pulsa «Comparar todos los métodos» para ver coste aproximado, iteraciones y si las raíces convergentes coinciden.',
    )
  }

  let curveLevel = 'unknown'
  if (curve?.warnings?.length) curveLevel = 'warn'
  else if (curve?.y?.length) curveLevel = 'ok'

  return { bullets: bullets.slice(0, 6), curveLevel }
}
