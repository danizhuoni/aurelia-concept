/**
 * ACT IV — Specialties as three full-screen scenes on one sticky stage.
 * Each scene has its own atmosphere; transitions are scrubbed mask reveals with a counter-scale "camera".
 * A chapter navigator jumps straight to any specialty.
 */
import { useRef, useState } from 'react'
import { Arrow } from '../components/ui'
import { SPECIALTIES } from '../data/content'
import { gsap, prefersReducedMotion, useGsap } from '../lib/motion'
import { img, srcSet, type AssetName } from '../lib/media'
import { requestConsultation } from '../lib/interest'

type SceneArt = {
  main: AssetName
  mainPos: string
  inset?: AssetName
  insetAlt?: string
  grade: string // per-scene atmosphere overlay
  tone: string
}

const ART: SceneArt[] = [
  {
    main: 'dermatology-editorial',
    mainPos: '70% 28%',
    grade: 'bg-[radial-gradient(120%_90%_at_75%_40%,transparent_0%,rgba(19,19,17,0.35)_45%,rgba(19,19,17,0.92)_100%)]',
    tone: 'Warm amber',
  },
  {
    main: 'treatment-consultation',
    mainPos: '50% 55%',
    inset: 'skincare-still-life',
    insetAlt: 'Bodegón de vidrio sin marca sobre travertino',
    grade: 'bg-[radial-gradient(120%_90%_at_65%_45%,rgba(36,33,31,0.1)_0%,rgba(36,33,31,0.5)_50%,rgba(19,19,17,0.94)_100%)]',
    tone: 'Champagne daylight',
  },
  {
    main: 'surgery-suite',
    mainPos: '55% 50%',
    grade: 'bg-[radial-gradient(120%_90%_at_70%_45%,rgba(19,19,17,0.15)_0%,rgba(19,19,17,0.55)_50%,rgba(19,19,17,0.95)_100%)]',
    tone: 'Clinical calm',
  },
]

// Timeline positions (0..1) where each scene is fully settled — used for anchors & navigation
const SETTLE = [0.06, 0.5, 0.94]

