import React, { useLayoutEffect, useMemo, useRef } from 'react'
import gsap from 'gsap'
import NotebookSheet from './NotebookSheet'
import Contact, { type SentNoteSnapshot } from '../components/Contact'
import { DoodleTape } from '../components/InkDoodles'

// Ragged spine-tear teeth profile ([yPercent, toothDepthPx])
const SPINE_TEAR_TEETH: ReadonlyArray<readonly [number, number]> = [
  [0, 11],
  [4, 5.5],
  [8.5, 14.5],
  [13, 6.5],
  [17.5, 15.5],
  [22, 6],
  [26.5, 13.5],
  [31, 7],
  [35.5, 16],
  [40, 6.5],
  [44.5, 14],
  [49, 5.5],
  [53.5, 15],
  [58, 7],
  [62.5, 13.5],
  [67, 6],
  [71.5, 15.5],
  [76, 6.5],
  [80.5, 14.5],
  [85, 6],
  [89.5, 15],
  [94, 7],
  [97.5, 13],
  [100, 9.5],
]

const STUB_WIDTH_PX = 18

const STUB_CLIP_POLYGON = `polygon(0% 0%, ${SPINE_TEAR_TEETH.map(
  ([yPct, px]) => `${Math.min(100, Math.round((px / STUB_WIDTH_PX) * 100))}% ${yPct}%`
).join(', ')}, 0% 100%)`

type Point2D = readonly [number, number]

/**
 * Sutherland-Hodgman polygon half-plane clipper: retains points where evalFn(x, y) <= 0.
 */
function clipPolygonHalfPlane(
  poly: ReadonlyArray<Point2D>,
  evalFn: (x: number, y: number) => number
): Array<[number, number]> {
  const out: Array<[number, number]> = []
  const n = poly.length
  if (n === 0) return out

  for (let i = 0; i < n; i++) {
    const cur = poly[i]
    const prev = poly[(i + n - 1) % n]
    const curVal = evalFn(cur[0], cur[1])
    const prevVal = evalFn(prev[0], prev[1])
    const curIn = curVal <= 0
    const prevIn = prevVal <= 0

    if (curIn !== prevIn) {
      const denom = prevVal - curVal
      const t = Math.abs(denom) > 1e-6 ? prevVal / denom : 0
      out.push([
        prev[0] + (cur[0] - prev[0]) * t,
        prev[1] + (cur[1] - prev[1]) * t,
      ])
    }
    if (curIn) {
      out.push([cur[0], cur[1]])
    }
  }

  return out
}

function pointsToClipPolygon(pts: ReadonlyArray<Point2D>): string {
  if (pts.length < 3) return 'polygon(0px 0px, 0px 0px, 0px 0px)'
  return `polygon(${pts
    .map(([x, y]) => `${x.toFixed(1)}px ${y.toFixed(1)}px`)
    .join(', ')})`
}

function pointsToMirroredClipPolygon(
  pts: ReadonlyArray<Point2D>,
  W: number
): string {
  if (pts.length < 3) return 'polygon(0px 0px, 0px 0px, 0px 0px)'
  return `polygon(${pts
    .map(([x, y]) => `${(W - x).toFixed(1)}px ${y.toFixed(1)}px`)
    .join(', ')})`
}

/**
 * Ragged torn notebook stub remaining in the bound spine against the black hardcover.
 */
export const TornSpineStub = React.forwardRef<
  HTMLDivElement,
  { initialHidden?: boolean }
>(function TornSpineStub({ initialHidden = false }, ref) {
  return (
    <div
      ref={ref}
      className="pointer-events-none absolute left-0 top-0 bottom-0 w-[18px] select-none"
      style={{
        zIndex: 25,
        clipPath: initialHidden ? 'inset(0 0 100% 0)' : 'inset(0 0 0% 0)',
        filter: 'drop-shadow(2px 1px 2px rgba(0, 0, 0, 0.65))',
        willChange: initialHidden ? 'clip-path' : undefined,
      }}
      aria-hidden="true"
    >
      <div
        className="w-full h-full bg-[#f3ecda]"
        style={{
          clipPath: STUB_CLIP_POLYGON,
          backgroundImage: `
            linear-gradient(to right, rgba(14, 10, 6, 0.45) 0px, rgba(16, 11, 7, 0.2) 4px, rgba(255, 255, 255, 0.42) 10px, rgba(255, 253, 248, 0.85) 100%),
            repeating-linear-gradient(
              to bottom,
              transparent 0px,
              transparent 26px,
              #c4d0df 26px,
              #c4d0df 27px
            )
          `,
        }}
      />
    </div>
  )
})

/**
 * Two strips of masking tape securing the replacement note sheet onto the torn spine stub.
 */
export function SpineReplacementTapes({
  topTapeRef,
  bottomTapeRef,
  initialHidden = false,
}: {
  topTapeRef?: React.RefObject<HTMLDivElement | null>
  bottomTapeRef?: React.RefObject<HTMLDivElement | null>
  initialHidden?: boolean
}) {
  return (
    <>
      <div
        ref={topTapeRef}
        className="pointer-events-none absolute left-[-4px] top-[64px] select-none"
        style={{
          zIndex: 35,
          opacity: initialHidden ? 0 : 1,
          transformOrigin: '50% 50%',
        }}
        aria-hidden="true"
      >
        <DoodleTape rotate={-78} className="w-11 h-4" variant="beige" />
      </div>
      <div
        ref={bottomTapeRef}
        className="pointer-events-none absolute left-[-4px] bottom-[74px] select-none"
        style={{
          zIndex: 35,
          opacity: initialHidden ? 0 : 1,
          transformOrigin: '50% 50%',
        }}
        aria-hidden="true"
      >
        <DoodleTape rotate={-84} className="w-11 h-4" variant="beige" />
      </div>
    </>
  )
}

/**
 * Reverse side of the notebook leaf (visible during top-corner peel & on folded airplane panels).
 */
