import { useEffect, useRef, useState, type ReactNode, type CSSProperties } from 'react'
import { img, srcSet, video, type AssetName } from '../lib/media'
import { prefersReducedMotion } from '../lib/motion'

/** Heading lines wrapped in reveal masks. Pass lines explicitly for typographic control. */
export function MaskLines({ lines, className = '' }: { lines: ReactNode[]; className?: string }) {
  return (
    <>
      {lines.map((line, i) => (
        <span key={i} className={`mask-line ${className}`}>
          <span>{line}</span>
        </span>
      ))}
    </>
  )
}

export function Eyebrow({ index, children, className = '' }: { index?: string; children: ReactNode; className?: string }) {
  return (
    <p className={`eyebrow flex items-center gap-4 ${className}`} data-reveal="fade">
      {index && <span className="tabular-nums opacity-70">{index}</span>}
      {index && <span aria-hidden className="h-px w-10 bg-current opacity-40" />}
      <span>{children}</span>
    </p>
  )
}

export function Arrow({ className = '' }: { className?: string }) {
  return (
    <svg className={`btn-arrow ${className}`} width="22" height="10" viewBox="0 0 22 10" fill="none" aria-hidden>
      <path d="M0 5h20M16 1l4 4-4 4" stroke="currentColor" strokeWidth="1" />
    </svg>
  )
}

type ImgProps = {
  name: AssetName
  alt: string
  sizes?: string
  className?: string
  style?: CSSProperties
  priority?: boolean
  speed?: number
}

/** Responsive WebP with srcset; lazy by default. `speed` enables scrubbed parallax via useParallax. */
export function Picture({ name, alt, sizes = '100vw', className = '', style, priority = false, speed }: ImgProps) {
  return (
    <img
      src={img(name, 1600)}
      srcSet={srcSet(name)}
      sizes={sizes}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      fetchPriority={priority ? 'high' : 'auto'}
      className={className}
      style={style}
      data-speed={speed}
    />
  )
}

/**
 * Background video that only downloads when near the viewport, plays while visible,
 * pauses off-screen, and keeps the poster when reduced motion is requested or playback fails.
 */
export function AmbientVideo({
  name,
  poster,
  className = '',
  eager = false,
  label,
}: {
  name: string
  poster: string
  className?: string
  eager?: boolean
  label?: string
}) {
  const ref = useRef<HTMLVideoElement>(null)
  const [load, setLoad] = useState(eager)
  const [failed, setFailed] = useState(false)
  const [reduced] = useState(prefersReducedMotion)

  useEffect(() => {
    const el = ref.current
    if (!el || reduced) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setLoad(true)
          el.play().catch(() => {})
        } else if (!el.paused) el.pause()
      },
      { rootMargin: '200px 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [reduced])

  useEffect(() => {
    if (load && !reduced) ref.current?.play().catch(() => {})
  }, [load, reduced])

  if (reduced || failed) {
    return <img src={poster} alt="" aria-hidden className={className} decoding="async" loading={eager ? 'eager' : 'lazy'} />
  }

  return (
    <video
      ref={ref}
      className={className}
      poster={poster}
      muted
      loop
      playsInline
      preload={load ? 'auto' : 'none'}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      // React re-dispatches <source> errors to the parent <video>; a non-matching `media` source
      // legitimately "fails" during source selection, so only react to errors on the video itself.
      onError={(e) => e.target === e.currentTarget && setFailed(true)}
      disablePictureInPicture
    >
      {load && <source src={video(name, true)} type="video/mp4" media="(max-width: 767px)" onError={(e) => e.stopPropagation()} />}
      {load && (
        <source
          src={video(name)}
          type="video/mp4"
          onError={(e) => {
            e.stopPropagation()
            setFailed(true) // last candidate failed → keep the poster
          }}
        />
      )}
    </video>
  )
}
