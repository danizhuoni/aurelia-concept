# AURELIA — The Art of Natural Beauty

Fictional luxury aesthetic-medicine, dermatology and plastic-surgery clinic in Madrid.
**Portfolio concept and commercial demonstration by Welegance. Not a real clinic.**

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build to dist/
npm run preview    # serve dist/ on http://localhost:4173
node scripts/qa.mjs http://127.0.0.1:4173/   # automated browser QA (needs `npx playwright-core install chromium`)
```

Stack: React 19 · Vite 8 · TypeScript · Tailwind CSS 4 · GSAP + ScrollTrigger · Three.js / React Three Fiber.

## Narrative architecture

| Act | Section | Technique |
|---|---|---|
| I · The Object | `sections/Story.tsx` + `three/BloomScene.tsx` | Real-time WebGL bloom (R3F). The headline is depth-composited: "BEAUTY," / "SCIENCE." sit on a plane behind the glass, and "refined by" is in front with difference blending. |
| II · Enter | same sticky stage | One scrubbed GSAP timeline drives a progress proxy. The R3F camera follows a spline over and down into the opening petals. |
| III · Skin | same sticky stage | The camera lands on the skin-textured core, then a radial mask crossfades into the macro photograph and its chapter. |
| IV · Specialties | `sections/Chapters.tsx` | Three full-screen scenes with mask transitions, counter-scaled imagery and a chapter navigator. |
| V · The Clinic | `sections/ClinicJourney.tsx` | Four full-bleed video rooms. Arched-doorway mask transitions with forward scale. Only the active film plays. Includes a skip button. |
| VI–VIII | Philosophy, Approach, Contact | Light editorial close. Demo-only validated form. |

Pinned stages use CSS `position: sticky` and scrubbed ScrollTriggers, not GSAP pin-spacers. There is a single
render loop (R3F), and rendering stops when the stage is off-screen or covered by the skin reveal.

## Structure

```
src/
  sections/   Story (I–III), Chapters (IV), ClinicJourney (V), Philosophy, Approach, Contact, Footer
  three/      BloomScene.tsx — procedural petals, materials, lights, camera path (lazy chunk)
  lib/        motion.ts (GSAP helpers), webgl.ts (capability tier, scrollToId), interest.ts, media.ts
  components/ Header (theme follows data-header of the section beneath), DemoNotice, ui
public/assets/aurelia/   optimised media + manifest.json
production/              Higgsfield prompts, logs, raw outputs, rejected takes
scripts/                 optimize-media.mjs, qa.mjs (browser acceptance tests), story-shots.mjs
```

## Notes

- **Contact form is demo-only.** Validation works, but nothing is sent or stored.
- WebGL tiers:
  - **Desktop:** transmission glass.
  - **Mobile and low-memory devices:** lighter translucent materials and a lower pixel ratio.
  - **No WebGL2 or Save-Data on:** a static composition.
- `prefers-reduced-motion`: there is no pinned scrolling. The story, chapters and clinic become ordinary sections, the sculpture stays still but remains draggable, and videos are replaced by posters.
