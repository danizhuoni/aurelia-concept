/**
 * AURELIA — "The Bloom". Signature WebGL scene for Acts I–III.
 *
 * A floating sculptural flower built from individually modelled petals in three rings
 * (frosted ivory ceramic · champagne glass · frosted glass) around a core that carries real skin texture.
 * The headline words "BEAUTY," / "SCIENCE." are rendered on a plane *behind* the sculpture so the glass
 * genuinely occludes and refracts them; the HTML layer in front adds "refined by".
 *
 * Scroll progress (0..1) comes from one GSAP ScrollTrigger timeline via `progress` and is read here inside
 * R3F's single render loop — no competing loops.
 */
import { useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react'
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

export type Tier = 'high' | 'low'

export type BloomProps = {
  progress: MutableRefObject<number>
  tier: Tier
  reduced: boolean
  skinUrl: string
  onReady?: () => void
  onHoverRing?: (ring: number | null) => void
  onSelectRing?: (ring: number) => void
}

/* ─────────────────────────────── Geometry ─────────────────────────────── */

type PetalSpec = { L: number; W: number; cup: number; curl: number; ruffle: number }

/** One petal: grows along +Y, width along X, cupped toward −Z (the centre), tip curling outward. */
function petalGeometry(p: PetalSpec, segU: number, segV: number) {
  const pos: number[] = []
  const uv: number[] = []
  const idx: number[] = []
  for (let j = 0; j <= segV; j++) {
    const v = j / segV
    const width = p.W * Math.pow(Math.sin(Math.PI * (0.04 + 0.92 * v)), 0.72) * (1 - 0.18 * v)
    for (let i = 0; i <= segU; i++) {
      const u = (i / segU) * 2 - 1
      const x = u * width
      const y = p.L * v
      // +z = away from the flower's centre. Mid-line sits outward, edges wrap toward the centre (cup);
      // the tip reflexes outward; the rim gets a soft organic ruffle.
      const z =
        p.cup * (1 - u * u) * Math.sin(Math.PI * Math.min(1, v * 1.1)) +
        p.curl * Math.pow(v, 2.4) +
        p.ruffle * Math.sin(u * 7 + v * 5) * v * v * Math.abs(u)
      pos.push(x, y, z)
      uv.push(i / segU, v)
    }
  }
  const row = segU + 1
  for (let j = 0; j < segV; j++)
    for (let i = 0; i < segU; i++) {
      const a = j * row + i
      idx.push(a, a + row, a + 1, a + row, a + row + 1, a + 1)
    }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.setIndex(idx)
  g.computeVertexNormals()
  return g
}

type RingSpec = { count: number; petal: PetalSpec; r0: number; tilt: number; open: number; y: number; twist: number }

/** 0 = Dermatología (ceramic core ring) · 1 = Medicina estética (champagne glass) · 2 = Cirugía plástica (frosted glass) */
const RINGS: RingSpec[] = [
  { count: 5, petal: { L: 1.12, W: 0.44, cup: 0.2, curl: 0.06, ruffle: 0.015 }, r0: 0.16, tilt: 0.2, open: 0.42, y: 0.0, twist: 0.0 },
  { count: 7, petal: { L: 1.5, W: 0.62, cup: 0.24, curl: 0.16, ruffle: 0.03 }, r0: 0.22, tilt: 0.52, open: 0.62, y: -0.06, twist: 0.45 },
  { count: 9, petal: { L: 1.95, W: 0.82, cup: 0.3, curl: 0.3, ruffle: 0.045 }, r0: 0.3, tilt: 0.86, open: 0.72, y: -0.14, twist: 0.2 },
]

/* ─────────────────────────────── Camera path ─────────────────────────────── */

const HERO_CAM = new THREE.Vector3(0, 2.1, 8.3)
const HERO_LOOK = new THREE.Vector3(0, 0.78, 0)

// Act I hero framing → rise over the bloom → descend through the opening → land on the skin core.
const CAM = new THREE.CatmullRomCurve3(
  [
    HERO_CAM.clone(),
    new THREE.Vector3(0.7, 3.6, 5.8),
    new THREE.Vector3(0.3, 4.8, 2.6),
    new THREE.Vector3(0.05, 3.0, 0.5),
    new THREE.Vector3(0.0, 1.6, 0.06),
    new THREE.Vector3(0.0, 1.12, 0.02),
  ],
  false,
  'centripetal',
)
const LOOK = new THREE.CatmullRomCurve3(
  [
    HERO_LOOK.clone(),
    new THREE.Vector3(0, 0.55, 0),
    new THREE.Vector3(0, 0.45, 0),
    new THREE.Vector3(0, 0.35, 0),
    new THREE.Vector3(0, 0.3, 0),
    new THREE.Vector3(0, 0.2, 0),
  ],
  false,
  'centripetal',
)

const ss = (a: number, b: number, x: number) => THREE.MathUtils.smoothstep(x, a, b)

/* ─────────────────────────────── Materials ─────────────────────────────── */

function makeMaterials(tier: Tier) {
  const side = THREE.DoubleSide
  const ceramic = new THREE.MeshPhysicalMaterial({
    color: '#e4d8c8', roughness: 0.5, clearcoat: 0.15, clearcoatRoughness: 0.4, sheen: 0.6, sheenColor: new THREE.Color('#fff1df'), sheenRoughness: 0.5, side,
  })
  const champagne =
    tier === 'high'
      ? new THREE.MeshPhysicalMaterial({
          color: '#e8c9a3', transmission: 0.72, thickness: 0.32, roughness: 0.1, ior: 1.46, attenuationColor: new THREE.Color('#c99c6c'), attenuationDistance: 0.9, clearcoat: 0.5, clearcoatRoughness: 0.08, specularIntensity: 1, side,
        })
      : new THREE.MeshPhysicalMaterial({ color: '#d9b994', roughness: 0.16, metalness: 0.05, clearcoat: 0.6, transparent: true, opacity: 0.62, depthWrite: false, side })
  const frosted =
    tier === 'high'
      ? new THREE.MeshPhysicalMaterial({
          color: '#efe6da', transmission: 0.58, thickness: 0.22, roughness: 0.36, ior: 1.42, clearcoat: 0.3, clearcoatRoughness: 0.3, specularIntensity: 0.8, side,
        })
      : new THREE.MeshPhysicalMaterial({ color: '#efe6da', roughness: 0.3, clearcoat: 0.4, transparent: true, opacity: 0.4, depthWrite: false, side })
  return [ceramic, champagne, frosted]
}

/* ─────────────────────────────── Scene parts ─────────────────────────────── */

function Environment({ intensity }: { intensity: number }) {
  const { gl, scene } = useThree()
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl)
    const room = new RoomEnvironment()
    const env = pmrem.fromScene(room, 0.04).texture
    scene.environment = env
    scene.environmentIntensity = intensity
    return () => {
      scene.environment = null
      env.dispose()
      pmrem.dispose()
      room.traverse((o) => {
        const m = o as THREE.Mesh
        m.geometry?.dispose?.()
      })
    }
  }, [gl, scene, intensity])
  return null
}

