import { useEffect, useRef, useState } from 'react'

/**
 * Discreet but always-visible disclosure that this is a fictional studio demonstration.
 * Lives in the header so it never covers page content or calls to action.
 */
export default function DemoNotice() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="demo-notice-text"
        className="flex items-center gap-2 rounded-full border border-current/25 px-3 py-1.5 text-[0.56rem] font-semibold tracking-[0.2em] uppercase transition-colors hover:bg-ivory hover:text-ink"
      >
        <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-bronze" />
        Concepto ficticio
      </button>
      <div
        id="demo-notice-text"
        role="note"
        hidden={!open}
        className="absolute top-full left-0 mt-3 w-[min(20rem,calc(100vw-3rem))] rounded-xl border border-charcoal/12 bg-ivory p-4 text-xs leading-relaxed text-taupe-deep shadow-[0_18px_50px_-24px_rgba(39,37,35,0.5)]"
      >
        <strong className="font-semibold text-charcoal">Demostración de estudio.</strong> AURELIA es una clínica imaginaria. Imágenes y vídeos generados con IA (Higgsfield). Sin servicios,
        profesionales ni resultados reales. Prototipo por Welegance.
      </div>
    </div>
  )
}
