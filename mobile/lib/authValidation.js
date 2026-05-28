const PASSWORD_MIN_LEN = 8;
const USERNAME_RE = /^[a-zA-Z0-9_]{3,32}$/;
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const HAS_SPECIAL = /[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/;

export function passwordRuleChecks(password) {
  const p = password || '';
  return [
    { id: 'len', label: `Al menos ${PASSWORD_MIN_LEN} caracteres`, ok: p.length >= PASSWORD_MIN_LEN },
    { id: 'upper', label: 'Mayúscula (A–Z)', ok: /[A-Z]/.test(p) },
    { id: 'lower', label: 'Minúscula (a–z)', ok: /[a-z]/.test(p) },
    { id: 'digit', label: 'Un número', ok: /\d/.test(p) },
    { id: 'special', label: 'Carácter especial', ok: HAS_SPECIAL.test(p) },
  ];
}

export function validateRegisterForm({ fullName, email, username, password, passwordConfirm }) {
  const errors = {};
  const name = (fullName || '').trim().replace(/\s+/g, ' ');
  if (name.length < 3) errors.fullName = 'Nombre: mínimo 3 caracteres.';
  const em = (email || '').trim().toLowerCase();
  if (!em) errors.email = 'Correo obligatorio.';
  else if (!EMAIL_RE.test(em)) errors.email = 'Correo no válido.';
  const user = (username || '').trim().toLowerCase();
  if (!user) errors.username = 'Usuario obligatorio.';
  else if (!USERNAME_RE.test(user)) errors.username = 'Usuario: 3–32 caracteres (letras, números, _).';
  if (!passwordRuleChecks(password).every((r) => r.ok)) {
    errors.password = 'La contraseña no cumple todas las reglas.';
  }
  if ((password || '') !== (passwordConfirm || '')) {
    errors.passwordConfirm = 'Las contraseñas no coinciden.';
  }
  return { ok: Object.keys(errors).length === 0, errors };
}

export function validateLoginForm({ username, password }) {
  const errors = {};
  if (!(username || '').trim()) errors.username = 'Introduce tu usuario.';
  if (!(password || '')) errors.password = 'Introduce tu contraseña.';
  return { ok: Object.keys(errors).length === 0, errors };
}
