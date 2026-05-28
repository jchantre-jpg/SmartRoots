/**
 * Muestra usuario autenticado o botones Entrar/Salir; el modal se monta en `App` vía `onOpenAuth`.
 */
import { useAuth } from '../AuthContext.jsx'

export function AuthBlock({ onOpenAuth }) {
  const { user, ready, logout } = useAuth()

  return (
    <div className="flex shrink-0 items-center gap-2">
        {!ready ? (
          <div
            className="h-10 w-10 animate-pulse rounded-full border sr-border-accent sr-bg-accent-dim"
            aria-hidden
          />
        ) : user ? (
          <>
            <span
              className="hidden max-w-[160px] truncate text-right text-[11px] font-medium text-slate-400 sm:block [html.sr-light_&]:text-slate-600"
              title={user.full_name ? `${user.full_name} · ${user.email}` : user.email}
            >
              {user.username ? `@${user.username}` : user.email}
            </span>
            <button
              type="button"
              onClick={logout}
              className="rounded-full border sr-border-accent-strong sr-bg-accent-mid px-3 py-2 text-[11px] font-semibold sr-text-accent-soft transition hover:brightness-110 sm:text-xs"
            >
              Salir
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => onOpenAuth?.()}
            className="flex h-10 min-w-[44px] items-center justify-center gap-2 rounded-full border sr-border-accent sr-bg-accent-dim px-3 sr-text-accent-soft sr-shadow-accent transition hover:brightness-110"
            title="Iniciar sesión o registrarse"
          >
            <svg className="h-5 w-5 shrink-0 opacity-90" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
            <span className="hidden text-xs font-semibold sm:inline">Entrar</span>
          </button>
        )}
    </div>
  )
}
