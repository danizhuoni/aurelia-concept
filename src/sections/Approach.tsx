import { useRef } from 'react'
import { Eyebrow, MaskLines } from '../components/ui'
import { STEPS } from '../data/content'
import { gsap, useGsap, useReveals } from '../lib/motion'

export default function Approach() {
  const root = useRef<HTMLElement>(null)
  useReveals(root)

  // A thin line draws down the journey as you read it
  useGsap(root, ({ reduced, q }) => {
    if (reduced) return
    gsap.fromTo(
      q('[data-journey-line]')[0],
      { scaleY: 0 },
      { scaleY: 1, ease: 'none', transformOrigin: '50% 0%', scrollTrigger: { trigger: q('[data-journey]')[0], start: 'top 70%', end: 'bottom 60%', scrub: 0.6 } },
    )
    q('[data-step]').forEach((el) => {
      gsap.fromTo(el, { opacity: 0.3 }, { opacity: 1, ease: 'none', scrollTrigger: { trigger: el, start: 'top 75%', end: 'top 50%', scrub: true } })
    })
  })

  return (
    <section ref={root} id="enfoque" data-header="light" aria-labelledby="enfoque-title" className="relative bg-pearl">
      <div className="mx-auto grid max-w-[1680px] gap-y-16 px-6 py-28 md:px-10 md:py-40 lg:grid-cols-12 lg:gap-x-10 lg:px-14">
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-32">
            <Eyebrow index="VII" className="text-taupe-deep">
              Our Approach
            </Eyebrow>
            <h2 id="enfoque-title" data-reveal="lines" className="display mt-8 text-[clamp(2.6rem,4.8vw,5.4rem)] text-charcoal">
              <MaskLines lines={['Un camino', <em key="c" className="italic">sin atajos.</em>]} />
            </h2>
            <p data-reveal="fade" className="body-copy mt-6 max-w-sm">
              Así imaginamos el recorrido de una persona en AURELIA. Es un planteamiento conceptual e indicativo, no el protocolo de una clínica real.
            </p>
          </div>
        </div>

        <ol data-journey className="relative lg:col-span-7 lg:col-start-6">
          <span aria-hidden className="absolute top-2 bottom-2 left-[0.45rem] w-px bg-charcoal/12 md:left-[0.55rem]" />
          <span data-journey-line aria-hidden className="absolute top-2 bottom-2 left-[0.45rem] w-px bg-gold-deep md:left-[0.55rem]" />
          {STEPS.map((s) => (
            <li key={s.n} data-step className="relative grid grid-cols-[2rem_1fr] gap-x-6 pb-16 last:pb-0 md:grid-cols-[2.5rem_1fr] md:gap-x-10 md:pb-24">
              <span aria-hidden className="relative z-10 mt-3 h-[0.95rem] w-[0.95rem] rounded-full border border-gold-deep bg-pearl md:h-[1.15rem] md:w-[1.15rem]" />
              <div>
                <p className="font-serif text-lg text-gold-deep italic">{s.n}</p>
                <h3 className="display mt-2 text-[clamp(2.1rem,3.6vw,3.6rem)] text-charcoal">{s.title}</h3>
                <p className="body-copy mt-4 max-w-lg">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