export default function Chapters() {
  const root = useRef<HTMLElement>(null)
  const [active, setActive] = useState(0)
  const [reduced] = useState(prefersReducedMotion)

  useGsap(
    root,
    ({ q }) => {
      if (reduced) return
      const scenes = q('[data-scene]')
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: root.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.8,
          onUpdate: (self) => {
            const p = self.progress
            setActive(p < 0.28 ? 0 : p < 0.72 ? 1 : 2)
          },
        },
      })
      // initial states
      scenes.forEach((s, i) => {
        if (i > 0) gsap.set(s, { clipPath: 'inset(100% 0% 0% 0%)' })
      })
      const enter = (i: number, at: number) => {
        const prev = scenes[i - 1]
        const next = scenes[i]
        tl.to(next, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.24, ease: 'power2.inOut' }, at)
          .fromTo(next.querySelector('[data-scene-img]'), { scale: 1.3, yPercent: 6 }, { scale: 1.05, yPercent: 0, duration: 0.3, ease: 'power2.out' }, at)
          .to(prev.querySelector('[data-scene-img]'), { scale: 1.18, yPercent: -6, filter: 'brightness(0.45)', duration: 0.24 }, at)
          .to(prev.querySelector('[data-scene-copy]'), { autoAlpha: 0, y: -60, duration: 0.12 }, at)
          .from(next.querySelectorAll('.mask-line > span'), { yPercent: 115, stagger: 0.02, duration: 0.12, ease: 'power3.out' }, at + 0.14)
          .from(next.querySelectorAll('[data-scene-fade]'), { autoAlpha: 0, y: 30, stagger: 0.015, duration: 0.1 }, at + 0.18)
          .fromTo(next.querySelector('[data-scene-inset]'), { yPercent: 40, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.2, ease: 'power2.out' }, at + 0.1)
      }
      enter(1, 0.16)
      enter(2, 0.6)
      // slow drift of each inset while its scene is held
      scenes.forEach((s) => {
        const inset = s.querySelector('[data-scene-inset] img')
        if (inset) tl.fromTo(inset, { scale: 1.15 }, { scale: 1, duration: 1 }, 0)
      })
      tl.to({}, { duration: 0.06 }, 0.94)
    },
    [reduced],
  )

  const jump = (i: number) => {
    const el = root.current
    if (!el) return
    const top = el.getBoundingClientRect().top + window.scrollY
    const range = el.offsetHeight - window.innerHeight
    window.scrollTo({ top: top + range * SETTLE[i], behavior: reduced ? 'auto' : 'smooth' })
  }

  return (
    <section
      ref={root}
      id="especialidades"
      data-header="dark"
      aria-labelledby="especialidades-title"
      className={`relative bg-ink ${reduced ? '' : 'h-[340svh]'}`}
    >
      <h2 id="especialidades-title" className="sr-only">
        Especialidades: Dermatología, Medicina estética y Cirugía plástica
      </h2>
      {/* Anchors at the settled position of each scene */}
      {!reduced &&
        SPECIALTIES.map((s, i) => (
          <span key={s.id} id={s.id} aria-hidden className="absolute left-0 h-px w-px" style={{ top: `calc((100% - 100svh) * ${SETTLE[i]})` }} />
        ))}

      <div className={reduced ? '' : 'sticky top-0 h-svh overflow-hidden'}>
        {SPECIALTIES.map((s, i) => {
          const art = ART[i]
          return (
            <article
              key={s.id}
              id={reduced ? s.id : undefined}
              data-scene
              aria-labelledby={`${s.id}-title`}
              className={`${reduced ? 'relative min-h-svh' : 'absolute inset-0'} overflow-hidden bg-ink`}
              style={{ zIndex: i + 1 }}
            >
              <div className="absolute inset-0">
                <img
                  data-scene-img
                  src={img(art.main, 1600)}
                  srcSet={srcSet(art.main)}
                  sizes="100vw"
                  alt={s.images[0].alt}
                  loading={i === 0 ? 'eager' : 'lazy'}
                  className="h-full w-full scale-105 object-cover will-change-transform"
                  style={{ objectPosition: art.mainPos }}
                />
                <div aria-hidden className={`absolute inset-0 ${art.grade}`} />
                <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-transparent md:bg-gradient-to-r md:from-ink/95 md:via-ink/50 md:to-transparent" />
              </div>

              {art.inset && (
                <figure
                  data-scene-inset
                  className="absolute top-[16%] right-[6%] hidden aspect-[3/4] w-[min(19vw,300px)] overflow-hidden rounded-t-full border border-champagne/30 lg:block"
                >
                  <img src={img(art.inset, 640)} srcSet={srcSet(art.inset)} sizes="20vw" alt={art.insetAlt ?? ''} loading="lazy" className="h-full w-full object-cover" />
                </figure>
              )}

              <div data-scene-copy className="on-dark relative z-10 mx-auto flex h-full min-h-svh max-w-[1680px] flex-col justify-end px-6 pt-28 pb-28 text-ivory md:justify-center md:px-10 md:pb-24 lg:px-14">
                <p data-scene-fade className="eyebrow flex items-center gap-4 text-champagne">
                  <span>Acto IV · Capítulo {s.index}</span>
                  <span aria-hidden className="h-px w-10 bg-current opacity-50" />
                  <span className="hidden sm:inline">{s.english}</span>
                </p>
                <h3 id={`${s.id}-title`} className="display mt-6 text-[clamp(3rem,9vw,10.5rem)]" style={{ fontWeight: 300 }}>
                  {s.title.split(' ').map((w, k) => (
                    <span key={k} className="mask-line">
                      <span className={k === 1 ? 'italic text-champagne' : ''}>{w}</span>
                    </span>
                  ))}
                </h3>
                <p data-scene-fade className="lede mt-6 max-w-xl text-ivory italic">
                  {s.intro}
                </p>
                <p data-scene-fade className="mt-5 max-w-lg text-[0.95rem] leading-[1.8] text-ivory/80">
                  {s.body}
                </p>
                <ul data-scene-fade className="mt-7 flex max-w-2xl flex-wrap gap-x-6 gap-y-2 text-[0.72rem] tracking-[0.16em] text-champagne uppercase">
                  {s.focus.map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <span aria-hidden className="h-1 w-1 rounded-full bg-bronze" />
                      {f}
                    </li>
                  ))}
                </ul>
                <div data-scene-fade className="mt-9 flex flex-wrap items-center gap-4">
                  <button type="button" className="btn btn-champagne" onClick={() => requestConsultation(s.id)}>
                    <span>Solicitar consulta</span>
                    <Arrow />
                  </button>
                  <span className="text-xs text-ivory/70">{i === 0 ? 'Imagen ilustrativa · modelo ficticia' : i === 1 ? 'Escena ilustrativa · personas ficticias' : 'Espacio ficticio · imagen generada'}</span>
                </div>
              </div>
            </article>
          )
        })}

        {/* Chapter navigator */}
        {!reduced && (
          <nav aria-label="Capítulos de especialidades" className="absolute right-6 bottom-6 z-20 md:right-10 md:bottom-10 lg:right-14">
            <ol className="flex gap-2 md:gap-3">
              {SPECIALTIES.map((s, i) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => jump(i)}
                    aria-current={active === i ? 'step' : undefined}
                    aria-label={`Ir a ${s.title}`}
                    className={`group flex flex-col items-start gap-2 rounded-full px-1 py-1 text-left text-ivory transition-opacity duration-500 ${active === i ? 'opacity-100' : 'opacity-55 hover:opacity-100'}`}
                  >
                    <span className="relative block h-px w-12 overflow-hidden bg-ivory/25 md:w-20">
                      <span className={`absolute inset-0 origin-left bg-champagne transition-transform duration-700 ${active === i ? 'scale-x-100' : 'scale-x-0'}`} />
                    </span>
                    <span className="text-[0.62rem] font-semibold tracking-[0.2em] uppercase">
                      {s.index} <span className="hidden md:inline">· {s.title}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </nav>
        )}
      </div>
    </section>
  )
}
