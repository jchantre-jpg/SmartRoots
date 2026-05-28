/** Reglas de contraseña (misma lógica que backend/auth_validation.py). */

const PASSWORD_MIN_LEN = 8
const USERNAME_RE = /^[a-zA-Z0-9_]{3,32}$/
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/
const HAS_SPECIAL = /[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/

export function passwordRuleChecks(password) {
  const p = password || ''
  return [
    { id: 'len', label: `Al menos ${PASSWORD_MIN_LEN} caracteres`, ok: p.length >= PASSWORD_MIN_LEN },
    { id: 'upper', label: 'Una letra mayúscula (A–Z)', ok: /[A-Z]/.test(p) },
    { id: 'lower', label: 'Una letra minúscula (a–z)', ok: /[a-z]/.test(p) },
    { id: 'digit', label: 'Un número (0–9)', ok: /\d/.test(p) },
    { id: 'special', label: 'Un carácter especial (!@#$…)', ok: HAS_SPECIAL.test(p) },
  ]
}

export function isPasswordValid(password) {
  return passwordRuleChecks(password).every((r) => r.ok)
}

export function validateRegisterForm({ fullName, email, username, password, passwordConfirm }) {
  const errors = {}

  const name = (fullName || '').trim().replace(/\s+/g, ' ')
  if (name.length < 3) errors.fullName = 'Nombre completo: mínimo 3 caracteres.'
  if (name.length > 120) errors.fullName = 'Nombre completo: máximo 120 caracteres.'

  const em = (email || '').trim().toLowerCase()
  if (!em) errors.email = 'El correo es obligatorio.'
  else if (!EMAIL_RE.test(em)) errors.email = 'Correo electrónico no válido.'

  const user = (username || '').trim().toLowerCase()
  if (!user) errors.username = 'El usuario es obligatorio.'
  else if (!USERNAME_RE.test(user)) {
    errors.username = 'Usuario: 3–32 caracteres (letras, números y _).'
  }

  if (!isPasswordValid(password)) {
    errors.password = 'La contraseña no cumple todas las reglas.'
  }

  if ((password || '') !== (passwordConfirm || '')) {
    errors.passwordConfirm = 'Las contraseñas no coinciden.'
  }

  return { ok: Object.keys(errors).length === 0, errors }
}

export function validateLoginForm({ username, password }) {
  const errors = {}
  if (!(username || '').trim()) errors.username = 'Introduce tu usuario.'
  if (!(password || '')) errors.password = 'Introduce tu contraseña.'
  return { ok: Object.keys(errors).length === 0, errors }
}
