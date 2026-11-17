// Automated QA against the running preview server. Usage: node scripts/qa.mjs [baseUrl]
import { chromium } from 'playwright-core'
import { mkdirSync } from 'node:fs'
import sharp from 'sharp'

const BASE = process.argv[2] ?? 'http://127.0.0.1:4173/'
const OUT = '/tmp/aurelia-qa'
mkdirSync(OUT, { recursive: true })
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const results = []
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail })
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`)
}
/** Mean absolute pixel difference (0..255) between two PNG buffers. */
async function diff(a, b) {
  const [ra, rb] = await Promise.all([a, b].map((x) => sharp(x).resize(320, 200, { fit: 'fill' }).raw().toBuffer()))
  let sum = 0
  for (let i = 0; i < ra.length; i++) sum += Math.abs(ra[i] - rb[i])
  return sum / ra.length
}

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })

async function newPage(viewport, opts = {}) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1, reducedMotion: opts.reduced ? 'reduce' : 'no-preference', isMobile: !!opts.mobile, hasTouch: !!opts.mobile })
  const page = await ctx.newPage()
  const errors = []
  const failed = []
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  page.on('pageerror', (e) => errors.push(String(e)))
  page.on('requestfailed', (r) => {
    const f = r.failure()?.errorText ?? ''
    if (!f.includes('ERR_ABORTED')) failed.push(`${r.url()} ${f}`)
  })
  page.on('response', (r) => r.status() >= 400 && failed.push(`${r.status()} ${r.url()}`))
  return { ctx, page, errors, failed }
}
async function glide(page, target, steps = 10, pause = 60) {
  const cur = await page.evaluate(() => scrollY)
  for (let k = 1; k <= steps; k++) {
    await page.evaluate((y) => scrollTo(0, y), cur + ((target - cur) * k) / steps)
    await wait(pause)
  }
}
const sectionY = (page, id, f = 0) =>
  page.evaluate(
    ([id, f]) => {
      const el = document.getElementById(id)
      return el.offsetTop + (el.offsetHeight - innerHeight) * f
    },
    [id, f],
  )
const shot = (page, name) => page.screenshot({ path: `${OUT}/${name}.jpg`, type: 'jpeg', quality: 70 })

// ───────────────────────── Desktop
{
  const { ctx, page, errors, failed } = await newPage({ width: 1440, height: 900 })
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await wait(5500)
  await shot(page, 'd-01-hero')

  const gl = await page.evaluate(() => {
    const c = document.querySelector('#top canvas')
    return c ? { w: c.width, h: c.height, webgl2: !!c.getContext('webgl2') } : null
  })
  check('Hero contains a WebGL2 canvas', !!gl?.webgl2, JSON.stringify(gl))

  // Cursor interaction must change the render far more than idle motion does
  const clip = { x: 300, y: 150, width: 840, height: 560 }
  await page.mouse.move(720, 450)
  await wait(2000)
  const a = await page.screenshot({ clip })
  await wait(1500)
  const b = await page.screenshot({ clip })
  await page.mouse.move(1400, 120, { steps: 12 })
  await wait(1500)
  const c = await page.screenshot({ clip })
  const idle = await diff(a, b)
  const moved = await diff(b, c)
  check('Cursor movement visibly reorients the 3D sculpture', moved > Math.max(4, idle * 2.5), `idle Δ=${idle.toFixed(2)} · cursor Δ=${moved.toFixed(2)}`)
  await shot(page, 'd-02-hero-cursor')

  // Drag rotates
  await page.mouse.move(720, 450)
  await wait(1200)
  const d0 = await page.screenshot({ clip })
  await page.mouse.down()
  await page.mouse.move(980, 450, { steps: 14 })
  await page.mouse.up()
  await wait(600)
  const d1 = await page.screenshot({ clip })
  check('Dragging rotates the sculpture', (await diff(d0, d1)) > 4, `Δ=${(await diff(d0, d1)).toFixed(2)}`)

  // Scroll drives the camera into the sculpture
  const s0 = await page.screenshot()
  await glide(page, await sectionY(page, 'top', 0.4), 12)
  await wait(2200)
  await shot(page, 'd-03-enter')
  const s1 = await page.screenshot()
  check('Scrolling moves the 3D camera (Act II)', (await diff(s0, s1)) > 15, `Δ=${(await diff(s0, s1)).toFixed(1)}`)
  await glide(page, await sectionY(page, 'top', 0.99), 14)
  await wait(2500)
  await shot(page, 'd-04-skin')
  const skin = await page.evaluate(() => getComputedStyle(document.querySelector('[data-skin]')).opacity)
  check('Skin reveal completes at the end of the story', skin === '1', `opacity ${skin}`)

  // Specialties: navigator
  await glide(page, await sectionY(page, 'especialidades', 0.02), 8)
  await wait(1800)
  await shot(page, 'd-05-derm')
  await page.getByRole('button', { name: 'Ir a Medicina estética' }).click()
  await wait(2600)
  await shot(page, 'd-06-aest')
  const cur = await page.evaluate(() => document.querySelector('#especialidades [aria-current="step"]')?.getAttribute('aria-label'))
  check('Chapter navigator jumps to Medicina estética', cur === 'Ir a Medicina estética', String(cur))
  await page.getByRole('button', { name: 'Ir a Cirugía plástica' }).click()
  await wait(2600)
  await shot(page, 'd-07-surg')
  await page.locator('article[aria-labelledby="cirugia-plastica-title"]').getByRole('button', { name: /Solicitar consulta/ }).click()
  await wait(2200)
  const pre = await page.evaluate(() => document.getElementById('field-interest').value)
  check('Specialty CTA pre-selects area and reaches the form', pre === 'cirugia-plastica', pre)

  // Clinic journey
  await glide(page, await sectionY(page, 'la-clinica', 0.02), 10)
  await wait(2500)
  await shot(page, 'd-08-arrival')
  const v0 = await page.evaluate(() => [...document.querySelectorAll('#la-clinica video')].filter((v) => !v.paused).map((v) => v.currentSrc.split('/').pop()))
  check('Arrival scene plays only its own video', v0.length === 1 && v0[0].startsWith('clinic-reception'), v0.join(','))
  await glide(page, await sectionY(page, 'la-clinica', 0.2), 10)
  await wait(1500)
  await shot(page, 'd-09-doorway')
  await page.getByRole('button', { name: /Ir a Escena 03/ }).click()
  await wait(3000)
  await shot(page, 'd-10-precision')
  const v2 = await page.evaluate(() => [...document.querySelectorAll('#la-clinica video')].filter((v) => !v.paused).map((v) => v.currentSrc.split('/').pop()))
  check('Scene navigation reaches Precisión and plays its film', v2.length === 1 && v2[0].startsWith('clinic-treatment'), v2.join(','))
  const loaded = await page.evaluate(() => [...document.querySelectorAll('#la-clinica video')].filter((v) => v.currentSrc).length)
  check('Clinic journey never loads all films at once', loaded <= 3, `${loaded} with a source`)
  await glide(page, await sectionY(page, 'la-clinica', 0.99), 10)
  await wait(2000)
  await shot(page, 'd-11-tranquility')
  await page.getByRole('button', { name: /Saltar recorrido/ }).click()
  await wait(1800)
  const phil = await page.evaluate(() => Math.round(document.getElementById('filosofia').getBoundingClientRect().top))
  check('"Saltar recorrido" skips to Filosofía', Math.abs(phil) < 30, `${phil}px`)
  await shot(page, 'd-12-philosophy')

  // Form
  await page.evaluate(() => document.getElementById('contacto').scrollIntoView())
  await wait(800)
  await page.getByRole('button', { name: 'Volver al formulario' }).isVisible().catch(() => false)
  await page.fill('#field-name', '')
  await page.selectOption('#field-interest', { index: 0 }).catch(() => {})
  await page.evaluate(() => document.querySelector('#contacto form').scrollIntoView())
  await page.getByRole('button', { name: /Enviar/ }).click()
  await wait(400)
  const invalid = await page.evaluate(() => document.querySelectorAll('#contacto [aria-invalid="true"]').length)
  check('Empty/invalid submit flags fields', invalid >= 4, `${invalid} invalid`)
  await page.fill('#field-name', 'Ana Prueba')
  await page.fill('#field-email', 'ana@ejemplo.com')
  await page.selectOption('#field-interest', 'dermatologia')
  await page.fill('#field-message', 'Mensaje de prueba para la demo.')
  await page.check('input[name="ack"]')
  await page.getByRole('button', { name: /Enviar/ }).click()
  await wait(500)
  const status = await page.evaluate(() => document.querySelector('#contacto [role="status"]')?.textContent ?? '')
  check('Valid submit is clearly demo-only (not "sent")', status.includes('no se ha enviado'))

  const badAnchors = await page.evaluate(() =>
    [...document.querySelectorAll('a[href^="#"]')].map((a) => a.getAttribute('href')).filter((h) => h.length > 1 && !document.getElementById(h.slice(1))),
  )
  check('All in-page anchors resolve', badAnchors.length === 0, badAnchors.join(', '))
  const h1 = await page.evaluate(() => document.querySelectorAll('h1').length)
  check('Exactly one h1', h1 === 1)
  const noAlt = await page.evaluate(() => [...document.querySelectorAll('img')].filter((i) => !i.hasAttribute('alt')).length)
  check('All <img> have alt', noAlt === 0)
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
  check('Desktop: no horizontal overflow', overflow <= 0, `${overflow}px`)
  check('Desktop: no console errors', errors.length === 0, errors.slice(0, 4).join(' | '))
  check('Desktop: no failed requests', failed.length === 0, failed.slice(0, 4).join(' | '))
  await ctx.close()
}

// ───────────────────────── Mobile
{
  const { ctx, page, errors, failed } = await newPage({ width: 390, height: 844 }, { mobile: true })
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await wait(5500)
  await shot(page, 'm-01-hero')
  check('Mobile hero renders WebGL', await page.evaluate(() => !!document.querySelector('#top canvas')))
  await page.getByRole('button', { name: 'Abrir menú' }).click()
  await wait(400)
  check('Mobile menu opens', await page.evaluate(() => !document.getElementById('mobile-menu').hidden))
  await page.locator('#mobile-menu a', { hasText: 'La Clínica' }).click()
  await wait(2200)
  const t = await page.evaluate(() => Math.abs(document.getElementById('la-clinica').getBoundingClientRect().top))
  check('Mobile menu navigates to La Clínica', t < 40, `${Math.round(t)}px`)
  await shot(page, 'm-02-clinic')
  await glide(page, await sectionY(page, 'especialidades', 0.5), 10)
  await wait(2000)
  await shot(page, 'm-03-aest')
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
  check('Mobile: no horizontal overflow', overflow <= 0, `${overflow}px`)
  check('Mobile: no console errors', errors.length === 0, errors.slice(0, 4).join(' | '))
  check('Mobile: no failed requests', failed.length === 0, failed.slice(0, 4).join(' | '))
  await ctx.close()
}

// ───────────────────────── Reduced motion
{
  const { ctx, page, errors } = await newPage({ width: 1280, height: 800 }, { reduced: true })
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await wait(2500)
  const h = await page.evaluate(() => document.getElementById('top').offsetHeight / innerHeight)
  check('Reduced motion: no long pinned story', h <= 1.05, `${h.toFixed(2)} viewports`)
  check('Reduced motion: skin chapter is a regular section', await page.evaluate(() => document.querySelector('section#piel') !== null))
  const vids = await page.evaluate(() => document.querySelectorAll('video').length)
  check('Reduced motion: no autoplay videos', vids === 0, `${vids} videos`)
  await page.evaluate(() => document.getElementById('especialidades').scrollIntoView())
  await wait(800)
  await shot(page, 'r-01-chapters')
  check('Reduced motion: no console errors', errors.length === 0, errors.slice(0, 4).join(' | '))
  await ctx.close()
}

await browser.close()
const bad = results.filter((r) => !r.ok)
console.log(`\n${results.length - bad.length}/${results.length} checks passed. Screenshots: ${OUT}`)
process.exit(bad.length ? 1 : 0)
