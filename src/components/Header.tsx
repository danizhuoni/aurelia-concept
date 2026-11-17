import { useEffect, useRef, useState } from 'react'
import { NAV } from '../data/content'
import { requestConsultation } from '../lib/interest'
import DemoNotice from './DemoNotice'

export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`font-serif tracking-[0.42em] ${className}`} style={{ fontWeight: 400 }}>
      AURELIA
    </span>
  )
}

export default function Header() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState<string>('')
  const menuRef = useRef<HTMLDivElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)

  // Theme follows the section under the header (data-header="dark" | "light")
  useEffect(() => {
    let raf = 0
    const update = () => {
      raf = 0
      setScrolled(window.scrollY > 40)
      const probe = 36
      const secs = document.querySelectorAll<HTMLElement>('[data-header]')
      let t: 'dark' | 'light' = 'light'
      for (const el of secs) {
        const r = el.getBoundingClientRect()
        if (r.top <= probe && r.bottom > probe) t = (el.dataset.header as 'dark' | 'light') ?? 'light'
      }
      setTheme(t)
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [])

  // Active section indicator
  useEffect(() => {
    // Observe every top-level section so non-nav sections (hero, sculpture…) clear the indicator
    const navIds = new Set<string>(NAV.map((n) => n.id))
    const els = Array.from(document.querySelectorAll<HTMLElement>('main > section'))
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(navIds.has(e.target.id) ? e.target.id : '')
        })
      },
      { rootMargin: '-45% 0px -50% 0px' },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  // Mobile menu: lock scroll, Escape to close, simple focus trap, restore focus
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const first = menuRef.current?.querySelector<HTMLElement>('a, button')
    first?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
      if (e.key === 'Tab' && menuRef.current) {
        const f = Array.from(menuRef.current.querySelectorAll<HTMLElement>('a, button'))
        const all = [toggleRef.current!, ...f]
        const i = all.indexOf(document.activeElement as HTMLElement)
        if (e.shiftKey && i <= 0) {
          e.preventDefault()
          all[all.length - 1].focus()
        } else if (!e.shiftKey && i === all.length - 1) {
          e.preventDefault()
          all[0].focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener('keydown', onKey)
      toggleRef.current?.focus({ preventScroll: true })
    }
  }, [open])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-[background-color,color,backdrop-filter,border-color] duration-700 ${
        open
          ? 'border-b border-transparent bg-ivory text-charcoal' /* no backdrop-filter: it would trap the fixed menu */
          : theme === 'dark'
            ? `on-dark border-b border-transparent text-ivory ${scrolled ? 'bg-gradient-to-b from-ink/70 to-transparent' : ''}`
            : 'border-b border-charcoal/10 bg-ivory/85 text-charcoal backdrop-blur-md'
      }`}
    >
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:rounded-full focus:bg-charcoal focus:px-5 focus:py-2 focus:text-ivory">
        Saltar al contenido
      </a>
      <div className="mx-auto flex h-18 max-w-[1680px] items-center justify-between px-6 md:h-20 md:px-10 lg:px-14">
        <div className="relative z-10 flex items-center gap-4 md:gap-6">
          <a href="#top" aria-label="AURELIA — volver al inicio" onClick={() => setOpen(false)}>
            <Wordmark className="text-[0.95rem] md:text-[1.05rem]" />
          </a>
          <DemoNotice />
        </div>

        <nav aria-label="Principal" className="hidden md:block">
          <ul className="flex items-center gap-10 lg:gap-14">
            {NAV.map((n) => (
              <li key={n.id}>
                <a href={`#${n.id}`} className="link-line text-[0.72rem] font-medium tracking-[0.22em] uppercase" aria-current={active === n.id ? 'true' : undefined}>
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => requestConsultation('')}
            className={`hidden rounded-full border px-5 py-2.5 text-[0.65rem] font-semibold tracking-[0.24em] uppercase transition-colors duration-500 lg:inline-flex ${
              theme === 'dark' && !open ? 'border-ivory/40 hover:bg-ivory hover:text-ink' : 'border-charcoal/30 hover:bg-charcoal hover:text-ivory'
            }`}
          >
            Solicitar consulta
          </button>
          <button
            ref={toggleRef}
            type="button"
            className="relative z-10 -mr-2 flex h-11 w-11 items-center justify-center md:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
            onClick={() => setOpen((v) => !v)}
          >
            <span aria-hidden className="relative block h-3 w-7">
              <span className={`absolute left-0 h-px w-full bg-current transition-transform duration-500 ${open ? 'top-1.5 rotate-45' : 'top-0'}`} />
              <span className={`absolute left-0 h-px w-full bg-current transition-transform duration-500 ${open ? 'top-1.5 -rotate-45' : 'top-3'}`} />
            </span>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        id="mobile-menu"
        ref={menuRef}
        role="dialog"
        aria-modal="true"
        aria-label="Menú"
        hidden={!open}
        className="fixed inset-0 top-0 -z-0 flex h-dvh flex-col bg-ivory px-6 pt-28 pb-10 text-charcoal md:hidden"
      >
        <nav aria-label="Menú móvil">
          <ul className="space-y-2">
            {NAV.map((n, i) => (
              <li key={n.id} className="border-b border-charcoal/10">
                <a href={`#${n.id}`} onClick={() => setOpen(false)} className="flex items-baseline justify-between py-5">
                  <span className="display text-[2.6rem]">{n.label}</span>
                  <span className="eyebrow text-taupe-deep">0{i + 1}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-auto space-y-6">
          <button
            type="button"
            className="btn btn-dark w-full justify-center"
            onClick={() => {
              setOpen(false)
              requestConsultation('')
            }}
          >
            <span>Solicitar consulta</span>
          </button>
          <p className="text-xs leading-relaxed text-taupe-deep">Concepto ficticio · Prototipo demostrativo por Welegance</p>
        </div>
      </div>
    </header>
  )
}
