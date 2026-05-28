import { apiPost } from './api';
import { buildSolvePayload, parseTolMax } from './rootsPayload';

export async function postSolve(apiBase, mId, expression, fields) {
  const ex = (expression || '').trim();
  if (!ex) return { ok: false, error: 'Escribe primero f(x).' };
  const num = parseTolMax(fields);
  if (!num.ok) return { ok: false, error: num.error };
  const built = buildSolvePayload(mId, ex, fields, num);
  if (!built.ok) return { ok: false, error: built.error };
  try {
    const data = await apiPost(apiBase, '/api/solve', built.body);
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}
