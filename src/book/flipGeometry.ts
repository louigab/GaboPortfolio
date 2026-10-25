/**
 * Physical inextensible paper-curl geometry for Diary of Gabo.
 *
 * Models a real flexible sheet of paper attached along the spine edge:
 * - Enforces inextensibility constraints from both top and bottom spine corners
 *   so the page can never stretch or detach from the binding.
 * - Computes the exact moving fold line (perpendicular bisector between the
 *   resting corner C0 and active lifted corner P).
 * - Clips both the unpeeled front page and the peeled reverse page using
 *   Sutherland-Hodgman half-plane clipping, enhanced with curved quadratic
 *   Bezier silhouettes along the rolling cylinder and lifted edges.
 * - Maps the reverse-side page content through a pure rigid-body transform
 *   (determinant +1: rotation + translation, never mirrored text) plus a 3D
 *   perspective arch around the fold axis.
 */

export interface Vec {
  x: number
  y: number
}

/** 2D affine matrix in CSS matrix(a, b, c, d, e, f) order */
export type Mat = [number, number, number, number, number, number]

export type Corner = 'top' | 'bottom'
export type TurnDirection = 'next' | 'prev'

export interface ComputedCurl {
  /** Constrained corner position in local sheet coordinates [0..W] x [0..H] */
  P: Vec
  /** Fold line midpoint in local sheet coordinates */
  M: Vec
  /** Unit normal of fold line pointing toward the peeled-away resting corner C0 */
  n: Vec
  /** 0 = flat unturned, 1 = flat fully turned */
  progress: number
  /** Arch height factor sin(pi * progress) in [0..1] */
  arch: number
  /** Rolling paper cylinder radius in px */
  rollRadius: number
  /** CSS clip-path for the unpeeled front sheet */
  frontClipPath: string
  /** CSS clip-path (curved SVG path) for the peeled reverse sheet */
  backClipPath: string
  /** CSS 2D rigid matrix placing the reverse sheet in spread coordinates */
  backMatrixCss: string
  /** CSS 3D perspective lift transform around the fold line in spread coordinates */
  flapLift3DCss: string
  /** Fold line midpoint in spread coordinates (for anchoring gradients & shadows) */
  spreadFoldMid: Vec
  /** Fold midpoint in frontSheet local [0..W]x[0..H] coordinates */
  frontLocalMid: Vec
  /** Angle (rad) pointing from fold line into unpeeled front sheet */
  frontLocalValleyAngleRad: number
  /** Fold midpoint in backSheet local [0..W]x[0..H] coordinates */
  backLocalMid: Vec
  /** Angle (rad) pointing from fold line into peeled back sheet */
  backLocalRollAngleRad: number
  /** Angle (radians) from fold line into the revealed underlying page in spread space */
  underShadowAngleRad: number
  /** Unit vector in spread space pointing from fold crease into overhanging flap (away from unpeeled sheet) */
  overhangUnit: Vec
  /** Length of fold segment across the sheet */
  foldLength: number
  /** Dynamic spine X coordinate in spread space */
  hingeX: number
}

export function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v))
}

export function smoothstep(t: number): number {
  const c = clamp(t, 0, 1)
  return c * c * (3 - 2 * c)
}

/** Compose two 2D affine matrices A ∘ B (apply B first, then A) */
export function mulMat(A: Mat, B: Mat): Mat {
  return [
    A[0] * B[0] + A[2] * B[1],
    A[1] * B[0] + A[3] * B[1],
    A[0] * B[2] + A[2] * B[3],
    A[1] * B[2] + A[3] * B[3],
    A[0] * B[4] + A[2] * B[5] + A[4],
    A[1] * B[4] + A[3] * B[5] + A[5],
  ]
}

export function translateMat(tx: number, ty: number): Mat {
  return [1, 0, 0, 1, tx, ty]
}

/** Reflection across the line passing through M with unit normal n */
export function reflectionMat(M: Vec, n: Vec): Mat {
  const k = n.x * M.x + n.y * M.y
  return [
    1 - 2 * n.x * n.x,
    -2 * n.x * n.y,
    -2 * n.x * n.y,
    1 - 2 * n.y * n.y,
    2 * n.x * k,
    2 * n.y * k,
  ]
}

