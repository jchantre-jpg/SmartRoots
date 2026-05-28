/**
 * Límite de errores de React (class component): captura fallos en el árbol hijo
 * y muestra un mensaje amistoso + botón de recarga en lugar de una pantalla en blanco.
 */
import { Component } from 'react'

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, message: '' }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message ? String(error.message) : 'Error desconocido' }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto max-w-lg rounded-2xl bg-rose-950/80 p-6 text-left ring-1 ring-rose-400/30">
          <p className="text-sm font-semibold text-rose-100">Algo salió mal en la interfaz</p>
          <p className="mt-2 text-xs text-rose-200/90">{this.state.message}</p>
          <button
            type="button"
            className="mt-4 rounded-xl bg-white px-4 py-2 text-sm font-medium text-rose-950"
            onClick={() => window.location.reload()}
          >
            Recargar página
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
