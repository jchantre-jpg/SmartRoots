import { Text } from 'react-native';
import { Card } from '../components/ui';
import { useTheme } from '../context/ThemeContext';

export function AboutScreen() {
  const { colors } = useTheme();
  return (
    <Card title="Acerca de SmartRoots">
      <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 22 }}>
        Suite educativa: raíces (bisección, Newton, secante, punto fijo, posición falsa), polinomios (Horner, división
        sintética, deflación) e interpolación (Lagrange, Neville, Runge/Chebyshev).
      </Text>
      <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 22, marginTop: 12 }}>
        La app móvil usa la misma API Flask que la web. Configura la IP de tu PC en la URL del backend cuando uses Expo Go
        en un teléfono físico.
      </Text>
      <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 22, marginTop: 16, fontWeight: '600' }}>
        by Juliana Chantre Astudillo
      </Text>
    </Card>
  );
}
