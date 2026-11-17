import { useLayoutEffect, useEffect, type RefObject, type DependencyList } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)
gsap.defaults({ ease: 'expo.out', duration: 1.4 })

export { gsap, ScrollTrigger }

/** Shared easing language. */
export const EASE = {
  lux: 'expo.out',
  soft: 'power3.out',
  inOut: 'power2.inOut',
} as const

const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return true
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Scoped GSAP hook: everything created inside `setup` is reverted on unmount.
 * `setup` receives the `reduced` flag so each section can provide a calm, static alternative.
 */
export function useGsap(
  scope: RefObject<HTMLElement | null>,
  setup: (ctx: { reduced: boolean; q: (sel: string) => HTMLElement[] }) => void | (() => void),
  deps: DependencyList = [],
) {
  useIsoLayoutEffect(() => {
    const el = scope.current
    if (!el) return
    const reduced = prefersReducedMotion()
    let cleanup: void | (() => void)
    const ctx = gsap.context(() => {
      cleanup = setup({ reduced, q: (sel) => gsap.utils.toArray<HTMLElement>(sel, el) })
    }, el)
    return () => {
      if (typeof cleanup === 'function') cleanup()
      ctx.revert()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

/**
 * Declarative reveals inside a scope. Markup conventions:
 *   [data-reveal="lines"]  → children `.mask-line > span` slide up from a mask
 *   [data-reveal="fade"]   → fade + small rise
 *   [data-reveal="rule"]   → hairline draws from left
 *   [data-reveal="media"]  → clip-path curtain opens, inner media settles from scale 1.15
 * Optional data-delay="0.2" (seconds).
 */
export function useReveals(scope: RefObject<HTMLElement | null>) {
  useGsap(scope, ({ reduced, q }) => {
    if (reduced) return
    const delay = (el: HTMLElement) => parseFloat(el.dataset.delay ?? '0')
    const st = (el: HTMLElement) => ({ trigger: el, start: 'top 86%', once: true })

    q('[data-reveal="lines"]').forEach((el) => {
      gsap.from(el.querySelectorAll('.mask-line > span'), {
        yPercent: 112,
        rotate: 1.5,
        duration: 1.5,
        stagger: 0.09,
        delay: delay(el),
        scrollTrigger: st(el),
      })
    })
    q('[data-reveal="fade"]').forEach((el) => {
      gsap.from(el, { autoAlpha: 0, y: 28, duration: 1.4, ease: EASE.soft, delay: delay(el), scrollTrigger: st(el) })
    })
    q('[data-reveal="rule"]').forEach((el) => {
      gsap.from(el, { scaleX: 0, transformOrigin: '0 50%', duration: 1.8, ease: EASE.inOut, delay: delay(el), scrollTrigger: st(el) })
    })
    q('[data-reveal="media"]').forEach((el) => {
      const inner = el.querySelector('img, video')
      const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 88%', once: true }, delay: delay(el) })
      tl.from(el, { clipPath: 'inset(100% 0% 0% 0%)', duration: 1.6, ease: 'expo.inOut' })
      if (inner) tl.from(inner, { scale: 1.18, duration: 2.2, ease: EASE.lux }, 0.15)
    })
  })
}

/** Scrubbed parallax for any element: data-speed="-0.15" moves against scroll. */
export function useParallax(scope: RefObject<HTMLElement | null>) {
  useGsap(scope, ({ reduced, q }) => {
    if (reduced) return
    q('[data-speed]').forEach((el) => {
      const speed = parseFloat(el.dataset.speed ?? '0')
      gsap.fromTo(
        el,
        { yPercent: -speed * 50 },
        {
          yPercent: speed * 50,
          ease: 'none',
          scrollTrigger: { trigger: el.parentElement ?? el, start: 'top bottom', end: 'bottom top', scrub: true },
        },
      )
    })
  })
}
