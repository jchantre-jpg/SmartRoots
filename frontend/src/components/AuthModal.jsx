/**
 * Registro e inicio de sesión — modal centrado, desplazable y coherente con el tema SmartRoots.
 */
import { useEffect, useId, useState } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '../AuthContext'
import { validateLoginForm, validateRegisterForm } from '../lib/authValidation.js'
import { PasswordField } from './auth/PasswordField.jsx'
import { PasswordRulesList } from './auth/PasswordRulesList.jsx'

const EMPTY_REGISTER = {
  fullName: '',
  email: '',
  username: '',
  password: '',
  passwordConfirm: '',
}

function TextField({ id, label, type = 'text', value, onChange, autoComplete, placeholder, error, required = true }) {
  return (
    <div className="sr-auth-field">
      <label htmlFor={id} className="sr-auth-label">
        {label}
      </label>
      <input
        id={id}
        type={type}
        autoComplete={autoComplete}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={`sr-input mt-1.5 w-full ${error ? 'border-rose-500/55 ring-rose-500/15' : ''}`}
      />
      {error ? <p className="sr-auth-error">{error}</p> : null}
    </div>
  )
}

function AuthUserIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M20 21a8 8 0 10-16 0" strokeLinecap="round" />
      <circle cx="12" cy="8" r="4" />
    </svg>
  )
}

export function AuthModal({ open, onClose }) {
  const titleId = useId()
  const { login, register } = useAuth()
  const [mode, setMode] = useState('login')
  const [loginUser, setLoginUser] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [reg, setReg] = useState(EMPTY_REGISTER)
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [portalReady, setPortalReady] = useState(false)

  useEffect(() => {
    setPortalReady(true)
  }, [])

  useEffect(() => {
    if (!open) return
    setError('')
    setFieldErrors({})
    setBusy(false)
  }, [open, mode])

  useEffect(() => {
    if (!open) return undefined
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  function patchReg(key, value) {
    setReg((prev) => ({ ...prev, [key]: value }))
    setFieldErrors((prev) => {
      const next = { ...prev }
      delete next[key]
      if (key === 'password' || key === 'passwordConfirm') {
        delete next.password
        delete next.passwordConfirm
      }
      return next
    })
  }

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setFieldErrors({})

    if (mode === 'login') {
      const v = validateLoginForm({ username: loginUser, password: loginPassword })
      if (!v.ok) {
        setFieldErrors(v.errors)
        return
      }
      setBusy(true)
      try {
        await login(loginUser.trim(), loginPassword)
        onClose()
        setLoginPassword('')
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
      } finally {
        setBusy(false)
      }
      return
    }

    const v = validateRegisterForm(reg)
    if (!v.ok) {
      setFieldErrors(v.errors)
      return
    }

    setBusy(true)
    try {
      await register({
        fullName: reg.fullName.trim(),
        email: reg.email.trim(),
        username: reg.username.trim(),
        password: reg.password,
        passwordConfirm: reg.passwordConfirm,
      })
      onClose()
      setReg(EMPTY_REGISTER)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  if (!open || !portalReady) return null

  const overlay = (
    <div
      className="sr-auth-overlay"
      role="presentation"
      onClick={(ev) => {
        if (ev.target === ev.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="sr-auth-dialog"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="sr-auth-header">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <span className="sr-auth-icon-badge" aria-hidden>
              <AuthUserIcon />
            </span>
            <div className="min-w-0">
              <h2 id={titleId} className="sr-auth-title">
                {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
              </h2>
              <p className="sr-auth-subtitle">Cuenta local · sesión guardada en este navegador</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="sr-auth-close" aria-label="Cerrar">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </header>

        <div className="sr-auth-tabs" role="tablist" aria-label="Modo de acceso">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'login'}
            className={mode === 'login' ? 'sr-auth-tab sr-auth-tab-active' : 'sr-auth-tab'}
            onClick={() => setMode('login')}
          >
            Iniciar sesión
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'register'}
            className={mode === 'register' ? 'sr-auth-tab sr-auth-tab-active' : 'sr-auth-tab'}
            onClick={() => setMode('register')}
          >
            Registrarse
          </button>
        </div>

        <form className="sr-auth-form" onSubmit={onSubmit} noValidate>
          <div className="sr-auth-body">
            {mode === 'login' ? (
              <div className="space-y-4">
                <TextField
                  id="sr-auth-username"
                  label="Usuario"
                  value={loginUser}
                  onChange={(e) => {
                    setLoginUser(e.target.value)
                    setFieldErrors((p) => {
                      const n = { ...p }
                      delete n.username
                      return n
                    })
                  }}
                  autoComplete="username"
                  placeholder="tu_usuario"
                  error={fieldErrors.username}
                />
                <PasswordField
                  id="sr-auth-login-password"
                  label="Contraseña"
                  value={loginPassword}
                  onChange={(e) => {
                    setLoginPassword(e.target.value)
                    setFieldErrors((p) => {
                      const n = { ...p }
                      delete n.password
                      return n
                    })
                  }}
                  autoComplete="current-password"
                  error={fieldErrors.password}
                />
              </div>
            ) : (
              <div className="space-y-4">
                <TextField
                  id="sr-auth-fullname"
                  label="Nombre completo"
                  value={reg.fullName}
                  onChange={(e) => patchReg('fullName', e.target.value)}
                  autoComplete="name"
                  placeholder="María García López"
                  error={fieldErrors.fullName}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField
                    id="sr-auth-email"
                    label="Correo electrónico"
                    type="email"
                    value={reg.email}
                    onChange={(e) => patchReg('email', e.target.value)}
                    autoComplete="email"
                    placeholder="tu@correo.com"
                    error={fieldErrors.email}
                  />
                  <div>
                    <TextField
                      id="sr-auth-reg-username"
                      label="Usuario"
                      value={reg.username}
                      onChange={(e) => patchReg('username', e.target.value.toLowerCase())}
                      autoComplete="username"
                      placeholder="maria_garcia"
                      error={fieldErrors.username}
                    />
                    <p className="sr-auth-hint mt-1">3–32 caracteres (letras, números, _)</p>
                  </div>
                </div>
                <PasswordField
                  id="sr-auth-reg-password"
                  label="Contraseña"
                  value={reg.password}
                  onChange={(e) => patchReg('password', e.target.value)}
                  autoComplete="new-password"
                  error={fieldErrors.password}
                />
                <PasswordRulesList password={reg.password} />
                <PasswordField
                  id="sr-auth-reg-password2"
                  label="Confirmar contraseña"
                  value={reg.passwordConfirm}
                  onChange={(e) => patchReg('passwordConfirm', e.target.value)}
                  autoComplete="new-password"
                  error={fieldErrors.passwordConfirm}
                />
              </div>
            )}

            {error ? <p className="sr-auth-banner-error">{error}</p> : null}
          </div>

          <footer className="sr-auth-footer">
            <button type="submit" disabled={busy} className="sr-btn-primary w-full justify-center disabled:opacity-50">
              {busy ? 'Espera…' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  )

  const target = document.getElementById('sr-portal-root') || document.body
  return createPortal(overlay, target)
}