/** Warm studio glow behind the object. */
function Backdrop() {
  const tex = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = c.height = 256
    const ctx = c.getContext('2d')!
    const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128)
    g.addColorStop(0, 'rgba(92,76,60,0.85)')
    g.addColorStop(0.45, 'rgba(52,44,37,0.5)')
    g.addColorStop(1, 'rgba(19,19,17,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 256, 256)
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [])
  useEffect(() => () => tex.dispose(), [tex])
  return (
    <mesh position={[0, 0.6, -4.5]}>
      <planeGeometry args={[16, 16]} />
      <meshBasicMaterial map={tex} transparent depthWrite={false} toneMapped={false} fog={false} />
    </mesh>
  )
}

/**
 * "BEAUTY," and "SCIENCE." drawn into a texture on a plane behind the sculpture.
 * Sized to fill the hero frame at its resting distance so it lines up with the HTML layer.
 */
function BackText() {
  const { size } = useThree()
  const [ready, setReady] = useState(false)
  useEffect(() => {
    let alive = true
    const fam = '"Cormorant Garamond Variable"'
    Promise.all([document.fonts.load(`300 200px ${fam}`), document.fonts.load(`italic 300 200px ${fam}`)])
      .catch(() => null)
      .then(() => alive && setReady(true))
    return () => {
      alive = false
    }
  }, [])

  const FOV = 32
  const { center, quat, DIST } = useMemo(() => {
    const dir = HERO_LOOK.clone().sub(HERO_CAM).normalize()
    const center = HERO_LOOK.clone().addScaledVector(dir, 2.2)
    const m = new THREE.Matrix4().lookAt(HERO_CAM, center, new THREE.Vector3(0, 1, 0))
    const quat = new THREE.Quaternion().setFromRotationMatrix(m)
    return { center, quat, DIST: HERO_CAM.distanceTo(center) }
  }, [])
  const aspect = size.width / Math.max(1, size.height)
  const planeH = 2 * DIST * Math.tan(THREE.MathUtils.degToRad(FOV / 2))
  const planeW = planeH * aspect

  const tex = useMemo(() => {
    if (!ready) return null
    const W = 2400
    const H = Math.round(W / aspect)
    const c = document.createElement('canvas')
    c.width = W
    c.height = H
    const ctx = c.getContext('2d')!
    const portrait = aspect < 0.9
    const drawSpaced = (text: string, size: number, x: number, y: number, align: 'left' | 'right', spacing: number, italic = false) => {
      ctx.font = `${italic ? 'italic ' : ''}300 ${size}px "Cormorant Garamond Variable", Georgia, serif`
      const widths = [...text].map((ch) => ctx.measureText(ch).width)
      const total = widths.reduce((a, b) => a + b, 0) + spacing * size * (text.length - 1)
      let cx = align === 'left' ? x : x - total
      ;[...text].forEach((ch, i) => {
        ctx.fillText(ch, cx, y)
        cx += widths[i] + spacing * size
      })
      return total
    }
    const fit = (text: string, maxW: number, maxSize: number, spacing: number) => {
      ctx.font = `300 100px "Cormorant Garamond Variable", Georgia, serif`
      const w100 = [...text].reduce((a, ch) => a + ctx.measureText(ch).width, 0) + spacing * 100 * (text.length - 1)
      return Math.min(maxSize, (maxW / w100) * 100)
    }
    ctx.fillStyle = '#f2ede6'
    ctx.textBaseline = 'alphabetic'
    if (portrait) {
      const s = fit('SCIENCE.', W * 0.88, H * 0.12, 0.04)
      drawSpaced('BEAUTY,', s, W * 0.06, H * 0.27, 'left', 0.04)
      drawSpaced('SCIENCE.', s, W * 0.94, H * 0.76, 'right', 0.04)
    } else {
      const s = fit('SCIENCE.', W * 0.6, H * 0.22, 0.035)
      drawSpaced('BEAUTY,', s, W * 0.055, H * 0.36, 'left', 0.035)
      drawSpaced('SCIENCE.', s, W * 0.945, H * 0.88, 'right', 0.035)
    }
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 4
    return t
  }, [ready, aspect])
  useEffect(() => () => tex?.dispose(), [tex])

  if (!tex) return null
  return (
    <mesh position={center} quaternion={quat}>
      <planeGeometry args={[planeW, planeH]} />
      <meshBasicMaterial map={tex} transparent toneMapped={false} depthWrite={false} fog={false} />
    </mesh>
  )
}

