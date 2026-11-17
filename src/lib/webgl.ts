export type GLTier = 'high' | 'low' | 'none'

/** Capability tier: full transmission on capable desktops, lighter materials on mobile/low-memory, none without WebGL2. */
export function detectTier(): GLTier {
  try {
    const c = document.createElement('canvas')
    const gl = c.getContext('webgl2')
    if (!gl) return 'none'
    gl.getExtension('WEBGL_lose_context')?.loseContext()
  } catch {
    return 'none'
  }
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } }
  if (nav.connection?.saveData) return 'none'
  const small = window.matchMedia('(max-width: 1023px)').matches
  const coarse = window.matchMedia('(pointer: coarse)').matches
  const cores = navigator.hardwareConcurrency || 4
  if (small || coarse || cores <= 4 || (nav.deviceMemory !== undefined && nav.deviceMemory <= 4)) return 'low'
  return 'high'
}

export function scrollToId(id: string) {
  const el = document.getElementById(id)
  if (!el) return
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY, behavior: reduced ? 'auto' : 'smooth' })
}