export function matToCss(m: Mat): string {
  const r = (v: number) => Math.round(v * 10000) / 10000
  return `matrix(${r(m[0])},${r(m[1])},${r(m[2])},${r(m[3])},${r(m[4])},${r(m[5])})`
}

/**
 * Constrain a dragged corner P in local right-hinged-left sheet coordinates
 * (spine at x = 0, outer edge at x = W) so the paper never stretches or tears.
 */
export function constrainLocalCorner(
  W: number,
  H: number,
  corner: Corner,
  rawP: Vec
): Vec {
  const nearSpine: Vec = { x: 0, y: corner === 'bottom' ? H : 0 }
  const farSpine: Vec = { x: 0, y: corner === 'bottom' ? 0 : H }

  let x = clamp(rawP.x, -W, W)
  let y = rawP.y

  // Prevent inverted degenerate folds past the opposite vertical edge
  const maxLift = H * 0.48
  if (corner === 'bottom') {
    y = clamp(y, H - maxLift * 1.65, H + maxLift * 0.65)
  } else {
    y = clamp(y, -maxLift * 0.65, maxLift * 1.65)
  }

  // Constraint 1: distance to near spine corner <= W
  let dx = x - nearSpine.x
  let dy = y - nearSpine.y
  let dist = Math.hypot(dx, dy)
  if (dist > W) {
    x = nearSpine.x + (dx / dist) * W
    y = nearSpine.y + (dy / dist) * W
  }

  // Constraint 2: distance to far spine corner <= diagonal sqrt(W^2 + H^2)
  const diag = Math.hypot(W, H)
  dx = x - farSpine.x
  dy = y - farSpine.y
  dist = Math.hypot(dx, dy)
  if (dist > diag) {
    x = farSpine.x + (dx / dist) * diag
    y = farSpine.y + (dy / dist) * diag
  }

  return { x, y }
}

/**
 * Natural hand-peel trajectory in local canonical sheet space (x: +W -> -W)
 * for click/keyboard turns. Lifts the corner in a graceful upward/inward arc
 * so the fold sweeps diagonally across the page before aligning with the spine.
 */
export function sampleNaturalTurnCorner(
  W: number,
  H: number,
  corner: Corner,
  t: number
): Vec {
  const u = clamp(t, 0, 1)
  const theta = Math.PI * u
  const x = W * Math.cos(theta)
  // Asymmetric arc: rises briskly during lift-off, flattens smoothly on landing
  const liftBell = Math.sin(theta) * Math.pow(1 - u * 0.35, 0.55)
  const archAmplitude = Math.min(H * 0.24, 142)
  const y =
    corner === 'bottom'
      ? H - archAmplitude * liftBell
      : archAmplitude * liftBell

  return constrainLocalCorner(W, H, corner, { x, y })
}

/**
 * Sutherland-Hodgman polygon clip against half-plane (q - M) · normal <= 0.
 * Also collects boundary intersection points on the dividing line.
 */
function clipRectHalfPlane(
  W: number,
  H: number,
  M: Vec,
  normal: Vec,
  keepPositive: boolean
): { poly: Vec[]; intersections: Vec[] } {
  const sign = keepPositive ? -1 : 1
  const evalDist = (p: Vec) => ((p.x - M.x) * normal.x + (p.y - M.y) * normal.y) * sign

  const rect: Vec[] = [
    { x: 0, y: 0 },
    { x: W, y: 0 },
    { x: W, y: H },
    { x: 0, y: H },
  ]

  const out: Vec[] = []
  const intersections: Vec[] = []

  for (let i = 0; i < rect.length; i++) {
    const curr = rect[i]
    const prev = rect[(i + rect.length - 1) % rect.length]
    const dCurr = evalDist(curr)
    const dPrev = evalDist(prev)
    const currIn = dCurr <= 1e-5
    const prevIn = dPrev <= 1e-5

    if (currIn !== prevIn) {
      const denom = dPrev - dCurr
      const alpha = Math.abs(denom) < 1e-9 ? 0.5 : dPrev / denom
      const hit: Vec = {
        x: prev.x + (curr.x - prev.x) * alpha,
        y: prev.y + (curr.y - prev.y) * alpha,
      }
      out.push(hit)
      intersections.push(hit)
    }
    if (currIn) {
      out.push(curr)
    }
  }

  return { poly: out, intersections }
}

