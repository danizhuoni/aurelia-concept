# AURELIA — Asset production log

All visual assets were generated with **Higgsfield** via the official CLI (`@higgsfield/cli` 1.2.2) on 2026‑11‑17.
Full per-asset prompts, job IDs, models and output files are recorded in
[`public/assets/aurelia/manifest.json`](../public/assets/aurelia/manifest.json). Exact prompt text sent to Higgsfield lives in
[`production/prompts/`](../production/prompts/), raw API responses in [`production/logs/`](../production/logs/), untouched
originals in [`production/raw/`](../production/raw/).

All people depicted are AI-generated fictional adults. No real patients, staff, results or premises are shown.

## Budget

| | Credits |
|---|---|
| Limit set by client | 300 |
| Iteration 1 (original site) | 80 |
| Iteration 2 (immersive rebuild — clinic journey) | 37 |
| **Total spent** | **117** (balance 790 → 673) |

## Models used

| Model (CLI id) | Used for |
|---|---|
| GPT Image 2.6 (`gpt_image_2_6`) — quality `high`, native WebP output | All 12 stills + 1 keyframe for the atmosphere loop |
| Kling 3.0 (`kling3_0`) — mode `pro`, sound off | All 3 videos (image-to-video) |

Seedance 2.5 (Higgsfield's default video model) was quoted at 128 credits for one 8 s 1080p clip, so Kling 3.0 Pro
(14 credits for the same clip, 1080p) was chosen to stay well inside the 300‑credit limit.

## Assets

| File | Model | Source | Cost | Notes |
|---|---|---|---|---|
| hero-portrait.webp | GPT Image 2.6 | 4K, 3840×2160 | 4.25 | Visual anchor for the campaign |
| hero-portrait.mp4 | Kling 3.0 Pro | i2v from hero still, **8.04 s**, 1920×1080 | 14 | Identity preserved; slow push-in |
| clinic-reception.webp | GPT Image 2.6 | 2K, 2688×1520 | 2.75 | Architectural reference for all interiors |
| clinic-reception.mp4 | Kling 3.0 Pro | i2v from reception still, **6.04 s**, 1912×1080 | 10.5 | Slow dolly |
| skin-macro.webp | GPT Image 2.6 | 2048×2048 | 2.75 | |
| treatment-consultation.webp | GPT Image 2.6 + reception ref | 1792×2240 | 2.75 | Fictional professional & patient |
| treatment-laser.webp | GPT Image 2.6 + reception ref | 1792×2240 | 2.75 | Unbranded equipment |
| dermatology-editorial.webp | GPT Image 2.6 | 1792×2240 | 2.75 | Fictional model |
| surgery-suite.webp | GPT Image 2.6 + reception ref | 2688×1520 | 2.75 | Preparation room, no people |
| clinic-detail.webp | GPT Image 2.6 + reception ref | 1792×2240 | 2.75 | |
| sculpture-reference.webp | GPT Image 2.6 | 2048×2048 | 2.75 | Art direction for the WebGL sculpture + 2.5D fallback |
| atmosphere-loop.mp4 | Kling 3.0 Pro | i2v from `atmosphere-still.webp`, **6.04 s** | 10.5 | Take 2 (see below) |
| skincare-still-life.webp | GPT Image 2.6 | 1792×2240 | 2.75 | Unlabelled vessels |
| clinic-corridor.webp | GPT Image 2.6 + reception ref | 2688×1520 | 2.75 | |
| atmosphere-still.webp *(extra)* | GPT Image 2.6 | 2688×1520 | 2.75 | Keyframe for the loop; also its poster |

Durations: Kling returned the exact requested durations (8 s / 6 s); container lengths are 8.04 s / 6.04 s.

### Regenerated

- **atmosphere-loop.mp4, take 1** (text-to-video, 10.5 credits) was rejected: it showed liquid pouring into a
  glass with brownish streaks rather than layered frosted glass. Kept for reference at
  `production/rejected/atmosphere-loop-v1-text2video.mp4`. Take 2 used an image-first workflow (still → animate).

No other asset needed regeneration.

## Web optimisation (`npm run optimize:media`)

- Images: re-encoded to real WebP with `sharp` at 640 / 1024 / 1600 / 2400 px (never upscaled) plus the canonical
  `<name>.webp`. Served via `srcset`; everything below the hero is `loading="lazy"`.
- Videos: re-encoded with ffmpeg (H.264 High, yuv420p, `+faststart`, audio stripped): a desktop version (≤1920 px)
  and a `-mobile` version (960 px). Hero: 12 MB → 2.1 MB desktop / 0.3 MB mobile.

## Iteration 2 — immersive rebuild (2026‑11‑17)

New assets for the fullscreen clinic journey (all 16:9, reception used as architectural reference for consistency):

| File | Model | Source | Cost |
|---|---|---|---|
| clinic-consultation-wide.webp | GPT Image 2.6 + reception ref | 2K 16:9 | 2.75 |
| clinic-treatment-wide.webp | GPT Image 2.6 + reception ref | 2K 16:9 | 2.75 |
| clinic-consultation.mp4 | Kling 3.0 Pro | i2v slow dolly, 6.04 s, 1912×1080 | 10.5 |
| clinic-treatment.mp4 | Kling 3.0 Pro | i2v lateral glide, 6.04 s, 1912×1080 | 10.5 |
| clinic-corridor.mp4 | Kling 3.0 Pro | i2v forward walk from clinic-corridor.webp, 6.04 s | 10.5 |

No regenerations were needed. No outputs were rejected.

No longer published (kept in `production/raw/`): `hero-portrait` (.webp/.mp4), `clinic-detail`, `treatment-laser`.
The hero is now a real-time WebGL sculpture. Its petals and core are modelled in code; the core's surface uses the
existing `skin-macro.webp` as a texture.
