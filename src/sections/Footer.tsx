import { NAV } from '../data/content'
import { Wordmark } from '../components/Header'

export default function Footer() {
  return (
    <footer data-header="dark" className="on-dark bg-ink text-ivory">
      <div className="mx-auto max-w-[1680px] px-6 pt-24 pb-10 md:px-10 md:pt-32 lg:px-14">
        <div className="grid gap-y-14 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <Wordmark className="block text-[clamp(2.3rem,5.2vw,5.4rem)] leading-none tracking-[0.24em]" />
            <p className="eyebrow mt-6 text-champagne">The Art of Natural Beauty</p>
          </div>
          <nav aria-label="Pie de página" className="lg:col-span-3 lg:col-start-8">
            <p className="eyebrow mb-5 text-[0.6rem] text-champagne">Navegación</p>
            <ul className="space-y-3">
              {NAV.map((n) => (
                <li key={n.id}>
                  <a href={`#${n.id}`} className="link-line font-serif text-2xl">
                    {n.label}
                  </a>
                </li>
              ))}
              <li>
                <a href="#top" className="link-line font-serif text-2xl">
                  Volver arriba ↑
                </a>
              </li>
            </ul>
          </nav>
          <div className="lg:col-span-2 lg:col-start-11">
            <p className="eyebrow mb-5 text-[0.6rem] text-champagne">Ubicación</p>
            <p className="font-serif text-2xl">Madrid</p>
            <p className="mt-1 text-xs text-pearl/80">Concepto · sin dirección real</p>
          </div>
        </div>

        <div className="mt-20 border-t border-ivory/15 pt-8 md:mt-28">
          <p className="max-w-3xl text-xs leading-relaxed text-pearl/80">
            <strong className="font-semibold text-ivory">Prototipo conceptual.</strong> AURELIA es una marca y clínica ficticias creadas como demostración de estudio. No ofrece servicios médicos.
            Las personas y espacios mostrados han sido generados con IA (Higgsfield) y no representan a pacientes, profesionales ni instalaciones reales. Los textos son ilustrativos y no
            constituyen información ni consejo médico.
          </p>
          <div className="mt-8 flex flex-col gap-3 text-[0.7rem] tracking-[0.18em] text-pearl/80 uppercase md:flex-row md:items-center md:justify-between">
            <p>© MMXXVI · AURELIA — Concepto ficticio</p>
            <p>Digital experience concept by Welegance</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
