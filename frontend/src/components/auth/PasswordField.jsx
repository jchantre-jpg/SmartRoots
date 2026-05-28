/**
 * Campo de contraseña con botón mostrar/ocultar.
 */
import { useState } from 'react'

export function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  placeholder = '••••••••',
  error,
  hint,
  required = true,
}) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="sr-auth-field">
      <label htmlFor={id} className="sr-auth-label">
        {label}
      </label>
      <div className="relative mt-1.5">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={`sr-input w-full py-2.5 pl-3 pr-11 ${error ? 'border-rose-500/55 ring-rose-500/15' : ''}`}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setVisible((v) => !v)}
          className="sr-auth-password-toggle"
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        >
          {visible ? (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M3 3l18 18M10.58 10.58a2 2 0 002.84 2.84M9.88 5.09A10.94 10.94 0 0112 5c5 0 9.27 3.11 11 7a11.8 11.8 0 01-4.12 4.88M6.61 6.61A11.8 11.8 0 001 12c1.73 3.89 6 7 11 7 1.05 0 2.06-.13 3-.37" strokeLinecap="round" />
            </svg>
          ) : (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" strokeLinecap="round" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>
      {hint ? <p className="sr-auth-hint">{hint}</p> : null}
      {error ? <p className="sr-auth-error">{error}</p> : null}
    </div>
  )
}
