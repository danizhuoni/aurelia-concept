/**
 * ACT V — Cinematic clinic journey. Four full-bleed scenes on one sticky stage.
 * Spatial progression: the current room scales toward the viewer (we walk forward) while the next room is
 * revealed through an arched doorway mask that opens to full frame — echoing the clinic's curved architecture.
 * Only the active scene's video plays; neighbours preload their poster only.
 */
import { useEffect, useRef, useState } from 'react'
import { gsap, prefersReducedMotion, useGsap } from '../lib/motion'
import { img, video, type AssetName } from '../lib/media'
import { scrollToId } from '../lib/webgl'

type Scene = { key: string; label: string; title: string[]; text: string; video: string; poster: AssetName; alt: string }

const SCENES: Scene[] = [
  {
    key: 'llegada',
    label: 'Escena 01 · Llegada',
    title: ['Un espacio', 'para sentirte bien.'],
    text: 'Piedra clara, luz natural y silencio. La recepción imaginada para AURELIA recibe sin prisa.',
    video: 'clinic-reception',
    poster: 'clinic-reception',
    alt: 'Recepción de la clínica ficticia: mostrador curvo de travertino, mamparas de vidrio acanalado y luz cálida',
  },
  {
    key: 'descubrimiento',
    label: 'Escena 02 · Descubrimiento',
    title: ['La intimidad', 'de una conversación.'],
    text: 'Un despacho pensado para escuchar: dos sillas frente a frente, tiempo para preguntar y para decidir con calma.',
    video: 'clinic-consultation',
    poster: 'clinic-consultation-wide',
    alt: 'Despacho de consulta ficticio con escritorio de travertino, dos sillas y gran ventana en arco',
  },
  {
    key: 'precision',
    label: 'Escena 03 · Precisión',
    title: ['Precisión,', 'en calma.'],
    text: 'Salas de tratamiento ordenadas y luminosas, donde el equipamiento médico convive con materiales naturales.',
    video: 'clinic-treatment',
    poster: 'clinic-treatment-wide',
    alt: 'Sala de tratamiento ficticia con camilla moderna, equipo sin marca y muro curvo con luz indirecta',
  },
  {
    key: 'tranquilidad',
    label: 'Escena 04 · Tranquilidad',
    title: ['Luz, silencio', 'y tiempo.'],
    text: 'Recorridos curvos y vidrio acanalado preservan la privacidad de cada visita sin renunciar a la luz.',
    video: 'clinic-corridor',
    poster: 'clinic-corridor',
    alt: 'Pasillo curvo de piedra caliza con mamparas de vidrio acanalado y reflejos de sol en el suelo',
  },
]

const N = SCENES.length
const settleAt = (i: number) => (i === 0 ? 0.03 : i / (N - 1) - (i === N - 1 ? 0.03 : 0))

function SceneVideo({ scene, state }: { scene: Scene; state: 'active' | 'near' | 'far' }) {
  const ref = useRef<HTMLVideoElement>(null)
  const [reduced] = useState(prefersReducedMotion)
  const [failed, setFailed] = useState(false)
  const load = state !== 'far'

  useEffect(() => {
    const v = ref.current
    if (!v) return
    if (state === 'active') v.play().catch(() => {})
    else v.pause()
  }, [state, load])

  const poster = img(scene.poster, 1600)
  // Distant rooms render only their poster: no <video> element, nothing buffered
  if (reduced || failed || state === 'far') return <img src={poster} alt={scene.alt} loading="lazy" className="h-full w-full object-cover" />
  return (
    <video
      ref={ref}
      className="h-full w-full object-cover"
      poster={load ? poster : undefined}
      muted
      loop
      playsInline
      preload={state === 'active' ? 'auto' : 'metadata'}
      aria-label={scene.alt}
      onError={(e) => e.target === e.currentTarget && setFailed(true)}
      disablePictureInPicture
    >
      {load && <source src={video(scene.video, true)} type="video/mp4" media="(max-width: 767px)" onError={(e) => e.stopPropagation()} />}
      {load && (
        <source
          src={video(scene.video)}
          type="video/mp4"
          onError={(e) => {
            e.stopPropagation()
            setFailed(true)
          }}
        />
      )}
    </video>
  )
}

