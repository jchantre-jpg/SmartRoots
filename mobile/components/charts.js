import { Dimensions, Text, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { useTheme } from '../context/ThemeContext';

const W = Dimensions.get('window').width - 40;

function buildPoints(xs, ys, maxPoints = 80) {
  if (!xs?.length || !ys?.length) return [];
  const n = Math.min(xs.length, ys.length);
  const step = Math.max(1, Math.floor(n / maxPoints));
  const out = [];
  for (let i = 0; i < n; i += step) {
    const y = ys[i];
    if (y == null || !Number.isFinite(y)) continue;
    out.push({ value: y, label: i % (step * 3) === 0 ? String(Number(xs[i]).toPrecision(3)) : '' });
  }
  return out;
}

export function XYLineChart({ title, xs, ys, height = 200, color }) {
  const { colors } = useTheme();
  const data = buildPoints(xs, ys);
  if (!data.length) return null;
  return (
    <View style={{ marginTop: 12 }}>
      {title ? <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '600', marginBottom: 6 }}>{title}</Text> : null}
      <LineChart
        data={data}
        width={W}
        height={height}
        color={color || colors.chartLine}
        thickness={2}
        hideDataPoints={data.length > 40}
        dataPointsColor={color || colors.chartLine}
        yAxisColor={colors.border}
        xAxisColor={colors.border}
        yAxisTextStyle={{ color: colors.muted, fontSize: 9 }}
        xAxisLabelTextStyle={{ color: colors.muted, fontSize: 8 }}
        rulesColor={colors.chartGrid}
        spacing={Math.max(4, W / data.length)}
        initialSpacing={8}
        endSpacing={8}
        curved
      />
    </View>
  );
}

export function ConvergenceCharts({ rows, method }) {
  const { colors } = useTheme();
  if (!rows?.length) return null;
  const errData = rows.map((r, i) => ({
    value: typeof r.error === 'number' && r.error > 0 ? Math.max(r.error, 1e-16) : 1e-16,
    label: String(r.k ?? i),
  }));
  const approx = rows.map((r, i) => {
    const v = r.aproximacion ?? r.c ?? r.x_next ?? r.g_x ?? r.x;
    return { value: Number.isFinite(v) ? v : 0, label: String(r.k ?? i) };
  });
  return (
    <View>
      <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '600', marginTop: 8 }}>Error vs k (log)</Text>
      <LineChart
        data={errData}
        width={W}
        height={160}
        color={colors.primary}
        yAxisTextStyle={{ color: colors.muted, fontSize: 8 }}
        xAxisLabelTextStyle={{ color: colors.muted, fontSize: 8 }}
        rulesColor={colors.chartGrid}
        spacing={Math.max(6, W / errData.length)}
        curved
      />
      <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '600', marginTop: 12 }}>Aproximación vs k</Text>
      <LineChart
        data={approx}
        width={W}
        height={160}
        color={colors.primarySoft}
        yAxisTextStyle={{ color: colors.muted, fontSize: 8 }}
        rulesColor={colors.chartGrid}
        spacing={Math.max(6, W / approx.length)}
        curved
      />
    </View>
  );
}

export function MultiSeriesChart({ title, series, height = 220 }) {
  const { colors } = useTheme();
  if (!series?.length) return null;
  const primary = series[0];
  const data = buildPoints(primary.x, primary.y);
  if (!data.length) return null;
  return (
    <View style={{ marginTop: 12 }}>
      <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '600', marginBottom: 6 }}>{title}</Text>
      <LineChart
        data={data}
        width={W}
        height={height}
        color={series[0].color || colors.chartLine}
        thickness={2}
        hideDataPoints
        yAxisTextStyle={{ color: colors.muted, fontSize: 9 }}
        rulesColor={colors.chartGrid}
        curved
      />
      {series.slice(1).map((s) => (
        <Text key={s.label} style={{ color: colors.muted, fontSize: 11, marginTop: 4 }}>
          ● {s.label} (ver curva en web para superposición completa)
        </Text>
      ))}
    </View>
  );
}
