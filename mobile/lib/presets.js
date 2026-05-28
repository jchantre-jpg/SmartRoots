/** Ejemplos alineados con frontend/src/lib/rootsMethodExamples.js y PolyInterpWorkspace */

export const ROOT_PRESETS = [
  { id: 'bis-1', label: '√2', expr: 'x**2 - 2', a: '1', b: '2', x0: '1', x1: '1.5', xmin: '-0.5', xmax: '2.5', gExpr: '0.5*(x + 2/x)', highlightContractive: false },
  { id: 'newton-1', label: 'Newton √2', expr: 'x**2 - 2', a: '1', b: '2', x0: '1.5', x1: '2', xmin: '-0.5', xmax: '2.5', gExpr: '0.5*(x + 2/x)', highlightContractive: false },
  { id: 'sec-1', label: 'Secante', expr: 'x**2 - 2', a: '1', b: '2', x0: '1', x1: '2', xmin: '-0.5', xmax: '2.5', gExpr: 'cos(x)', highlightContractive: false },
  { id: 'fp-1', label: 'Punto fijo', expr: 'x**2 - 2', a: '0', b: '2', x0: '1.5', x1: '2', xmin: '-0.5', xmax: '2.5', gExpr: '0.5*(x + 2/x)', highlightContractive: true },
  { id: 'exp', label: 'e^x - 3x', expr: 'exp(x) - 3*x', a: '0', b: '2', x0: '1', x1: '1.5', xmin: '-1', xmax: '3', gExpr: 'log(3*x)', highlightContractive: false },
];

export const POLY_PRESETS = [
  { id: 'quartic', label: 'Cuártico', coeffs: '1,0,-5,0,4', xEval: '1.2', polyXmin: '-5', polyXmax: '5' },
  { id: 'cubic', label: 'x³−x', coeffs: '1,0,-1,0', xEval: '0.5', polyXmin: '-2', polyXmax: '2' },
  { id: 'double', label: 'Doble+simple', coeffs: '1,0,-3,2', xEval: '0.9', polyXmin: '-2', polyXmax: '3' },
];

export const INTERP_PRESETS = [
  { id: 'linear', label: 'Lineal', nodesX: '-1,1', nodesY: '0,2', xStar: '0.25' },
  { id: 'parab', label: 'Parábola', nodesX: '-1,0,1', nodesY: '0,1,0', xStar: '0.5' },
  { id: 'runge', label: 'Runge', nodesX: '-1,-0.5,0,0.5,1', nodesY: '0.0384615,0.137931,1,0.137931,0.0384615', xStar: '0.85' },
  { id: 'cheb', label: 'Chebyshev', nodesX: '0.9238795,0.3826834,-0.3826834,-0.9238795', nodesY: '0.0447617,0.2145325,0.2145325,0.0447617', xStar: '0.5' },
];

export const METHOD_BUTTONS = [
  { id: 'bisection', short: 'Bisección' },
  { id: 'false_position', short: 'Pos. falsa' },
  { id: 'newton_raphson', short: 'Newton' },
  { id: 'secant', short: 'Secante' },
  { id: 'fixed_point', short: 'P. fijo' },
];
