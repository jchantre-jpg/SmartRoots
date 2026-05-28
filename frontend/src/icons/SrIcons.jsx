/**
 * Iconos SVG del laboratorio: secciones, métodos numéricos y operaciones.
 * Trazos coherentes (24×24, stroke 2) para lectura en nav y botones.
 */

const strokeIcon = 'h-5 w-5 shrink-0'
const navIcon = 'h-4 w-4 shrink-0 opacity-95'

export function SrIcon({ name, className = navIcon }) {
  const common = { className, viewBox: '0 0 24 24', 'aria-hidden': true }

  switch (name) {
    case 'home':
      return (
        <svg {...common} fill="currentColor" stroke="none">
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
        </svg>
      )

    case 'roots':
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 19h18" opacity="0.45" />
          <path d="M4 17 C8 6 12 5 17 14 C19 17 21 16 21 16" />
          <circle cx="13.5" cy="13.8" r="2" fill="currentColor" stroke="none" />
          <path d="M13.5 15.8v3.2" strokeWidth="1.75" opacity="0.7" />
        </svg>
      )

    case 'poly':
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M5 18V9M9 18V12M13 18V15M17 18V6" />
          <path d="M4 20h16" opacity="0.35" />
          <path d="M17 6l2-2M17 6l-1 2" strokeWidth="1.5" />
        </svg>
      )

    case 'interp':
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="5" cy="16" r="1.75" fill="currentColor" stroke="none" />
          <circle cx="10" cy="9" r="1.75" fill="currentColor" stroke="none" />
          <circle cx="15" cy="12" r="1.75" fill="currentColor" stroke="none" />
          <circle cx="19" cy="7" r="1.75" fill="currentColor" stroke="none" />
          <path d="M4 17 C9 5 14 8 20 6" />
        </svg>
      )

    case 'book':
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 4h9a2 2 0 012 2v14H8a2 2 0 01-2-2V4z" />
          <path d="M6 18h11" />
          <path d="M9 8h5M9 12h4" opacity="0.85" />
        </svg>
      )

    case 'info':
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 10v6M12 7h.01" strokeLinecap="round" />
        </svg>
      )

    case 'lab':
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 3h6l1 4H8l1-4z" />
          <path d="M7 7h10l-1 13H8L7 7z" />
          <path d="M10 11v5M14 11v3" opacity="0.8" />
        </svg>
      )

    /* —— Métodos de raíces —— */
    case 'bisection':
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M3 15h18" opacity="0.4" />
          <path d="M6 11v8" />
          <path d="M6 11h2.5M6 19h2.5" />
          <path d="M18 11v8" />
          <path d="M15.5 11H18M15.5 19H18" />
          <circle cx="12" cy="15" r="1.75" fill="currentColor" stroke="none" />
        </svg>
      )

    case 'false_position':
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 18h16" opacity="0.35" />
          <path d="M7 18V7" />
          <path d="M17 18V11" />
          <path d="M7 9 L17 13" />
          <circle cx="11" cy="15.2" r="1.5" fill="currentColor" stroke="none" />
        </svg>
      )

    case 'newton_raphson':
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 17 C8 5 13 6 21 15" />
          <path d="M15 8 L21 18" />
          <circle cx="15" cy="8" r="1.75" fill="currentColor" stroke="none" />
          <path d="M3 19h18" opacity="0.3" />
        </svg>
      )

    case 'secant':
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 16 C8 6 14 9 21 14" opacity="0.55" />
          <circle cx="8" cy="11.5" r="1.75" fill="currentColor" stroke="none" />
          <circle cx="17" cy="12.8" r="1.75" fill="currentColor" stroke="none" />
          <path d="M6.5 12.5 L20 18" />
          <path d="M3 19h18" opacity="0.3" />
        </svg>
      )

    case 'fixed_point':
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 20L20 4" opacity="0.55" />
          <path d="M4 18 C10 7 14 16 20 9" />
          <path d="M7 16 L7 12 L11 12 L11 10" />
          <circle cx="11" cy="10" r="1.25" fill="currentColor" stroke="none" />
        </svg>
      )

    /* —— Polinomios —— */
    case 'horner':
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 6h14M7 10h10M9 14h6" />
          <path d="M12 14v4M12 18l-1.5-2M12 18l1.5-2" strokeWidth="1.75" />
        </svg>
      )

    case 'deflation':
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M4 8c2-2 5-2 7 0s5 2 7 0" />
          <path d="M4 16c2 2 5 2 7 0s5-2 7 0" />
          <circle cx="12" cy="12" r="1.75" fill="currentColor" stroke="none" />
          <path d="M12 13.8v4" strokeWidth="1.75" opacity="0.65" />
        </svg>
      )

    /* —— Interpolación —— */
    case 'lagrange':
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M4 17 C7 8 10 8 12 17 S17 8 20 17" />
          <circle cx="7" cy="14" r="1.25" fill="currentColor" stroke="none" />
          <circle cx="12" cy="17" r="1.25" fill="currentColor" stroke="none" />
          <circle cx="17" cy="14" r="1.25" fill="currentColor" stroke="none" />
        </svg>
      )

    case 'neville':
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
          <path d="M6 6h12M8 10h8M10 14h4" />
          <path d="M12 6v12M8 10l4 4 4-4" opacity="0.5" />
        </svg>
      )

    case 'runge':
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12c2-3 3-3 4 0s2 3 4 0 2-3 4 0 2 3 4 0" />
          <circle cx="6" cy="12" r="1" fill="currentColor" stroke="none" />
          <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
          <circle cx="18" cy="12" r="1" fill="currentColor" stroke="none" />
        </svg>
      )

    default:
      return (
        <svg {...common} fill="currentColor" stroke="none">
          <circle cx="12" cy="12" r="3" />
        </svg>
      )
  }
}

/** Alias para la barra lateral de métodos en Raíces */
export function MethodGlyph({ id, className = strokeIcon }) {
  return <SrIcon name={id} className={className} />
}

/** Mapa sección → icono (pestañas principales) */
export const SECTION_ICON = {
  lab: 'home',
  roots: 'roots',
  poly: 'poly',
  interp: 'interp',
  concepts: 'book',
  about: 'info',
}
