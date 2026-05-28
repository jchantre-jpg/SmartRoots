import { useCallback, useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { XYLineChart } from '../components/charts';
import { IterationTable } from '../components/IterationTable';
import { PresetChips } from '../components/PresetChips';
import { Card, ErrorText, Field, OkText, PrimaryButton, SecondaryButton, WarnText } from '../components/ui';
import { useTheme } from '../context/ThemeContext';
import { apiPost } from '../lib/api';
import { POLY_PRESETS } from '../lib/presets';
import { formatValidationError, parseCoefficientsInput } from '../lib/validation';
import { pushPolyHistory, readPolyHistory, readPolySession, writePolySession } from '../lib/sessionHistory';
import { fmtCell } from '../lib/iterationCols';

export function PolyScreen({ apiBase, busy, setBusy, err, setErr, okHint, setOkHint }) {
  const { colors } = useTheme();
  const [coeffs, setCoeffs] = useState('1,0,-5,0,4');
  const [xEval, setXEval] = useState('1.2');
  const [polyXmin, setPolyXmin] = useState('-5');
  const [polyXmax, setPolyXmax] = useState('5');
  const [horner, setHorner] = useState(null);
  const [deflate, setDeflate] = useState(null);
  const [polyCurve, setPolyCurve] = useState(null);

  const coeffParse = useMemo(() => parseCoefficientsInput(coeffs), [coeffs]);

  useEffect(() => {
    readPolySession().then((s) => {
      if (!s) return;
      if (s.coeffs) setCoeffs(s.coeffs);
      if (s.xEval != null) setXEval(String(s.xEval));
      if (s.polyXmin != null) setPolyXmin(String(s.polyXmin));
      if (s.polyXmax != null) setPolyXmax(String(s.polyXmax));
    });
  }, []);

  const refreshCurve = useCallback(async () => {
    if (!coeffParse.ok) return;
    const lo = Number(polyXmin);
    const hi = Number(polyXmax);
    if (!Number.isFinite(lo) || !Number.isFinite(hi) || lo >= hi) return;
    try {
      setPolyCurve(await apiPost(apiBase, '/api/polynomial/sample_curve', {
        coefficients: coeffParse.values,
        xmin: lo,
        xmax: hi,
        n: 300,
      }));
    } catch {
      setPolyCurve(null);
    }
  }, [apiBase, coeffParse, polyXmin, polyXmax]);

  const persist = async () => {
    await writePolySession({ coeffs, xEval, polyXmin, polyXmax });
    await pushPolyHistory({ coeffs, xEval });
  };

  const runHorner = async () => {
    setErr('');
    if (!coeffParse.ok) {
      setErr(formatValidationError(coeffParse));
      return;
    }
    const xv = Number(xEval);
    if (!Number.isFinite(xv)) {
      setErr('x debe ser número.');
      return;
    }
    setBusy(true);
    try {
      setHorner(await apiPost(apiBase, '/api/polynomial/horner', { coefficients: coeffParse.values, x: xv }));
      await refreshCurve();
      setOkHint('Horner y división sintética listos.');
      await persist();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const runDeflate = async () => {
    setErr('');
    if (!coeffParse.ok) {
      setErr(formatValidationError(coeffParse));
      return;
    }
    setBusy(true);
    try {
      setDeflate(await apiPost(apiBase, '/api/polynomial/deflate_all', { coefficients: coeffParse.values }));
      await refreshCurve();
      setOkHint('Deflación completada.');
      await persist();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const runAll = async () => {
    await runHorner();
    if (!coeffParse.ok) return;
    setBusy(true);
    try {
      setDeflate(await apiPost(apiBase, '/api/polynomial/deflate_all', { coefficients: coeffParse.values }));
      setOkHint('Horner + deflación + curva listos.');
      await persist();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card title="Polinomios — Horner y deflación" subtitle="Coeficientes de mayor a menor grado">
      <PresetChips presets={POLY_PRESETS} onSelect={(p) => { setCoeffs(p.coeffs); setXEval(p.xEval); setPolyXmin(p.polyXmin); setPolyXmax(p.polyXmax); }} />
      <Field label="Coeficientes" value={coeffs} onChange={setCoeffs} />
      {!coeffParse.ok ? <WarnText message={formatValidationError(coeffParse)} /> : null}
      <Field label="x (Horner)" value={xEval} onChange={setXEval} keyboardType="decimal-pad" />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Field label="x mín curva" value={polyXmin} onChange={setPolyXmin} keyboardType="decimal-pad" />
        </View>
        <View style={{ flex: 1 }}>
          <Field label="x máx" value={polyXmax} onChange={setPolyXmax} keyboardType="decimal-pad" />
        </View>
      </View>

      <PrimaryButton label={busy ? '…' : 'Calcular todo'} onPress={runAll} disabled={busy} />
      <SecondaryButton label="Solo Horner" onPress={runHorner} disabled={busy} />
      <SecondaryButton label="Solo deflación" onPress={runDeflate} disabled={busy} />
      <SecondaryButton label="Actualizar curva P(x)" onPress={refreshCurve} disabled={busy} />

      <ErrorText message={err} />
      <OkText message={okHint} />

      {polyCurve?.x?.length ? <XYLineChart title="P(x)" xs={polyCurve.x} ys={polyCurve.y} color={colors.primary} /> : null}

      {horner ? (
        <View style={{ marginTop: 12 }}>
          <Text style={{ color: colors.text, fontWeight: '700' }}>P({horner.x}) = {horner.P_x}</Text>
          <Text style={{ color: colors.muted, fontSize: 12 }}>Resto: {horner.remainder}</Text>
          {(horner.horner_steps || []).slice(-3).map((s, i) => (
            <Text key={i} style={{ color: colors.muted, fontSize: 10, fontFamily: 'monospace' }}>
              paso {s.paso ?? i}: acum={fmtCell(s.acumulado_despues)}
            </Text>
          ))}
          {(horner.synthetic_division_steps || []).length ? (
            <Text style={{ color: colors.muted, fontSize: 11, marginTop: 6 }}>
              División sintética: {horner.synthetic_division_steps.length} filas
            </Text>
          ) : null}
        </View>
      ) : null}

      {deflate?.roots?.length ? (
        <View style={{ marginTop: 12 }}>
          <Text style={{ color: colors.text, fontWeight: '700' }}>Raíces: {deflate.roots.join(', ')}</Text>
          {(deflate.deflation_log || []).map((entry, i) => (
            <View key={i} style={{ marginTop: 8 }}>
              <Text style={{ color: colors.primarySoft, fontSize: 12 }}>Etapa {entry.deflation_step}: r≈{entry.root_found}</Text>
              {entry.newton_trace?.length ? (
                <IterationTable method="newton_raphson" rows={entry.newton_trace} />
              ) : null}
            </View>
          ))}
        </View>
      ) : null}
    </Card>
  );
}
