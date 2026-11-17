// Captures the scroll narrative at fixed points for visual review. Usage: node scripts/story-shots.mjs [w] [h] [prefix]
import { chromium } from 'playwright-core'
const [w = 1440, h = 900, prefix = 'st'] = process.argv.slice(2)
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
const p = await b.newPage({ viewport: { width: +w, height: +h }, isMobile: +w < 700, hasTouch: +w < 700 })
const errs = []
p.on('pageerror', (e) => errs.push(String(e)))
p.on('console', (m) => m.type() === 'error' && errs.push(m.text()))
await p.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' })
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
await wait(5200)
await p.mouse.move(+w * 0.8, +h * 0.3)
await wait(1200)
await p.screenshot({ path: `/tmp/aurelia-qa/${prefix}-0.jpg`, type: 'jpeg', quality: 72 })
const story = await p.evaluate(() => { const el = document.getElementById('top'); return { top: el.offsetTop, range: el.offsetHeight - innerHeight } })
let i = 1
for (const f of [0.18, 0.38, 0.58, 0.74, 0.84, 0.98]) {
  // scroll gradually so scrubbed timelines follow
  const target = story.top + story.range * f
  const cur = await p.evaluate(() => scrollY)
  for (let k = 1; k <= 8; k++) { await p.evaluate((y) => scrollTo(0, y), cur + ((target - cur) * k) / 8); await wait(60) }
  await wait(2200)
  await p.screenshot({ path: `/tmp/aurelia-qa/${prefix}-${i++}.jpg`, type: 'jpeg', quality: 72 })
}
console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'no errors')
await b.close()
