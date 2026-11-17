// BASE_URL keeps asset paths valid when served from a sub-path (e.g. GitHub Pages /<repo>/)
export const ASSET_BASE = `${import.meta.env.BASE_URL}assets/aurelia`

export type AssetName =
  | 'clinic-reception'
  | 'skin-macro'
  | 'treatment-consultation'
  | 'dermatology-editorial'
  | 'surgery-suite'
  | 'sculpture-reference'
  | 'skincare-still-life'
  | 'clinic-corridor'
  | 'clinic-consultation-wide'
  | 'clinic-treatment-wide'
  | 'atmosphere-still'

/** Widths produced by scripts/optimize-media.mjs */
export const WIDTHS = [640, 1024, 1600, 2400] as const

export const img = (name: AssetName, w: (typeof WIDTHS)[number] = 1600) => `${ASSET_BASE}/${name}-${w}.webp`
export const srcSet = (name: AssetName) => WIDTHS.map((w) => `${img(name, w)} ${w}w`).join(', ')
export const video = (name: string, mobile = false) => `${ASSET_BASE}/${name}${mobile ? '-mobile' : ''}.mp4`
