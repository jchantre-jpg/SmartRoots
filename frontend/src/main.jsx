/**
 * Punto de entrada del frontend SmartRoots (Vite + React).
 * Monta la app en #root, registra Chart.js vía chartRegister y aplica estilos globales (index.css).
 */
import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { AuthProvider } from './AuthContext.jsx'
import { notifyMobileReady } from './mobileBridge.js'
import './chartRegister.js'
import './index.css'
import App from './App.jsx'

function MobileReadyPing() {
  useEffect(() => {
    notifyMobileReady()
  }, [])
  return null
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <MobileReadyPing />
      <App />
    </AuthProvider>
  </StrictMode>,
)
