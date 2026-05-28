export function lastFiniteErrorFromIterations(rows) {
  if (!rows?.length) return null;
  for (let i = rows.length - 1; i >= 0; i--) {
    const e = rows[i]?.error;
    if (typeof e === 'number' && Number.isFinite(e)) return e;
  }
  return null;
}

export function summarizeCompareRow(row) {
  if (!row?.ok || !row.data) {
    return {
      id: row?.id,
      label: row?.label,
      ok: false,
      note: row?.error ? String(row.error).slice(0, 120) : '—',
    };
  }
  const d = row.data;
  const iters = d.iterations_count ?? d.iterations?.length ?? 0;
  const ec = d.eval_counts || {};
  return {
    id: row.id,
    label: row.label,
    ok: true,
    status: d.status,
    root: typeof d.root === 'number' && Number.isFinite(d.root) ? d.root : null,
    iters,
    cost: { f: ec.f || 0, df: ec.df || 0, g: ec.g || 0 },
    lastErr: lastFiniteErrorFromIterations(d.iterations),
    residual: d.residual_abs,
    stopReasonLabel: d.stop_reason_label,
    note: [d.status === 'ok' ? 'ok' : d.status, d.stop_reason_label].filter(Boolean).join(' · '),
  };
}

export function compareScore(summ) {
  if (!summ.ok || summ.status !== 'ok') return Infinity;
  const err = summ.lastErr > 0 ? Math.log10(summ.lastErr + 1e-16) : -16;
  const res = summ.residual > 0 ? Math.log10(summ.residual + 1e-16) : -16;
  return summ.iters + 0.001 * (summ.cost.f + 2 * summ.cost.df + summ.cost.g) + 0.02 * (err + 16) + 0.12 * (res + 16);
}

export function interpNodeHints(xs) {
  if (!xs?.length || xs.length < 2) return [];
  const hints = [];
  const sorted = [...xs].filter((x) => Number.isFinite(x)).sort((a, b) => a - b);
  if (sorted.length !== xs.length) return hints;
  const span = sorted[sorted.length - 1] - sorted[0] || 1;
  const gaps = [];
  for (let i = 1; i < sorted.length; i++) gaps.push(sorted[i] - sorted[i - 1]);
  const minG = Math.min(...gaps);
  const maxG = Math.max(...gaps);
  if (minG / span < 0.02) hints.push('Nodos x muy próximos: mal condicionamiento posible.');
  if (maxG / minG > 12 && sorted.length >= 4) hints.push('Espaciado x muy desigual.');
  if (sorted.length >= 10) hints.push('Muchos nodos: vigila Runge con nodos uniformes.');
  return hints;
}

export function rootAgreementStats(rows) {
  const roots = (rows || [])
    .filter((r) => r.ok && r.data?.status === 'ok' && Number.isFinite(r.data.root))
    .map((r) => r.data.root);
  if (!roots.length) return { count: 0, spread: null, agree: null };
  const sorted = [...roots].sort((a, b) => a - b);
  const spread = sorted[sorted.length - 1] - sorted[0];
  const median = sorted[Math.floor(sorted.length / 2)];
  const tol = 1e-6 * (1 + Math.abs(median));
  return { count: roots.length, spread, agree: spread <= 8 * tol };
}
