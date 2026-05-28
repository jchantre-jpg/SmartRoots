/**
 * Contenedor tipo “tarjeta cristal” reutilizable: título, subtítulo opcional y cuerpo.
 * Los estilos dependen de `index.css` (clases `sr-glass-card`, tema claro/oscuro).
 */
export function GlassCard({ title, subtitle, children, className = '' }) {
  return (
    <section
      className={`sr-glass-card rounded-3xl border sr-border-accent p-6 shadow-xl backdrop-blur-md sm:p-8 ${className}`}
    >
      <header className="sr-glass-card-head mb-5 w-full min-w-0 border-b pb-4 sm:mb-6 sm:pb-5">
        <h2 className="sr-surface-heading font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight sm:text-xl">
          {title}
        </h2>
        {subtitle ? <p className="sr-lead-text sr-surface-muted mt-2 text-sm">{subtitle}</p> : null}
      </header>
      {children}
    </section>
  )
}
