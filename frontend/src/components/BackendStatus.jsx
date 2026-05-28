/**
 * Franja superior opcional: si `/api/health` falla, muestra instrucciones para levantar Flask.
 * Reintenta en intervalos; en modo claro/oscuro ajusta colores del aviso.
 */
import { useCallback, useEffect, useState } from 'react'
import { apiGet } from '../api'
import { isMobileShell } from '../mobileBridge.js'
import { useTheme } from '../ThemeContext.jsx'

export function BackendStatus() {
  const { colorMode } = useTheme()
  const [state, setState] = useState({ ok: null, lastCheck: null, detail: '' })

  const ping = useCallback(async () => {
    try {
      await apiGet('/api/health')
      setState({ ok: true, lastCheck: new Date(), detail: '' })
    } catch (e) {
      setState({ ok: false, lastCheck: new Date(), detail: e?.message || 'Error' })
    }
  }, [])

  useEffect(() => {
    const t = window.setTimeout(() => {
      void ping()
    }, 0)
    const id = window.setInterval(() => {
      void ping()
    }, 20000)
    return () => {
      window.clearTimeout(t)
      window.clearInterval(id)
    }
  }, [ping])

  if (state.ok !== false) {
    return null
  }

  const shell =
    colorMode === 'light'
      ? 'border-b border-amber-400/50 bg-amber-50 px-4 py-4 text-center sm:px-6'
      : 'border-b border-amber-500/30 bg-amber-950/55 px-4 py-4 text-center sm:px-6'
  const titleCls = colorMode === 'light' ? 'text-sm font-medium text-amber-950' : 'text-sm font-medium text-amber-50'
  const subCls =
    colorMode === 'light'
      ? 'sr-lead-text mt-2 text-xs text-amber-900/80 sm:text-sm'
      : 'sr-lead-text mt-2 text-xs text-amber-200/85 sm:text-sm'
  const codeCls =
    colorMode === 'light'
      ? 'rounded-md border border-amber-200/80 bg-amber-100/90 px-1.5 py-0.5 font-mono text-[11px] text-amber-950 sm:text-xs'
      : 'rounded-md bg-black/35 px-1.5 py-0.5 font-mono text-[11px] sm:text-xs'
  const btnCls =
    colorMode === 'light'
      ? 'mt-3 inline-flex min-h-[44px] min-w-[7rem] items-center justify-center rounded-full border border-amber-700/25 bg-amber-200/80 px-4 text-sm font-semibold text-amber-950 transition hover:bg-amber-300/90'
      : 'mt-3 inline-flex min-h-[44px] min-w-[7rem] items-center justify-center rounded-full border border-white/20 bg-white/15 px-4 text-sm font-semibold text-white transition hover:bg-white/25'

  return (
    <div className={shell}>
      <p className={titleCls}>No se alcanza el backend ({state.detail.slice(0, 120)})</p>
      <p className={subCls}>
        {isMobileShell() ? (
          <>
            Sin misma WiFi: en el PC <code className={codeCls}>cd SmartRoots/mobile</code> →{' '}
            <code className={codeCls}>npm run tunnel:backend</code>, copia la URL <strong>https</strong> en{' '}
            <strong>Red</strong> → Backend. Flask: <code className={codeCls}>python app.py</code>. Expo:{' '}
            <code className={codeCls}>npm run start:tunnel</code>.
          </>
        ) : (
          <>
            Necesitas <strong>dos procesos</strong>: (1) backend Flask y (2) frontend Vite. En una terminal:
            <code className={codeCls}>cd SmartRoots/backend</code> → <code className={codeCls}>python app.py</code>
            (o doble clic en <code className={codeCls}>start-backend.bat</code>). En otra:{' '}
            <code className={codeCls}>cd SmartRoots/frontend</code> → <code className={codeCls}>npm run dev</code>.
          </>
        )}
      </p>
      <button type="button" onClick={ping} className={btnCls}>
        Reintentar
      </button>
    </div>
  )
}
