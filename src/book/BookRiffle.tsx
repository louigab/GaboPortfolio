import React, { useEffect, useLayoutEffect, useRef } from 'react'
import {
  type Corner,
  type TurnDirection,
  clamp,
  sampleNaturalTurnCorner,
  solveBookCurl,
} from './flipGeometry'

export interface BookRiffleLeaf {
  frontSheet: React.ReactNode
  backSheet: React.ReactNode
}

export interface BookRiffleProps {
  direction: TurnDirection
  isDesktop: boolean
  pageW: number
  pageH: number
  spineW: number
  offsetLeft: number
  offsetTop: number
  leaves: BookRiffleLeaf[]
  underSheet: React.ReactNode | null
  onComplete: () => void
}

interface SingleLeafRefs {
  frontWrapper: HTMLDivElement | null
  overhangBlur: HTMLDivElement | null
  overhangShadow: HTMLDivElement | null
  flapFilter: HTMLDivElement | null
  flap3D: HTMLDivElement | null
  backWrapper: HTMLDivElement | null
}

export default function BookRiffle({
  direction,
  isDesktop,
  pageW,
  pageH,
  spineW,
  offsetLeft,
  offsetTop,
  leaves,
  underSheet,
  onComplete,
}: BookRiffleProps) {
  const onCompleteRef = useRef(onComplete)
  useEffect(() => {
    onCompleteRef.current = onComplete
  })

  const leafRefs = useRef<SingleLeafRefs[]>([])
  const getLeafRef = (i: number): SingleLeafRefs => {
    if (!leafRefs.current[i]) {
      leafRefs.current[i] = {
        frontWrapper: null,
        overhangBlur: null,
        overhangShadow: null,
        flapFilter: null,
        flap3D: null,
        backWrapper: null,
      }
    }
    return leafRefs.current[i]
  }

  const rafRef = useRef<number | null>(null)
  const totalW = isDesktop ? pageW * 2 + spineW : pageW
  const underSlotLeft = !isDesktop
    ? 0
    : direction === 'next'
      ? pageW + spineW
      : 0

  const tornFrontClass =
    isDesktop && direction === 'prev' ? 'torn-clip-left' : 'torn-clip-right'
  const tornBackClass =
    isDesktop && direction === 'prev' ? 'torn-clip-right' : 'torn-clip-left'
  const tornUnderClass =
    isDesktop && direction === 'prev' ? 'torn-clip-left' : 'torn-clip-right'

  useLayoutEffect(() => {
    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (reducedMotion || leaves.length === 0) {
      onCompleteRef.current()
      return
    }

    const N = leaves.length
    // Responsive, brisk riffle duration scaling: 460ms for 2 leaves up to 640ms for 5+
    const totalDuration =
      N <= 2 ? 460 : N === 3 ? 520 : N === 4 ? 580 : 640

    // Individual leaf sweep window within [0..1]
    const leafDurationFrac = clamp(0.74 - (N - 2) * 0.055, 0.44, 0.74)
    const stagger = N > 1 ? (1 - leafDurationFrac) / (N - 1) : 0

    const corner: Corner = 'bottom'
    let startTime = 0

    const applyLeafProgress = (i: number, progress: number) => {
      const refs = leafRefs.current[i]
      if (!refs) return

      const {
        frontWrapper,
        overhangBlur,
        overhangShadow,
        flapFilter,
        flap3D,
        backWrapper,
      } = refs

      if (progress <= 0.0001) {
        // Unpeeled state: flat on unpeeled stack
        if (frontWrapper) {
          const hingeX = isDesktop ? (direction === 'next' ? pageW + spineW : pageW) : 0
          const frontLeft = isDesktop && direction === 'prev' ? hingeX - pageW : hingeX
          frontWrapper.style.transform = `translate3d(${frontLeft}px, 0, 0)`
          frontWrapper.style.clipPath = 'none'
          frontWrapper.style.opacity = '1'
          frontWrapper.style.visibility = 'visible'
        }
        if (flapFilter) {
          flapFilter.style.opacity = '0'
          flapFilter.style.visibility = 'hidden'
        }
        if (overhangBlur) {
          overhangBlur.style.opacity = '0'
        }
        return
      }

      if (progress >= 0.9999) {
        // Landed state: flat on destination stack
        if (frontWrapper) {
          frontWrapper.style.opacity = '0'
          frontWrapper.style.visibility = 'hidden'
        }
        if (flapFilter) {
          flapFilter.style.opacity = '1'
          flapFilter.style.visibility = 'visible'
          flapFilter.style.filter = 'none'
        }
        if (flap3D) {
          flap3D.style.transform = 'none'
        }
        if (backWrapper) {
          // Destination side resting position
          const landedX = isDesktop
            ? direction === 'next'
              ? 0
              : pageW + spineW
            : 0
          backWrapper.style.transform = `translate3d(${landedX}px, 0, 0)`
          backWrapper.style.clipPath = 'none'
          backWrapper.style.opacity = '1'
        }
        if (overhangBlur) {
          overhangBlur.style.opacity = '0'
        }
        return
      }

      // Mid-flight peeling state
      const canonicalP = sampleNaturalTurnCorner(pageW, pageH, corner, progress)
      const curl = solveBookCurl({
        W: pageW,
        H: pageH,
        spineW: isDesktop ? spineW : 0,
        isDesktop,
        direction,
        corner,
        canonicalP,
      })

      const {
        arch,
        frontClipPath,
        backClipPath,
        backMatrixCss,
        flapLift3DCss,
        overhangUnit,
        hingeX,
      } = curl

      if (frontWrapper) {
        const frontLeft = isDesktop && direction === 'prev' ? hingeX - pageW : hingeX
        frontWrapper.style.transform = `translate3d(${Math.round(frontLeft * 10) / 10}px, 0, 0)`
        frontWrapper.style.clipPath = frontClipPath
        frontWrapper.style.opacity = '1'
        frontWrapper.style.visibility = 'visible'
      }

      if (overhangBlur && overhangShadow) {
        const reach = 2.5 + 10 * arch
        const dx = Math.round(overhangUnit.x * reach * 10) / 10
        const dy = Math.round((overhangUnit.y * reach + 2 * arch) * 10) / 10
        const blurPx = Math.round((3 + 9 * arch) * 10) / 10
        const shOpacity = Math.round(Math.pow(arch, 0.75) * 0.28 * 1000) / 1000

        overhangBlur.style.filter = `blur(${blurPx}px)`
        overhangBlur.style.opacity = `${shOpacity}`

        overhangShadow.style.transform = `translate3d(${dx}px, ${dy}px, 0) ${backMatrixCss}`
        overhangShadow.style.clipPath = backClipPath
      }

      if (flapFilter) {
        flapFilter.style.opacity = '1'
        flapFilter.style.visibility = 'visible'
        if (arch > 0.01) {
          const rimDist = 1.2 + 1.6 * arch
          const rdx = Math.round(overhangUnit.x * rimDist * 10) / 10
          const rdy = Math.round((overhangUnit.y * rimDist + 0.5 * arch) * 10) / 10
          const rAlpha = Math.round(Math.pow(arch, 0.6) * 0.35 * 1000) / 1000
          flapFilter.style.filter = `drop-shadow(${rdx}px ${rdy}px 2px rgba(17, 12, 8, ${rAlpha}))`
        } else {
          flapFilter.style.filter = 'none'
        }
      }

      if (flap3D) {
        flap3D.style.transform = flapLift3DCss
      }

      if (backWrapper) {
        backWrapper.style.transform = backMatrixCss
        backWrapper.style.clipPath = backClipPath
        backWrapper.style.opacity = '1'
      }
    }

    // Set initial frame (leaf 0 starting, others waiting)
    for (let i = 0; i < N; i++) {
      applyLeafProgress(i, 0)
    }

    const step = (now: number) => {
      if (startTime === 0) startTime = now
      const elapsed = now - startTime
      const globalT = clamp(elapsed / totalDuration, 0, 1)

      for (let i = 0; i < N; i++) {
        const startT = i * stagger
        const endT = startT + leafDurationFrac

        let localP = 0
        if (globalT <= startT) {
          localP = 0
        } else if (globalT >= endT) {
          localP = 1
        } else {
          const raw = (globalT - startT) / leafDurationFrac
          // Crisp, continuous flick curve for intermediate leaves; smooth air-cushioned landing for final leaf
          if (i === N - 1) {
            localP = clamp(raw * raw * (3 - 2 * raw), 0, 1)
          } else {
            // Snappy energetic page release
            localP = clamp(raw * raw * raw * (raw * (raw * 6 - 15) + 10), 0, 1)
          }
        }

        applyLeafProgress(i, localP)
      }

      if (globalT < 1) {
        rafRef.current = requestAnimationFrame(step)
      } else {
        rafRef.current = null
        onCompleteRef.current()
      }
    }

    rafRef.current = requestAnimationFrame(step)

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [direction, isDesktop, leaves.length, pageH, pageW, spineW])

  return (
    <div
      className="pointer-events-none absolute select-none z-50"
      style={{
        left: `${offsetLeft}px`,
        top: `${offsetTop}px`,
        width: `${totalW}px`,
        height: `${pageH}px`,
        zIndex: 50,
      }}
      aria-hidden="true"
    >
      {/* LAYER 0: Newly Revealed Destination Sheet Resting Underneath at z-15 */}
      {underSheet !== null && (
        <div
          className="absolute top-0 overflow-hidden"
          style={{
            left: `${underSlotLeft}px`,
            width: `${pageW}px`,
            height: `${pageH}px`,
            zIndex: 15,
          }}
        >
          {underSheet}
          <div className={`pointer-events-none absolute inset-0 overflow-hidden ${tornUnderClass}`} />
        </div>
      )}

      {/* CASCADING LEAVES */}
      {leaves.map((leaf, i) => {
        // Physical stacking order:
        // - On unpeeled side (right for 'next'): leaf 0 is on top of leaf 1, which is on top of leaf 2.
        //   -> frontWrapper zIndex = 28 - i * 2.
        // - On peeled reverse side (left for 'next'): leaf 0 lands first, leaf 1 lands on top of leaf 0, leaf 2 lands on top of leaf 1.
        //   -> flapFilter zIndex = 35 + i * 4.
        const frontZ = 28 - i * 2
        const flapZ = 35 + i * 4

        return (
          <React.Fragment key={i}>
            {/* Peeling Front Sheet (Front of this leaf) */}
            <div
              ref={(el) => {
                getLeafRef(i).frontWrapper = el
              }}
              className="absolute left-0 top-0 overflow-hidden"
              style={{
                width: `${pageW}px`,
                height: `${pageH}px`,
                zIndex: frontZ,
                willChange: 'transform, clip-path',
              }}
            >
              {leaf.frontSheet}
              <div className={`pointer-events-none absolute inset-0 overflow-hidden z-40 ${tornFrontClass}`} />
            </div>

            {/* Moving Soft Drop Shadow for this leaf */}
            <div
              ref={(el) => {
                getLeafRef(i).overhangBlur = el
              }}
              className="pointer-events-none absolute inset-0"
              style={{
                zIndex: flapZ - 1,
                overflow: isDesktop ? 'visible' : 'hidden',
                willChange: 'filter, opacity',
                opacity: 0,
              }}
            >
              <div
                ref={(el) => {
                  getLeafRef(i).overhangShadow = el
                }}
                className="absolute left-0 top-0"
                style={{
                  width: `${pageW}px`,
                  height: `${pageH}px`,
                  transformOrigin: '0 0',
                  willChange: 'transform, clip-path',
                }}
              >
                <div className={`w-full h-full bg-[#120d08] ${tornBackClass}`} />
              </div>
            </div>

            {/* 3D Arched Curled Reverse Flap (Lands on destination side) */}
            <div
              ref={(el) => {
                getLeafRef(i).flapFilter = el
              }}
              className="pointer-events-none absolute top-0 bottom-0"
              style={{
                left: isDesktop ? '0px' : '-20px',
                right: '0px',
                overflow: isDesktop ? 'visible' : 'hidden',
                zIndex: flapZ,
                perspective: '2000px',
                perspectiveOrigin: '50% 50%',
                willChange: 'filter',
                opacity: 0,
              }}
            >
              <div
                ref={(el) => {
                  getLeafRef(i).flap3D = el
                }}
                className="pointer-events-none absolute top-0 bottom-0 right-0 transform-style-3d"
                style={{
                  left: isDesktop ? '0px' : '20px',
                  transformOrigin: '0 0',
                  willChange: 'transform',
                }}
              >
                <div
                  ref={(el) => {
                    getLeafRef(i).backWrapper = el
                  }}
                  className="absolute left-0 top-0 overflow-hidden"
                  style={{
                    width: `${pageW}px`,
                    height: `${pageH}px`,
                    transformOrigin: '0 0',
                    willChange: 'transform, clip-path',
                  }}
                >
                  {leaf.backSheet}
                  <div className={`pointer-events-none absolute inset-0 overflow-hidden z-30 ${tornBackClass}`} />
                </div>
              </div>
            </div>
          </React.Fragment>
        )
      })}
    </div>
  )
}
