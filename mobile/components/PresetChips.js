import { ScrollView, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export function PresetChips({ presets, onSelect }) {
  const { colors } = useTheme();
  if (!presets?.length) return null;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 8 }}>
      {presets.map((p) => (
        <TouchableOpacity
          key={p.id}
          onPress={() => onSelect(p)}
          style={{
            marginRight: 8,
            paddingHorizontal: 12,
            paddingVertical: 7,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.primaryDim,
          }}
        >
          <Text style={{ color: colors.text, fontSize: 12, fontWeight: '600' }}>{p.label}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}
