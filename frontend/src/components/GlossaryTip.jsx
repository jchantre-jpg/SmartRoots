/**
 * Abreviatura accesible: `title` nativo con definición (glosario inline sin tooltip JS).
 */
export function GlossaryTip({ term, definition, children }) {
  return (
    <abbr title={definition} className="cursor-help underline decoration-dotted decoration-[color:color-mix(in_srgb,var(--sr-accent)_50%,transparent)] underline-offset-2">
      {children ?? term}
    </abbr>
  )
}
