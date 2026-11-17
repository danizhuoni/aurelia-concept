// Optimizes raw Higgsfield outputs (production/raw) into web-ready assets (public/assets/aurelia)
// and writes an asset manifest from the generation logs (production/logs).
//   Images -> real WebP re-encodes at several widths (sharp)
//   Videos -> H.264 MP4, yuv420p, faststart, no audio, desktop + mobile variants (ffmpeg-static)
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import ffmpeg from 'ffmpeg-static'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const RAW = path.join(root, 'production/raw')
const LOGS = path.join(root, 'production/logs')
const OUT = path.join(root, 'public/assets/aurelia')
mkdirSync(OUT, { recursive: true })

const WIDTHS = [640, 1024, 1600, 2400] // fixed set so srcset in code always matches; never upscales

// raw log name -> public file name (videos are logged with a -video suffix)
const VIDEO_MAP = {
  'hero-portrait-video': 'hero-portrait',
  'clinic-reception-video': 'clinic-reception',
  'atmosphere-loop': 'atmosphere-loop',
  'clinic-consultation-video': 'clinic-consultation',
  'clinic-treatment-video': 'clinic-treatment',
  'clinic-corridor-video': 'clinic-corridor',
}

// Generated in the first iteration but no longer used by the immersive build (kept in production/raw).
const UNUSED = new Set(['hero-portrait', 'hero-portrait-video', 'clinic-detail', 'treatment-laser'])

const kb = (f) => Math.round(statSync(f).size / 1024)
const manifest = { generatedAt: new Date().toISOString(), note: 'Fictional concept assets generated with Higgsfield for the AURELIA demo by Welegance. No real people, patients, staff or clinical results are depicted.', assets: [] }

function logFor(name) {
  const f = path.join(LOGS, `${name}.json`)
  if (!existsSync(f) || statSync(f).size === 0) return null
  const d = JSON.parse(readFileSync(f, 'utf8'))
  return Array.isArray(d) ? d[0] : d
}

for (const file of readdirSync(RAW).sort()) {
  const ext = path.extname(file).toLowerCase()
  const name = path.basename(file, ext)
  const src = path.join(RAW, file)
  if (UNUSED.has(name)) continue
  const log = logFor(name)
  const entry = {
    source: `production/raw/${file}`,
    model: log ? `${log.display_name} (${log.job_type})` : 'unknown',
    jobId: log?.id ?? null,
    createdAt: log?.created_at ?? null,
    params: log ? Object.fromEntries(Object.entries(log.params).filter(([k]) => ['aspect_ratio', 'resolution', 'quality', 'duration', 'mode', 'width', 'height'].includes(k))) : {},
    prompt: log?.params?.prompt ?? null,
    outputs: [],
  }

  if (['.webp', '.png', '.jpg', '.jpeg'].includes(ext)) {
    const meta = await sharp(src).metadata()
    entry.sourceSize = `${meta.width}x${meta.height}`
    for (const w of WIDTHS) {
      const out = path.join(OUT, `${name}-${w}.webp`)
      const info = await sharp(src).resize({ width: w, withoutEnlargement: true }).webp({ quality: w <= 1024 ? 76 : 80, effort: 5 }).toFile(out)
      entry.outputs.push({ file: `public/assets/aurelia/${name}-${w}.webp`, width: info.width, kb: kb(out) })
    }
    // canonical file name requested in the brief
    const canon = path.join(OUT, `${name}.webp`)
    await sharp(src).resize({ width: 2400, withoutEnlargement: true }).webp({ quality: 80, effort: 5 }).toFile(canon)
    entry.file = `${name}.webp`
    entry.outputs.unshift({ file: `public/assets/aurelia/${name}.webp`, kb: kb(canon) })
  } else if (ext === '.mp4') {
    const pub = VIDEO_MAP[name] ?? name
    entry.file = `${pub}.mp4`
    const variants = [
      { suffix: '', width: 1920, crf: 23 },
      { suffix: '-mobile', width: 960, crf: 26 },
    ]
    for (const v of variants) {
      const out = path.join(OUT, `${pub}${v.suffix}.mp4`)
      execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-i', src, '-vf', `scale='min(${v.width},iw)':-2`, '-c:v', 'libx264', '-preset', 'slow', '-crf', String(v.crf), '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', out])
      entry.outputs.push({ file: `public/assets/aurelia/${pub}${v.suffix}.mp4`, kb: kb(out) })
    }
    const probe = (() => { try { execFileSync(ffmpeg, ['-i', src], { stdio: 'pipe' }) } catch (e) { return String(e.stderr) } })()
    entry.duration = probe.match(/Duration: ([\d:.]+)/)?.[1] ?? null
    entry.sourceSize = probe.match(/, (\d{3,5}x\d{3,5})/)?.[1] ?? null
  } else continue

  manifest.assets.push(entry)
  console.log(`✓ ${entry.file}  [${entry.model}]  ${entry.outputs.map((o) => o.kb + 'KB').join(' / ')}`)
}

writeFileSync(path.join(root, 'public/assets/aurelia/manifest.json'), JSON.stringify(manifest, null, 2))
console.log(`\nManifest: public/assets/aurelia/manifest.json (${manifest.assets.length} assets)`)
