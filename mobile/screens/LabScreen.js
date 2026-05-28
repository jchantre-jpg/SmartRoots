import { Text, TouchableOpacity, View } from 'react-native';
import { Card, OkText } from '../components/ui';
import { useTheme } from '../context/ThemeContext';

const CHAPTERS = [
  { id: 'roots', num: '05', title: 'Raíces', sub: 'Bisección, Newton, secante, punto fijo' },
  { id: 'poly', num: '06', title: 'Polinomios', sub: 'Horner, división sintética, deflación' },
  { id: 'interp', num: '07', title: 'Interpolación', sub: 'Lagrange, Neville, Runge' },
  { id: 'concepts', num: '—', title: 'Conceptos', sub: 'Teoría y fórmulas' },
  { id: 'about', num: '—', title: 'Acerca', sub: 'Proyecto SmartRoots' },
];

const STEPS = [
  { n: '1', t: 'Ingresa', d: 'f(x), coeficientes o nodos (xᵢ,yᵢ)' },
  { n: '2', t: 'Analiza', d: 'Recomendación o validación automática' },
  { n: '3', t: 'Resuelve', d: 'Tablas, gráficas y comparación' },
  { n: '4', t: 'Comprende', d: 'Conceptos y criterios de parada' },
];

export function LabScreen({ onOpenChapter, backendOk, onStartRoots }) {
  const { colors } = useTheme();
  return (
    <>
      <Card title="SmartRoots">
        <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 22 }}>
          Laboratorio de métodos numéricos. Misma API que la versión web: raíces, polinomios e interpolación con tablas y gráficas.
        </Text>
        {backendOk === true ? <OkText message="✓ Servidor conectado" /> : null}
        {backendOk === false ? (
          <Text style={{ color: '#fecaca', marginTop: 8, fontSize: 13 }}>✗ Sin conexión — revisa la URL del backend y python app.py</Text>
        ) : null}
        <TouchableOpacity
          onPress={onStartRoots}
          style={{ marginTop: 14, backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 16, alignItems: 'center' }}
        >
          <Text style={{ color: '#0f172a', fontWeight: '700', fontSize: 15 }}>Empezar ahora → Raíces</Text>
        </TouchableOpacity>
      </Card>

      <Text style={{ color: colors.primarySoft, fontSize: 11, fontWeight: '700', letterSpacing: 2, marginTop: 16, marginBottom: 8 }}>
        FLUJO DE TRABAJO
      </Text>
      {STEPS.map((s) => (
        <View key={s.n} style={{ flexDirection: 'row', gap: 12, marginBottom: 10, alignItems: 'flex-start' }}>
          <Text style={{ color: colors.primary, fontWeight: '800', fontSize: 16 }}>{s.n}</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.text, fontWeight: '600' }}>{s.t}</Text>
            <Text style={{ color: colors.muted, fontSize: 12 }}>{s.d}</Text>
          </View>
        </View>
      ))}

      <Text style={{ color: colors.primarySoft, fontSize: 11, fontWeight: '700', letterSpacing: 2, marginTop: 16, marginBottom: 8 }}>
        CAPÍTULOS
      </Text>
      {CHAPTERS.map((ch) => (
        <TouchableOpacity
          key={ch.id}
          onPress={() => onOpenChapter(ch.id)}
          style={{
            marginBottom: 8,
            padding: 14,
            borderRadius: 16,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text style={{ color: colors.primarySoft, fontSize: 10, fontWeight: '700' }}>{ch.num}</Text>
          <Text style={{ color: colors.text, fontSize: 16, fontWeight: '700' }}>{ch.title}</Text>
          <Text style={{ color: colors.muted, fontSize: 12 }}>{ch.sub}</Text>
        </TouchableOpacity>
      ))}
    </>
  );
}
