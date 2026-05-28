/**
 * Pantalla de referencia teórica: ideas clave y fórmulas de raíces, polinomios e interpolación.
 * Notación matemática renderizada con KaTeX (LaTeX).
 */
import { GlassCard } from './GlassCard.jsx'
import { M, MathBlock } from './Math.jsx'
import { SrIcon } from '../icons/SrIcons.jsx'

const toc = [
  ['#concept-overview', 'Panorama', 'lab'],
  ['#concept-roots-map', 'Elegir método', 'roots'],
  ['#concept-bisection', 'Bisección', 'bisection'],
  ['#concept-false-position', 'Posición falsa', 'false_position'],
  ['#concept-newton', 'Newton', 'newton_raphson'],
  ['#concept-secant', 'Secante', 'secant'],
  ['#concept-fixed-point', 'Punto fijo', 'fixed_point'],
  ['#concept-stopping', 'Parada y errores', 'info'],
  ['#concept-poly', 'Polinomios', 'poly'],
  ['#concept-interp', 'Interpolación', 'interp'],
]

export function ConceptsWorkspace() {
  return (
    <div className="concepts-light space-y-10 pb-8">
      <header className="mx-auto max-w-3xl text-center">
        <p className="text-xs font-bold uppercase tracking-[0.28em] sr-text-accent-soft">Teoría y guía</p>
        <h1 className="mt-2 font-display text-2xl font-bold sr-surface-heading sm:text-3xl">Conceptos y fórmulas</h1>
        <p className="sr-lead-text mt-3 text-sm sr-surface-muted">
          Guía alineada con SmartRoots: hipótesis, iteraciones, órdenes de convergencia, condicionamiento e
          interpolación. Úsala junto a las pestañas Raíces, Polinomios e Interpolación.
        </p>
      </header>

      <nav
        aria-label="Índice de conceptos"
        className="mx-auto flex max-w-4xl flex-wrap justify-center gap-2 rounded-2xl border border-white/[0.08] bg-slate-950/40 p-3 ring-1 ring-white/[0.04] [html.sr-light_&]:border-slate-400/45 [html.sr-light_&]:bg-slate-100/90 [html.sr-light_&]:ring-slate-400/30 [html.sr-light_&]:shadow-sm"
      >
        {toc.map(([href, label, icon]) => (
          <a
            key={href}
            href={href}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.06] px-2.5 py-1.5 text-[11px] font-semibold text-slate-200 ring-1 ring-white/10 transition hover:bg-white/[0.1] [html.sr-light_&]:bg-slate-200/80 [html.sr-light_&]:text-slate-900 [html.sr-light_&]:ring-slate-400/45 [html.sr-light_&]:hover:bg-slate-300/70"
          >
            <SrIcon name={icon} className="h-3.5 w-3.5 opacity-90" />
            {label}
          </a>
        ))}
      </nav>

      <GlassCard title="Panorama" subtitle="Qué hace cada módulo y cómo encajan las ideas.">
        <div id="concept-overview" className="scroll-mt-24 space-y-4 text-sm leading-relaxed text-slate-300">
          <p>
            <strong className="text-slate-200">Raíces:</strong> aproximar <M tex="r" /> tal que{' '}
            <M tex="f(r) \approx 0" /> con métodos que generan una sucesión <M tex="(x_k)" /> y un criterio de parada
            (tolerancia, máximo de iteraciones, cambio pequeño entre pasos). La app cuenta evaluaciones de{' '}
            <M tex="f" />, <M tex="f'" /> y <M tex="g" /> para comparar coste.
          </p>
          <p>
            <strong className="text-slate-200">Polinomios:</strong> evaluar con Horner, dividir entre{' '}
            <M tex="(x - \alpha)" /> y encadenar raíces con deflación y Newton en forma Horner.
          </p>
          <p>
            <strong className="text-slate-200">Interpolación:</strong> existe un único polinomio de grado{' '}
            <M tex="\leq n - 1" /> que pasa por <M tex="n" /> puntos con abscisas distintas; Lagrange y Neville son dos
            formas de obtener el mismo valor <M tex="P(x^*)" />.
          </p>
          <p className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-[13px] text-amber-100/95 [html.sr-light_&]:border-amber-600/25 [html.sr-light_&]:bg-amber-50 [html.sr-light_&]:text-amber-950">
            Los métodos numéricos convergen solo bajo hipótesis. Verifica el dominio de <M tex="f" />, la existencia de
            raíz, semillas e intervalos antes de confiar en una tabla.
          </p>
        </div>
      </GlassCard>

      <GlassCard
        title="Raíces de f(x) = 0"
        subtitle="Intervalo vs semillas, derivada disponible y reformulación x = g(x)."
      >
        <div className="space-y-10 text-sm leading-relaxed text-slate-300">
          <section id="concept-roots-map" className="scroll-mt-24">
            <h3 className="font-display text-lg font-semibold sr-surface-heading">¿Cuándo suele preferirse cada método?</h3>
            <p className="mt-2 text-slate-400">
              La app usa reglas heurísticas (no demostración automática). Resumen del criterio pedagógico típico:
            </p>
            <div className="mt-4 overflow-x-auto rounded-xl border border-white/[0.08] text-xs ring-1 ring-white/[0.04] [html.sr-light_&]:border-slate-400/50 [html.sr-light_&]:ring-slate-400/35 [html.sr-light_&]:shadow-inner">
              <table className="min-w-[640px] w-full border-collapse text-left">
                <thead className="bg-slate-900/80 [html.sr-light_&]:bg-slate-200/90">
                  <tr className="sr-surface-heading">
                    <th className="border-b border-white/10 px-3 py-2 font-semibold [html.sr-light_&]:border-slate-400/60">Método</th>
                    <th className="border-b border-white/10 px-3 py-2 font-semibold [html.sr-light_&]:border-slate-400/60">Datos clave</th>
                    <th className="border-b border-white/10 px-3 py-2 font-semibold [html.sr-light_&]:border-slate-400/60">Ventaja</th>
                    <th className="border-b border-white/10 px-3 py-2 font-semibold [html.sr-light_&]:border-slate-400/60">Riesgo</th>
                  </tr>
                </thead>
                <tbody className="text-slate-300 [html.sr-light_&]:text-slate-800">
                  <tr className="border-b border-white/[0.06] [html.sr-light_&]:border-slate-300/80">
                    <td className="px-3 py-2 font-medium text-slate-200 [html.sr-light_&]:text-slate-900">Bisección</td>
                    <td className="px-3 py-2">
                      <M tex="[a,b]" /> con cambio de signo; <M tex="f" /> continua
                    </td>
                    <td className="px-3 py-2">Robusta; cota explícita del intervalo</td>
                    <td className="px-3 py-2">Lineal; raíz múltiple → lento</td>
                  </tr>
                  <tr className="border-b border-white/[0.06] [html.sr-light_&]:border-slate-300/80">
                    <td className="px-3 py-2 font-medium text-slate-200 [html.sr-light_&]:text-slate-900">Posición falsa</td>
                    <td className="px-3 py-2">Igual que bisección; a veces mejor si <M tex="f" /> es casi lineal en el tramo</td>
                    <td className="px-3 py-2">Mantiene bracket; a menudo menos pasos</td>
                    <td className="px-3 py-2">Puede estancarse (un extremo “pegado”)</td>
                  </tr>
                  <tr className="border-b border-white/[0.06] [html.sr-light_&]:border-slate-300/80">
                    <td className="px-3 py-2 font-medium text-slate-200 [html.sr-light_&]:text-slate-900">Newton–Raphson</td>
                    <td className="px-3 py-2">
                      Semilla <M tex="x_0" />; <M tex="f'" /> calculable y <M tex="\neq 0" /> cerca de la raíz
                    </td>
                    <td className="px-3 py-2">Cuadrático en raíz simple</td>
                    <td className="px-3 py-2">
                      Diverge si <M tex="x_0" /> mala o <M tex="f'(r)=0" />
                    </td>
                  </tr>
                  <tr className="border-b border-white/[0.06] [html.sr-light_&]:border-slate-300/80">
                    <td className="px-3 py-2 font-medium text-slate-200 [html.sr-light_&]:text-slate-900">Secante</td>
                    <td className="px-3 py-2">Dos semillas; no requiere <M tex="f'" /> explícita</td>
                    <td className="px-3 py-2">
                      Superlineal (orden <M tex="\approx \varphi \approx 1{,}618" /> en raíz simple)
                    </td>
                    <td className="px-3 py-2">
                      Falla si <M tex="f(x_0)=f(x_1)" /> o semillas malas
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-medium text-slate-200 [html.sr-light_&]:text-slate-900">Punto fijo</td>
                    <td className="px-3 py-2">
                      <M tex="x = g(x)" />; <M tex="|g'(r)| < 1" /> cerca de <M tex="r" />
                    </td>
                    <td className="px-3 py-2">Simple; útil si <M tex="g" /> es contractiva</td>
                    <td className="px-3 py-2">Convergencia lineal; depende de <M tex="g" /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section id="concept-bisection" className="scroll-mt-24">
            <h3 className="font-display text-lg font-semibold sr-surface-heading">Bisección</h3>
            <p className="mt-2">
              <strong className="text-slate-200">Hipótesis:</strong> <M tex="f" /> continua en <M tex="[a,b]" /> y{' '}
              <M tex="f(a)\,f(b) < 0" /> (al menos una raíz en el intervalo).
            </p>
            <p className="mt-2">
              <strong className="text-slate-200">Idea:</strong> dividir el intervalo por la mitad y conservar el subintervalo
              donde sigue habiendo cambio de signo.
            </p>
            <MathBlock tex="c = \dfrac{a + b}{2}" />
            <p className="text-slate-400">
              Tras <M tex="k" /> pasos, la incertidumbre del intervalo es como máximo{' '}
              <M tex="\dfrac{b-a}{2^{k}}" />. Convergencia <strong className="text-slate-300">lineal</strong> con
              constante asintótica <M tex="\tfrac{1}{2}" /> respecto al ancho del intervalo.
            </p>
          </section>

          <section id="concept-false-position" className="scroll-mt-24">
            <h3 className="font-display text-lg font-semibold sr-surface-heading">Posición falsa (regula falsi)</h3>
            <p className="mt-2">
              <strong className="text-slate-200">Hipótesis:</strong> misma idea de bracket que bisección.
            </p>
            <p className="mt-2">
              <strong className="text-slate-200">Idea:</strong> une <M tex="(a,f(a))" /> y <M tex="(b,f(b))" /> con una
              recta y toma la intersección con el eje <M tex="x" /> como nuevo punto <M tex="c" />; se actualiza el extremo
              del mismo signo que <M tex="f(c)" />.
            </p>
            <MathBlock tex="c = \dfrac{a\,f(b) - b\,f(a)}{f(b) - f(a)}" />
            <p className="text-slate-400">
              Si <M tex="f" /> es casi lineal entre <M tex="a" /> y <M tex="b" />, <M tex="c" /> queda muy cerca de la raíz
              de un golpe; si un extremo se repite muchas veces, el avance puede volverse lento.
            </p>
          </section>

          <section id="concept-newton" className="scroll-mt-24">
            <h3 className="font-display text-lg font-semibold sr-surface-heading">Newton–Raphson</h3>
            <p className="mt-2">
              <strong className="text-slate-200">Hipótesis:</strong> <M tex="f" /> derivable, <M tex="f'(x) \neq 0" /> en un
              entorno de la raíz simple <M tex="r" />, y <M tex="x_0" /> suficientemente cercana a <M tex="r" />.
            </p>
            <MathBlock tex="x_{k+1} = x_k - \dfrac{f(x_k)}{f'(x_k)}" />
            <p className="mt-2 text-slate-400">
              En raíz <strong className="text-slate-300">simple</strong>, el error{' '}
              <M tex="e_k = x_k - r" /> cumple aproximadamente{' '}
              <M tex="e_{k+1} \approx C\,e_k^{2}" /> (convergencia cuadrática local). Si la multiplicidad es{' '}
              <M tex="m > 1" />, el orden baja; en la práctica se usan modificaciones (paso amortiguado, <M tex="m" />{' '}
              conocido, etc.).
            </p>
            <p className="mt-2 text-slate-400">
              <strong className="text-slate-300">Patologías:</strong> <M tex="f'(x_k) \approx 0" /> (salto enorme),
              oscilación entre dos valores, o convergencia a otra raíz si hay varias y la semilla está en otra cuenca.
            </p>
          </section>

          <section id="concept-secant" className="scroll-mt-24">
            <h3 className="font-display text-lg font-semibold sr-surface-heading">Secante</h3>
            <p className="mt-2">
              <strong className="text-slate-200">Hipótesis:</strong> dos semillas <M tex="x_0 \neq x_1" />; no hace falta
              derivada explícita.
            </p>
            <p className="mt-2">
              <strong className="text-slate-200">Idea:</strong> aproxima <M tex="f'(x_k)" /> por la pendiente entre{' '}
              <M tex="(x_{k-1}, f(x_{k-1}))" /> y <M tex="(x_k, f(x_k))" />.
            </p>
            <MathBlock tex="x_{k+1} = x_k - f(x_k)\,\dfrac{x_k - x_{k-1}}{f(x_k) - f(x_{k-1})}" />
            <p className="mt-2 text-slate-400">
              Cada paso reutiliza la evaluación anterior: suele ser más barato en evaluaciones de <M tex="f" /> que Newton
              si <M tex="f'" /> es cara. El orden superlineal típico es el número áureo{' '}
              <M tex="\varphi = \dfrac{1+\sqrt{5}}{2} \approx 1{,}618" />.
            </p>
          </section>

          <section id="concept-fixed-point" className="scroll-mt-24">
            <h3 className="font-display text-lg font-semibold sr-surface-heading">Punto fijo</h3>
            <p className="mt-2">
              <strong className="text-slate-200">Reformulación:</strong> escribir <M tex="f(x)=0" /> como{' '}
              <M tex="x = g(x)" />. Cualquier raíz de <M tex="f - g" /> es punto fijo de <M tex="g" /> (con{' '}
              <M tex="f(x)=x-g(x)" /> para acotar el residual).
            </p>
            <MathBlock tex="x_{k+1} = g(x_k)" />
            <p className="mt-2 text-slate-400">
              <strong className="text-slate-300">Contracción (Banach):</strong> si <M tex="g" /> es lipschitziana con
              constante <M tex="L < 1" /> en un cerrado invariante, existe un único punto fijo ahí y la iteración converge
              desde cualquier punto inicial en ese conjunto. En curso se usa mucho{' '}
              <M tex="|g'(r)| < 1" /> para convergencia local.
            </p>
            <p className="mt-2 text-slate-400">
              <strong className="text-slate-300">Aceleración:</strong> Aitken o Steffensen pueden mejorar esquemas lineales;
              no están en esta app, pero son el siguiente paso natural.
            </p>
          </section>

          <section id="concept-stopping" className="scroll-mt-24">
            <h3 className="font-display text-lg font-semibold sr-surface-heading">Parada, errores y coma flotante</h3>
            <ul className="mt-2 list-inside list-disc space-y-2 text-slate-400">
              <li>
                <strong className="text-slate-300">Error hacia adelante:</strong>{' '}
                <M tex="|x_k - r|" /> (desconocido salvo cotas).
              </li>
              <li>
                <strong className="text-slate-300">Error residual:</strong>{' '}
                <M tex="|f(x_k)|" />; pequeño no implica <M tex="|x_k-r|" /> pequeño si{' '}
                <M tex="|f'(r)|" /> es muy pequeño (mal condicionamiento).
              </li>
              <li>
                <strong className="text-slate-300">Diferencia entre iterados:</strong>{' '}
                <M tex="|x_{k+1} - x_k|" /> útil como heurística, no como prueba de precisión absoluta.
              </li>
              <li>
                <strong className="text-slate-300">Cancelación catastrófica:</strong> restar cantidades casi iguales
                destruye dígitos significativos; afecta a secante, diferencias finitas y fórmulas mal reescritas.
              </li>
            </ul>
          </section>
        </div>
      </GlassCard>

      <GlassCard title="Polinomios" subtitle="Evaluación estable, división y encadenamiento de raíces.">
        <div className="space-y-10 text-sm leading-relaxed text-slate-300">
          <section id="concept-poly" className="scroll-mt-24">
            <h3 className="font-display text-lg font-semibold sr-surface-heading">Esquema de Horner</h3>
            <p className="mt-2">
              Evalúa <M tex="P(x) = a_n x^n + a_{n-1} x^{n-1} + \cdots + a_0" /> con coeficientes en orden{' '}
              <strong className="text-slate-200">de mayor a menor grado</strong>, sin formar potencias explícitas:
            </p>
            <MathBlock tex="P(x) = (\cdots((a_n x + a_{n-1})x + a_{n-2})x + \cdots + a_0)" />
            <MathBlock tex="r \leftarrow 0;\quad \text{para cada } c \in \{a_n,\ldots,a_0\}:\quad r \leftarrow r\cdot x + c" />
            <p className="text-slate-400">
              Complejidad <M tex="O(n)" /> por evaluación; reduce propagación de error frente a sumar monomios por separado.
            </p>
          </section>

          <section>
            <h3 className="font-display text-lg font-semibold sr-surface-heading">División sintética (Ruffini)</h3>
            <p className="mt-2">
              Divide <M tex="P(x)" /> entre <M tex="(x - \alpha)" />. Si el residuo es <M tex="0" />,{' '}
              <M tex="\alpha" /> es raíz (en aritmética exacta). El cociente tiene grado uno menos y sirve para deflación.
            </p>
            <p className="mt-2 text-slate-400">
              En coma flotante el residuo casi nunca es exactamente cero: se usa un umbral. Familia de Wilkinson: raíces
              reales pero extremadamente sensibles a perturbaciones de coeficientes.
            </p>
          </section>

          <section>
            <h3 className="font-display text-lg font-semibold sr-surface-heading">Deflación + Newton–Horner</h3>
            <p className="mt-2">
              Tras hallar <M tex="r" /> aproximada, factoriza <M tex="(x-r)" /> y continúa en el cociente. Newton con
              Horner evalúa <M tex="P" /> y <M tex="P'" /> en <M tex="O(n)" /> por iteración.
            </p>
            <p className="mt-2 text-slate-400">
              La deflación con raíz mal aproximada introduce raíces espurias en el cociente: conviene refinar antes de
              deflar.
            </p>
          </section>
        </div>
      </GlassCard>

      <GlassCard
        title="Interpolación polinómica"
        subtitle="Grado ≤ n − 1 por n puntos (xᵢ, yᵢ) con xᵢ distintos; unicidad en ese espacio."
      >
        <div id="concept-interp" className="scroll-mt-24 space-y-10 text-sm leading-relaxed text-slate-300">
          <section>
            <h3 className="font-display text-lg font-semibold sr-surface-heading">Existencia y unicidad</h3>
            <p className="mt-2">
              Dados nodos <M tex="x_i" /> distintos, existe un único polinomio de grado a lo sumo <M tex="n-1" /> que
              interpola los datos <M tex="(x_i, y_i)" />. Lagrange, Newton en diferencias divididas y Neville computan el
              mismo polinomio de formas distintas.
            </p>
          </section>

          <section>
            <h3 className="font-display text-lg font-semibold sr-surface-heading">Lagrange</h3>
            <MathBlock tex="P(x) = \sum_{i=0}^{n-1} y_i\, L_i(x), \qquad L_i(x_j) = \delta_{ij}" />
            <MathBlock tex="L_i(x) = \prod_{\substack{j=0 \\ j \neq i}}^{n-1} \dfrac{x - x_j}{x_i - x_j}" />
            <p className="mt-2 text-slate-400">
              Estable conceptualmente para pocos nodos; con muchos nodos equiespaciados el problema se vuelve mal
              condicionado (mejor Neville o Newton incremental).
            </p>
          </section>

          <section>
            <h3 className="font-display text-lg font-semibold sr-surface-heading">Forma de Newton y diferencias divididas</h3>
            <MathBlock tex="P(x) = f[x_0] + f[x_0,x_1](x-x_0) + f[x_0,x_1,x_2](x-x_0)(x-x_1) + \cdots" />
            <p className="mt-2 text-slate-400">
              Los coeficientes <M tex="f[\cdot]" /> se construyen en una tabla triangular de diferencias divididas. Añadir
              un nodo reutiliza trabajo previo.
            </p>
          </section>

          <section>
            <h3 className="font-display text-lg font-semibold sr-surface-heading">Neville</h3>
            <p className="mt-2">
              Tabla <M tex="Q_{i,j}" />: valor del polinomio que coincide en los nodos <M tex="x_i,\ldots,x_{i+j}" />,
              evaluado en <M tex="x" />.
            </p>
            <MathBlock tex="Q_{i,j} = \dfrac{(x_{i+j}-x)\, Q_{i,j-1} + (x-x_i)\, Q_{i+1,j-1}}{x_{i+j}-x_i}" />
            <p className="text-slate-400">
              El valor buscado es <M tex="Q_{0,\,n-1}" />. Ideal cuando solo necesitas <M tex="P(x^*)" /> sin coeficientes
              explícitos.
            </p>
          </section>

          <section>
            <h3 className="font-display text-lg font-semibold sr-surface-heading">Error de interpolación</h3>
            <MathBlock tex="f(x) - P(x) = \dfrac{f^{(n)}(\xi)}{n!}\,\prod_{i=0}^{n-1}(x - x_i)" />
            <p className="mt-2 text-slate-400">
              Por eso derivadas grandes o nodos mal elegidos disparan el error entre nodos (<M tex="\xi" /> depende de{' '}
              <M tex="x" /> y de los nodos).
            </p>
          </section>

          <section>
            <h3 className="font-display text-lg font-semibold sr-surface-heading">Runge y nodos de Chebyshev</h3>
            <p className="mt-2">
              Con nodos <strong className="text-slate-200">uniformes</strong> en un intervalo fijo, el interpolante puede
              oscilar fuerte cerca de los extremos (fenómeno de Runge) aunque <M tex="f" /> sea analítica.
            </p>
            <p className="mt-2">
              Repartir nodos con mayor densidad hacia los extremos —nodos de <strong className="text-slate-200">Chebyshev</strong>{' '}
              en <M tex="[-1,1]" /> proyectados al intervalo de trabajo— suele reducir esas oscilaciones.
            </p>
            <p className="mt-2 text-slate-400">
              Weierstrass garantiza aproximación uniforme por polinomios en un compacto; no implica que el interpolante
              equiespaciado sea la mejor herramienta con muchos nodos.
            </p>
          </section>

          <section>
            <h3 className="font-display text-lg font-semibold sr-surface-heading">Más allá del polinomio único</h3>
            <p className="mt-2 text-slate-400">
              En aplicaciones reales a menudo se prefieren <strong className="text-slate-300">splines</strong> (tramos
              polinómicos con continuidad <M tex="C^2" /> en los empates): evitan una sola curva de grado alto. SmartRoots
              se centra en el núcleo polinómico clásico; los splines son el siguiente capítulo del curso.
            </p>
          </section>
        </div>
      </GlassCard>

      <p className="text-center text-xs text-slate-500">
        Notación: <M tex="f'" /> derivada; <M tex="\delta_{ij}" /> es 1 si <M tex="i=j" /> y 0 si no. Para practicar con
        números, abre Raíces, Polinomios o Interpolación.
      </p>
    </div>
  )
}