function NotebookBackSurface({ pageW, pageH }: { pageW: number; pageH: number }) {
  return (
    <div
      className="relative w-full h-full select-none pointer-events-none"
      style={{
        width: `${pageW}px`,
        height: `${pageH}px`,
        backgroundColor: '#f3ecda',
        backgroundImage: `
          linear-gradient(to left, transparent 34px, rgba(220, 118, 118, 0.58) 34px, rgba(220, 118, 118, 0.58) 35.5px, transparent 35.5px),
          repeating-linear-gradient(
            to bottom,
            transparent 0px,
            transparent 26px,
            #c4d0df 26px,
            #c4d0df 27px
          )
        `,
      }}
    >
      {/* Subtle ghosted ink show-through on reverse side of paper */}
      <div className="absolute right-10 top-10 w-36 h-2 rounded-full bg-crimson/12" />
      <div className="absolute right-10 top-24 w-48 h-1.5 rounded-full bg-ink/7" />
      <div className="absolute right-10 top-32 w-40 h-1.5 rounded-full bg-ink/7" />
      <div className="absolute right-10 top-52 w-56 h-1.5 rounded-full bg-ink/8" />
      <div className="absolute right-10 top-66 w-52 h-1.5 rounded-full bg-ink/8" />
    </div>
  )
}

interface FacetGeometry {
  frontClip: string
  backClip: string
  frontPointsAttr: string
  backPointsAttr: string
}