/* ─────────────────────────────── The Bloom ─────────────────────────────── */

function Bloom({ progress, tier, reduced, skinUrl, onHoverRing, onSelectRing }: BloomProps) {
  const root = useRef<THREE.Group>(null)
  const rings = useRef<(THREE.Group | null)[]>([])
  const petals = useRef<THREE.Mesh[][]>([[], [], []])
  const core = useRef<THREE.Mesh>(null)
  const heart = useRef<THREE.PointLight>(null)
  const { gl, camera, size } = useThree()
  const [hover, setHover] = useState<number | null>(null)

  const geos = useMemo(() => RINGS.map((r) => petalGeometry(r.petal, tier === 'high' ? 36 : 20, tier === 'high' ? 44 : 24)), [tier])
  const mats = useMemo(() => makeMaterials(tier), [tier])
  const coreGeo = useMemo(() => new THREE.SphereGeometry(0.42, tier === 'high' ? 96 : 48, tier === 'high' ? 64 : 32), [tier])
  const skin = useMemo(() => {
    const t = new THREE.TextureLoader().load(skinUrl)
    t.colorSpace = THREE.SRGBColorSpace
    t.wrapS = t.wrapT = THREE.MirroredRepeatWrapping
    t.repeat.set(2, 1)
    t.anisotropy = 8
    return t
  }, [skinUrl])
  const coreMat = useMemo(
    () => new THREE.MeshPhysicalMaterial({ map: skin, color: '#efdccb', roughness: 0.62, clearcoat: 0.08, clearcoatRoughness: 0.6, envMapIntensity: 0.5 }),
    [skin],
  )
  useEffect(
    () => () => {
      geos.forEach((g) => g.dispose())
      mats.forEach((m) => m.dispose())
      coreGeo.dispose()
      coreMat.dispose()
      skin.dispose()
    },
    [geos, mats, coreGeo, coreMat, skin],
  )

  // Pointer + drag state lives outside React
  const st = useRef({ tx: 0, ty: 0, px: 0, py: 0, spin: 0, vel: 0, dragging: false, lastX: 0, intro: reduced ? 1 : 0, t0: -1 })

  useEffect(() => {
    const el = gl.domElement
    const s = st.current
    const onMove = (e: PointerEvent) => {
      s.tx = (e.clientX / window.innerWidth) * 2 - 1
      s.ty = (e.clientY / window.innerHeight) * 2 - 1
      if (s.dragging) {
        const dx = e.clientX - s.lastX
        s.lastX = e.clientX
        s.vel = dx * 0.006
        s.spin += s.vel
      }
    }
    const onDown = (e: PointerEvent) => {
      s.dragging = true
      s.lastX = e.clientX
      s.vel = 0
    }
    const onUp = () => (s.dragging = false)
    window.addEventListener('pointermove', onMove, { passive: true })
    el.addEventListener('pointerdown', onDown)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [gl])

  useEffect(() => {
    gl.domElement.style.cursor = hover !== null ? 'pointer' : 'grab'
    onHoverRing?.(hover)
  }, [hover, gl, onHoverRing])

  const look = useMemo(() => new THREE.Vector3(), [])
  const camPos = useMemo(() => new THREE.Vector3(), [])

  useFrame((state, dtRaw) => {
    const dt = Math.min(dtRaw, 1 / 30)
    const s = st.current
    const time = state.clock.elapsedTime
    const p = THREE.MathUtils.clamp(progress.current, 0, 1)

    // Load-in: camera approaches from distance
    if (s.t0 < 0) s.t0 = time
    s.intro = reduced ? 1 : Math.min(1, (time - s.t0) / 3.2)
    const intro = 1 - Math.pow(1 - s.intro, 3)

    const engageCam = (1 - ss(0.04, 0.3, p)) * (reduced ? 0 : 1)

    // Camera along the scroll path (+ intro distance on load)
    const portrait = size.width / size.height < 0.9
    CAM.getPoint(p, camPos)
    LOOK.getPoint(p, look)
    const back = (1 - intro) * 6 + (portrait ? 5.2 * (1 - ss(0.0, 0.45, p)) : 0)
    // Cursor parallax: the camera drifts with the pointer so the headline plane slides behind the object
    camera.position.set(camPos.x + s.px * 0.9 * engageCam, camPos.y + (1 - intro) * 0.6 - s.py * 0.5 * engageCam, camPos.z + back)
    camera.lookAt(look)

    // Damped pointer response, fading out as we enter the sculpture
    const engage = (1 - ss(0.05, 0.35, p)) * (reduced ? 0 : 1)
    const k = 1 - Math.pow(0.03, dt)
    s.px += (s.tx * engage - s.px) * k
    s.py += (s.ty * engage - s.py) * k
    if (!s.dragging) {
      s.vel *= Math.pow(0.05, dt)
      s.spin += s.vel
      if (!reduced) s.spin += dt * 0.06 // extremely slow idle rotation
    }

    const g = root.current
    if (g) {
      g.rotation.y = s.spin + s.px * 0.5 + p * 0.9
      g.rotation.x = 0.06 + s.py * 0.38 // tilt toward the cursor
      g.rotation.z = -s.px * 0.26 // roll — clearly visible on a radially symmetric form
      g.position.y = reduced ? 0 : Math.sin(time * 0.5) * 0.05 * (1 - p)
    }

    // Petal breathing (independent phases) + scroll-driven opening/separation
    const open = ss(0.08, 0.7, p)
    RINGS.forEach((r, ri) => {
      const ring = rings.current[ri]
      if (ring) {
        ring.rotation.y = r.twist + open * [0.35, -0.5, 0.6][ri]
        ring.position.y = r.y + open * [-0.05, 0.12, 0.28][ri]
        const sc = 1 + open * [0.0, 0.12, 0.3][ri]
        ring.scale.setScalar(sc)
      }
      petals.current[ri].forEach((m, pi) => {
        const breathe = reduced ? 0 : Math.sin(time * 0.55 + pi * 1.7 + ri * 2.1) * 0.03
        m.rotation.x = r.tilt + open * r.open + breathe
      })
      const mat = mats[ri]
      const glow = hover === ri ? 0.1 : 0
      mat.emissive.set('#b59c7e')
      mat.emissiveIntensity += (glow - mat.emissiveIntensity) * k
    })
    if (core.current) core.current.rotation.y = time * 0.03
    // the warm heart light fades as the camera lands on the skin so the texture is never blown out
    if (heart.current) heart.current.intensity = 2.0 * (1 - ss(0.45, 0.8, p))
  })

  const ringHandlers = (ri: number) => ({
    onPointerOver: (e: ThreeEvent<PointerEvent>) => {
      if (progress.current > 0.1) return
      e.stopPropagation()
      setHover(ri)
    },
    onPointerOut: () => setHover((h) => (h === ri ? null : h)),
    onClick: (e: ThreeEvent<MouseEvent>) => {
      if (progress.current > 0.1 || e.delta > 6) return
      e.stopPropagation()
      onSelectRing?.(ri)
    },
  })

  return (
    <group ref={root} position={[0, 0, 0]} scale={1.16}>
      <pointLight ref={heart} position={[0, 1.15, 0.2]} intensity={2} distance={2.4} decay={2} color="#ffcf9a" />
      <mesh ref={core} geometry={coreGeo} material={coreMat} position={[0, 0.38, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 1.12]} />
      {RINGS.map((r, ri) => (
        <group key={ri} ref={(el) => (rings.current[ri] = el)} position={[0, r.y, 0]}>
          {Array.from({ length: r.count }).map((_, pi) => {
            const a = (pi / r.count) * Math.PI * 2
            return (
              <group key={pi} rotation={[0, a, 0]}>
                <mesh
                  ref={(m) => {
                    if (m) petals.current[ri][pi] = m
                  }}
                  geometry={geos[ri]}
                  material={mats[ri]}
                  position={[0, 0, r.r0]}
                  rotation={[r.tilt, 0, 0]}
                  renderOrder={ri}
                  {...ringHandlers(ri)}
                />
              </group>
            )
          })}
        </group>
      ))}
    </group>
  )
}

/* ─────────────────────────────── Canvas ─────────────────────────────── */

export default function BloomScene(props: BloomProps) {
  const wrap = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(true)

  // Pause rendering when the stage is off-screen or fully covered by the skin reveal
  useEffect(() => {
    const el = wrap.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: '50px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  const [covered, setCovered] = useState(false)
  useEffect(() => {
    let raf = 0
    const tick = () => {
      const c = props.progress.current > 0.985
      setCovered((prev) => (prev === c ? prev : c))
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [props.progress])

  return (
    <div ref={wrap} className="absolute inset-0 touch-pan-y">
      <Canvas
        frameloop={visible && !covered ? 'always' : 'never'}
        dpr={props.tier === 'high' ? [1, 1.6] : [1, 1.25]}
        camera={{ position: [0, 0.55, 14], fov: 32, near: 0.01, far: 60 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping
          gl.toneMappingExposure = 1.05
          props.onReady?.()
        }}
        aria-hidden
      >
        <color attach="background" args={['#131311']} />
        <fog attach="fog" args={['#131311', 12, 22]} />
        <Environment intensity={0.42} />
        <Backdrop />
        <BackText />
        <ambientLight intensity={0.06} />
        {/* key */}
        <directionalLight position={[-4, 5, 4]} intensity={2.1} color="#fff0dd" />
        {/* rim lights carve the glass edges out of the dark */}
        <directionalLight position={[4.5, 2.5, -4]} intensity={3.2} color="#ffd9b0" />
        <directionalLight position={[-3.5, 1, -5]} intensity={1.6} color="#e9d6c0" />
        {/* top fill — lights the petals when the camera looks down into the bloom */}
        <directionalLight position={[0.5, 8, 1.5]} intensity={1.3} color="#fff3e4" />
        <Bloom {...props} />
      </Canvas>
    </div>
  )
}
