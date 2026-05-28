import { passwordRuleChecks } from '../../lib/authValidation.js'

export function PasswordRulesList({ password }) {
  const rules = passwordRuleChecks(password)

  return (
    <div className="sr-auth-rules" aria-live="polite">
      <p className="sr-auth-rules-title">Requisitos de la contraseña</p>
      <ul className="sr-auth-rules-grid">
        {rules.map((r) => (
          <li key={r.id} className={r.ok ? 'sr-auth-rule-ok' : 'sr-auth-rule-pending'}>
            <span className="sr-auth-rule-icon" aria-hidden>
              {r.ok ? '✓' : '·'}
            </span>
            <span>{r.label}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
