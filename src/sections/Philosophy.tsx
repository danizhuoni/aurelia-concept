import { useRef } from 'react'
import { Eyebrow, MaskLines } from '../components/ui'
import { gsap, useGsap, useReveals } from '../lib/motion'

const MANIFESTO =
  'Creemos en una medicina estética que empieza escuchando. Cada consulta parte de una conversación honesta sobre la persona, su salud y sus expectativas, y solo después se valora si existe una indicación médica adecuada.'

const PRINCIPLES = [
  { n: 'I', title: 'Naturalidad', text: 'Respetar los rasgos, la expresión y el tiempo de cada persona. El objetivo nunca es parecer otra.' },
  { n: 'II', title: 'Precisión', text: 'Decisiones basadas en una valoración médica individual, con información clara sobre beneficios, riesgos y alternativas.' },
  { n: 'III', title: 'Armonía', text: 'Entender el rostro y el cuerpo como un conjunto, priorizando el equilibrio sobre el cambio.' },
]

export default function Philosophy() {
  const root = useRef<HTMLElement>(null)
  useReveals(root)

  // Word-by-word illumination of the manifesto, tied to scroll
  useGsap(root, ({ reduced, q }) => {
    if (reduced) return
    gsap.fromTo(
      q('[data-word]'),
      { opacity: 0.16 },
      {
        opacity: 1,
        stagger: 0.05,
        ease: 'none',
        scrollTrigger: { trigger: q('[data-manifesto]')[0], start: 'top 80%', end: 'bottom 45%', scrub: 0.5 },
      },
    )
  })

  return (
    <section ref={root} id="filosofia" data-header="light" aria-labelledby="filosofia-title" className="relative bg-ivory">
      <div className="mx-auto max-w-[1680px] px-6 pt-28 pb-24 md:px-10 md:pt-40 md:pb-36 lg:px-14">
        <div className="grid gap-y-14 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <Eyebrow index="VI" className="text-taupe-deep">
              Philosophy
            </Eyebrow>
          </div>
          <div className="lg:col-span-9">
            <h2 id="filosofia-title" data-reveal="lines" className="display text-[clamp(2.8rem,7.4vw,8.5rem)] text-charcoal">
              <MaskLines lines={['Naturalidad,', <em key="p" className="italic text-gold-deep">precisión</em>, 'y armonía.']} />
            </h2>
          </div>
        </div>

        <div className="mt-20 grid gap-y-10 md:mt-32 lg:grid-cols-12">
          <p data-manifesto className="lede text-pretty text-charcoal lg:col-span-7 lg:col-start-4">
            {MANIFESTO.split(' ').map((w, i) => (
              <span key={i} data-word>
                {w}{' '}
              </span>
            ))}
          </p>
          <p data-reveal="fade" className="body-copy max-w-sm lg:col-span-2 lg:col-start-11 lg:self-end">
            AURELIA es un concepto que imagina cómo podría sentirse una clínica donde la ciencia médica y la sensibilidad estética conviven sin estridencias.
          </p>
        </div>

        <ol className="mt-24 grid gap-px md:mt-36 md:grid-cols-3" aria-label="Principios">
          {PRINCIPLES.map((p, i) => (
            <li key={p.n} className="relative pt-8 pr-8 pb-10 md:pr-12">
              <div data-reveal="rule" data-delay={i * 0.12} aria-hidden className="hairline absolute inset-x-0 top-0 text-charcoal" />
              <div data-reveal="fade" data-delay={0.15 + i * 0.12}>
                <span className="font-serif text-lg text-gold-deep italic">{p.n}</span>
                <h3 className="display mt-5 text-[2.4rem] text-charcoal md:text-[2.8rem]">{p.title}</h3>
                <p className="body-copy mt-5 max-w-xs">{p.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
