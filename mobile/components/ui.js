import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export function Field({ label, value, onChange, keyboardType, multiline, placeholder }) {
  const { colors } = useTheme();
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 4, fontWeight: '600' }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        style={{
          borderRadius: 14,
          borderWidth: 1,
          borderColor: colors.border,
          paddingHorizontal: 12,
          paddingVertical: 10,
          color: colors.text,
          backgroundColor: colors.light ? '#fff' : 'rgba(15,23,42,0.75)',
          fontSize: 15,
          minHeight: multiline ? 72 : undefined,
          textAlignVertical: multiline ? 'top' : 'center',
        }}
        keyboardType={keyboardType || 'default'}
        autoCapitalize="none"
        autoCorrect={false}
        multiline={multiline}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
      />
    </View>
  );
}

export function Card({ title, subtitle, children }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        marginTop: 10,
        padding: 14,
        borderRadius: 18,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      {title ? <Text style={{ color: colors.text, fontSize: 17, fontWeight: '700', marginBottom: subtitle ? 4 : 10 }}>{title}</Text> : null}
      {subtitle ? <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 10 }}>{subtitle}</Text> : null}
      {children}
    </View>
  );
}

export function PrimaryButton({ label, onPress, disabled }) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      style={{ marginTop: 8, backgroundColor: colors.primary, paddingVertical: 12, borderRadius: 14, alignItems: 'center', opacity: disabled ? 0.5 : 1 }}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={{ color: '#0f172a', fontWeight: '700', fontSize: 14 }}>{label}</Text>
    </TouchableOpacity>
  );
}

export function SecondaryButton({ label, onPress, disabled }) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      style={{ marginTop: 8, borderWidth: 1, borderColor: colors.border, paddingVertical: 11, borderRadius: 14, alignItems: 'center', opacity: disabled ? 0.5 : 1 }}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={{ color: colors.text, fontWeight: '700', fontSize: 13 }}>{label}</Text>
    </TouchableOpacity>
  );
}

export function MethodChips({ methods, active, onSelect }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
      {methods.map((m) => {
        const on = active === m.id;
        return (
          <TouchableOpacity
            key={m.id}
            onPress={() => onSelect(m.id)}
            style={{
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: on ? colors.primary : colors.primaryDim,
            }}
          >
            <Text style={{ color: on ? '#0f172a' : colors.text, fontSize: 12, fontWeight: '600' }}>{m.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export function ErrorText({ message }) {
  const { colors } = useTheme();
  if (!message) return null;
  return <Text style={{ color: '#fecaca', marginTop: 8, fontSize: 13, lineHeight: 18 }}>{message}</Text>;
}

export function OkText({ message }) {
  const { colors } = useTheme();
  if (!message) return null;
  return <Text style={{ color: colors.primarySoft, marginTop: 8, fontSize: 13, lineHeight: 18 }}>{message}</Text>;
}

export function WarnText({ message }) {
  if (!message) return null;
  return <Text style={{ color: '#fde68a', marginTop: 8, fontSize: 13, lineHeight: 18 }}>{message}</Text>;
}
