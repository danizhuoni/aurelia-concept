import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { AmbientVideo, Arrow, Eyebrow, MaskLines } from '../components/ui'
import { INTEREST_OPTIONS } from '../data/content'
import { setInterest, useInterest, type InterestId } from '../lib/interest'
import { useReveals } from '../lib/motion'
import { ASSET_BASE } from '../lib/media'

type Values = { name: string; email: string; interest: InterestId; message: string; ack: boolean }
type Errors = Partial<Record<keyof Values, string>>

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

function validate(v: Values): Errors {
  const e: Errors = {}
  if (v.name.trim().length < 2) e.name = 'Indica tu nombre (mínimo 2 caracteres).'
  if (!v.email.trim()) e.email = 'Indica un correo electrónico.'
  else if (!EMAIL_RE.test(v.email.trim())) e.email = 'El formato del correo no es válido (ejemplo: nombre@dominio.com).'
  if (!v.interest) e.interest = 'Selecciona un área de interés.'
  if (v.message.trim().length < 10) e.message = 'Escribe un mensaje de al menos 10 caracteres.'
  else if (v.message.length > 1000) e.message = 'El mensaje no puede superar los 1000 caracteres.'
  if (!v.ack) e.ack = 'Confirma que entiendes que se trata de una demostración.'
  return e
}

const PLACEHOLDERS = [
  { label: 'Ubicación', value: 'Madrid, España', note: 'Ubicación conceptual' },
  { label: 'Dirección', value: '[Dirección por definir]', note: 'Marcador de posición' },
  { label: 'Teléfono', value: '[Teléfono por definir]', note: 'Marcador de posición' },
  { label: 'Correo', value: '[Correo por definir]', note: 'Marcador de posición' },
]

