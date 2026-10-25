import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
  clamp,
  constrainLocalCorner,
  sampleNaturalTurnCorner,
  solveBookCurl,
  type ComputedCurl,
  type Corner,
  type TurnDirection,
  type Vec,
} from './flipGeometry'

export interface ActiveTurnSession {
  direction: TurnDirection
  corner: Corner
  /** Optional explicit destination page index (used when clicking section tabs) */
  targetPage?: number
}

export type CurlFrameListener = (curl: ComputedCurl) => void

export interface PageTurnController {
  /** Non-null whenever a hover-peek, interactive drag, or animated turn is active */
  activeTurn: ActiveTurnSession | null
  /** True only while user is actively dragging a sheet (used for cursor styling) */
  isDragging: boolean
  /** Register imperative DOM frame updater from BookLeafTurn (zero React re-renders) */
  registerFrameListener: (fn: CurlFrameListener | null) => void
  /** Read latest computed curl synchronously on mount */
  getCurrentCurl: () => ComputedCurl | null
  /** Programmatic smooth physical page turn (buttons, keyboard, section tabs) */
  triggerFlip: (
    dir: TurnDirection,
    options?: { targetPage?: number; corner?: Corner }
  ) => void
  /** Subtle live paper corner peel when hovering corner on fine-pointer devices */
  onCornerHoverEnter: (dir: TurnDirection, corner: Corner) => void
  onCornerHoverLeave: () => void
  /** Continuous 2D pointer/touch drag handlers */
  onPointerDownEdge: (
    dir: TurnDirection,
    e: React.PointerEvent<HTMLElement>,
    spreadRect: DOMRect
  ) => void
  onPointerMoveEdge: (
    e: React.PointerEvent<HTMLElement>,
    spreadRect: DOMRect
  ) => void
  onPointerUpEdge: (e: React.PointerEvent<HTMLElement>) => void
  onLostCaptureEdge: () => void
}

type EngineMode = 'idle' | 'hover-in' | 'hover-out' | 'dragging' | 'animating'

