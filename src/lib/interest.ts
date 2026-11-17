import { useSyncExternalStore } from 'react'

/** Tiny shared store so any "Solicitar consulta" button can pre-select the contact form's area of interest. */
export type InterestId = '' | 'dermatologia' | 'medicina-estetica' | 'cirugia-plastica' | 'orientacion'

let current: InterestId = ''
const listeners = new Set<() => void>()

export function setInterest(next: InterestId) {
  current = next
  listeners.forEach((l) => l())
}

export function useInterest(): InterestId {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => current,
    () => current,
  )
}

/** Pre-select the interest, scroll to the form and move focus to its first field. */
export function requestConsultation(interest: InterestId) {
  setInterest(interest)
  const target = document.getElementById('contacto')
  if (!target) return
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' })
  window.setTimeout(() => document.getElementById('field-name')?.focus({ preventScroll: true }), reduced ? 0 : 900)
}