export default function Contact() {
  const root = useRef<HTMLElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const statusRef = useRef<HTMLDivElement>(null)
  const interest = useInterest()
  const uid = useId()
  const [values, setValues] = useState<Values>({ name: '', email: '', interest: '', message: '', ack: false })
  const [errors, setErrors] = useState<Errors>({})
  const [touched, setTouched] = useState<Partial<Record<keyof Values, boolean>>>({})
  const [submitted, setSubmitted] = useState(false)
  useReveals(root)

  // Pre-selection from any "Solicitar consulta" button
  useEffect(() => {
    if (interest) setValues((v) => ({ ...v, interest }))
  }, [interest])

  const set = <K extends keyof Values>(k: K, val: Values[K]) => {
    const next = { ...values, [k]: val }
    setValues(next)
    if (k === 'interest') setInterest(val as InterestId)
    if (touched[k]) setErrors(validate(next))
  }
  const blur = (k: keyof Values) => {
    setTouched((t) => ({ ...t, [k]: true }))
    setErrors(validate(values))
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    const errs = validate(values)
    setErrors(errs)
    setTouched({ name: true, email: true, interest: true, message: true, ack: true })
    const first = (Object.keys(errs) as (keyof Values)[])[0]
    if (first) {
      formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus()
      return
    }
    // No backend is connected: nothing is transmitted or stored.
    setSubmitted(true)
    requestAnimationFrame(() => statusRef.current?.focus())
  }

  const reset = () => {
    setValues({ name: '', email: '', interest: '', message: '', ack: false })
    setInterest('')
    setErrors({})
    setTouched({})
    setSubmitted(false)
    requestAnimationFrame(() => document.getElementById('field-name')?.focus())
  }

  const show = (k: keyof Values) => (touched[k] ? errors[k] : undefined)
  const errId = (k: string) => `${uid}-${k}-error`
  const errorCount = Object.keys(errors).filter((k) => touched[k as keyof Values]).length

  return (
    <section ref={root} id="contacto" data-header="light" aria-labelledby="contacto-title" className="relative bg-ivory">
      {/* Atmospheric CTA */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <AmbientVideo name="atmosphere-loop" poster={`${ASSET_BASE}/atmosphere-still-1600.webp`} className="h-full w-full object-cover opacity-70" />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-ivory/60 via-ivory/30 to-ivory" />
        </div>
        <div className="relative mx-auto max-w-[1680px] px-6 pt-32 pb-20 md:px-10 md:pt-48 md:pb-28 lg:px-14">
          <Eyebrow index="VIII" className="text-taupe-deep">
            Contact
          </Eyebrow>
          <h2 id="contacto-title" data-reveal="lines" className="display mt-10 max-w-[16ch] text-[clamp(2.8rem,7.2vw,8.4rem)] text-charcoal">
            <MaskLines lines={['Tu bienestar merece', <em key="a" className="italic text-gold-deep">una atención</em>, 'individual.']} />
          </h2>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1680px] gap-y-16 px-6 pb-28 md:px-10 md:pb-40 lg:grid-cols-12 lg:gap-x-10 lg:px-14">
        {/* Info column */}
        <div className="lg:col-span-4">
          <p data-reveal="fade" className="body-copy max-w-sm">
            Cuéntanos qué te gustaría consultar. En una clínica real, un profesional se pondría en contacto contigo para orientarte sin compromiso.
          </p>
          <dl className="mt-12 border-t border-charcoal/15" data-reveal="fade">
            {PLACEHOLDERS.map((p) => (
              <div key={p.label} className="grid grid-cols-[7rem_1fr] gap-4 border-b border-charcoal/15 py-4">
                <dt className="eyebrow pt-1 text-[0.6rem] text-taupe-deep">{p.label}</dt>
                <dd>
                  <span className="block text-[0.95rem] text-charcoal">{p.value}</span>
                  <span className="mt-0.5 block text-xs text-taupe-deep">{p.note}</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Form */}
        <div className="lg:col-span-7 lg:col-start-6">
          <div role="note" className="mb-10 flex items-start gap-4 border border-gold-deep/40 bg-pearl/60 px-5 py-4 text-sm leading-relaxed text-charcoal">
            <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-deep" />
            <p>
              <strong className="font-semibold">Formulario de demostración.</strong> La validación funciona, pero no hay ningún servicio conectado: los datos no se envían ni se almacenan.
            </p>
          </div>

          {submitted ? (
            <div ref={statusRef} tabIndex={-1} role="status" className="border-t border-charcoal/15 pt-12 outline-none">
              <p className="eyebrow text-gold-deep">Demostración completada</p>
              <p className="display mt-6 text-[clamp(2rem,3.6vw,3.4rem)] text-charcoal">Formulario validado correctamente.</p>
              <p className="body-copy mt-6 max-w-lg">
                Tu mensaje <strong className="font-semibold text-charcoal">no se ha enviado</strong>: este prototipo no está conectado a ningún servicio. En una implementación real, aquí se confirmaría la recepción de la solicitud.
              </p>
              <button type="button" className="btn btn-outline mt-10" onClick={reset}>
                <span>Volver al formulario</span>
              </button>
            </div>
          ) : (
            <form ref={formRef} noValidate onSubmit={onSubmit} aria-describedby={`${uid}-req`} className="space-y-10">
              <p id={`${uid}-req`} className="text-xs text-taupe-deep">
                Todos los campos son obligatorios.
              </p>
              {errorCount > 0 && (
                <p role="alert" className="text-sm text-[#8c3b2e]">
                  Revisa {errorCount === 1 ? 'el campo marcado' : `los ${errorCount} campos marcados`} antes de continuar.
                </p>
              )}

              <div className="grid gap-10 md:grid-cols-2">
                <Field id="field-name" label="Nombre" error={show('name')} errorId={errId('name')}>
                  <input
                    id="field-name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    className="field-input"
                    value={values.name}
                    onChange={(e) => set('name', e.target.value)}
                    onBlur={() => blur('name')}
                    aria-invalid={!!show('name')}
                    aria-describedby={show('name') ? errId('name') : undefined}
                    required
                  />
                </Field>
                <Field id="field-email" label="Correo electrónico" error={show('email')} errorId={errId('email')}>
                  <input
                    id="field-email"
                    name="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    className="field-input"
                    value={values.email}
                    onChange={(e) => set('email', e.target.value)}
                    onBlur={() => blur('email')}
                    aria-invalid={!!show('email')}
                    aria-describedby={show('email') ? errId('email') : undefined}
                    required
                  />
                </Field>
              </div>

              <Field id="field-interest" label="Área de interés" error={show('interest')} errorId={errId('interest')}>
                <div className="relative">
                  <select
                    id="field-interest"
                    name="interest"
                    className="field-input appearance-none pr-8"
                    value={values.interest}
                    onChange={(e) => set('interest', e.target.value as InterestId)}
                    onBlur={() => blur('interest')}
                    aria-invalid={!!show('interest')}
                    aria-describedby={show('interest') ? errId('interest') : undefined}
                    required
                  >
                    <option value="" disabled>
                      Selecciona una opción
                    </option>
                    {INTEREST_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <svg aria-hidden className="pointer-events-none absolute top-1/2 right-1 -translate-y-1/2" width="12" height="8" viewBox="0 0 12 8" fill="none">
                    <path d="M1 1.5l5 5 5-5" stroke="currentColor" />
                  </svg>
                </div>
              </Field>

              <Field id="field-message" label="Mensaje" error={show('message')} errorId={errId('message')} hint={`${values.message.length}/1000`}>
                <textarea
                  id="field-message"
                  name="message"
                  rows={4}
                  maxLength={1000}
                  className="field-input resize-y"
                  value={values.message}
                  onChange={(e) => set('message', e.target.value)}
                  onBlur={() => blur('message')}
                  aria-invalid={!!show('message')}
                  aria-describedby={show('message') ? errId('message') : undefined}
                  placeholder="Cuéntanos brevemente qué te gustaría consultar. No incluyas datos de salud sensibles."
                  required
                />
              </Field>

              <div>
                <label className="flex cursor-pointer items-start gap-4 text-sm leading-relaxed text-charcoal">
                  <input
                    type="checkbox"
                    name="ack"
                    checked={values.ack}
                    onChange={(e) => set('ack', e.target.checked)}
                    onBlur={() => blur('ack')}
                    aria-invalid={!!show('ack')}
                    aria-describedby={show('ack') ? errId('ack') : undefined}
                    className="mt-1 h-4 w-4 shrink-0 accent-charcoal"
                  />
                  <span>Entiendo que AURELIA es un concepto ficticio y que este formulario es solo una demostración.</span>
                </label>
                {show('ack') && (
                  <p id={errId('ack')} className="mt-2 pl-8 text-xs text-[#8c3b2e]">
                    {errors.ack}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-6 pt-2">
                <button type="submit" className="btn btn-dark">
                  <span>Enviar (demostración)</span>
                  <Arrow />
                </button>
                <span className="text-xs text-taupe-deep">Ningún dato sale de tu navegador.</span>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}

function Field({ id, label, error, errorId, hint, children }: { id: string; label: string; error?: string; errorId: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="eyebrow text-[0.62rem] text-taupe-deep">
          {label}
        </label>
        {hint && <span className="text-[0.7rem] text-taupe-deep tabular-nums">{hint}</span>}
      </div>
      {children}
      {error && (
        <p id={errorId} className="mt-2 text-xs text-[#8c3b2e]">
          {error}
        </p>
      )}
    </div>
  )
}