export function usePageTurn(params: {
  onCommitTurn: (dir: TurnDirection, targetPage?: number) => void
  canTurnNext: boolean
  canTurnPrev: boolean
  pageW: number
  pageH: number
  spineW: number
  isDesktop: boolean
}): PageTurnController {
  const {
    onCommitTurn,
    canTurnNext,
    canTurnPrev,
    pageW,
    pageH,
    spineW,
    isDesktop,
  } = params

  const [activeTurn, setActiveTurn] = useState<ActiveTurnSession | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const listenerRef = useRef<CurlFrameListener | null>(null)
  const latestCurlRef = useRef<ComputedCurl | null>(null)
  const rafRef = useRef<number | null>(null)

  // Mutable physics state (never triggers React re-renders per frame)
  const engineRef = useRef<{
    mode: EngineMode
    direction: TurnDirection
    corner: Corner
    targetPage?: number
    currentP: Vec
    targetP: Vec
    grabOriginP: Vec
    pointerStartCanonical: Vec
    reusedHoverOnDown: boolean
    animFromP: Vec
    animToP: Vec
    animFromTheta: number
    animToTheta: number
    animInitialSlope: number
    animStartTime: number
    animDuration: number
    animUseNaturalArc: boolean
    animWillCommit: boolean
    lastFrameTime: number
    pointerDownClient: Vec
    pointerDownTime: number
    hasExceededSlop: boolean
    velocityX: number
    renderedVelocityX: number
    lastCanonicalX: number
    lastMoveTime: number
  }>({
    mode: 'idle',
    direction: 'next',
    corner: 'bottom',
    targetPage: undefined,
    currentP: { x: pageW, y: pageH },
    targetP: { x: pageW, y: pageH },
    grabOriginP: { x: pageW, y: pageH },
    pointerStartCanonical: { x: pageW, y: pageH },
    reusedHoverOnDown: false,
    animFromP: { x: pageW, y: pageH },
    animToP: { x: -pageW, y: pageH },
    animFromTheta: 0,
    animToTheta: Math.PI,
    animInitialSlope: 0.85,
    animStartTime: 0,
    animDuration: 620,
    animUseNaturalArc: true,
    animWillCommit: true,
    lastFrameTime: 0,
    pointerDownClient: { x: 0, y: 0 },
    pointerDownTime: 0,
    hasExceededSlop: false,
    velocityX: 0,
    renderedVelocityX: 0,
    lastCanonicalX: pageW,
    lastMoveTime: 0,
  })

  // Keep latest props accessible inside rAF without restarting loops
  const propsRef = useRef(params)
  useLayoutEffect(() => {
    propsRef.current = params
  })

  const stopRaf = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  const emitCurl = useCallback((canonicalP: Vec) => {
    const st = engineRef.current
    const pr = propsRef.current
    const curl = solveBookCurl({
      W: pr.pageW,
      H: pr.pageH,
      spineW: pr.spineW,
      isDesktop: pr.isDesktop,
      direction: st.direction,
      corner: st.corner,
      canonicalP,
    })
    latestCurlRef.current = curl
    if (listenerRef.current) {
      listenerRef.current(curl)
    }
    return curl
  }, [])

  const finishToIdle = useCallback(
    (commit: boolean) => {
      stopRaf()
      const st = engineRef.current
      const dir = st.direction
      const tgt = st.targetPage
      st.mode = 'idle'
      st.targetPage = undefined
      latestCurlRef.current = null
      setIsDragging(false)
      setActiveTurn(null)
      if (commit) {
        propsRef.current.onCommitTurn(dir, tgt)
      }
    },
    [stopRaf]
  )

  const stepLoop = useCallback(
    function tick(now: number) {
      const st = engineRef.current
      const pr = propsRef.current
      const W = pr.pageW
      const H = pr.pageH
      const dt = Math.min(0.05, Math.max(0.001, (now - st.lastFrameTime) / 1000))
      st.lastFrameTime = now

      if (st.mode === 'idle') {
        rafRef.current = null
        return
      }

      if (
        st.mode === 'hover-in' ||
        st.mode === 'hover-out' ||
        st.mode === 'dragging'
      ) {
        const prevX = st.currentP.x
        const speed = st.mode === 'dragging' ? 48 : 14
        const alpha = 1 - Math.exp(-speed * dt)
        st.currentP = {
          x: st.currentP.x + (st.targetP.x - st.currentP.x) * alpha,
          y: st.currentP.y + (st.targetP.y - st.currentP.y) * alpha,
        }

        if (st.mode === 'dragging') {
          const instRenderVx = (st.currentP.x - prevX) / (dt * 1000) // px/ms
          st.renderedVelocityX =
            st.renderedVelocityX * 0.42 + instRenderVx * 0.58
          // Decay pointer velocity when pointer stops moving while held
          if (now - st.lastMoveTime > 55) {
            st.velocityX *= Math.exp(-18 * dt)
          }
        }

        emitCurl(st.currentP)

        const distToTarget = Math.hypot(
          st.targetP.x - st.currentP.x,
          st.targetP.y - st.currentP.y
        )

        if (st.mode === 'hover-out' && distToTarget < 0.35) {
          const restingY = st.corner === 'bottom' ? H : 0
          st.currentP = { x: W, y: restingY }
          emitCurl(st.currentP)
          finishToIdle(false)
          return
        }

        if (st.mode === 'hover-in' && distToTarget < 0.35) {
          st.currentP = { ...st.targetP }
          emitCurl(st.currentP)
          rafRef.current = null
          return
        }

        rafRef.current = requestAnimationFrame(tick)
        return
      }

      if (st.mode === 'animating') {
        const elapsed = now - st.animStartTime
        const rawT = clamp(elapsed / st.animDuration, 0, 1)
        const restingY = st.corner === 'bottom' ? H : 0

        if (st.animUseNaturalArc) {
          // C-infinity continuous Hermite page-turn curve: brisk finger pick-up, smooth diagonal peel, air-cushioned settle
          const omt = 1 - rawT
          const eased =
            0.85 * rawT * omt * omt + rawT * rawT * (3 - 2 * rawT)
          const u = clamp(eased, 0, 1)
          // On mobile 'prev', sheet uncurls from t=1 (-W) back to t=0 (+W)
          const arcT = !pr.isDesktop && st.direction === 'prev' ? 1 - u : u
          st.currentP = sampleNaturalTurnCorner(W, H, st.corner, arcT)
        } else {
          // C1-continuous polar spine angle interpolation: matches exact release position & velocity,
          // glides around the cylindrical spine arc, and settles to exact (±W, restingY) with zero snap.
          const omt = 1 - rawT
          const m0 = st.animInitialSlope
          const h = m0 * rawT * omt * omt + rawT * rawT * (3 - 2 * rawT)
          const u = clamp(h, 0, 1)

          const deltaTheta = st.animToTheta - st.animFromTheta
          const theta = st.animFromTheta + deltaTheta * u
          const x = W * Math.cos(theta)

          const fromDy = st.animFromP.y - restingY
          const decayedDy = fromDy * Math.pow(1 - u, 1.65)
          // Subtle C1-zero-endpoint arch only when releasing a nearly horizontal drag across the spine
          const needSubtleArc =
            st.animWillCommit &&
            Math.abs(deltaTheta) > 1.1 &&
            Math.abs(fromDy) < 16
          const bell = Math.sin(Math.PI * u)
          const extraLift = needSubtleArc
            ? bell * bell * (16 - Math.abs(fromDy)) * (st.corner === 'bottom' ? -1 : 1)
            : 0

          const y = restingY + decayedDy + extraLift
          st.currentP =
            rawT >= 1
              ? { x: W * Math.cos(st.animToTheta), y: restingY }
              : constrainLocalCorner(W, H, st.corner, { x, y })
        }

        emitCurl(st.currentP)

        if (rawT < 1) {
          rafRef.current = requestAnimationFrame(tick)
        } else {
          finishToIdle(st.animWillCommit)
        }
      }
    },
    [emitCurl, finishToIdle]
  )

  const ensureLoop = useCallback(() => {
    if (rafRef.current === null) {
      engineRef.current.lastFrameTime = performance.now()
      rafRef.current = requestAnimationFrame(stepLoop)
    }
  }, [stepLoop])

  useEffect(() => {
    return () => stopRaf()
  }, [stopRaf])

  const registerFrameListener = useCallback((fn: CurlFrameListener | null) => {
    listenerRef.current = fn
    if (fn && latestCurlRef.current) {
      fn(latestCurlRef.current)
    }
  }, [])

  const getCurrentCurl = useCallback(() => latestCurlRef.current, [])

  /** Map viewport clientX/clientY to canonical sheet coordinates */
  const clientToCanonical = useCallback(
    (
      clientX: number,
      clientY: number,
      dir: TurnDirection,
      spreadRect: DOMRect
    ): Vec => {
      const totalSpreadW = isDesktop ? pageW * 2 + spineW : pageW
      const relX =
        ((clientX - spreadRect.left) / Math.max(1, spreadRect.width)) *
        totalSpreadW
      const relY =
        ((clientY - spreadRect.top) / Math.max(1, spreadRect.height)) * pageH

      if (!isDesktop) {
        // Mobile single page [0..pageW], spine at 0
        return { x: clamp(relX, -pageW, pageW), y: relY }
      }

      if (dir === 'next') {
        // Right page hinges around W + spineW/2
        const canonicalX = relX - (pageW + spineW * 0.5)
        return { x: clamp(canonicalX, -pageW, pageW), y: relY }
      } else {
        // Left page hinges around W + spineW/2, mirrored horizontally
        const canonicalX = pageW + spineW * 0.5 - relX
        return { x: clamp(canonicalX, -pageW, pageW), y: relY }
      }
    },
    [isDesktop, pageH, pageW, spineW]
  )

  const triggerFlip = useCallback(
    (
      dir: TurnDirection,
      options?: { targetPage?: number; corner?: Corner }
    ) => {
      const st = engineRef.current
      if (st.mode === 'animating' || st.mode === 'dragging') return
      if (dir === 'next' && !canTurnNext && options?.targetPage === undefined) {
        return
      }
      if (dir === 'prev' && !canTurnPrev && options?.targetPage === undefined) {
        return
      }

      if (
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ) {
        finishToIdle(false)
        onCommitTurn(dir, options?.targetPage)
        return
      }

      const corner: Corner = options?.corner ?? 'bottom'
      const restingY = corner === 'bottom' ? pageH : 0
      const isMobilePrev = !isDesktop && dir === 'prev'

      // If already hover-peeking the exact same corner, continue seamlessly from current lifted corner!
      const reuseHover =
        (st.mode === 'hover-in' || st.mode === 'hover-out') &&
        st.direction === dir &&
        st.corner === corner &&
        options?.targetPage === undefined

      st.direction = dir
      st.corner = corner
      st.targetPage = options?.targetPage
      st.mode = 'animating'
      st.animStartTime = performance.now()
      st.animDuration = 680
      st.animWillCommit = true

      if (reuseHover) {
        st.animUseNaturalArc = false
        st.animFromP = { ...st.currentP }
        st.animFromTheta = Math.acos(clamp(st.currentP.x / pageW, -1, 1))
        st.animToTheta = isMobilePrev ? 0 : Math.PI
        st.animInitialSlope = 0.85
        st.animToP = {
          x: isMobilePrev ? pageW : -pageW,
          y: restingY,
        }
      } else {
        st.animUseNaturalArc = true
        const startP = isMobilePrev
          ? { x: -pageW, y: restingY }
          : { x: pageW, y: restingY }
        st.currentP = startP
        st.animFromP = startP
        st.animToP = {
          x: isMobilePrev ? pageW : -pageW,
          y: restingY,
        }
      }

      emitCurl(st.currentP)
      setActiveTurn({
        direction: dir,
        corner,
        targetPage: options?.targetPage,
      })
      ensureLoop()
    },
    [
      canTurnNext,
      canTurnPrev,
      emitCurl,
      ensureLoop,
      finishToIdle,
      isDesktop,
      onCommitTurn,
      pageH,
      pageW,
    ]
  )

  const onCornerHoverEnter = useCallback(
    (dir: TurnDirection, corner: Corner) => {
      if (typeof window === 'undefined') return
      if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
      if (!isDesktop && dir === 'prev') return

      const st = engineRef.current
      if (st.mode === 'animating' || st.mode === 'dragging') return
      if (dir === 'next' && !canTurnNext) return
      if (dir === 'prev' && !canTurnPrev) return

      const restingY = corner === 'bottom' ? pageH : 0
      const peekY = corner === 'bottom' ? pageH - 34 : 34

      if (st.mode === 'idle') {
        st.currentP = { x: pageW, y: restingY }
      }

      st.direction = dir
      st.corner = corner
      st.targetPage = undefined
      st.mode = 'hover-in'
      st.targetP = constrainLocalCorner(pageW, pageH, corner, {
        x: pageW - 42,
        y: peekY,
      })

      emitCurl(st.currentP)
      setActiveTurn({ direction: dir, corner })
      ensureLoop()
    },
    [canTurnNext, canTurnPrev, emitCurl, ensureLoop, isDesktop, pageH, pageW]
  )

  const onCornerHoverLeave = useCallback(() => {
    const st = engineRef.current
    if (st.mode !== 'hover-in') return
    const restingY = st.corner === 'bottom' ? pageH : 0
    st.mode = 'hover-out'
    st.targetP = { x: pageW, y: restingY }
    ensureLoop()
  }, [ensureLoop, pageH, pageW])

  const onPointerDownEdge = useCallback(
    (
      dir: TurnDirection,
      e: React.PointerEvent<HTMLElement>,
      spreadRect: DOMRect
    ) => {
      if (e.button !== 0) return
      const st = engineRef.current
      if (st.mode === 'animating') return
      if (dir === 'next' && !canTurnNext) return
      if (dir === 'prev' && !canTurnPrev) return

      const relY =
        ((e.clientY - spreadRect.top) / Math.max(1, spreadRect.height)) * pageH
      const corner: Corner = relY < pageH * 0.45 ? 'top' : 'bottom'

      try {
        e.currentTarget.setPointerCapture(e.pointerId)
      } catch {
        // ignore synthetic events
      }

      const now = performance.now()
      const mapped = clientToCanonical(e.clientX, e.clientY, dir, spreadRect)
      const restingY = corner === 'bottom' ? pageH : 0
      const restingX = !isDesktop && dir === 'prev' ? -pageW : pageW

      const reuseHover =
        (st.mode === 'hover-in' || st.mode === 'hover-out') &&
        st.direction === dir &&
        st.corner === corner

      st.direction = dir
      st.corner = corner
      st.targetPage = undefined
      st.pointerDownClient = { x: e.clientX, y: e.clientY }
      st.pointerStartCanonical = { ...mapped }
      st.reusedHoverOnDown = reuseHover
      st.pointerDownTime = now
      st.hasExceededSlop = false
      st.velocityX = 0
      st.renderedVelocityX = 0
      st.lastCanonicalX = mapped.x
      st.lastMoveTime = now

      if (reuseHover) {
        st.grabOriginP = { ...st.currentP }
        st.targetP = { ...st.currentP }
        st.mode = 'dragging'
        ensureLoop()
      } else {
        // Stay at exact flat rest (0.00px displacement) until pointer moves past drag slop
        st.grabOriginP = { x: restingX, y: restingY }
        st.currentP = { x: restingX, y: restingY }
        st.targetP = { x: restingX, y: restingY }
        st.mode = 'dragging'
      }
    },
    [
      canTurnNext,
      canTurnPrev,
      clientToCanonical,
      ensureLoop,
      isDesktop,
      pageH,
      pageW,
    ]
  )

  const onPointerMoveEdge = useCallback(
    (e: React.PointerEvent<HTMLElement>, spreadRect: DOMRect) => {
      const st = engineRef.current
      if (st.mode !== 'dragging') return

      const moveDist = Math.hypot(
        e.clientX - st.pointerDownClient.x,
        e.clientY - st.pointerDownClient.y
      )
      if (!st.hasExceededSlop) {
        if (moveDist < 3.5) return
        st.hasExceededSlop = true
        setIsDragging(true)
        if (!st.reusedHoverOnDown) {
          emitCurl(st.currentP)
          setActiveTurn({ direction: st.direction, corner: st.corner })
        }
      }

      const now = performance.now()
      const mapped = clientToCanonical(
        e.clientX,
        e.clientY,
        st.direction,
        spreadRect
      )
      const dtMs = Math.max(1, now - st.lastMoveTime)
      const instVx = (mapped.x - st.lastCanonicalX) / dtMs // px/ms
      st.velocityX = st.velocityX * 0.5 + instVx * 0.5
      st.lastCanonicalX = mapped.x
      st.lastMoveTime = now

      const restingY = st.corner === 'bottom' ? pageH : 0
      const x0 = st.pointerStartCanonical.x
      const y0 = st.pointerStartCanonical.y
      const isMobilePrev = !isDesktop && st.direction === 'prev'

      let rawX: number
      let rawY: number

      if (isMobilePrev) {
        const frac = clamp((mapped.x - x0) / Math.max(1, pageW - x0), 0, 1)
        rawX = -pageW + frac * 2 * pageW
        rawY = restingY + (mapped.y - y0) * 0.72
      } else {
        if (mapped.x <= x0) {
          const leftTarget = isDesktop ? -pageW : -20
          const frac = clamp(
            (x0 - mapped.x) / Math.max(1, x0 - leftTarget),
            0,
            1
          )
          rawX = st.grabOriginP.x - frac * (st.grabOriginP.x + pageW)
        } else {
          rawX = clamp(st.grabOriginP.x + (mapped.x - x0), -pageW, pageW)
        }

        const dy = mapped.y - y0
        const edgeMidFactor =
          1 - Math.min(1, Math.abs(y0 - restingY) / (pageH * 0.3))
        const progressEst = clamp((pageW - rawX) / (2 * pageW), 0, 1)
        const autoLiftMag = st.reusedHoverOnDown ? 0 : 18 + 30 * edgeMidFactor
        const autoLift =
          Math.sin(Math.PI * progressEst) *
          autoLiftMag *
          (st.corner === 'bottom' ? -1 : 1)
        rawY = st.grabOriginP.y + dy * 0.92 + autoLift
      }

      st.targetP = constrainLocalCorner(pageW, pageH, st.corner, {
        x: rawX,
        y: rawY,
      })
      ensureLoop()
    },
    [clientToCanonical, emitCurl, ensureLoop, isDesktop, pageH, pageW]
  )

  const settleReleasedDrag = useCallback(
    (wasTap: boolean) => {
      const st = engineRef.current
      if (st.mode !== 'dragging') return
      setIsDragging(false)

      const restingY = st.corner === 'bottom' ? pageH : 0
      const isMobilePrev = !isDesktop && st.direction === 'prev'
      const now = performance.now()

      if (wasTap) {
        if (
          typeof window !== 'undefined' &&
          window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ) {
          finishToIdle(true)
          return
        }
        st.mode = 'animating'
        st.animStartTime = now
        st.animWillCommit = true

        if (st.reusedHoverOnDown) {
          st.animDuration = 600
          st.animUseNaturalArc = false
          st.animFromP = { ...st.currentP }
          st.animFromTheta = Math.acos(clamp(st.currentP.x / pageW, -1, 1))
          st.animToTheta = isMobilePrev ? 0 : Math.PI
          st.animInitialSlope = 0.85
          st.animToP = {
            x: isMobilePrev ? pageW : -pageW,
            y: restingY,
          }
        } else {
          st.animDuration = 680
          st.animUseNaturalArc = true
          const startP = isMobilePrev
            ? { x: -pageW, y: restingY }
            : { x: pageW, y: restingY }
          st.currentP = startP
          st.animFromP = startP
          st.animToP = {
            x: isMobilePrev ? pageW : -pageW,
            y: restingY,
          }
          emitCurl(st.currentP)
          setActiveTurn({ direction: st.direction, corner: st.corner })
        }
        ensureLoop()
        return
      }

      // If pointer never exceeded drag slop (e.g. long press without moving), cancel cleanly
      if (!st.hasExceededSlop && !st.reusedHoverOnDown) {
        finishToIdle(false)
        return
      }

      // Decay stale pointer velocity if user paused before releasing
      const pauseMs = now - st.lastMoveTime
      const livePointerVx =
        pauseMs > 80 ? st.velocityX * Math.exp(-(pauseMs - 80) / 45) : st.velocityX
      const effectiveVx =
        pauseMs > 80
          ? st.renderedVelocityX
          : livePointerVx * 0.55 + st.renderedVelocityX * 0.45

      const progress = isMobilePrev
        ? clamp((st.currentP.x + pageW) / (2 * pageW), 0, 1)
        : clamp((pageW - st.currentP.x) / (2 * pageW), 0, 1)

      const forwardVel = isMobilePrev ? effectiveVx : -effectiveVx
      const shouldCommit =
        forwardVel > 0.3 || (forwardVel > -0.3 && progress > 0.34)

      const fromTheta = Math.acos(clamp(st.currentP.x / pageW, -1, 1))
      const toTheta = shouldCommit
        ? isMobilePrev
          ? 0
          : Math.PI
        : isMobilePrev
          ? Math.PI
          : 0
      const deltaTheta = toTheta - fromTheta

      // Already essentially flat at destination -> settle immediately at exact endpoint
      if (Math.abs(deltaTheta) < 0.008) {
        st.currentP = { x: pageW * Math.cos(toTheta), y: restingY }
        emitCurl(st.currentP)
        finishToIdle(shouldCommit)
        return
      }

      const speedBoost = clamp(Math.abs(forwardVel) * 210, 0, 170)
      const duration = clamp(
        265 + (Math.abs(deltaTheta) / Math.PI) * 385 - speedBoost,
        220,
        560
      )

      // Match C1 initial angular rate from live rendered velocity (x = W cos(theta) => dTheta/dt = -vx / (W sin(theta)))
      const sinTheta = Math.max(0.22, Math.sin(fromTheta))
      const dThetaPerMs = -st.renderedVelocityX / (pageW * sinTheta)
      const matchedSlope = (dThetaPerMs * duration) / deltaTheta

      st.mode = 'animating'
      st.animStartTime = now
      st.animDuration = duration
      st.animUseNaturalArc = false
      st.animWillCommit = shouldCommit
      st.animFromP = { ...st.currentP }
      st.animFromTheta = fromTheta
      st.animToTheta = toTheta
      st.animInitialSlope = clamp(matchedSlope, 0.22, 1.95)
      st.animToP = { x: pageW * Math.cos(toTheta), y: restingY }
      ensureLoop()
    },
    [emitCurl, ensureLoop, finishToIdle, isDesktop, pageH, pageW]
  )

  const onPointerUpEdge = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      try {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId)
        }
      } catch {
        // ignore
      }
      const st = engineRef.current
      if (st.mode !== 'dragging') return
      const dt = performance.now() - st.pointerDownTime
      const wasTap = !st.hasExceededSlop && dt < 450
      settleReleasedDrag(wasTap)
    },
    [settleReleasedDrag]
  )

  const onLostCaptureEdge = useCallback(() => {
    const st = engineRef.current
    if (st.mode === 'dragging') {
      settleReleasedDrag(false)
    }
  }, [settleReleasedDrag])

  return {
    activeTurn,
    isDragging,
    registerFrameListener,
    getCurrentCurl,
    triggerFlip,
    onCornerHoverEnter,
    onCornerHoverLeave,
    onPointerDownEdge,
    onPointerMoveEdge,
    onPointerUpEdge,
    onLostCaptureEdge,
  }
}