function pointsClose(a: Vec, b: Vec, eps = 0.6): boolean {
  return Math.abs(a.x - b.x) < eps && Math.abs(a.y - b.y) < eps
}

function formatPolygonCss(poly: Vec[]): string {
  if (poly.length < 3) return 'polygon(0px 0px, 0px 0px, 0px 0px)'
  const r = (v: number) => Math.round(v * 100) / 100
  return `polygon(${poly.map((p) => `${r(p.x)}px ${r(p.y)}px`).join(', ')})`
}

/**
 * Builds a smooth curved SVG path(...) for the peeled reverse flap:
 * - Bows the rolling fold edge slightly outward along its normal so the paper
 *   shows a genuine curved cylindrical roll profile instead of a sharp crease
 *   (and overlaps the front sheet's straight clip edge by a few pixels so zero
 *   subpixel seam can ever appear).
 * - Adds subtle paper flex curvature along the lifted edges adjacent to the free corner.
 */
function buildCurvedBackPath(
  backPoly: Vec[],
  foldE1: Vec | null,
  foldE2: Vec | null,
  outwardNormalInBack: Vec,
  rollBulgePx: number
): string {
  if (backPoly.length < 3) return 'polygon(0px 0px, 0px 0px, 0px 0px)'
  if (!foldE1 || !foldE2 || rollBulgePx < 0.4) {
    return formatPolygonCss(backPoly)
  }

  const r = (v: number) => Math.round(v * 100) / 100
  const cmds: string[] = [`M ${r(backPoly[0].x)} ${r(backPoly[0].y)}`]

  for (let i = 0; i < backPoly.length; i++) {
    const a = backPoly[i]
    const b = backPoly[(i + 1) % backPoly.length]

    const isFoldSegment =
      (pointsClose(a, foldE1) && pointsClose(b, foldE2)) ||
      (pointsClose(a, foldE2) && pointsClose(b, foldE1))

    if (isFoldSegment) {
      const mx = (a.x + b.x) * 0.5 + outwardNormalInBack.x * rollBulgePx
      const my = (a.y + b.y) * 0.5 + outwardNormalInBack.y * rollBulgePx
      cmds.push(`Q ${r(mx)} ${r(my)} ${r(b.x)} ${r(b.y)}`)
    } else {
      cmds.push(`L ${r(b.x)} ${r(b.y)}`)
    }
  }

  cmds.push('Z')
  return `path('${cmds.join(' ')}')`
}

/**
 * Core Unified Curl Solver for both Desktop 2-page spread and Mobile 1-page mode.
 *
 * Spread coordinates have origin (0, 0) at top-left of the inner page area:
 * - Desktop:
 *   - Left slot:  [0, W] x [0, H]
 *   - Spine gap:  [W, W + spineW]
 *   - Right slot: [W + spineW, 2*W + spineW] x [0, H]
 * - Mobile:
 *   - Spine sits on the left; single page slot is [0, W] x [0, H]
 */
