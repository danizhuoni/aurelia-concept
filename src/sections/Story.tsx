/**
 * ACTS I–III — The Object · Enter the Sculpture · Skin Reveal.
 * One sticky stage, one scrubbed GSAP timeline. The timeline drives a progress proxy that the WebGL camera
 * reads inside R3F's render loop, and the DOM layers (headline, captions, skin reveal) on the same clock.
 */
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { Arrow } from '../components/ui'
import { SPECIALTIES } from '../data/content'
import { gsap, prefersReducedMotion, useGsap } from '../lib/motion'
import { img, srcSet } from '../lib/media'
import { requestConsultation } from '../lib/interest'
import { detectTier, scrollToId, type GLTier } from '../lib/webgl'

const BloomScene = lazy(() => import('../three/BloomScene'))

const CAMERA_SPAN = 0.9 // fraction of the timeline used by the camera; the rest holds on the skin scene

function SkinContent({ inline = false }: { inline?: boolean }) {
  return (
    <div className={`on-dark relative z-10 mx-auto flex h-full max-w-[1680px] flex-col justify-end px-6 pb-14 text-ivory md:px-10 md:pb-20 lg:px-14 ${inline ? 'min-h-svh' : ''}`}>
      <p data-skin-fade className="eyebrow mb-6 text-champagne">
        Acto III · Skin Science
      </p>
      <h2 id="piel-title" className="display max-w-[13ch] text-[clamp(2.6rem,7.4vw,8.6rem)] uppercase" style={{ fontWeight: 300 }}>
        {['Cada piel', 'cuenta', 'una historia.'].map((l, i) => (
          <span key={i} className="mask-line" data-skin-line>
            <span className={i === 2 ? 'italic normal-case' : ''}>{l}</span>
          </span>
        ))}
      </h2>
      <div data-skin-fade className="mt-10 grid max-w-5xl gap-8 md:grid-cols-2 md:gap-16">
        <p className="lede text-ivory/95">La piel guarda memoria: del sol, del tiempo, de la genética y de la vida de cada persona.</p>
        <div>
          <p className="text-[0.95rem] leading-[1.8] text-ivory/85">
            Por eso la dermatología es el punto de partida del concepto AURELIA: observar, comprender y valorar cada piel con criterio médico antes de plantear
            cualquier decisión. Cada caso es distinto; una consulta es siempre el primer paso.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <button type="button" className="btn btn-light" onClick={() => scrollToId('dermatologia')}>
              <span>Dermatología</span>
              <Arrow />
            </button>
            <button type="button" className="btn btn-light" onClick={() => requestConsultation('dermatologia')}>
              <span>Solicitar consulta</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Story() {
  const root = useRef<HTMLElement>(null)
  const progress = useRef(0)
  const [tier, setTier] = useState<GLTier | null>(null)
  const [ready, setReady] = useState(false)
  const [reduced] = useState(prefersReducedMotion)
  const [hoverRing, setHoverRing] = useState<number | null>(null)

  useEffect(() => setTier(detectTier()), [])

  const onSelectRing = useCallback((i: number) => scrollToId(SPECIALTIES[i].id), [])

  // Entry choreography (time-based) + the scroll timeline (scrubbed)
  useGsap(
    root,
    ({ q }) => {
      const intro = gsap.timeline({ delay: reduced ? 0 : 1.1 })
      if (!reduced) {
        intro
          .from(q('[data-front-word] > span'), { yPercent: 115, duration: 1.8, ease: 'expo.out', stagger: 0.08 })
          .from(q('[data-hero-fade]'), { autoAlpha: 0, y: 16, duration: 1.4, ease: 'power3.out', stagger: 0.08 }, 0.5)
      }
      if (reduced) return

      const proxy = { p: 0 }
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom bottom', scrub: 0.9 },
      })
      tl.to(proxy, { p: 1, duration: CAMERA_SPAN, onUpdate: () => (progress.current = proxy.p) }, 0)
        // Act I → II: hero typography steps aside
        .to(q('[data-act1]'), { autoAlpha: 0, y: -50, duration: 0.09 }, 0.015)
        .to(q('[data-front-word]'), { autoAlpha: 0, yPercent: -40, duration: 0.08 }, 0.015)
        .to(q('[data-act1-hints]'), { autoAlpha: 0, duration: 0.05 }, 0)
        // Act II captions
        .fromTo(q('[data-cap="a"]'), { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.06 }, 0.2)
        .to(q('[data-cap="a"]'), { autoAlpha: 0, y: -30, duration: 0.06 }, 0.4)
        .fromTo(q('[data-cap="b"]'), { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.06 }, 0.5)
        .to(q('[data-cap="b"]'), { autoAlpha: 0, y: -30, duration: 0.06 }, 0.68)
        // Act III: skin opens from the core (aligned with the camera landing on the skin-textured core)
        .fromTo(q('[data-skin]'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.07 }, 0.78)
        .fromTo(q('[data-skin-mask]'), { clipPath: 'circle(28% at 50% 50%)' }, { clipPath: 'circle(80% at 50% 50%)', duration: 0.1, ease: 'power2.in' }, 0.79)
        .fromTo(q('[data-skin-img]'), { scale: 1.5 }, { scale: 1.04, duration: 0.2, ease: 'power2.out' }, 0.79)
        .from(q('[data-skin-line] > span'), { yPercent: 115, stagger: 0.012, duration: 0.05, ease: 'power3.out' }, 0.9)
        .from(q('[data-skin-fade]'), { autoAlpha: 0, y: 24, stagger: 0.015, duration: 0.04 }, 0.93)
        .to(q('[data-act-bar]'), { scaleY: 1, duration: 1 }, 0)
    },
    [reduced],
  )

  const show3D = tier === 'high' || tier === 'low'

  const ringLabel = hoverRing !== null ? SPECIALTIES[hoverRing] : null

  return (
    <>
      <section
        ref={root}
        id="top"
        data-header="dark"
        aria-labelledby="hero-title"
        className={`relative bg-ink ${reduced ? '' : 'h-[380svh] md:h-[440svh]'}`}
      >
        <div className={`${reduced ? 'relative h-svh' : 'sticky top-0 h-svh'} overflow-hidden`}>
          {/* ── WebGL stage ── */}
          {show3D && (
            <Suspense fallback={null}>
              <BloomScene
                progress={progress}
                tier={tier}
                reduced={reduced}
                skinUrl={img('skin-macro', 1600)}
                onReady={() => setReady(true)}
                onHoverRing={setHoverRing}
                onSelectRing={onSelectRing}
              />
            </Suspense>
          )}
          {/* Loading veil / no-WebGL fallback (static composition) */}
          <div aria-hidden className={`pointer-events-none absolute inset-0 transition-opacity duration-[1600ms] ${show3D && ready ? 'opacity-0' : 'opacity-100'}`}>
            <div className="absolute inset-0 bg-ink" />
            {tier === 'none' && (
              <>
                <p className="display absolute top-[24%] left-[5%] text-[clamp(3.4rem,15vw,15rem)] text-ivory uppercase" style={{ fontWeight: 300, letterSpacing: '0.035em' }}>
                  Beauty,
                </p>
                <img
                  src={img('sculpture-reference', 1024)}
                  srcSet={srcSet('sculpture-reference')}
                  sizes="60vw"
                  alt=""
                  className="absolute top-1/2 left-1/2 w-[min(70vh,80vw)] -translate-x-1/2 -translate-y-1/2 [mask-image:radial-gradient(closest-side,black_55%,transparent)] opacity-90"
                />
                <p className="display absolute right-[5%] bottom-[10%] text-[clamp(3.4rem,15vw,15rem)] text-ivory uppercase" style={{ fontWeight: 300, letterSpacing: '0.035em' }}>
                  Science.
                </p>
              </>
            )}
          </div>

          {/* "refined by" sits in front of the glass; BEAUTY, / SCIENCE. live behind it in WebGL.
              Difference blending keeps it legible over both the dark studio and the ivory petals. */}
          <p
            aria-hidden
            data-front-word
            className="display pointer-events-none absolute top-[43%] left-1/2 z-10 -translate-x-1/2 overflow-hidden pb-[0.15em] text-[clamp(3rem,13vw,9.4rem)] whitespace-nowrap text-champagne italic mix-blend-difference md:top-[47%] md:left-[22%] md:translate-x-0 md:text-[clamp(2.6rem,8.4vw,9.4rem)]"
            style={{ fontWeight: 300 }}
          >
            <span className="block">refined by</span>
          </p>

          {/* ── ACT I: front typography layer (in front of the sculpture) ── */}
          <div data-act1 className="pointer-events-none absolute inset-0 z-10 text-ivory on-dark">
            <h1 id="hero-title" className="sr-only">
              Beauty, refined by science. AURELIA — La belleza de sentirte tú.
            </h1>
            <p data-hero-fade className="eyebrow absolute top-24 left-6 text-champagne md:top-28 md:left-10 lg:left-14">
              AURELIA <span className="mx-2 opacity-50">·</span> Madrid <span className="mx-2 hidden opacity-50 sm:inline">·</span>
              <span className="hidden sm:inline">The Art of Natural Beauty</span>
            </p>
            <div className="pointer-events-auto absolute right-6 bottom-6 left-6 md:right-auto md:bottom-12 md:left-10 lg:left-14">
              <p data-hero-fade className="font-serif text-[1.35rem] text-ivory italic md:text-2xl">
                La belleza de sentirte tú.
              </p>
              <div data-hero-fade className="mt-5 flex flex-wrap gap-3 md:mt-7">
                <button
                  type="button"
                  className="btn btn-champagne"
                  onClick={() => window.scrollTo({ top: (root.current?.offsetTop ?? 0) + window.innerHeight * 1.4, behavior: reduced ? 'auto' : 'smooth' })}
                >
                  <span>Entrar</span>
                  <Arrow />
                </button>
                <button type="button" className="btn btn-light" onClick={() => scrollToId('especialidades')}>
                  <span>Especialidades</span>
                </button>
              </div>
            </div>
          </div>

          {/* Interaction hints + scroll cue */}
          <div data-act1-hints aria-hidden className="pointer-events-none absolute right-6 bottom-6 z-10 hidden text-right md:right-10 md:bottom-12 md:block lg:right-14">
            <p data-hero-fade className="eyebrow text-[0.6rem] text-champagne/90">
              {show3D ? 'Mueve el cursor · Arrastra para girar' : 'Escultura · Vista estática'}
            </p>
            {!reduced && (
              <p data-hero-fade className="eyebrow mt-3 flex items-center justify-end gap-3 text-[0.6rem] text-ivory">
                Desliza para entrar en la escultura
                <span className="relative block h-8 w-px overflow-hidden bg-ivory/20">
                  <span className="absolute inset-x-0 top-0 block h-1/2 animate-[scrollcue_2.4s_cubic-bezier(.65,0,.35,1)_infinite] bg-ivory" />
                </span>
              </p>
            )}
          </div>

          {/* Ring hover label */}
          <div
            aria-hidden
            className={`pointer-events-none absolute top-[22%] left-1/2 z-10 -translate-x-1/2 text-center transition-opacity duration-500 ${ringLabel ? 'opacity-100' : 'opacity-0'}`}
          >
            <p className="eyebrow text-[0.6rem] text-champagne">{ringLabel ? `${ringLabel.index} · ${ringLabel.layerLabel}` : ' '}</p>
            <p className="mt-2 font-serif text-2xl text-ivory italic">{ringLabel?.title ?? ' '}</p>
            <p className="mt-1 text-[0.7rem] tracking-[0.18em] text-ivory/70 uppercase">Clic para explorar</p>
          </div>

          {/* ── ACT II captions ── */}
          {!reduced && (
            <>
              <div data-cap="a" className="on-dark pointer-events-none invisible absolute top-1/2 left-6 z-10 -translate-y-1/2 rounded-[2px] bg-ink/55 px-6 py-6 text-ivory backdrop-blur-md md:left-10 md:px-8 md:py-7 lg:left-14">
                <p className="eyebrow text-champagne">Acto II · Entrar</p>
                <p className="display mt-5 text-[clamp(2.2rem,4vw,4rem)]">
                  Tres capas.
                  <br />
                  <em className="italic text-champagne">Una misma mirada.</em>
                </p>
              </div>
              <div data-cap="b" className="on-dark pointer-events-none invisible absolute right-6 bottom-8 z-10 rounded-[2px] bg-ink/55 px-6 py-6 text-right text-ivory backdrop-blur-md md:right-10 md:bottom-14 md:px-8 md:py-7 lg:right-14">
                <ul className="space-y-2">
                  {SPECIALTIES.map((s) => (
                    <li key={s.id} className="flex items-baseline justify-end gap-4">
                      <span className="text-[0.7rem] tracking-[0.2em] text-champagne/80 uppercase">{s.layerLabel}</span>
                      <span className="display text-[clamp(1.6rem,2.6vw,2.6rem)]">{s.title}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-5 text-sm text-ivory/75">En el centro de todo: la piel.</p>
              </div>
            </>
          )}

          {/* ── ACT III: skin reveal ── */}
          {!reduced && (
            <div data-skin className="invisible absolute inset-0 z-20">
              <div data-skin-mask className="absolute inset-0 overflow-hidden" style={{ clipPath: 'circle(28% at 50% 50%)' }}>
                <img
                  data-skin-img
                  src={img('skin-macro', 1600)}
                  srcSet={srcSet('skin-macro')}
                  sizes="100vw"
                  alt="Macrofotografía de piel humana real con poros y textura natural bajo luz cálida"
                  className="h-full w-full object-cover"
                />
                <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/30 to-ink/10" />
              </div>
              <SkinContent />
            </div>
          )}

          {/* Act progress (desktop) */}
          {!reduced && (
            <div aria-hidden className="pointer-events-none absolute top-1/2 right-6 z-30 hidden -translate-y-1/2 items-center gap-4 lg:right-10 lg:flex">
              <ol data-acts className="space-y-5 text-right text-[0.6rem] tracking-[0.24em] text-ivory uppercase">
                <li>I · Objeto</li>
                <li>II · Entrar</li>
                <li>III · Piel</li>
              </ol>
              <span className="relative block h-24 w-px bg-ivory/20">
                <span data-act-bar className="absolute inset-0 origin-top scale-y-0 bg-champagne" />
              </span>
            </div>
          )}
        </div>

        {/* Anchor near the end of the story where the skin scene is fully revealed */}
        {!reduced && <span id="piel" aria-hidden className="absolute left-0 h-px w-px" style={{ top: 'calc(100% - 115svh)' }} />}
      </section>

      {/* Reduced motion: the skin chapter is a regular section */}
      {reduced && (
        <section id="piel" aria-labelledby="piel-title" data-header="dark" className="relative overflow-hidden bg-ink">
          <img src={img('skin-macro', 1600)} srcSet={srcSet('skin-macro')} sizes="100vw" alt="Macrofotografía de piel humana real" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/40 to-ink/20" />
          <SkinContent inline />
        </section>
      )}
    </>
  )
}
