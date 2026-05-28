import { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { XYLineChart } from '../components/charts';
import { PresetChips } from '../components/PresetChips';
import { Card, ErrorText, Field, OkText, PrimaryButton, SecondaryButton, WarnText } from '../components/ui';
import { useTheme } from '../context/ThemeContext';
import { apiGet, apiPost } from '../lib/api';
import { INTERP_PRESETS } from '../lib/presets';
import { interpNodeHints } from '../lib/rootsMeta';
import { formatValidationError, validateInterpNodes } from '../lib/validation';
import { fmtCell } from '../lib/iterationCols';
import { pushInterpHistory, readInterpSession, writeInterpSession } from '../lib/sessionHistory';

export function InterpScreen({ apiBase, busy, setBusy, err, setErr, okHint, setOkHint }) {
  const { colors } = useTheme();
  const [nodesX, setNodesX] = useState('-1,0,1,2');
  const [nodesY, setNodesY] = useState('2,1,2,5');
  const [xStar, setXStar] = useState('0.5');
  const [xExtra, setXExtra] = useState('');
  const [yRef, setYRef] = useState('');
  const [lag, setLag] = useState(null);
  const [nev, setNev] = useState(null);
  const [runge, setRunge] = useState(null);
  const [lagSample, setLagSample] = useState(null);
  const [extraProbe, setExtraProbe] = useState(null);

  const nodeCheck = useMemo(() => validateInterpNodes(nodesX, nodesY), [nodesX, nodesY]);
  const hints = useMemo(() => (nodeCheck.ok ? interpNodeHints(nodeCheck.xs) : []), [nodeCheck]);

  useEffect(() => {
    readInterpSession().then((s) => {
      if (!s) return;
      if (s.nodesX) setNodesX(s.nodesX);
      if (s.nodesY) setNodesY(s.nodesY);
      if (s.xStar != null) setXStar(String(s.xStar));
    });
  }, []);

  const refreshLagSample = async () => {
    if (!nodeCheck.ok) return;
    try {
      setLagSample(
        await apiPost(apiBase, '/api/interpolation/lagrange_sample', {
          x_nodes: nodeCheck.xs,
          y_nodes: nodeCheck.ys,
          pad_fraction: 0.15,
          n: 200,
        }),
      );
    } catch {
      setLagSample(null);
    }
  };

  const runAll = async () => {
    setErr('');
    if (!nodeCheck.ok) {
      setErr(formatValidationError(nodeCheck));
      return;
    }
    const xv = Number(xStar);
    if (!Number.isFinite(xv)) {
      setErr('x a interpolar: número válido.');
      return;
    }
    setBusy(true);
    const payload = { x_nodes: nodeCheck.xs, y_nodes: nodeCheck.ys, x: xv };
    try {
      const [l, n, r] = await Promise.all([
        apiPost(apiBase, '/api/interpolation/lagrange', payload),
        apiPost(apiBase, '/api/interpolation/neville', payload),
        apiGet(apiBase, '/api/interpolation/weierstrass_runge?n=9'),
      ]);
      setLag(l);
      setNev(n);
      setRunge(r);
      await refreshLagSample();
      await writeInterpSession({ nodesX, nodesY, xStar });
      await pushInterpHistory({ nodesX, nodesY, xStar });
      setOkHint('Lagrange, Neville y Runge listos.');
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const runExtraProbe = async () => {
    if (!nodeCheck.ok) {
      setExtraProbe({ error: formatValidationError(nodeCheck) });
      return;
    }
    const xe = Number(xExtra);
    const yr = Number(yRef);
    if (!Number.isFinite(xe) || !Number.isFinite(yr)) {
      setExtraProbe({ error: 'x extra y y ref deben ser números.' });
      return;
    }
    setBusy(true);
    try {
      const data = await apiPost(apiBase, '/api/interpolation/lagrange', {
        x_nodes: nodeCheck.xs,
        y_nodes: nodeCheck.ys,
        x: xe,
      });
      setExtraProbe({ xe, yr, Px: data.P_x, err: Math.abs(data.P_x - yr) });
    } catch (e) {
      setExtraProbe({ error: e.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card title="Interpolación" subtitle="Lagrange · Neville · Runge">
      <PresetChips presets={INTERP_PRESETS} onSelect={(p) => { setNodesX(p.nodesX); setNodesY(p.nodesY); setXStar(p.xStar); }} />
      <Field label="Nodos x" value={nodesX} onChange={setNodesX} />
      <Field label="Nodos y" value={nodesY} onChange={setNodesY} />
      <Field label="x a interpolar" value={xStar} onChange={setXStar} keyboardType="decimal-pad" />
      {!nodeCheck.ok ? <WarnText message={formatValidationError(nodeCheck)} /> : null}
      {hints.map((h, i) => (
        <Text key={i} style={{ color: colors.muted, fontSize: 11, marginTop: 4 }}>⚠ {h}</Text>
      ))}

      <PrimaryButton label={busy ? '…' : 'Calcular todo'} onPress={runAll} disabled={busy} />
      <SecondaryButton label="Actualizar curva Lagrange" onPress={refreshLagSample} disabled={busy || !nodeCheck.ok} />

      <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '600', marginTop: 14 }}>Sonda punto extra</Text>
      <Field label="x extra" value={xExtra} onChange={setXExtra} keyboardType="decimal-pad" />
      <Field label="y referencia" value={yRef} onChange={setYRef} keyboardType="decimal-pad" />
      <SecondaryButton label="Medir error |P(x)−y|" onPress={runExtraProbe} disabled={busy} />
      {extraProbe?.error ? <WarnText message={extraProbe.error} /> : null}
      {extraProbe?.Px != null ? (
        <Text style={{ color: colors.primarySoft, fontSize: 12, marginTop: 6 }}>
          P({extraProbe.xe})={extraProbe.Px} · |error|={extraProbe.err}
        </Text>
      ) : null}

      <ErrorText message={err} />
      <OkText message={okHint} />

      {lagSample?.x?.length ? <XYLineChart title="Curva interpolante" xs={lagSample.x} ys={lagSample.y} /> : null}

      {lag ? (
        <View style={{ marginTop: 12 }}>
          <Text style={{ color: colors.text, fontWeight: '700' }}>Lagrange P(x*)={lag.P_x}</Text>
          <ScrollView horizontal style={{ marginTop: 6 }}>
            {(lag.lagrange_terms || []).map((t) => (
              <Text key={t.i} style={{ width: 100, fontSize: 10, color: colors.muted, fontFamily: 'monospace' }}>
                L{t.i}={fmtCell(t.L_i_en_x)} → {fmtCell(t.termino)}
              </Text>
            ))}
          </ScrollView>
        </View>
      ) : null}

      {nev?.table?.length ? (
        <View style={{ marginTop: 12 }}>
          <Text style={{ color: colors.text, fontWeight: '700' }}>Neville P(x*)={nev.P_x}</Text>
          <Text style={{ color: colors.muted, fontSize: 11, marginTop: 4 }}>Tabla {nev.table.length}×{nev.table[0]?.length}</Text>
          {nev.table.map((row, i) => (
            <Text key={i} style={{ fontSize: 9, color: colors.muted, fontFamily: 'monospace' }} numberOfLines={1}>
              {row.map((v) => fmtCell(v)).join(' | ')}
            </Text>
          ))}
        </View>
      ) : null}

      {runge?.x?.length ? (
        <View style={{ marginTop: 12 }}>
          <Text style={{ color: colors.text, fontWeight: '700' }}>Demo Runge (n={runge.n_nodes})</Text>
          <XYLineChart title="f(x) verdadera" xs={runge.x} ys={runge.y_true} color="#94a3b8" />
          {runge.uniform_nodes?.poly_y ? (
            <XYLineChart title="Interp. uniforme" xs={runge.x} ys={runge.uniform_nodes.poly_y} color="#f87171" />
          ) : null}
          {runge.chebyshev_nodes?.poly_y ? (
            <XYLineChart title="Interp. Chebyshev" xs={runge.x} ys={runge.chebyshev_nodes.poly_y} color={colors.primary} />
          ) : null}
        </View>
      ) : null}
    </Card>
  );
}
