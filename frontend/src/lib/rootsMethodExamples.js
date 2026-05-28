/**
 * Ejemplos por método de raíces: dos casos cada uno, calibrados para que el asistente
 * (`POST /api/recommend`) devuelva el **mismo** `recommended.method` en ambos.
 */

/** @typedef {{ expr: string, a: string, b: string, x0: string, x1: string, xmin: string, xmax: string, gExpr: string, highlightContractive?: boolean }} RootsExampleFields */

/** @typedef {{ id: string, label: string, labelTex: string, hint: string, fields: RootsExampleFields }} RootsMethodExample */

/** @typedef {{ methodId: string, title: string, examples: [RootsMethodExample, RootsMethodExample] }} RootsMethodExampleGroup */

export const METHOD_BUTTONS = [
  { id: 'bisection', short: 'Bisección' },
  { id: 'false_position', short: 'Posición falsa' },
  { id: 'newton_raphson', short: 'Newton–Raphson' },
  { id: 'secant', short: 'Secante' },
  { id: 'fixed_point', short: 'Punto fijo' },
]

/** @type {RootsMethodExampleGroup[]} */
export const ROOTS_METHOD_EXAMPLE_GROUPS = [
  {
    methodId: 'bisection',
    title: 'Bisección',
    examples: [
      {
        id: 'bis-1',
        label: '√2 (intervalo puro)',
        labelTex: 'x^2-2,\ [1,2]',
        hint: 'x²−2 en [1,2]; solo intervalo → bisección gana.',
        fields: {
          expr: 'x**2 - 2',
          a: '1',
          b: '2',
          x0: '',
          x1: '',
          xmin: '-0.5',
          xmax: '2.5',
          gExpr: '0.5*(x + 2/x)',
          highlightContractive: false,
        },
      },
      {
        id: 'bis-2',
        label: 'Cúbica x³−x−2',
        labelTex: 'x^3-x-2',
        hint: 'f(1)<0, f(2)>0; otra ecuación, misma regla → otra vez bisección #1.',
        fields: {
          expr: 'x**3 - x - 2',
          a: '1',
          b: '2',
          x0: '',
          x1: '',
          xmin: '-1.5',
          xmax: '2.5',
          gExpr: 'x',
          highlightContractive: false,
        },
      },
    ],
  },
  {
    methodId: 'false_position',
    title: 'Posición falsa',
    examples: [
      {
        id: 'fp-1',
        label: '√(x−0.5) − c',
        labelTex: '\\sqrt{x-0.5}-0.2',
        hint: 'x₀ a la izquierda del dominio de f′ real → posición falsa #1.',
        fields: {
          expr: 'sqrt(x-0.5)-0.2',
          a: '0.51',
          b: '1.2',
          x0: '0.45',
          x1: '',
          xmin: '0.35',
          xmax: '1.3',
          gExpr: 'x',
          highlightContractive: false,
        },
      },
      {
        id: 'fp-2',
        label: 'Otra traslación de la raíz',
        labelTex: '\\sqrt{x-0.4}-0.22',
        hint: 'Misma idea: intervalo válido + x₀ con f′ problemática.',
        fields: {
          expr: 'sqrt(x-0.4)-0.22',
          a: '0.42',
          b: '1.0',
          x0: '0.38',
          x1: '',
          xmin: '0.3',
          xmax: '1.2',
          gExpr: 'x',
          highlightContractive: false,
        },
      },
    ],
  },
  {
    methodId: 'newton_raphson',
    title: 'Newton–Raphson',
    examples: [
      {
        id: 'nw-1',
        label: '√2 con semillas',
        labelTex: 'x^2-2',
        hint: 'x²−2; x₀ y x₁ rellenos pero Newton gana por f′ finita.',
        fields: {
          expr: 'x**2 - 2',
          a: '1',
          b: '2',
          x0: '1',
          x1: '1.5',
          xmin: '-0.5',
          xmax: '2.5',
          gExpr: '0.5*(x + 2/x)',
          highlightContractive: false,
        },
      },
      {
        id: 'nw-2',
        label: 'e^x − 2x − 1',
        labelTex: 'e^x-2x-1',
        hint: 'Transcendente suave; buen x₀ → otra vez Newton #1.',
        fields: {
          expr: 'exp(x) - 2*x - 1',
          a: '0',
          b: '2',
          x0: '0.5',
          x1: '1.2',
          xmin: '-1',
          xmax: '2.5',
          gExpr: '0.5*(exp(x)-1)',
          highlightContractive: false,
        },
      },
    ],
  },
  {
    methodId: 'secant',
    title: 'Secante',
    examples: [
      {
        id: 'sc-1',
        label: 'Raíz + dos semillas',
        labelTex: '\\sqrt{x-0.5}-0.2',
        hint: 'Misma f que posición falsa, pero con x₁ → secante #1.',
        fields: {
          expr: 'sqrt(x-0.5)-0.2',
          a: '0.51',
          b: '1.2',
          x0: '0.45',
          x1: '0.9',
          xmin: '0.35',
          xmax: '1.3',
          gExpr: 'x',
          highlightContractive: false,
        },
      },
      {
        id: 'sc-2',
        label: 'Segunda familia √(x−c)',
        labelTex: '\\sqrt{x-0.3}-0.25',
        hint: 'x₀ fuera del dominio real de f′; secante sigue siendo #1.',
        fields: {
          expr: 'sqrt(x-0.3)-0.25',
          a: '0.35',
          b: '1.1',
          x0: '0.295',
          x1: '0.75',
          xmin: '0.2',
          xmax: '1.2',
          gExpr: 'x',
          highlightContractive: false,
        },
      },
    ],
  },
  {
    methodId: 'fixed_point',
    title: 'Punto fijo',
    examples: [
      {
        id: 'fpf-1',
        label: 'cos x = x',
        labelTex: 'x-\\cos x=0',
        hint: 'f(x)=x−cos x, g=cos x; contracción en x₀ → punto fijo #1.',
        fields: {
          expr: 'x - cos(x)',
          a: '0',
          b: '1',
          x0: '0.5',
          x1: '',
          xmin: '-0.5',
          xmax: '1.5',
          gExpr: 'cos(x)',
          highlightContractive: true,
        },
      },
      {
        id: 'fpf-2',
        label: 'x = e^(−x)',
        labelTex: 'x-e^{-x}=0',
        hint: 'Otra g contractiva típica; mismo criterio → punto fijo #1.',
        fields: {
          expr: 'x - exp(-x)',
          a: '0',
          b: '1',
          x0: '0.4',
          x1: '',
          xmin: '-0.5',
          xmax: '1.5',
          gExpr: 'exp(-x)',
          highlightContractive: true,
        },
      },
    ],
  },
]

/** Botones rápidos «Ejemplos»: los diez casos (dos por método). */
export const ROOT_PRESETS = ROOTS_METHOD_EXAMPLE_GROUPS.flatMap((g) =>
  g.examples.map((ex) => {
    const f = ex.fields
    return {
      id: ex.id,
      label: ex.label,
      labelTex: ex.labelTex,
      expr: f.expr,
      a: f.a,
      b: f.b,
      x0: f.x0,
      x1: f.x1,
      xmin: f.xmin,
      xmax: f.xmax,
      gExpr: f.gExpr,
      highlightContractive: Boolean(f.highlightContractive),
    }
  }),
)