function createFacetGeometry(
  pts: ReadonlyArray<Point2D>,
  W: number
): FacetGeometry {
  const frontClip = pointsToClipPolygon(pts)
  const backClip = pointsToMirroredClipPolygon(pts, W)
  const frontPointsAttr = pts
    .map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`)
    .join(' ')
  const backPointsAttr = pts
    .map(([x, y]) => `${(W - x).toFixed(1)},${y.toFixed(1)}`)
    .join(' ')
  return { frontClip, backClip, frontPointsAttr, backPointsAttr }
}

interface OrigamiFacetProps {
  geo: FacetGeometry
  pageW: number
  pageH: number
  frontContent: React.ReactNode
  frontShadeRef?: React.RefObject<HTMLDivElement | null>
  backShadeRef?: React.RefObject<HTMLDivElement | null>
  registerCreaseEl: (el: SVGSVGElement | null) => void
}

function OrigamiFacet({
  geo,
  pageW,
  pageH,
  frontContent,
  frontShadeRef,
  backShadeRef,
  registerCreaseEl,
}: OrigamiFacetProps) {
  return (
    <>
      {/* Explicit translateZ(0.6px) establishes a true 3D GPU layer for reliable backface culling */}
      <div
        className="pointer-events-none absolute inset-0 backface-hidden"
        style={{ transform: 'translateZ(0.6px)' }}
      >
        <div
          className="relative w-full h-full overflow-hidden"
          style={{ clipPath: geo.frontClip }}
        >
          {frontContent}
          <div
            ref={frontShadeRef}
            className="pointer-events-none absolute inset-0 z-30"
            style={{ backgroundColor: '#16100a', opacity: 0 }}
          />
          <svg
            ref={registerCreaseEl}
            viewBox={`0 0 ${pageW} ${pageH}`}
            className="pointer-events-none absolute inset-0 w-full h-full z-40"
            style={{ opacity: 0 }}
          >
            <polygon
              points={geo.frontPointsAttr}
              fill="none"
              stroke="rgba(22, 16, 11, 0.42)"
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {/* Explicit rotateY(180deg) translateZ(0.6px) back face */}
      <div
        className="pointer-events-none absolute inset-0 backface-hidden"
        style={{ transform: 'rotateY(180deg) translateZ(0.6px)' }}
      >
        <div
          className="relative w-full h-full overflow-hidden"
          style={{ clipPath: geo.backClip }}
        >
          <NotebookBackSurface pageW={pageW} pageH={pageH} />
          <div
            ref={backShadeRef}
            className="pointer-events-none absolute inset-0 z-20"
            style={{ backgroundColor: '#18110b', opacity: 0 }}
          />
          <svg
            ref={registerCreaseEl}
            viewBox={`0 0 ${pageW} ${pageH}`}
            className="pointer-events-none absolute inset-0 w-full h-full z-30"
            style={{ opacity: 0 }}
          >
            <polygon
              points={geo.backPointsAttr}
              fill="none"
              stroke="rgba(22, 16, 11, 0.46)"
              strokeWidth="2.4"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </>
  )
}

export interface PaperAirplaneFlightProps {
  snapshot: SentNoteSnapshot
  isDesktop: boolean
  pageW: number
  pageH: number
  offsetLeft: number
  offsetTop: number
  totalPages: number
  exitX: number
  exitY: number
  onComplete: () => void
}

export default function PaperAirplaneFlight({
  snapshot,
  isDesktop,
  pageW,
  pageH,
  offsetLeft,
  offsetTop,
  totalPages,
  exitX,
  exitY,
  onComplete,
}: PaperAirplaneFlightProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const progressiveStubRef = useRef<HTMLDivElement>(null)
  const deskShadowRef = useRef<HTMLDivElement>(null)

  // Phase 1 Diagonal Peel-Rip refs
  const ripStageRef = useRef<HTMLDivElement>(null)
  const lowerUntornClipRef = useRef<HTMLDivElement>(null)
  const lowerCreaseShadowRef = useRef<HTMLDivElement>(null)
  const upperPeelHingeRef = useRef<HTMLDivElement>(null)
  const upperPeelFrontClipRef = useRef<HTMLDivElement>(null)
  const upperPeelBackClipRef = useRef<HTMLDivElement>(null)
  const upperPeelBackShadeRef = useRef<HTMLDivElement>(null)

  // Phase 2 & 3 Flight + 10-panel 3D Origami refs
  const flightPosRef = useRef<HTMLDivElement>(null)
  const attitudeRef = useRef<HTMLDivElement>(null)
  const origamiRigRef = useRef<HTMLDivElement>(null)

  const leftKeelHingeRef = useRef<HTMLDivElement>(null)
  const leftWingHingeRef = useRef<HTMLDivElement>(null)
  const leftDartHingeRef = useRef<HTMLDivElement>(null)
  const leftCornerHingeRef = useRef<HTMLDivElement>(null)
  const leftTipHingeRef = useRef<HTMLDivElement>(null)

  const rightKeelHingeRef = useRef<HTMLDivElement>(null)
  const rightWingHingeRef = useRef<HTMLDivElement>(null)
  const rightDartHingeRef = useRef<HTMLDivElement>(null)
  const rightCornerHingeRef = useRef<HTMLDivElement>(null)
  const rightTipHingeRef = useRef<HTMLDivElement>(null)

  const l1FrontShade = useRef<HTMLDivElement>(null)
  const l1BackShade = useRef<HTMLDivElement>(null)
  const r1FrontShade = useRef<HTMLDivElement>(null)
  const r1BackShade = useRef<HTMLDivElement>(null)
  const l2FrontShade = useRef<HTMLDivElement>(null)
  const r2FrontShade = useRef<HTMLDivElement>(null)
  const l3BackShade = useRef<HTMLDivElement>(null)
  const r3BackShade = useRef<HTMLDivElement>(null)
  const l4aBackShade = useRef<HTMLDivElement>(null)
  const l4bBackShade = useRef<HTMLDivElement>(null)
  const r4aBackShade = useRef<HTMLDivElement>(null)
  const r4bBackShade = useRef<HTMLDivElement>(null)

  // Phase 4 Incoming Replacement Sheet & Spine Tapes refs
  const incomingSheetRef = useRef<HTMLDivElement>(null)
  const incomingShadowRef = useRef<HTMLDivElement>(null)
  const topTapeRef = useRef<HTMLDivElement>(null)
  const bottomTapeRef = useRef<HTMLDivElement>(null)

  const creaseElsRef = useRef<Set<SVGSVGElement>>(new Set())
  const registerCreaseEl = useMemo(
    () => (el: SVGSVGElement | null) => {
      if (el) {
        creaseElsRef.current.add(el)
      }
    },
    []
  )

  const onCompleteRef = useRef(onComplete)
  useLayoutEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  // Precompute ragged torn sheet polygon + exact 8-panel radial dart origami partition
  const geometry = useMemo(() => {
    const W = pageW
    const H = pageH
    const c = W / 2

    // Clockwise polygon of the ripped sheet (with ragged left spine teeth along x = 5.5..16px)
    const tornLeftReversed = [...SPINE_TEAR_TEETH]
      .reverse()
      .map(([yPct, px]) => [px, (yPct / 100) * H] as const)

    const tornSheetPoly: Array<Point2D> = [
      [W, 0],
      [W, H],
      ...tornLeftReversed,
    ]

    const intactRectPoly: Array<Point2D> = [
      [0, 0],
      [W, 0],
      [W, H],
      [0, H],
    ]

    // Diagonal peel-rip crease slope: P_tear(0, tearY) -> P_flex(W, tearY - ripSlopePx)
    const ripSlopePx = W * 0.42
    const ripLen = Math.hypot(W, ripSlopePx)
    const uRip = { x: W / ripLen, y: -ripSlopePx / ripLen }

    // Sleek full-length Euclidean dart origami angles:
    // θ1 = 6° (keel), θ2 = 24° (dart crease), θ3 = 48° (corner crease), θ4 = 72° (tip sub-crease)
    // Satisfies 2*θ3 - 90° = 6° = θ1, 2*θ3 - θ4 = 24° = θ2, and 2*θ2 - θ3 = 0° (flush with center spine!)
    const t1 = (6 * Math.PI) / 180
    const t2 = (24 * Math.PI) / 180
    const t3 = (48 * Math.PI) / 180
    const t4 = (72 * Math.PI) / 180

    const cos1 = Math.cos(t1)
    const sin1 = Math.sin(t1)
    const cos2 = Math.cos(t2)
    const sin2 = Math.sin(t2)
    const cos3 = Math.cos(t3)
    const sin3 = Math.sin(t3)
    const cos4 = Math.cos(t4)
    const sin4 = Math.sin(t4)

    // Signed distance right of left-side ray θ: fL(x,y) = (x - c)*cos(θ) + y*sin(θ)
    const fL1 = (x: number, y: number) => (x - c) * cos1 + y * sin1
    const fL2 = (x: number, y: number) => (x - c) * cos2 + y * sin2
    const fL3 = (x: number, y: number) => (x - c) * cos3 + y * sin3
    const fL4 = (x: number, y: number) => (x - c) * cos4 + y * sin4

    // Signed distance left of right-side ray θ: fR(x,y) = -(x - c)*cos(θ) + y*sin(θ)
    const fR1 = (x: number, y: number) => -(x - c) * cos1 + y * sin1
    const fR2 = (x: number, y: number) => -(x - c) * cos2 + y * sin2
    const fR3 = (x: number, y: number) => -(x - c) * cos3 + y * sin3
    const fR4 = (x: number, y: number) => -(x - c) * cos4 + y * sin4

    const eps = 0.55

    const polyL4b = clipPolygonHalfPlane(tornSheetPoly, (x, y) => fL4(x, y) - eps)
    const polyL4a = clipPolygonHalfPlane(
      clipPolygonHalfPlane(tornSheetPoly, (x, y) => -fL4(x, y) - eps),
      (x, y) => fL3(x, y) - eps
    )
    const polyL3 = clipPolygonHalfPlane(
      clipPolygonHalfPlane(tornSheetPoly, (x, y) => -fL3(x, y) - eps),
      (x, y) => fL2(x, y) - eps
    )
    const polyL2 = clipPolygonHalfPlane(
      clipPolygonHalfPlane(tornSheetPoly, (x, y) => -fL2(x, y) - eps),
      (x, y) => fL1(x, y) - eps
    )
    const polyL1 = clipPolygonHalfPlane(
      clipPolygonHalfPlane(tornSheetPoly, (x, y) => -fL1(x, y) - eps),
      (x) => x - c - eps
    )

    const polyR4b = clipPolygonHalfPlane(tornSheetPoly, (x, y) => fR4(x, y) - eps)
    const polyR4a = clipPolygonHalfPlane(
      clipPolygonHalfPlane(tornSheetPoly, (x, y) => -fR4(x, y) - eps),
      (x, y) => fR3(x, y) - eps
    )
    const polyR3 = clipPolygonHalfPlane(
      clipPolygonHalfPlane(tornSheetPoly, (x, y) => -fR3(x, y) - eps),
      (x, y) => fR2(x, y) - eps
    )
    const polyR2 = clipPolygonHalfPlane(
      clipPolygonHalfPlane(tornSheetPoly, (x, y) => -fR2(x, y) - eps),
      (x, y) => fR1(x, y) - eps
    )
    const polyR1 = clipPolygonHalfPlane(
      clipPolygonHalfPlane(tornSheetPoly, (x, y) => -fR1(x, y) - eps),
      (x) => c - x - eps
    )

    return {
      W,
      H,
      c,
      ripSlopePx,
      uRip,
      tornSheetPoly,
      intactRectPoly,
      u1: { x: sin1, y: cos1 },
      u2: { x: sin2, y: cos2 },
      u3: { x: sin3, y: cos3 },
      u4: { x: sin4, y: cos4 },
      facets: {
        L1: createFacetGeometry(polyL1, W),
        L2: createFacetGeometry(polyL2, W),
        L3: createFacetGeometry(polyL3, W),
        L4a: createFacetGeometry(polyL4a, W),
        L4b: createFacetGeometry(polyL4b, W),
        R1: createFacetGeometry(polyR1, W),
        R2: createFacetGeometry(polyR2, W),
        R3: createFacetGeometry(polyR3, W),
        R4a: createFacetGeometry(polyR4a, W),
        R4b: createFacetGeometry(polyR4b, W),
      },
    }
  }, [pageH, pageW])

  const sheetSide = isDesktop ? 'right' : 'mobile'

  const filledPageNode = useMemo(
    () => (
      <NotebookSheet
        side={sheetSide}
        pageIndex={totalPages - 1}
        totalPages={totalPages}
        interactive={false}
      >
        <Contact snapshot={snapshot} />
      </NotebookSheet>
    ),
    [sheetSide, snapshot, totalPages]
  )

  const blankReplacementSnapshot = useMemo<SentNoteSnapshot>(
    () => ({
      id: -1,
      senderName: '',
      senderEmail: '',
      noteMessage: '',
      selectedTopics: snapshot.selectedTopics,
    }),
    [snapshot.selectedTopics]
  )

  const cleanReplacementPageNode = useMemo(
    () => (
      <NotebookSheet
        side={sheetSide}
        pageIndex={totalPages - 1}
        totalPages={totalPages}
        interactive={false}
      >
        <Contact snapshot={blankReplacementSnapshot} />
      </NotebookSheet>
    ),
    [blankReplacementSnapshot, sheetSide, totalPages]
  )

  useLayoutEffect(() => {
    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const ctx = gsap.context(() => {
      if (reducedMotion) {
        if (progressiveStubRef.current) {
          progressiveStubRef.current.style.clipPath = 'inset(0 0 0% 0)'
        }
        const tlReduced = gsap.timeline({
          onComplete: () => onCompleteRef.current(),
        })
        tlReduced.to(flightPosRef.current, {
          autoAlpha: 0,
          duration: 0.25,
          ease: 'power2.out',
        })
        tlReduced.fromTo(
          incomingSheetRef.current,
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: 0.28, ease: 'power2.out' },
          '+=0.08'
        )
        tlReduced.to(
          [topTapeRef.current, bottomTapeRef.current],
          { opacity: 1, duration: 0.18 },
          '<0.1'
        )
        return
      }

      const maxTearY = geometry.H + geometry.ripSlopePx

      const rig = {
        tearNorm: 0, // 0 -> 1 sweeps tearY from 0 to (H + ripSlopePx)
        peelAngle: 0,
        cornerL: 0,
        cornerR: 0,
        dartL: 0,
        dartR: 0,
        keel: 0,
        wing: 0,
        creaseInk: 0,
        posX: 0,
        posY: 0,
        posZ: 0,
        heading: 0,
        scale: 1,
        pitch: 0,
        bank: 0,
        shadowAlpha: 0,
        shadowScaleX: 0.9,
        shadowScaleY: 0.92,
      }

      let switchedToOrigami = false

      const syncFrame = () => {
        const {
          W,
          H,
          ripSlopePx,
          uRip,
          tornSheetPoly,
          intactRectPoly,
          u1,
          u2,
          u3,
          u4,
        } = geometry

        const tearY = rig.tearNorm * maxTearY
        const spineTearRatio = Math.max(0, Math.min(1, tearY / H))

        // 1. Progressive spine stub left behind on the black hardcover
        if (progressiveStubRef.current) {
          const remPct = (1 - spineTearRatio) * 100
          progressiveStubRef.current.style.clipPath = `inset(0 0 ${remPct.toFixed(1)}% 0)`
        }

        // 2. Act 1 Diagonal Peel-Rip Geometry (Lower stationary sheet + Upper 3D curling torn sheet)
        if (!switchedToOrigami) {
          // Crease line from (0, tearY) to (W, tearY - ripSlopePx):
          // Signed value (y - tearY) + (ripSlopePx / W) * x  (<= 0 is ABOVE crease, >= 0 is BELOW crease)
          const slopeRatio = ripSlopePx / W

          if (lowerUntornClipRef.current) {
            if (tearY >= maxTearY - 1) {
              lowerUntornClipRef.current.style.display = 'none'
            } else {
              lowerUntornClipRef.current.style.display = 'block'
              const lowerPts = clipPolygonHalfPlane(
                intactRectPoly,
                (x, y) => -(y - tearY + slopeRatio * x) + 0.5
              )
              lowerUntornClipRef.current.style.clipPath =
                pointsToClipPolygon(lowerPts)
            }
          }

          if (lowerCreaseShadowRef.current) {
            const creaseAngleDeg = -Math.atan2(ripSlopePx, W) * (180 / Math.PI)
            const shStrength =
              Math.sin(Math.min(1, rig.peelAngle / 95) * (Math.PI / 2)) * 0.42
            lowerCreaseShadowRef.current.style.opacity = shStrength.toFixed(3)
            lowerCreaseShadowRef.current.style.transform = `translate3d(0px, ${tearY.toFixed(1)}px, 0px) rotate(${creaseAngleDeg.toFixed(2)}deg)`
          }

          if (
            upperPeelHingeRef.current &&
            upperPeelFrontClipRef.current &&
            upperPeelBackClipRef.current
          ) {
            if (tearY <= 1) {
              upperPeelHingeRef.current.style.display = 'none'
            } else {
              upperPeelHingeRef.current.style.display = 'block'
              const upperPts = clipPolygonHalfPlane(
                tornSheetPoly,
                (x, y) => y - tearY + slopeRatio * x - 0.5
              )
              upperPeelFrontClipRef.current.style.clipPath =
                pointsToClipPolygon(upperPts)
              upperPeelBackClipRef.current.style.clipPath =
                pointsToMirroredClipPolygon(upperPts, W)
              upperPeelHingeRef.current.style.transform = `translate3d(0px, ${tearY.toFixed(1)}px, 1.2px) rotate3d(${uRip.x.toFixed(4)}, ${uRip.y.toFixed(4)}, 0, ${(-rig.peelAngle).toFixed(2)}deg) translate3d(0px, ${(-tearY).toFixed(1)}px, 0px)`
            }
          }

          if (upperPeelBackShadeRef.current) {
            const curlShade =
              Math.max(0, Math.sin((rig.peelAngle * Math.PI) / 180)) * 0.16
            upperPeelBackShadeRef.current.style.opacity = curlShade.toFixed(3)
          }
        }

        // 3. World Flight Position + Attitude
        if (flightPosRef.current) {
          flightPosRef.current.style.transform = `translate3d(${rig.posX.toFixed(2)}px, ${rig.posY.toFixed(2)}px, ${rig.posZ.toFixed(2)}px) rotateZ(${rig.heading.toFixed(2)}deg) scale(${rig.scale.toFixed(4)})`
        }

        if (attitudeRef.current) {
          attitudeRef.current.style.transform = `rotateX(${rig.pitch.toFixed(2)}deg) rotateY(${rig.bank.toFixed(2)}deg)`
        }

        // 4. Cast Shadow on Black Cover / Desk (composite-only transform + opacity)
        if (deskShadowRef.current) {
          const shX = rig.posX + rig.posZ * 0.2
          const shY = rig.posY + rig.posZ * 0.32
          const sh = deskShadowRef.current
          sh.style.opacity = `${Math.max(0, rig.shadowAlpha).toFixed(3)}`
          sh.style.transform = `translate3d(${shX.toFixed(1)}px, ${shY.toFixed(1)}px, 0px) rotateZ(${rig.heading.toFixed(1)}deg) scale(${rig.shadowScaleX.toFixed(3)}, ${rig.shadowScaleY.toFixed(3)})`
        }

        // 5. 10-Panel Crease-Welded 3D Origami Hinges
        if (switchedToOrigami) {
          if (leftKeelHingeRef.current) {
            leftKeelHingeRef.current.style.transform = `rotateY(${rig.keel.toFixed(2)}deg)`
          }
          if (rightKeelHingeRef.current) {
            rightKeelHingeRef.current.style.transform = `rotateY(${(-rig.keel).toFixed(2)}deg)`
          }

          if (leftWingHingeRef.current) {
            leftWingHingeRef.current.style.transform = `rotate3d(${-u1.x}, ${u1.y}, 0, ${(-rig.wing).toFixed(2)}deg)`
          }
          if (rightWingHingeRef.current) {
            rightWingHingeRef.current.style.transform = `rotate3d(${u1.x}, ${u1.y}, 0, ${rig.wing.toFixed(2)}deg)`
          }

          if (leftDartHingeRef.current) {
            leftDartHingeRef.current.style.transform = `rotate3d(${-u2.x}, ${u2.y}, 0, ${rig.dartL.toFixed(2)}deg)`
          }
          if (rightDartHingeRef.current) {
            rightDartHingeRef.current.style.transform = `rotate3d(${u2.x}, ${u2.y}, 0, ${(-rig.dartR).toFixed(2)}deg)`
          }

          if (leftCornerHingeRef.current) {
            leftCornerHingeRef.current.style.transform = `rotate3d(${-u3.x}, ${u3.y}, 0, ${rig.cornerL.toFixed(2)}deg)`
          }
          if (rightCornerHingeRef.current) {
            rightCornerHingeRef.current.style.transform = `rotate3d(${u3.x}, ${u3.y}, 0, ${(-rig.cornerR).toFixed(2)}deg)`
          }

          // Counter-hinge outer corner tips along θ4 = 72° during Fold 2 so they stay flat on L2/R2
          const tipLiftL = -0.9 * Math.min(1, rig.dartL / 20)
          const tipLiftR = -0.9 * Math.min(1, rig.dartR / 20)
          if (leftTipHingeRef.current) {
            leftTipHingeRef.current.style.transform = `rotate3d(${-u4.x}, ${u4.y}, 0, ${(-rig.dartL).toFixed(2)}deg) translateZ(${tipLiftL.toFixed(2)}px)`
          }
          if (rightTipHingeRef.current) {
            rightTipHingeRef.current.style.transform = `rotate3d(${u4.x}, ${u4.y}, 0, ${rig.dartR.toFixed(2)}deg) translateZ(${tipLiftR.toFixed(2)}px)`
          }

          // Dynamic 3D Facet Shading
          const keelFactor = rig.keel / 80
          const bankBias = Math.max(-1, Math.min(1, rig.bank / 30))

          if (l1FrontShade.current) {
            l1FrontShade.current.style.opacity = (keelFactor * 0.35).toFixed(3)
          }
          if (r1FrontShade.current) {
            r1FrontShade.current.style.opacity = (keelFactor * 0.35).toFixed(3)
          }
          if (l1BackShade.current) {
            l1BackShade.current.style.opacity = Math.max(
              0,
              keelFactor * (0.16 - bankBias * 0.06)
            ).toFixed(3)
          }
          if (r1BackShade.current) {
            r1BackShade.current.style.opacity = Math.max(
              0,
              keelFactor * (0.28 + bankBias * 0.06)
            ).toFixed(3)
          }

          if (l2FrontShade.current) {
            l2FrontShade.current.style.opacity = Math.max(
              0,
              keelFactor * 0.04 - bankBias * 0.04
            ).toFixed(3)
          }
          if (r2FrontShade.current) {
            r2FrontShade.current.style.opacity = Math.max(
              0,
              keelFactor * 0.08 + bankBias * 0.05
            ).toFixed(3)
          }

          const l4Arch = Math.sin((rig.cornerL * Math.PI) / 180)
          const r4Arch = Math.sin((rig.cornerR * Math.PI) / 180)
          const l4ShadeVal = (0.05 + l4Arch * 0.16).toFixed(3)
          const r4ShadeVal = (0.07 + r4Arch * 0.16).toFixed(3)
          if (l4aBackShade.current) l4aBackShade.current.style.opacity = l4ShadeVal
          if (l4bBackShade.current) l4bBackShade.current.style.opacity = l4ShadeVal
          if (r4aBackShade.current) r4aBackShade.current.style.opacity = r4ShadeVal
          if (r4bBackShade.current) r4bBackShade.current.style.opacity = r4ShadeVal

          const l3Arch = Math.sin((rig.dartL * Math.PI) / 180)
          const r3Arch = Math.sin((rig.dartR * Math.PI) / 180)
          if (l3BackShade.current) {
            l3BackShade.current.style.opacity = Math.max(
              0,
              0.03 + l3Arch * 0.15 - bankBias * 0.04
            ).toFixed(3)
          }
          if (r3BackShade.current) {
            r3BackShade.current.style.opacity = Math.max(
              0,
              0.08 + r3Arch * 0.15 + bankBias * 0.05
            ).toFixed(3)
          }

          const creaseOpacity = rig.creaseInk.toFixed(3)
          for (const svgEl of creaseElsRef.current) {
            svgEl.style.opacity = creaseOpacity
          }
        }
      }

      const tl = gsap.timeline({
        onUpdate: syncFrame,
        onComplete: () => onCompleteRef.current(),
      })

      // ====================================================================
      // ACT 1: PROGRESSIVE DIAGONAL PEEL-RIP DOWN SPINE AGAINST BLACK COVER
      // ====================================================================
      tl.addLabel('rip', 0)

      // 1a. Top-left spine corner curls forward (>90° exposes warm ruled paper back + black cover)
      tl.to(
        rig,
        {
          peelAngle: 118,
          duration: 0.26,
          ease: 'power2.out',
        },
        'rip'
      )

      // 1b. Tear unzips down the spine from top to bottom
      tl.to(
        rig,
        {
          tearNorm: 1,
          duration: 0.66,
          ease: 'power1.inOut',
        },
        'rip+=0.04'
      )

      // 1c. As bottom half rips free, sheet tugs right off the spine stub (clear black gap)
      tl.to(
        rig,
        {
          peelAngle: 24,
          posX: 18,
          posY: 6,
          posZ: 32,
          heading: 3.2,
          shadowAlpha: 0.45,
          duration: 0.4,
          ease: 'sine.inOut',
        },
        'rip+=0.32'
      )

      // 1d. Freed ragged-edged sheet flattens & centers cleanly over the black hardcover board
      tl.to(
        rig,
        {
          peelAngle: 0,
          posX: 12,
          posY: -4,
          posZ: 45,
          heading: 0,
          scale: 0.86,
          shadowAlpha: 0.55,
          duration: 0.24,
          ease: 'power2.out',
        },
        'rip+=0.72'
      )

      // Hard swap (`display: none`) from flat torn sheet to ONLY the 3D origami rig
      tl.call(
        () => {
          switchedToOrigami = true
          if (ripStageRef.current) ripStageRef.current.style.display = 'none'
          if (origamiRigRef.current) origamiRigRef.current.style.display = 'block'
        },
        undefined,
        0.97
      )

      // ====================================================================
      // ACT 2: 4-STEP REAL 3D ORIGAMI FOLDING OVER BLACK HARDCOVER
      // ====================================================================
      tl.addLabel('fold1', 0.98)

      tl.to(
        rig,
        {
          creaseInk: 1,
          pitch: 16,
          duration: 0.28,
          ease: 'power2.out',
        },
        'fold1'
      )

      // Fold 1: Top-left & top-right nose corners crease cleanly to 180° onto the center line
      tl.to(
        rig,
        {
          cornerL: 180,
          duration: 0.3,
          ease: 'power2.inOut',
        },
        'fold1'
      )
      tl.to(
        rig,
        {
          cornerR: 180,
          shadowScaleX: 0.66,
          duration: 0.3,
          ease: 'power2.inOut',
        },
        'fold1+=0.03'
      )

      // Fold 2: Left & right angled edges fold inward into sleek full-length dart
      tl.addLabel('fold2', 1.32)
      tl.to(
        rig,
        {
          dartL: 176,
          pitch: 24,
          duration: 0.34,
          ease: 'power2.inOut',
        },
        'fold2'
      )
      tl.to(
        rig,
        {
          dartR: 176,
          shadowScaleX: 0.38,
          shadowScaleY: 0.72,
          duration: 0.34,
          ease: 'power2.inOut',
        },
        'fold2+=0.03'
      )

      // Fold 3: Center spine pinches into tight 3D V-keel while plane turns toward launch heading
      tl.addLabel('fold3', 1.66)
      tl.to(
        rig,
        {
          keel: 80,
          posX: 6,
          scale: 0.5,
          heading: 46,
          pitch: 52,
          bank: -16,
          posZ: 95,
          shadowScaleX: 0.22,
          shadowScaleY: 0.48,
          duration: 0.36,
          ease: 'power3.inOut',
        },
        'fold3'
      )

      // Fold 4: Delta wings snap outward with crisp +6° dihedral
      tl.addLabel('fold4', 1.8)
      tl.to(
        rig,
        {
          wing: 74,
          shadowScaleX: 0.32,
          duration: 0.34,
          ease: 'back.out(1.4)',
        },
        'fold4'
      )

      // ====================================================================
      // ACT 3: WIND-UP ANTICIPATION & SWOOPING FLIGHT OFF-SCREEN
      // ====================================================================
      tl.addLabel('windup', 2.14)

      tl.to(
        rig,
        {
          posX: -28,
          posY: 22,
          posZ: 120,
          pitch: 56,
          bank: -24,
          heading: 50,
          shadowAlpha: 0.38,
          shadowScaleX: 0.4,
          shadowScaleY: 0.56,
          duration: 0.26,
          ease: 'power2.inOut',
        },
        'windup'
      )

      tl.addLabel('launch', 2.4)

      tl.to(
        rig,
        {
          posX: exitX,
          posZ: 280,
          scale: 0.3,
          duration: 0.72,
          ease: 'power2.in',
        },
        'launch'
      )

      tl.to(
        rig,
        {
          posY: exitY,
          duration: 0.72,
          ease: 'power3.in',
        },
        'launch'
      )

      tl.to(
        rig,
        {
          bank: 24,
          heading: 30,
          pitch: 60,
          duration: 0.72,
          ease: 'power1.inOut',
        },
        'launch'
      )

      tl.to(
        rig,
        {
          shadowAlpha: 0,
          shadowScaleX: 0.65,
          shadowScaleY: 0.85,
          duration: 0.48,
          ease: 'power2.in',
        },
        'launch+=0.08'
      )

      // ====================================================================
      // ACT 4: FRESH REPLACEMENT SHEET GLIDES ONTO BLACK COVER & GETS TAPED
      // ====================================================================
      tl.addLabel('returnSheet', 3.16)

      tl.fromTo(
        incomingSheetRef.current,
        {
          autoAlpha: 0,
          x: 116,
          y: 44,
          rotation: 3.8,
          scale: 1.03,
        },
        {
          autoAlpha: 1,
          x: 0,
          y: 0,
          rotation: 0,
          scale: 1,
          duration: 0.52,
          ease: 'power3.out',
        },
        'returnSheet'
      )

      tl.fromTo(
        incomingShadowRef.current,
        {
          opacity: 0.55,
          x: 102,
          y: 56,
          rotation: 3.8,
        },
        {
          opacity: 0,
          x: 0,
          y: 0,
          rotation: 0,
          duration: 0.52,
          ease: 'power3.out',
        },
        'returnSheet'
      )

      // Two beige masking tape strips press down onto the spine seam to hold the fresh sheet
      tl.fromTo(
        topTapeRef.current,
        { opacity: 0, scale: 1.28 },
        { opacity: 1, scale: 1, duration: 0.16, ease: 'power2.out' },
        'returnSheet+=0.36'
      )
      tl.fromTo(
        bottomTapeRef.current,
        { opacity: 0, scale: 1.28 },
        { opacity: 1, scale: 1, duration: 0.16, ease: 'power2.out' },
        'returnSheet+=0.43'
      )

      syncFrame()
    }, rootRef)

    return () => ctx.revert()
  }, [exitX, exitY, geometry])

  const hingeOrigin = `${geometry.c}px 0px`
  const diagLen = Math.ceil(Math.hypot(pageW, pageH) * 1.4)

  return (
    <div
      ref={rootRef}
      className="pointer-events-none absolute select-none"
      style={{
        left: `${offsetLeft}px`,
        top: `${offsetTop}px`,
        width: `${pageW}px`,
        height: `${pageH}px`,
        zIndex: 90,
        // Isolated 3D perspective prevents any rotated flap from ever slicing into the book's z=0 plane
        perspective: '1650px',
        perspectiveOrigin: '50% 48%',
      }}
      aria-hidden="true"
    >
      {/* Stationary progressive spine stub clinging to the spine over the black hardcover */}
      <TornSpineStub ref={progressiveStubRef} initialHidden={true} />

      {/* Act 4: Soft composite-only landing shadow under the gliding replacement sheet */}
      <div
        ref={incomingShadowRef}
        className="pointer-events-none absolute inset-2 bg-black rounded-r-sm"
        style={{
          zIndex: 18,
          opacity: 0,
          filter: 'blur(14px)',
          willChange: 'transform, opacity',
        }}
      />

      {/* Act 4: Fresh replacement note sheet gliding in from desk + masking tape strips */}
      <div
        ref={incomingSheetRef}
        className="pointer-events-none absolute inset-0"
        style={{
          zIndex: 20,
          opacity: 0,
          visibility: 'hidden',
          willChange: 'transform, opacity',
        }}
      >
        {cleanReplacementPageNode}
      </div>
      <SpineReplacementTapes
        topTapeRef={topTapeRef}
        bottomTapeRef={bottomTapeRef}
        initialHidden={true}
      />

      {/* Soft cast shadow on the black inside hardcover / desk */}
      <div
        ref={deskShadowRef}
        className="pointer-events-none absolute inset-0"
        style={{
          zIndex: 22,
          opacity: 0,
          filter: 'blur(18px)',
          transformOrigin: '50% 50%',
          willChange: 'transform, opacity',
        }}
      >
        <div
          className="w-full h-full bg-black"
          style={{
            clipPath: 'polygon(50% 0%, 96% 62%, 82% 100%, 18% 100%, 4% 62%)',
          }}
        />
      </div>

      {/* 3D FLIGHT POSITION & HEADING RIG */}
      <div
        ref={flightPosRef}
        className="pointer-events-none absolute inset-0 transform-style-3d"
        style={{
          zIndex: 30,
          transformOrigin: '50% 50%',
          willChange: 'transform',
        }}
      >
        {/* 3D AIRCRAFT PITCH & ROLL ATTITUDE RIG */}
        <div
          ref={attitudeRef}
          className="pointer-events-none absolute inset-0 transform-style-3d"
          style={{
            transformOrigin: '50% 50%',
            willChange: 'transform',
          }}
        >
          {/* ================================================================ */}
          {/* ACT 1: TRUE DIAGONAL PEEL-RIP STAGE (Zero doubled page below!)   */}
          {/* ================================================================ */}
          <div
            ref={ripStageRef}
            className="pointer-events-none absolute inset-0 transform-style-3d"
          >
            {/* Lower untorn portion still attached to the bottom of the spine */}
            <div
              ref={lowerUntornClipRef}
              className="pointer-events-none absolute inset-0 overflow-hidden"
              style={{ transform: 'translateZ(0.4px)' }}
            >
              {filledPageNode}
              {/* Moving crease shadow cast by peeling upper corner */}
              <div
                ref={lowerCreaseShadowRef}
                className="pointer-events-none absolute left-0 top-0 z-30"
                style={{
                  width: `${diagLen}px`,
                  height: '44px',
                  transformOrigin: '0px 0px',
                  opacity: 0,
                  background:
                    'linear-gradient(to bottom, rgba(14, 10, 6, 0.45) 0%, rgba(14, 10, 6, 0.14) 45%, transparent 100%)',
                }}
              />
            </div>

            {/* Upper torn portion curling forward & peeling down-right off the spine */}
            <div
              ref={upperPeelHingeRef}
              className="pointer-events-none absolute inset-0 transform-style-3d"
              style={{
                transformOrigin: '0px 0px',
                display: 'none',
                willChange: 'transform',
              }}
            >
              <div
                className="pointer-events-none absolute inset-0 backface-hidden"
                style={{ transform: 'translateZ(0.8px)' }}
              >
                <div
                  ref={upperPeelFrontClipRef}
                  className="relative w-full h-full overflow-hidden"
                >
                  {filledPageNode}
                </div>
              </div>

              <div
                className="pointer-events-none absolute inset-0 backface-hidden"
                style={{ transform: 'rotateY(180deg) translateZ(0.8px)' }}
              >
                <div
                  ref={upperPeelBackClipRef}
                  className="relative w-full h-full overflow-hidden"
                >
                  <NotebookBackSurface pageW={pageW} pageH={pageH} />
                  <div
                    ref={upperPeelBackShadeRef}
                    className="pointer-events-none absolute inset-0"
                    style={{ backgroundColor: '#16100a', opacity: 0 }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ================================================================ */}
          {/* ACT 2 & 3: 10-PANEL 3D ORIGAMI DART AIRPLANE RIG                 */}
          {/* ================================================================ */}
          <div
            ref={origamiRigRef}
            className="pointer-events-none absolute inset-0 transform-style-3d"
            style={{ display: 'none' }}
          >
            {/* LEFT HALF KINEMATIC CHAIN */}
            <div
              ref={leftKeelHingeRef}
              className="pointer-events-none absolute inset-0 transform-style-3d"
              style={{ transformOrigin: hingeOrigin, willChange: 'transform' }}
            >
              <OrigamiFacet
                geo={geometry.facets.L1}
                pageW={pageW}
                pageH={pageH}
                frontContent={filledPageNode}
                frontShadeRef={l1FrontShade}
                backShadeRef={l1BackShade}
                registerCreaseEl={registerCreaseEl}
              />

              <div
                ref={leftWingHingeRef}
                className="pointer-events-none absolute inset-0 transform-style-3d"
                style={{ transformOrigin: hingeOrigin, willChange: 'transform' }}
              >
                <OrigamiFacet
                  geo={geometry.facets.L2}
                  pageW={pageW}
                  pageH={pageH}
                  frontContent={filledPageNode}
                  frontShadeRef={l2FrontShade}
                  registerCreaseEl={registerCreaseEl}
                />

                <div
                  ref={leftDartHingeRef}
                  className="pointer-events-none absolute inset-0 transform-style-3d"
                  style={{ transformOrigin: hingeOrigin, willChange: 'transform' }}
                >
                  <OrigamiFacet
                    geo={geometry.facets.L3}
                    pageW={pageW}
                    pageH={pageH}
                    frontContent={filledPageNode}
                    backShadeRef={l3BackShade}
                    registerCreaseEl={registerCreaseEl}
                  />

                  <div
                    ref={leftCornerHingeRef}
                    className="pointer-events-none absolute inset-0 transform-style-3d"
                    style={{ transformOrigin: hingeOrigin, willChange: 'transform' }}
                  >
                    <OrigamiFacet
                      geo={geometry.facets.L4a}
                      pageW={pageW}
                      pageH={pageH}
                      frontContent={filledPageNode}
                      backShadeRef={l4aBackShade}
                      registerCreaseEl={registerCreaseEl}
                    />

                    <div
                      ref={leftTipHingeRef}
                      className="pointer-events-none absolute inset-0 transform-style-3d"
                      style={{ transformOrigin: hingeOrigin, willChange: 'transform' }}
                    >
                      <OrigamiFacet
                        geo={geometry.facets.L4b}
                        pageW={pageW}
                        pageH={pageH}
                        frontContent={filledPageNode}
                        backShadeRef={l4bBackShade}
                        registerCreaseEl={registerCreaseEl}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT HALF KINEMATIC CHAIN */}
            <div
              ref={rightKeelHingeRef}
              className="pointer-events-none absolute inset-0 transform-style-3d"
              style={{ transformOrigin: hingeOrigin, willChange: 'transform' }}
            >
              <OrigamiFacet
                geo={geometry.facets.R1}
                pageW={pageW}
                pageH={pageH}
                frontContent={filledPageNode}
                frontShadeRef={r1FrontShade}
                backShadeRef={r1BackShade}
                registerCreaseEl={registerCreaseEl}
              />

              <div
                ref={rightWingHingeRef}
                className="pointer-events-none absolute inset-0 transform-style-3d"
                style={{ transformOrigin: hingeOrigin, willChange: 'transform' }}
              >
                <OrigamiFacet
                  geo={geometry.facets.R2}
                  pageW={pageW}
                  pageH={pageH}
                  frontContent={filledPageNode}
                  frontShadeRef={r2FrontShade}
                  registerCreaseEl={registerCreaseEl}
                />

                <div
                  ref={rightDartHingeRef}
                  className="pointer-events-none absolute inset-0 transform-style-3d"
                  style={{ transformOrigin: hingeOrigin, willChange: 'transform' }}
                >
                  <OrigamiFacet
                    geo={geometry.facets.R3}
                    pageW={pageW}
                    pageH={pageH}
                    frontContent={filledPageNode}
                    backShadeRef={r3BackShade}
                    registerCreaseEl={registerCreaseEl}
                  />

                  <div
                    ref={rightCornerHingeRef}
                    className="pointer-events-none absolute inset-0 transform-style-3d"
                    style={{ transformOrigin: hingeOrigin, willChange: 'transform' }}
                  >
                    <OrigamiFacet
                      geo={geometry.facets.R4a}
                      pageW={pageW}
                      pageH={pageH}
                      frontContent={filledPageNode}
                      backShadeRef={r4aBackShade}
                      registerCreaseEl={registerCreaseEl}
                    />

                    <div
                      ref={rightTipHingeRef}
                      className="pointer-events-none absolute inset-0 transform-style-3d"
                      style={{ transformOrigin: hingeOrigin, willChange: 'transform' }}
                    >
                      <OrigamiFacet
                        geo={geometry.facets.R4b}
                        pageW={pageW}
                        pageH={pageH}
                        frontContent={filledPageNode}
                        backShadeRef={r4bBackShade}
                        registerCreaseEl={registerCreaseEl}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
