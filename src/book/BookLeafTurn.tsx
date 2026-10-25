import React, { useCallback, useLayoutEffect, useRef } from 'react'
import type { ComputedCurl, TurnDirection } from './flipGeometry'
import type { CurlFrameListener } from './usePageTurn'

export interface BookLeafTurnProps {
  direction: TurnDirection
  isDesktop: boolean
  pageW: number
  pageH: number
  spineW: number
  offsetLeft: number
  offsetTop: number
  /** Sheet currently being lifted & peeled */
  frontSheet: React.ReactNode
  /** Reverse side of the lifted sheet (lands on opposite side in 2-page spread) */
  backSheet: React.ReactNode
  /** Sheet resting directly underneath the lifted sheet */
  underSheet: React.ReactNode | null
  registerFrameListener: (fn: CurlFrameListener | null) => void
  getCurrentCurl: () => ComputedCurl | null
}

export default function BookLeafTurn({
  direction,
  isDesktop,
  pageW,
  pageH,
  spineW,
  offsetLeft,
  offsetTop,
  frontSheet,
  backSheet,
  underSheet,
  registerFrameListener,
  getCurrentCurl,
}: BookLeafTurnProps) {
  const underShadowBarRef = useRef<HTMLDivElement>(null)
  const frontWrapperRef = useRef<HTMLDivElement>(null)
  const frontValleyBarRef = useRef<HTMLDivElement>(null)
  const overhangBlurRef = useRef<HTMLDivElement>(null)
  const overhangShadowRef = useRef<HTMLDivElement>(null)
  const flapFilterRef = useRef<HTMLDivElement>(null)
  const flap3DRef = useRef<HTMLDivElement>(null)
  const backWrapperRef = useRef<HTMLDivElement>(null)
  const backTintRef = useRef<HTMLDivElement>(null)
  const backRollBarRef = useRef<HTMLDivElement>(null)

  const totalW = isDesktop ? pageW * 2 + spineW : pageW
  const diagLen = Math.ceil(Math.hypot(pageW, pageH) * 1.6)

  const underSlotLeft = !isDesktop
    ? 0
    : direction === 'next'
      ? pageW + spineW
      : 0

  // Clip-only torn outer-edge classes (NO background-image!) so overlays never draw notebook lines over content!
  const tornFrontClass =
    isDesktop && direction === 'prev' ? 'torn-clip-left' : 'torn-clip-right'
  const tornBackClass =
    isDesktop && direction === 'prev' ? 'torn-clip-right' : 'torn-clip-left'
  const tornUnderClass =
    isDesktop && direction === 'prev' ? 'torn-clip-left' : 'torn-clip-right'

  const applyFrame = useCallback(
    (curl: ComputedCurl) => {
      const {
        arch,
        rollRadius,
        frontClipPath,
        backClipPath,
        backMatrixCss,
        flapLift3DCss,
        spreadFoldMid,
        frontLocalMid,
        frontLocalValleyAngleRad,
        backLocalMid,
        backLocalRollAngleRad,
        underShadowAngleRad,
        overhangUnit,
        hingeX,
      } = curl

      // 1. Cast shadow onto newly revealed underlying page (0 at flat endpoints!)
      if (underShadowBarRef.current) {
        const localMidX = spreadFoldMid.x - underSlotLeft
        const localMidY = spreadFoldMid.y
        const reach = Math.round(14 + 108 * arch)
        const opacity = Math.min(1, Math.pow(arch, 0.72) * 0.92)
        const el = underShadowBarRef.current
        el.style.width = `${reach}px`
        el.style.opacity = `${Math.round(opacity * 1000) / 1000}`
        el.style.transform = `translate3d(${Math.round(localMidX * 10) / 10}px, ${
          Math.round((localMidY - diagLen * 0.5) * 10) / 10
        }px, 0) rotate(${Math.round(underShadowAngleRad * 10000) / 10000}rad)`
      }

      // 2. Peeling front sheet + pre-curl upward flex shading
      if (frontWrapperRef.current) {
        const frontLeft =
          isDesktop && direction === 'prev' ? hingeX - pageW : hingeX
        const fw = frontWrapperRef.current
        fw.style.transform = `translate3d(${Math.round(frontLeft * 100) / 100}px, 0, 0)`
        fw.style.clipPath = frontClipPath
      }

      if (frontValleyBarRef.current) {
        const valleyW = Math.round(12 + 48 * arch)
        const el = frontValleyBarRef.current
        el.style.width = `${valleyW}px`
        el.style.opacity = `${Math.round(arch * 0.8 * 1000) / 1000}`
        el.style.transform = `translate3d(${
          Math.round(frontLocalMid.x * 10) / 10
        }px, ${
          Math.round((frontLocalMid.y - diagLen * 0.5) * 10) / 10
        }px, 0) rotate(${Math.round(frontLocalValleyAngleRad * 10000) / 10000}rad)`
      }

      // 3. Soft Gaussian-blurred ambient shadow of overhanging curled flap
      // (Shifted strictly along overhangUnit so zero shadow ever crosses backward over the fold crease!)
      if (overhangBlurRef.current && overhangShadowRef.current) {
        const reach = 2.5 + 12 * arch
        const dx = Math.round(overhangUnit.x * reach * 10) / 10
        const dy = Math.round((overhangUnit.y * reach + 2.5 * arch) * 10) / 10
        const blurPx = Math.round((4.5 + 11 * arch) * 10) / 10
        const shOpacity = Math.round(Math.pow(arch, 0.78) * 0.25 * 1000) / 1000

        const blurWrap = overhangBlurRef.current
        blurWrap.style.filter = `blur(${blurPx}px)`
        blurWrap.style.opacity = `${shOpacity}`

        const sh = overhangShadowRef.current
        sh.style.transform = `translate3d(${dx}px, ${dy}px, 0) ${backMatrixCss}`
        sh.style.clipPath = backClipPath
      }

      // 4. 3D perspective-arched curled reverse flap + crisp jagged-edge paper-thickness rim shadow
      if (flapFilterRef.current) {
        if (arch > 0.008) {
          const rimDist = 1.4 + 1.8 * arch
          const rdx = Math.round(overhangUnit.x * rimDist * 10) / 10
          const rdy = Math.round((overhangUnit.y * rimDist + 0.6 * arch) * 10) / 10
          const rBlur = Math.round((0.8 + 1.0 * arch) * 10) / 10
          const rAlpha = Math.round(Math.pow(arch, 0.62) * 0.4 * 1000) / 1000
          flapFilterRef.current.style.filter = `drop-shadow(${rdx}px ${rdy}px ${rBlur}px rgba(17, 12, 8, ${rAlpha}))`
        } else {
          flapFilterRef.current.style.filter = 'none'
        }
      }

      if (flap3DRef.current) {
        flap3DRef.current.style.transform = flapLift3DCss
      }

      if (backWrapperRef.current) {
        const bw = backWrapperRef.current
        bw.style.transform = backMatrixCss
        bw.style.clipPath = backClipPath
      }

      // Reverse paper fiber tint fades smoothly to 0.000 at flat landing -> zero swap flash!
      if (backTintRef.current) {
        backTintRef.current.style.opacity = `${
          Math.round(arch * 0.12 * 1000) / 1000
        }`
      }

      // Cylindrical roll highlight & concave belly shadow also fade strictly to 0.000 at arch = 0!
      if (backRollBarRef.current) {
        const cylSpan = Math.round(24 + rollRadius * 1.55)
        const bulgeOffset = Math.round(12 * arch)
        const lightStrength = Math.round(Math.pow(arch, 0.65) * 0.94 * 1000) / 1000
        const br = backRollBarRef.current
        br.style.width = `${cylSpan}px`
        br.style.opacity = `${lightStrength}`
        br.style.transform = `translate3d(${
          Math.round(backLocalMid.x * 10) / 10
        }px, ${
          Math.round((backLocalMid.y - diagLen * 0.5) * 10) / 10
        }px, 0) rotate(${
          Math.round(backLocalRollAngleRad * 10000) / 10000
        }rad) translate3d(${-bulgeOffset}px, 0, 0)`
      }
    },
    [diagLen, direction, isDesktop, pageW, underSlotLeft]
  )

  useLayoutEffect(() => {
    registerFrameListener(applyFrame)
    const initial = getCurrentCurl()
    if (initial) {
      applyFrame(initial)
    }
    return () => {
      registerFrameListener(null)
    }
  }, [applyFrame, getCurrentCurl, registerFrameListener])

  return (
    <div
      className="pointer-events-none absolute select-none"
      style={{
        left: `${offsetLeft}px`,
        top: `${offsetTop}px`,
        width: `${totalW}px`,
        height: `${pageH}px`,
      }}
      aria-hidden="true"
    >
      {/* LAYER 1: Newly Revealed Underlying Page + Moving Crease Cast Shadow */}
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
          {/* Clip crease shadow to the torn outer paper silhouette too */}
          <div className={`pointer-events-none absolute inset-0 overflow-hidden ${tornUnderClass}`}>
            <div
              ref={underShadowBarRef}
              className="pointer-events-none absolute left-0 top-0"
              style={{
                height: `${diagLen}px`,
                transformOrigin: '0px 50%',
                willChange: 'transform, opacity',
                background:
                  'linear-gradient(to right, rgba(16, 11, 6, 0.42) 0%, rgba(16, 11, 6, 0.23) 24%, rgba(16, 11, 6, 0.08) 58%, transparent 100%)',
              }}
            />
          </div>
        </div>
      )}

      {/* LAYER 2: Peeling Front Sheet + Pre-Fold Upward Curve Shading */}
      <div
        ref={frontWrapperRef}
        className="absolute left-0 top-0 overflow-hidden"
        style={{
          width: `${pageW}px`,
          height: `${pageH}px`,
          zIndex: 20,
          willChange: 'transform, clip-path',
        }}
      >
        {frontSheet}
        <div className={`pointer-events-none absolute inset-0 overflow-hidden z-40 ${tornFrontClass}`}>
          <div
            ref={frontValleyBarRef}
            className="pointer-events-none absolute left-0 top-0"
            style={{
              height: `${diagLen}px`,
              transformOrigin: '0px 50%',
              willChange: 'transform, opacity',
              background:
                'linear-gradient(to right, rgba(22, 16, 10, 0.17) 0%, rgba(22, 16, 10, 0.06) 45%, transparent 100%)',
            }}
          />
        </div>
      </div>

      {/* LAYER 3: Soft Blurred Drop Shadow of Overhanging Curled Flap */}
      <div
        ref={overhangBlurRef}
        className="pointer-events-none absolute inset-0"
        style={{
          zIndex: 42,
          overflow: isDesktop ? 'visible' : 'hidden',
          willChange: 'filter, opacity',
        }}
      >
        <div
          ref={overhangShadowRef}
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

      {/* LAYER 4: 3D Perspective-Arched Curled Reverse Sheet (Transparent outer wrapper so torn edges stay jagged!) */}
      <div
        ref={flapFilterRef}
        className="pointer-events-none absolute top-0 bottom-0"
        style={{
          left: isDesktop ? '0px' : '-20px',
          right: '0px',
          overflow: isDesktop ? 'visible' : 'hidden',
          zIndex: 45,
          perspective: '2000px',
          perspectiveOrigin: '50% 50%',
          willChange: 'filter',
        }}
      >
        <div
          ref={flap3DRef}
          className="pointer-events-none absolute top-0 bottom-0 right-0 transform-style-3d"
          style={{
            left: isDesktop ? '0px' : '20px',
            transformOrigin: '0 0',
            willChange: 'transform',
          }}
        >
          <div
            ref={backWrapperRef}
            className="absolute left-0 top-0 overflow-hidden"
            style={{
              width: `${pageW}px`,
              height: `${pageH}px`,
              transformOrigin: '0 0',
              willChange: 'transform, clip-path',
            }}
          >
            {backSheet}

            {/* Torn-edge-clipped roll lighting & warm fiber tint (preserves jagged outer silhouette!) */}
            <div className={`pointer-events-none absolute inset-0 overflow-hidden z-30 ${tornBackClass}`}>
              <div
                ref={backTintRef}
                className="pointer-events-none absolute inset-0"
                style={{
                  opacity: 0,
                  backgroundColor: 'rgb(228, 218, 198)',
                }}
              />
              <div
                ref={backRollBarRef}
                className="pointer-events-none absolute left-0 top-0"
                style={{
                  height: `${diagLen}px`,
                  transformOrigin: '0px 50%',
                  willChange: 'transform, opacity',
                  background:
                    'linear-gradient(to right, rgba(42, 30, 18, 0.36) 0%, rgba(238, 230, 214, 0.68) 2.5%, rgba(255, 253, 249, 0.92) 8%, rgba(255, 252, 246, 0.56) 22%, rgba(255, 251, 242, 0.08) 42%, rgba(28, 20, 12, 0.16) 70%, rgba(28, 20, 12, 0.04) 88%, transparent 100%)',
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
