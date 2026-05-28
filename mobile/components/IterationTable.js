import * as Clipboard from 'expo-clipboard';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { COLS, LABELS, fmtCell } from '../lib/iterationCols';
import { useTheme } from '../context/ThemeContext';

export function IterationTable({ method, rows }) {
  const { colors } = useTheme();
  if (!rows?.length || !method) return null;
  const cols = COLS[method] || Object.keys(rows[0] || {});

  async function copyCsv() {
    const header = cols.map((c) => LABELS[c] || c).join(',');
    const body = rows.map((r) => cols.map((c) => fmtCell(r[c])).join(',')).join('\n');
    await Clipboard.setStringAsync(`${header}\n${body}`);
  }

  return (
    <View style={{ marginTop: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '700' }}>Tabla de iteraciones</Text>
        <TouchableOpacity onPress={copyCsv} style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: colors.primaryDim }}>
          <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '600' }}>Copiar CSV</Text>
        </TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator>
        <View>
          <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderColor: colors.border }}>
            {cols.map((c) => (
              <Text key={c} style={{ width: 72, padding: 6, color: colors.primarySoft, fontSize: 10, fontWeight: '700' }}>
                {LABELS[c] || c}
              </Text>
            ))}
          </View>
          {rows.map((row, i) => (
            <View key={i} style={{ flexDirection: 'row', backgroundColor: i % 2 ? colors.primaryDim : 'transparent' }}>
              {cols.map((c) => (
                <Text key={c} style={{ width: 72, padding: 6, color: colors.text, fontSize: 10, fontFamily: 'monospace' }}>
                  {fmtCell(row[c])}
                </Text>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
