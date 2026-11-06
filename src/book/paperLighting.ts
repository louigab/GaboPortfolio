import type { ComputedCurl } from './flipGeometry'

// A broad diffuse highlight, not a hard glossy stripe: paper is a matte material.
export const PAPER_ROLL_LIGHT = 'linear-gradient(to right, rgba(52,39,22,.18), rgba(255,251,238,.32) 12%, rgba(255,252,242,.12) 40%, rgba(38,28,16,.13) 72%, transparent)'

export function paperRollStyle(curl: Pick<ComputedCurl, 'arch' | 'rollRadius' | 'backLocalMid' | 'backLocalRollAngleRad'>, diagonal: number) {
  return {
    width: `${24 + curl.rollRadius * 1.55}px`,
    opacity: `${Math.pow(Math.max(0, curl.arch), .65) * .72}`,
    transform: `translate3d(${curl.backLocalMid.x}px, ${curl.backLocalMid.y - diagonal / 2}px, 0) rotate(${curl.backLocalRollAngleRad}rad) translateX(${-12 * curl.arch}px)`,
  }
}