export function solveBookCurl(params: {
  W: number
  H: number
  spineW: number
  isDesktop: boolean
  direction: TurnDirection
  corner: Corner
  /** Corner position in canonical sheet space (x in [-W..W], y in [0..H]) */
  canonicalP: Vec
}): ComputedCurl {
  const { W, H, spineW, isDesktop, direction, corner, canonicalP } = params

  const P = constrainLocalCorner(W, H, corner, canonicalP)
  const C0: Vec = { x: W, y: corner === 'bottom' ? H : 0 }

  const vx = C0.x - P.x
  const vy = C0.y - P.y
  const span = Math.hypot(vx, vy)

  const progress = clamp((W - P.x) / (2 * W), 0, 1)
  const arch = Math.sin(Math.PI * progress)
  const rollRadius = 22 + 86 * arch

  const n: Vec = span < 1e-4 ? { x: 1, y: 0 } : { x: vx / span, y: vy / span }
  const M: Vec =
    span < 1e-4
      ? { x: W + 2, y: C0.y }
      : { x: (C0.x + P.x) * 0.5, y: (C0.y + P.y) * 0.5 }

  // Clip canonical sheet [0, W] x [0, H]
  const { poly: canonicalUnpeeled, intersections } = clipRectHalfPlane(
    W,
    H,
    M,
    n,
    false
  )
  const { poly: canonicalPeeled } = clipRectHalfPlane(W, H, M, n, true)

  const e1 = intersections.length >= 2 ? intersections[0] : null
  const e2 = intersections.length >= 2 ? intersections[1] : null
  const foldLength = e1 && e2 ? Math.hypot(e2.x - e1.x, e2.y - e1.y) : H

  // Flip horizontal canonical x <-> W - x when turning backward on desktop
  // On mobile, single page always hinges on its left edge (x = 0):
  // - forward peels current page from W -> -W
  // - backward pulls previous page from -W -> W (so canonicalP starts near -W and moves to +W!)
  const mirrorHoriz = isDesktop && direction === 'prev'

  // Dynamic spine hinge X in spread space
  const s = smoothstep(progress)
  const hingeX = !isDesktop
    ? 0
    : direction === 'next'
      ? W + spineW * (1 - s)
      : W + spineW * s

  if (!mirrorHoriz) {
    // Sheet hinges on its LEFT edge (desktop 'next' OR mobile 'next'/'prev')
    const frontClipPath = formatPolygonCss(canonicalUnpeeled)

    const foldMidCanonical: Vec =
      e1 && e2
        ? { x: (e1.x + e2.x) * 0.5, y: (e1.y + e2.y) * 0.5 }
        : M

    // Back page local coords (u, v) = (W - x, y)
    const backPoly = canonicalPeeled.map((pt) => ({ x: W - pt.x, y: pt.y }))
    const backE1 = e1 ? { x: W - e1.x, y: e1.y } : null
    const backE2 = e2 ? { x: W - e2.x, y: e2.y } : null
    // Outward bulge from peeled region toward unpeeled region in canonical is -n;
    // under u = W - x, dx_back = -dx_canonical, so outward normal in back coords is (+n.x, -n.y)
    const outwardBackNormal: Vec = { x: n.x, y: -n.y }
    const spineClearance = clamp(foldMidCanonical.x / 28, 0, 1)
    const bulge = 11 * arch * spineClearance
    const backClipPath = buildCurvedBackPath(
      backPoly,
      backE1,
      backE2,
      outwardBackNormal,
      bulge
    )

    const flipMat: Mat = [-1, 0, 0, 1, W, 0]
    const reflMat = reflectionMat(M, n)
    const toSpread = translateMat(hingeX, 0)
    const backMat = mulMat(toSpread, mulMat(reflMat, flipMat))

    // Fold midpoint in spread coordinates
    const spreadFoldMid: Vec = {
      x: hingeX + foldMidCanonical.x,
      y: foldMidCanonical.y,
    }

    // 3D perspective arch lift strictly around the fold line (origin 0,0 -> Z === 0 everywhere along the fold!)
    const liftDeg = Math.round(7.5 * arch * 100) / 100
    const tx = Math.round(-n.y * 10000) / 10000
    const ty = Math.round(n.x * 10000) / 10000
    const mx = Math.round(spreadFoldMid.x * 100) / 100
    const my = Math.round(spreadFoldMid.y * 100) / 100
    const flapLift3DCss =
      liftDeg > 0.01
        ? `translate3d(${mx}px, ${my}px, 0px) rotate3d(${tx}, ${ty}, 0, ${liftDeg}deg) translate3d(${-mx}px, ${-my}px, 0px)`
        : 'none'

    const frontLocalMid = foldMidCanonical
    const frontLocalValleyAngleRad = Math.atan2(-n.y, -n.x)
    const backLocalMid: Vec = { x: W - foldMidCanonical.x, y: foldMidCanonical.y }
    const backLocalRollAngleRad = Math.atan2(n.y, -n.x)
    const underShadowAngleRad = Math.atan2(n.y, n.x)
    const overhangUnit: Vec = { x: -n.x, y: -n.y }

    return {
      P,
      M,
      n,
      progress,
      arch,
      rollRadius,
      frontClipPath,
      backClipPath,
      backMatrixCss: matToCss(backMat),
      flapLift3DCss,
      spreadFoldMid,
      frontLocalMid,
      frontLocalValleyAngleRad,
      backLocalMid,
      backLocalRollAngleRad,
      underShadowAngleRad,
      overhangUnit,
      foldLength,
      hingeX,
    }
  } else {
    // Desktop 'prev': Left page hinges on its RIGHT edge (spine at u = W, outer left edge at u = 0)
    // Map canonical x in [0..W] -> left-sheet u = W - x
    const frontPolyLeft = canonicalUnpeeled.map((pt) => ({ x: W - pt.x, y: pt.y }))
    const frontClipPath = formatPolygonCss(frontPolyLeft)

    const foldMidCanonical: Vec =
      e1 && e2
        ? { x: (e1.x + e2.x) * 0.5, y: (e1.y + e2.y) * 0.5 }
        : M

    // Back page is a Right Page (rx, ry) where rx = 0 is spine (u = W -> x = 0) and rx = W is outer right edge (u = 0 -> x = W)!
    // So rx = x_canonical, ry = y_canonical!
    const backPolyRight = canonicalPeeled
    const backE1 = e1
    const backE2 = e2
    // Outward from peeled toward unpeeled in canonical is -n
    const outwardBackNormal: Vec = { x: -n.x, y: -n.y }
    const spineClearance = clamp(foldMidCanonical.x / 28, 0, 1)
    const bulge = 11 * arch * spineClearance
    const backClipPath = buildCurvedBackPath(
      backPolyRight,
      backE1,
      backE2,
      outwardBackNormal,
      bulge
    )

    // Transform (rx, ry) == canonical (x, y) -> reflect across (M, n) in canonical -> map canonical x_ref to spread X = hingeX - x_ref
    // Determinant: det([-1,0,0,1]) * det(reflMat) = (-1)*(-1) = +1 (Pure rigid rotation + translation!)
    const reflMat = reflectionMat(M, n)
    const canonicalToSpread: Mat = [-1, 0, 0, 1, hingeX, 0]
    const backMat = mulMat(canonicalToSpread, reflMat)

    const spreadFoldMid: Vec = {
      x: hingeX - foldMidCanonical.x,
      y: foldMidCanonical.y,
    }

    // In spread space, fold normal pointing toward resting outer-left corner C0=(0,..) is n_spread = (-n.x, n.y)
    const nsx = -n.x
    const nsy = n.y
    const liftDeg = Math.round(7.5 * arch * 100) / 100
    const tx = Math.round(-nsy * 10000) / 10000
    const ty = Math.round(nsx * 10000) / 10000
    const mx = Math.round(spreadFoldMid.x * 100) / 100
    const my = Math.round(spreadFoldMid.y * 100) / 100
    const flapLift3DCss =
      liftDeg > 0.01
        ? `translate3d(${mx}px, ${my}px, 0px) rotate3d(${tx}, ${ty}, 0, ${liftDeg}deg) translate3d(${-mx}px, ${-my}px, 0px)`
        : 'none'

    const frontLocalMid: Vec = { x: W - foldMidCanonical.x, y: foldMidCanonical.y }
    const frontLocalValleyAngleRad = Math.atan2(-n.y, n.x)
    const backLocalMid = foldMidCanonical
    const backLocalRollAngleRad = Math.atan2(n.y, n.x)
    const underShadowAngleRad = Math.atan2(nsy, nsx)
    const overhangUnit: Vec = { x: -nsx, y: -nsy }

    return {
      P,
      M,
      n,
      progress,
      arch,
      rollRadius,
      frontClipPath,
      backClipPath,
      backMatrixCss: matToCss(backMat),
      flapLift3DCss,
      spreadFoldMid,
      frontLocalMid,
      frontLocalValleyAngleRad,
      backLocalMid,
      backLocalRollAngleRad,
      underShadowAngleRad,
      overhangUnit,
      foldLength,
      hingeX,
    }
  }
}
