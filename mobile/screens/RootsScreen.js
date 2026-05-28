import { useCallback, useEffect, useMemo, useState } from 'react';
import { Switch, Text, View } from 'react-native';
import { ConvergenceCharts, XYLineChart } from '../components/charts';
import { IterationTable } from '../components/IterationTable';
import { PresetChips } from '../components/PresetChips';
import { Card, ErrorText, Field, MethodChips, OkText, PrimaryButton, SecondaryButton } from '../components/ui';
import { useTheme } from '../context/ThemeContext';
import { apiPost } from '../lib/api';
import { METHOD_BUTTONS, ROOT_PRESETS } from '../lib/presets';
import { buildSolvePayload, parseOptNum, parseTolMax } from '../lib/rootsPayload';
import { compareScore, rootAgreementStats, summarizeCompareRow } from '../lib/rootsMeta';
import { postSolve } from '../lib/rootsSolve';
import { pushRootsHistory, readRootsHistory, readRootsSession, writeRootsSession } from '../lib/sessionHistory';

export function RootsScreen({ apiBase, busy, setBusy, err, setErr, okHint, setOkHint }) {
  const { colors } = useTheme();
  const [expr, setExpr] = useState('x**2 - 2');
  const [a, setA] = useState('1');
  const [b, setB] = useState('2');
  const [x0, setX0] = useState('1');
  const [x1, setX1] = useState('1.5');
  const [xmin, setXmin] = useState('-4');
  const [xmax, setXmax] = useState('4');
  const [gExpr, setGExpr] = useState('0.5*(x + 2/x)');
  const [highlightContractive, setHighlightContractive] = useState(false);
  const [tolStr, setTolStr] = useState('1e-10');
  const [maxIterStr, setMaxIterStr] = useState('80');
  const [method, setMethod] = useState('bisection');
  const [rec, setRec] = useState(null);
  const [solve, setSolve] = useState(null);
  const [curve, setCurve] = useState(null);
  const [signCheck, setSignCheck] = useState(null);
  const [compareRows, setCompareRows] = useState(null);
  const [compareBusy, setCompareBusy] = useState(false);
  const [history, setHistory] = useState([]);

  const fields = { a, b, x0, x1, gExpr, tolStr, maxIterStr };

  useEffect(() => {
    readRootsSession().then((s) => {
      if (!s) return;
      if (s.expr != null) setExpr(String(s.expr));
      if (s.a != null) setA(String(s.a));
      if (s.b != null) setB(String(s.b));
      if (s.x0 != null) setX0(String(s.x0));
      if (s.x1 != null) setX1(String(s.x1));
      if (s.xmin != null) setXmin(String(s.xmin));
      if (s.xmax != null) setXmax(String(s.xmax));
      if (s.gExpr != null) setGExpr(String(s.gExpr));
      if (s.tolStr != null) setTolStr(String(s.tolStr));
      if (s.maxIterStr != null) setMaxIterStr(String(s.maxIterStr));
      if (s.highlightContractive != null) setHighlightContractive(Boolean(s.highlightContractive));
    });
    readRootsHistory().then(setHistory);
  }, []);

  const persist = useCallback(async () => {
    const payload = { expr, a, b, x0, x1, xmin, xmax, gExpr, highlightContractive, tolStr, maxIterStr };
    await writeRootsSession(payload);
    await pushRootsHistory(payload);
    setHistory(await readRootsHistory());
  }, [expr, a, b, x0, x1, xmin, xmax, gExpr, highlightContractive, tolStr, maxIterStr]);

  const applyPreset = (p) => {
    setExpr(p.expr);
    setA(p.a);
    setB(p.b);
    setX0(p.x0);
    setX1(p.x1);
    setXmin(p.xmin);
    setXmax(p.xmax);
    setGExpr(p.gExpr);
    setHighlightContractive(Boolean(p.highlightContractive));
    setErr('');
    setOkHint('Ejemplo cargado. Pulsa «Analizar y graficar».');
  };

  const analyze = useCallback(async () => {
    setErr('');
    setOkHint('');
    const ex = expr.trim();
    if (!ex) {
      setErr('Escribe f(x).');
      return;
    }
    const lo = parseOptNum(xmin);
    const hi = parseOptNum(xmax);
    if (Number.isNaN(lo) || Number.isNaN(hi) || lo >= hi) {
      setErr('x mín y x máx deben ser números con mín < máx.');
      return;
    }
    const num = parseTolMax(fields);
    if (!num.ok) {
      setErr(num.error);
      return;
    }
    setBusy(true);
    setRec(null);
    setSolve(null);
    setCurve(null);
    setCompareRows(null);
    let data;
    try {
      data = await apiPost(apiBase, '/api/recommend', {
        expression: ex,
        a: a === '' ? null : Number(a),
        b: b === '' ? null : Number(b),
        x0: x0 === '' ? null : Number(x0),
        x1: x1 === '' ? null : Number(x1),
        g_expression: gExpr.trim() || null,
        highlight_contractive: highlightContractive,
      });
      setRec(data);
      const m = data.recommended?.method || 'bisection';
      setMethod(m);
      try {
        const na = Number(a);
        const nb = Number(b);
        if (Number.isFinite(na) && Number.isFinite(nb)) {
          setSignCheck(await apiPost(apiBase, '/api/interval_sign', { expression: ex, a: na, b: nb }));
        }
      } catch {
        setSignCheck(null);
      }
    } catch (e) {
      setErr(e.message);
      setBusy(false);
      return;
    }
    try {
      setCurve(await apiPost(apiBase, '/api/sample_curve', { expression: ex, xmin: lo, xmax: hi, n: 200 }));
    } catch (e) {
      setErr(`Recomendación lista; gráfico falló: ${e.message}`);
    }
    const r = await postSolve(apiBase, data?.recommended?.method || 'bisection', ex, fields);
    if (r.ok) {
      setSolve(r.data);
      setOkHint('Análisis, curva y método recomendado listos.');
      await persist();
    } else {
      setOkHint(`Recomendación lista. Solve: ${r.error}`);
    }
    setBusy(false);
  }, [apiBase, expr, xmin, xmax, a, b, x0, x1, gExpr, highlightContractive, fields, persist, setBusy, setErr, setOkHint]);

  const runMethod = async (mId) => {
    setMethod(mId);
    setErr('');
    setBusy(true);
    const r = await postSolve(apiBase, mId, expr.trim(), fields);
    if (r.ok) {
      setSolve(r.data);
      setOkHint(`${r.data.method_label || mId} listo.`);
      await persist();
    } else setErr(r.error);
    setBusy(false);
  };

  const compareAll = async () => {
    setErr('');
    setCompareBusy(true);
    setCompareRows(null);
    try {
      const results = await Promise.all(
        METHOD_BUTTONS.map(async (m) => {
          const r = await postSolve(apiBase, m.id, expr.trim(), fields);
          return { id: m.id, label: m.short, ...r };
        }),
      );
      setCompareRows(results);
      setOkHint('Comparación de métodos lista.');
      await persist();
    } catch (e) {
      setErr(e.message);
    } finally {
      setCompareBusy(false);
    }
  };

  const compareDisplay = useMemo(() => {
    if (!compareRows?.length) return [];
    return [...compareRows]
      .map((r) => ({ r, s: summarizeCompareRow(r) }))
      .sort((A, B) => compareScore(A.s) - compareScore(B.s));
  }, [compareRows]);

  const agreement = useMemo(() => rootAgreementStats(compareRows), [compareRows]);

  return (
    <Card title="Raíces — f(x) = 0">
      <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 6 }}>SymPy: x**2-2, sin(x)-x/2, exp(x)-3*x</Text>
      <PresetChips presets={ROOT_PRESETS} onSelect={applyPreset} />
      <Field label="f(x)" value={expr} onChange={setExpr} multiline />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Field label="a" value={a} onChange={setA} keyboardType="decimal-pad" />
        </View>
        <View style={{ flex: 1 }}>
          <Field label="b" value={b} onChange={setB} keyboardType="decimal-pad" />
        </View>
      </View>
      <Field label="x₀" value={x0} onChange={setX0} keyboardType="decimal-pad" />
      <Field label="x₁" value={x1} onChange={setX1} keyboardType="decimal-pad" />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Field label="x mín (gráfica)" value={xmin} onChange={setXmin} keyboardType="decimal-pad" />
        </View>
        <View style={{ flex: 1 }}>
          <Field label="x máx" value={xmax} onChange={setXmax} keyboardType="decimal-pad" />
        </View>
      </View>
      <Field label="g(x) punto fijo" value={gExpr} onChange={setGExpr} multiline />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 6 }}>
        <Switch value={highlightContractive} onValueChange={setHighlightContractive} />
        <Text style={{ color: colors.muted, fontSize: 13 }}>Resaltar región contractiva (g′)</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Field label="Tolerancia" value={tolStr} onChange={setTolStr} />
        </View>
        <View style={{ flex: 1 }}>
          <Field label="Máx. iter." value={maxIterStr} onChange={setMaxIterStr} keyboardType="number-pad" />
        </View>
      </View>

      <PrimaryButton label={busy ? 'Calculando…' : 'Analizar y graficar'} onPress={analyze} disabled={busy} />
      <SecondaryButton label={compareBusy ? 'Comparando…' : 'Comparar todos los métodos'} onPress={compareAll} disabled={busy || compareBusy} />

      <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '600', marginTop: 12 }}>Ejecutar método</Text>
      <MethodChips methods={METHOD_BUTTONS.map((m) => ({ id: m.id, label: m.short }))} active={method} onSelect={runMethod} />

      <ErrorText message={err} />
      <OkText message={okHint} />

      {rec?.recommended ? (
        <Text style={{ color: colors.primarySoft, fontSize: 13, marginTop: 8 }}>
          Recomendado: {rec.recommended.label || rec.recommended.method} (score {rec.recommended.score})
          {rec.bracket ? ` · bracket [${rec.bracket.a?.toFixed?.(4)}, ${rec.bracket.b?.toFixed?.(4)}]` : ''}
        </Text>
      ) : null}

      {signCheck ? (
        <Text style={{ color: colors.muted, fontSize: 12, marginTop: 6 }}>
          f(a)={signCheck.f_a?.toPrecision?.(4)} f(b)={signCheck.f_b?.toPrecision?.(4)} · signos opuestos:{' '}
          {signCheck.opposite_signs ? 'sí' : 'no'}
        </Text>
      ) : null}

      {curve?.x?.length ? <XYLineChart title="f(x)" xs={curve.x} ys={curve.y} /> : null}

      {solve ? (
        <>
          <Text style={{ color: colors.text, fontSize: 14, fontWeight: '700', marginTop: 12 }}>
            {solve.method_label} · raíz ≈ {solve.root} · {solve.status}
          </Text>
          <Text style={{ color: colors.muted, fontSize: 12 }}>
            {solve.stop_reason_label} · |residual|={solve.residual_abs}
          </Text>
          <IterationTable method={solve.method} rows={solve.iterations} />
          <ConvergenceCharts rows={solve.iterations} method={solve.method} />
        </>
      ) : null}

      {compareDisplay.length ? (
        <View style={{ marginTop: 14 }}>
          <Text style={{ color: colors.text, fontSize: 15, fontWeight: '700' }}>Comparación</Text>
          {agreement.count > 0 ? (
            <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>
              {agreement.count} métodos ok · spread={agreement.spread?.toExponential?.(2)} ·{' '}
              {agreement.agree ? 'raíces coherentes' : 'raíces dispersas'}
            </Text>
          ) : null}
          {compareDisplay.map(({ r, s }) => (
            <Text key={r.id} style={{ color: colors.muted, fontSize: 11, marginTop: 4, fontFamily: 'monospace' }}>
              {s.label}: {s.ok ? `r≈${s.root} · ${s.iters} it · #f=${s.cost?.f}` : s.note}
            </Text>
          ))}
        </View>
      ) : null}

      {history.length ? (
        <View style={{ marginTop: 12 }}>
          <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '700' }}>Historial</Text>
          {history.slice(0, 5).map((h, i) => (
            <Text key={i} style={{ color: colors.muted, fontSize: 11, marginTop: 4 }} numberOfLines={1}>
              {h.expr}
            </Text>
          ))}
        </View>
      ) : null}
    </Card>
  );
}