export default function ClinicJourney() {
  const root = useRef<HTMLElement>(null)
  const [active, setActive] = useState(0)
  const [inView, setInView] = useState(false)
  const [reduced] = useState(prefersReducedMotion)

  useEffect(() => {
    const el = root.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { rootMargin: '300px 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useGsap(
    root,
    ({ q }) => {
      if (reduced) return
      const scenes = q('[data-room]')
      scenes.forEach((s, i) => i > 0 && gsap.set(s, { clipPath: 'inset(32% 36% 0% 36% round 50vw 50vw 0px 0px)', autoAlpha: 0 }))
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: root.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.8,
          onUpdate: (self) => setActive(Math.min(N - 1, Math.round(self.progress * (N - 1)))),
        },
      })
      tl.fromTo(q('[data-progress]'), { scaleX: 0 }, { scaleX: 1, duration: 1 }, 0)
      // establishing push on the first room
      tl.fromTo(scenes[0].querySelector('[data-room-media]'), { scale: 1.12 }, { scale: 1, duration: 0.12, ease: 'power1.out' }, 0)
      const seg = 1 / (N - 1)
      for (let i = 1; i < N; i++) {
        const at = (i - 1) * seg + seg * 0.2
        const d = seg * 0.62
        const prev = scenes[i - 1]
        const next = scenes[i]
        tl.to(prev.querySelector('[data-room-media]'), { scale: 1.45, filter: 'brightness(0.5) blur(2px)', duration: d, ease: 'power2.in' }, at)
          .to(prev.querySelector('[data-room-copy]'), { autoAlpha: 0, y: -50, duration: d * 0.4 }, at)
          .set(next, { autoAlpha: 1 }, at)
          .to(next, { clipPath: 'inset(0% 0% 0% 0% round 0vw 0vw 0px 0px)', duration: d, ease: 'power2.inOut' }, at)
          .fromTo(next.querySelector('[data-room-media]'), { scale: 1.3 }, { scale: 1, duration: d * 1.2, ease: 'power2.out' }, at)
          .from(next.querySelectorAll('.mask-line > span'), { yPercent: 115, stagger: 0.02, duration: d * 0.45, ease: 'power3.out' }, at + d * 0.6)
          .from(next.querySelectorAll('[data-room-fade]'), { autoAlpha: 0, y: 20, duration: d * 0.4 }, at + d * 0.75)
      }
    },
    [reduced],
  )

  const jump = (i: number) => {
    const el = root.current
    if (!el) return
    const top = el.getBoundingClientRect().top + window.scrollY
    window.scrollTo({ top: top + (el.offsetHeight - window.innerHeight) * settleAt(i), behavior: reduced ? 'auto' : 'smooth' })
  }

  return (
    <section
      ref={root}
      id="la-clinica"
      data-header="dark"
      aria-labelledby="clinica-title"
      className={`relative bg-ink ${reduced ? '' : 'h-[460svh]'}`}
    >
      <h2 id="clinica-title" className="sr-only">
        La Clínica — un recorrido por los espacios imaginados para AURELIA
      </h2>
      <div className={reduced ? '' : 'sticky top-0 h-svh overflow-hidden'}>
        {SCENES.map((s, i) => {
          const state: 'active' | 'near' | 'far' = !inView ? 'far' : i === active ? 'active' : Math.abs(i - active) === 1 ? 'near' : 'far'
          return (
            <article
              key={s.key}
              data-room
              aria-label={s.label}
              className={`${reduced ? 'relative h-svh' : 'absolute inset-0'} overflow-hidden bg-ink`}
              style={{ zIndex: i + 1 }}
            >
              <div data-room-media className="absolute inset-0 will-change-transform">
                <SceneVideo scene={s} state={reduced ? 'far' : state} />
              </div>
              <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-ink/40" />
              <div data-room-copy className="on-dark absolute inset-x-0 bottom-0 z-10 mx-auto max-w-[1680px] px-6 pb-28 text-ivory md:px-10 md:pb-24 lg:px-14">
                <p data-room-fade className="eyebrow text-champagne">
                  {i === 0 ? 'Acto V · La Clínica — ' : ''}
                  {s.label}
                </p>
                <h3 className="display mt-5 text-[clamp(2.6rem,7vw,7.8rem)] uppercase" style={{ fontWeight: 300 }}>
                  {s.title.map((l, k) => (
                    <span key={k} className="mask-line">
                      <span className={k === 1 ? 'italic normal-case text-champagne' : ''}>{l}</span>
                    </span>
                  ))}
                </h3>
                <p data-room-fade className="mt-5 max-w-md text-[0.95rem] leading-[1.8] text-ivory/85">
                  {s.text}
                </p>
              </div>
            </article>
          )
        })}

        {/* HUD: progress, scene navigation, skip */}
        {!reduced && (
          <div className="on-dark absolute inset-x-0 bottom-0 z-20 mx-auto flex max-w-[1680px] items-end justify-between gap-6 px-6 pb-7 text-ivory md:px-10 lg:px-14">
            <nav aria-label="Escenas de la clínica" className="flex-1">
              <ol className="flex gap-2 md:gap-4">
                {SCENES.map((s, i) => (
                  <li key={s.key}>
                    <button
                      type="button"
                      onClick={() => jump(i)}
                      aria-current={active === i ? 'step' : undefined}
                      aria-label={`Ir a ${s.label}`}
                      className={`text-[0.62rem] font-semibold tracking-[0.2em] uppercase transition-opacity duration-500 ${active === i ? 'opacity-100' : 'opacity-50 hover:opacity-100'}`}
                    >
                      0{i + 1}
                      <span className="hidden md:inline"> · {s.label.split('· ')[1]}</span>
                    </button>
                  </li>
                ))}
              </ol>
              <span aria-hidden className="mt-3 block h-px w-full max-w-md bg-ivory/20">
                <span data-progress className="block h-full origin-left bg-champagne" />
              </span>
            </nav>
            <button type="button" onClick={() => scrollToId('filosofia')} className="eyebrow shrink-0 rounded-full border border-ivory/30 px-4 py-2.5 text-[0.6rem] transition-colors hover:bg-ivory hover:text-ink">
              Saltar recorrido ↓
            </button>
          </div>
        )}
        {!reduced && (
          <p className="eyebrow pointer-events-none absolute top-24 right-6 z-20 text-[0.58rem] text-ivory/75 md:right-10 lg:right-14">Espacios ficticios · Vídeo generado con IA</p>
        )}
      </div>
    </section>
  )
}
