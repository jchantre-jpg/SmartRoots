import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const BULLETS = [
  'Raíces: define f(x), intervalo o semillas; «Analizar y graficar» recomienda y ejecuta. Compara métodos desde la tabla.',
  'Polinomios: coeficientes mayor→menor; Horner, división sintética y deflación con tablas.',
  'Interpolación: nodos (xᵢ,yᵢ); Lagrange, Neville y demo Runge/Chebyshev.',
  'En móvil escribe SymPy (x**2-2). La web usa editor LaTeX MathLive.',
  'Backend Flask en puerto 5000; en el teléfono usa la IP de tu PC en la URL.',
  'Temas: botón «Tema» en la cabecera (claro/oscuro y paletas).',
];

export function HelpModal({ visible, onClose }) {
  const { colors } = useTheme();
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(2,8,18,0.9)', justifyContent: 'center', padding: 20 }}>
        <View style={{ maxHeight: '85%', borderRadius: 20, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, padding: 18 }}>
          <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700' }}>Ayuda rápida</Text>
          <ScrollView style={{ marginTop: 12 }}>
            {BULLETS.map((b, i) => (
              <Text key={i} style={{ color: colors.muted, fontSize: 14, lineHeight: 22, marginBottom: 10 }}>
                • {b}
              </Text>
            ))}
          </ScrollView>
          <TouchableOpacity onPress={onClose} style={{ marginTop: 12, padding: 12, borderRadius: 14, backgroundColor: colors.primary }}>
            <Text style={{ textAlign: 'center', color: '#0f172a', fontWeight: '700' }}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
