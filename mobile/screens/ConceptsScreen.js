import { Text } from 'react-native';
import { Card } from '../components/ui';
import { useTheme } from '../context/ThemeContext';

const SECTIONS = [
  { title: 'Panorama', body: 'Raíces: f(r)≈0. Polinomios: Horner y deflación. Interpolación: polinomio único grado ≤n−1 por n nodos.' },
  { title: 'Bisección / posición falsa', body: 'Intervalo [a,b] con cambio de signo. Convergencia garantizada; lenta pero robusta.' },
  { title: 'Newton–Raphson', body: 'x_{k+1}=x_k−f(x_k)/f′(x_k). Rápido; falla si f′≈0 (raíz múltiple).' },
  { title: 'Secante', body: 'Aproxima derivada con dos puntos; no requiere f′ explícita.' },
  { title: 'Punto fijo', body: 'x=g(x). Converge si |g′|<1 (contracción).' },
  { title: 'Horner y deflación', body: 'Evaluación O(n). Tras cada raíz, factoriza (x−r) y baja el grado.' },
  { title: 'Lagrange y Neville', body: 'Mismo polinomio interpolante; Lagrange suma términos L_i; Neville en tabla.' },
  { title: 'Runge y Chebyshev', body: 'Nodos uniformes pueden oscilar; Chebyshev reduce error máximo en [-1,1].' },
  { title: 'Parada y errores', body: 'Tol. en |f|, paso, o iteraciones máx. Cuidado con coma flotante y dominio de f.' },
];

export function ConceptsScreen() {
  const { colors } = useTheme();
  return (
    <>
      <Card title="Conceptos y fórmulas" subtitle="Guía alineada con la pestaña web">
        <Text style={{ color: colors.muted, fontSize: 13, lineHeight: 20 }}>
          Referencia teórica. En la web las fórmulas usan notación LaTeX; aquí el contenido esencial en texto.
        </Text>
      </Card>
      {SECTIONS.map((s) => (
        <Card key={s.title} title={s.title}>
          <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 22 }}>{s.body}</Text>
        </Card>
      ))}
    </>
  );
}
