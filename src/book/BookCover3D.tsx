import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { DoodleTape } from '../components/InkDoodles'
import { clamp } from './flipGeometry'

export interface BookCover3DProps {
  isOpen: boolean
  onOpen: () => void
  onClose?: () => void
  isDesktop: boolean
  /** Actual Page 1 (or current left page) rendered physically on the inside of the hinged left cover! */
  interiorLeftPage?: React.ReactNode
  /** Notifies parent of real-time cover progress (0 = closed, 1 = fully open -180deg) so desk position & page shadows stay 1:1 synced */
  onProgressChange?: (progress: number, isAnimating: boolean) => void
  /** Notifies parent when the cover has finished its opening or closing animation and fully settled */
  onCoverSettled?: (isOpen: boolean) => void
}

function CoverArtwork() {
  return (
    <div className="cover-exterior relative w-full h-full rounded-r-[14px] rounded-l-[3px] overflow-visible select-none bg-[#151414] text-[#f5f2eb] shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.14),inset_-3px_-3px_14px_rgba(0,0,0,0.88)]">
      {/* SVG Global Definitions for Rugged Texture Patterns */}
      <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
        <defs>
          {/* Exposed Strawboard Fiber Texture Pattern for Battered Corners */}
          <pattern id="strawboardFiber" width="12" height="12" patternUnits="userSpaceOnUse">
            <rect width="12" height="12" fill="#c2aa85" />
            <line x1="0" y1="2" x2="12" y2="3.5" stroke="#967e5b" strokeWidth="0.85" opacity="0.7" />
            <line x1="0" y1="7" x2="12" y2="6" stroke="#dbcaa9" strokeWidth="0.8" opacity="0.65" />
            <line x1="0" y1="10.5" x2="12" y2="11" stroke="#876f4e" strokeWidth="0.75" opacity="0.6" />
            <line x1="4" y1="0" x2="5.5" y2="12" stroke="#786041" strokeWidth="0.65" opacity="0.45" />
            <line x1="9.5" y1="0" x2="8" y2="12" stroke="#d5c2a1" strokeWidth="0.7" opacity="0.5" />
            <circle cx="3" cy="5" r="0.9" fill="#5c452b" opacity="0.55" />
            <circle cx="8" cy="2" r="0.7" fill="#6e5539" opacity="0.45" />
            <circle cx="10" cy="9" r="0.8" fill="#523d24" opacity="0.5" />
          </pattern>
        </defs>
      </svg>

      {/* 1. BASE LEATHERETTE PATINA & HAND-WEAR GRADIENTS */}
      <div
        className="pointer-events-none absolute inset-0 rounded-r-[14px] rounded-l-[3px] overflow-hidden"
        style={{
          background: `
            radial-gradient(ellipse at 98% 50%, rgba(52, 42, 33, 0.48) 0%, transparent 45%),
            radial-gradient(circle at 97% 4%, rgba(58, 48, 38, 0.55) 0%, transparent 24%),
            radial-gradient(circle at 97% 96%, rgba(60, 48, 38, 0.58) 0%, transparent 26%),
            radial-gradient(ellipse at 12% 50%, rgba(45, 38, 32, 0.35) 0%, transparent 35%),
            radial-gradient(ellipse at 52% 28%, rgba(48,45,43,0.42) 0%, rgba(18,17,17,0.94) 72%, #0e0d0d 100%)
          `,
        }}
        aria-hidden="true"
      />

      {/* 2. TACTILE LEATHERETTE PEBBLE-GRAIN OVERLAY */}
      <div
        className="pointer-events-none absolute inset-0 rounded-r-[14px] rounded-l-[3px] overflow-hidden opacity-95"
        style={{
          backgroundImage:
            "url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%228%22 height=%228%22><circle cx=%221.5%22 cy=%221.5%22 r=%220.85%22 fill=%22rgba(255,255,255,0.04)%22/><circle cx=%225.5%22 cy=%222%22 r=%220.7%22 fill=%22rgba(0,0,0,0.24)%22/><circle cx=%222.5%22 cy=%225.5%22 r=%220.75%22 fill=%22rgba(0,0,0,0.2)%22/><circle cx=%226.5%22 cy=%226%22 r=%220.9%22 fill=%22rgba(255,255,255,0.035)%22/><circle cx=%224%22 cy=%224%22 r=%220.6%22 fill=%22rgba(255,255,255,0.025)%22/><circle cx=%220.5%22 cy=%224.5%22 r=%220.5%22 fill=%22rgba(0,0,0,0.18)%22/></svg>')",
        }}
        aria-hidden="true"
      />

      {/* 3. FORE-EDGE WEAR & CHAFING HIGHLIGHT (Physical rim abrasion along outer edge) */}
      <div
        className="pointer-events-none absolute right-0 top-0 bottom-0 w-[14px] rounded-r-[14px]"
        style={{
          background:
            'linear-gradient(to left, rgba(255,255,255,0.12) 0px, rgba(255,255,255,0.03) 3px, rgba(0,0,0,0.3) 8px, transparent 14px)',
        }}
        aria-hidden="true"
      />

      {/* 4. RED & BLACK STRIPED CLOTH SPINE BAND */}
      <div
        className="pointer-events-none absolute left-0 top-0 bottom-0 w-[44px] rounded-l-[3px] overflow-hidden z-10"
        style={{
          backgroundColor: '#191213',
          backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.04) 22%, rgba(0,0,0,0.28) 78%, rgba(0,0,0,0.75) 100%),
            repeating-linear-gradient(to bottom, #c4202a 0px, #c4202a 19px, #191214 19px, #191214 38px)
          `,
          boxShadow: 'inset -3px 0 5px rgba(0,0,0,0.88), 2px 0 3px rgba(0,0,0,0.7)',
        }}
        aria-hidden="true"
      >
        {/* Cloth scrim weave texture */}
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%224%22 height=%224%22><path d=%22M 0 2 H 4 M 2 0 V 4%22 stroke=%22rgba(255,255,255,0.12)%22 stroke-width=%220.5%22/><circle cx=%222%22 cy=%222%22 r=%220.4%22 fill=%22rgba(0,0,0,0.16)%22/></svg>')",
          }}
        />

        {/* Top and bottom worn fray shading */}
        <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-b from-black/50 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-2 bg-gradient-to-t from-black/50 to-transparent" />
      </div>

      {/* 5. DEEP HINGE GROOVE (Deep debossed gutter beside spine) */}
      <div
        className="pointer-events-none absolute top-0 bottom-0 left-[44px] w-[5px] z-10"
        style={{
          background:
            'linear-gradient(to right, #060505 0%, #292626 65%, rgba(255,255,255,0.07) 100%)',
          boxShadow: 'inset 1px 0 2px rgba(0,0,0,0.85)',
        }}
        aria-hidden="true"
      ></div>

      {/* 6. HEAVY-DUTY WAXED SADDLE STITCHING (Debossed stitch holes + waxed linen thread) */}
      <svg
        className="pointer-events-none absolute inset-0 w-full h-full z-12"
        viewBox="0 0 488 642"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M 54 628 L 54 14 L 464 14 Q 474 14 474 24 L 474 618 Q 474 628 464 628 Z"
          stroke="#060505"
          strokeWidth="2.8"
          strokeDasharray="7 5.5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M 54 628 L 54 14 L 464 14 Q 474 14 474 24 L 474 618 Q 474 628 464 628 Z"
          stroke="#cfc4b0"
          strokeWidth="1.6"
          strokeDasharray="7 5.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.85"
        />
        <path
          d="M 54 628 L 54 14 L 464 14 Q 474 14 474 24 L 474 618 Q 474 628 464 628 Z"
          stroke="#ffffff"
          strokeWidth="0.75"
          strokeDasharray="5 7.5"
          strokeDashoffset="1"
          strokeLinecap="round"
          fill="none"
          opacity="0.25"
        />
      </svg>

      {/* 7. BATTERED & BRUISED CORNERS: EXPOSED STRAWBOARD (Strawboard core peeking through frayed buckram) */}
      {/* Top-Right Battered Corner */}
      <div className="pointer-events-none absolute right-0 top-0 w-[62px] h-[62px] z-18 overflow-visible">
        <svg viewBox="0 0 62 62" className="w-full h-full overflow-visible" aria-hidden="true">
          <path
            d="
              M 46 0 
              C 54 0, 62 6, 62 14 
              L 62 26 
              C 58 20, 53 17, 49 14 
              C 46 11, 45 5, 46 0 Z
            "
            fill="url(#strawboardFiber)"
          />
          <path
            d="M 46 0 C 45 5, 46 11, 49 14 C 53 17, 58 20, 62 26"
            stroke="#735c3e"
            strokeWidth="1.3"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="
              M 46 0 
              L 44 2
              C 43 7, 44 13, 47 16 
              C 51 20, 56 23, 62 30
              L 62 26 
              C 58 20, 53 17, 49 14 
              C 46 11, 45 5, 46 0 Z
            "
            fill="rgba(0,0,0,0.78)"
          />
          <path
            d="M 42 1 C 41 8, 43 15, 47 19 C 51 23, 57 26, 62 33"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="0.85"
            fill="none"
            strokeDasharray="3 2"
          />
          <line x1="54" y1="14" x2="57" y2="11" stroke="#d5c2a1" strokeWidth="0.75" />
          <line x1="49" y1="16" x2="47" y2="19" stroke="#d5c2a1" strokeWidth="0.65" />
        </svg>
      </div>

      {/* Bottom-Right Battered Corner */}
      <div className="pointer-events-none absolute right-0 bottom-0 w-[68px] h-[68px] z-18 overflow-visible">
        <svg viewBox="0 0 68 68" className="w-full h-full overflow-visible" aria-hidden="true">
          <path
            d="
              M 68 40 
              L 68 54 
              C 68 62, 62 68, 54 68 
              L 44 68 
              C 46 62, 49 57, 54 52 
              C 59 47, 64 43, 68 40 Z
            "
            fill="url(#strawboardFiber)"
          />
          <path
            d="M 68 40 C 64 43, 59 47, 54 52 C 49 57, 46 62, 44 68"
            stroke="#735c3e"
            strokeWidth="1.3"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="
              M 44 68 
              L 41 68
              C 43 60, 46 54, 51 49 
              C 56 44, 62 40, 68 36
              L 68 40 
              C 64 43, 59 47, 54 52 
              C 49 57, 46 62, 44 68 Z
            "
            fill="rgba(0,0,0,0.78)"
          />
          <path
            d="M 39 68 C 41 58, 44 51, 50 45 C 55 40, 62 36, 68 32"
            stroke="rgba(255,255,255,0.28)"
            strokeWidth="0.85"
            fill="none"
            strokeDasharray="4 2"
          />
          <line x1="59" y1="55" x2="63" y2="58" stroke="#d5c2a1" strokeWidth="0.8" />
          <line x1="55" y1="50" x2="52" y2="48" stroke="#d5c2a1" strokeWidth="0.65" />
        </svg>
      </div>

      {/* 8. MAIN COVER CONTENT COLUMN */}
      <div className="relative z-20 h-full pl-[58px] pr-[20px] pt-[48px] pb-[18px] flex flex-col items-center justify-between pointer-events-none select-none">
        {/* TOP TITLE LOCKUP: PORTFOLIO scrawled over crossed-out DIARY / of / GABO */}
        <div className="w-full flex flex-col items-center text-center">
          {/* 'PORTFOLIO' scrawled cleanly above crossed-out serif 'DIARY' */}
          <div className="relative inline-block pt-[26px]">
            {/* Handwritten red 'PORTFOLIO' */}
            <span
              className="marker absolute top-0 left-[53%] -translate-x-1/2 -rotate-4 text-[30px] leading-none tracking-[0.06em] text-[#e0262f] whitespace-nowrap z-20"
              style={{
                textShadow: '0 2px 5px rgba(0,0,0,0.85)',
              }}
            >
              PORTFOLIO
            </span>

            {/* Red marker splatter flecks */}
            <svg
              className="pointer-events-none absolute top-0 left-[82%] w-6 h-[18px] z-21"
              viewBox="0 0 24 18"
              aria-hidden="true"
            >
              <circle cx="6" cy="4" r="1.1" fill="#e0262f" />
              <circle cx="16" cy="11" r="0.8" fill="#e0262f" />
              <circle cx="21" cy="5" r="0.6" fill="#e0262f" />
            </svg>

            {/* Classic Serif 'DIARY' */}
            <span
              className="block uppercase text-[52px] leading-[0.88] tracking-[0.11em] text-[#dcd9d0] font-normal select-none"
              style={{
                fontFamily: 'Georgia, "Times New Roman", Times, serif',
                textShadow: '0 1px 1px rgba(0,0,0,0.95), 0 -1px 0 rgba(255,255,255,0.18)',
              }}
            >
              DIARY
            </span>

            {/* Bold Red Marker Strikethrough Slash across the waist of DIARY */}
            <svg
              viewBox="0 0 280 28"
              preserveAspectRatio="none"
              className="pointer-events-none absolute -left-3.5 -right-3.5 w-[calc(100%+28px)] h-6 top-[64%] -translate-y-1/2 z-10"
              aria-hidden="true"
            >
              <path
                d="M4 21 C88 14, 188 9, 276 6"
                stroke="#d4232b"
                strokeWidth="6"
                strokeLinecap="round"
              />
              <path
                d="M12 24 C102 18, 194 12, 268 10"
                stroke="#9a151b"
                strokeWidth="2.5"
                strokeLinecap="round"
                opacity="0.9"
              />
              <path
                d="M 60 17 L 110 14 M 170 11 L 220 8"
                stroke="#f23b43"
                strokeWidth="1.2"
                strokeLinecap="round"
                opacity="0.6"
              />
              <circle cx="280" cy="5" r="1.2" fill="#d4232b" />
              <circle cx="2" cy="22" r="1" fill="#d4232b" />
            </svg>
          </div>

          {/* 'of' */}
          <span
            className="hand font-extrabold text-[32px] leading-[0.92] text-[#f5f3ee] mt-0.5"
            style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}
          >
            of
          </span>

          {/* 'GABO' in White Brush Marker with Thick Crimson Paint Halo */}
          <div className="relative -mt-1">
            <h1
              className="marker uppercase text-[72px] leading-[0.94] tracking-[0.03em] text-white select-none"
              style={{
                paintOrder: 'stroke fill',
                WebkitTextStroke: '12px #c81f27',
                filter:
                  'drop-shadow(0px 2px 0px #851217) drop-shadow(0px 6px 12px rgba(0,0,0,0.65))',
              }}
            >
              GABO
            </h1>
          </div>
        </div>

        {/* CENTER/BOTTOM TAPED TORN RULED NOTEBOOK PAPER SCRAP */}
        <div className="relative w-[292px] h-[292px] mt-1 mb-16 flex items-center justify-center">
          {/* Layered Translucent Masking Tape Corners */}
          <DoodleTape
            className="w-[84px] h-6 absolute -top-2.5 -left-3 z-30 opacity-88 drop-shadow-[0_2px_3px_rgba(0,0,0,0.35)]"
            rotate={-40}
            variant="beige"
          />
          <DoodleTape
            className="w-[68px] h-5 absolute top-1 -left-4 z-29 opacity-65 drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]"
            rotate={-32}
            variant="beige"
          />

          <DoodleTape
            className="w-[84px] h-6 absolute -top-2 -right-3.5 z-30 opacity-88 drop-shadow-[0_2px_3px_rgba(0,0,0,0.35)]"
            rotate={38}
            variant="beige"
          />
          <DoodleTape
            className="w-[72px] h-5.5 absolute top-0.5 -right-3 z-29 opacity-70 drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]"
            rotate={-42}
            variant="beige"
          />

          <DoodleTape
            className="w-[82px] h-6 absolute -bottom-2 -left-3.5 z-30 opacity-88 drop-shadow-[0_2px_3px_rgba(0,0,0,0.35)]"
            rotate={36}
            variant="beige"
          />
          <DoodleTape
            className="w-[70px] h-5 absolute bottom-0.5 -left-3 z-29 opacity-70"
            rotate={-38}
            variant="beige"
          />

          <DoodleTape
            className="w-[82px] h-6 absolute -bottom-2.5 -right-3 z-30 opacity-88 drop-shadow-[0_2px_3px_rgba(0,0,0,0.35)]"
            rotate={-36}
            variant="beige"
          />
          <DoodleTape
            className="w-[68px] h-5 absolute bottom-0.5 -right-3.5 z-29 opacity-68"
            rotate={34}
            variant="beige"
          />

          {/* Drop shadow beneath torn paper */}
          <div
            className="relative w-full h-full drop-shadow-[0_6px_14px_rgba(0,0,0,0.78)]"
            style={{ transform: 'rotate(-1.2deg)' }}
          >
            {/* Jagged Hand-Torn Lined Notebook Paper Scrap with Aged Tea Tone Patina */}
            <div
              className="relative w-full h-full overflow-hidden flex flex-col justify-between px-4 pt-3 pb-2.5"
              style={{
                backgroundColor: '#f1ebd8',
                backgroundImage: `
                  radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0.35) 0%, rgba(220,205,175,0.4) 80%, rgba(195,175,140,0.65) 100%),
                  linear-gradient(128deg, transparent 22%, rgba(0,0,0,0.035) 26%, rgba(255,255,255,0.4) 28%, transparent 34%),
                  linear-gradient(212deg, transparent 48%, rgba(0,0,0,0.03) 52%, rgba(255,255,255,0.35) 54%, transparent 60%),
                  repeating-linear-gradient(
                    to bottom,
                    transparent 0px,
                    transparent 21px,
                    rgba(156, 178, 206, 0.7) 21px,
                    rgba(156, 178, 206, 0.7) 22px
                  )
                `,
                clipPath:
                  'polygon(2% 3%, 7% 1%, 13% 3.5%, 20% 1.2%, 27% 3%, 35% 0.8%, 43% 2.8%, 51% 1%, 59% 3.2%, 67% 1.4%, 75% 3.5%, 83% 1.2%, 91% 3%, 97.5% 1.8%, 99% 8%, 97% 15%, 99.2% 23%, 96.8% 31%, 99% 39%, 97.2% 48%, 99.4% 57%, 96.8% 66%, 99% 75%, 97% 84%, 98.8% 92%, 96% 98.5%, 89% 96.8%, 81% 99.2%, 73% 97%, 64% 99.4%, 55% 97.2%, 46% 99%, 37% 96.8%, 28% 99.2%, 19% 97%, 11% 99%, 3.5% 96.5%, 1.2% 90%, 3.2% 81%, 0.8% 72%, 2.8% 63%, 1% 54%, 3% 45%, 0.9% 36%, 2.8% 27%, 1.2% 18%, 3% 10%)',
              }}
            >
              {/* Illustration Scene: Gabo Mascot + Ink Grass Tufts (Centered & Elevated) */}
              <div className="relative flex-1 min-h-0 flex items-end justify-center pb-[18px]">
                {/* Grass tuft left of shoes */}
                <svg
                  viewBox="0 0 60 28"
                  fill="none"
                  className="w-12 h-5 -mr-2.5 mb-1.5 z-10 shrink-0"
                  aria-hidden="true"
                >
                  <path
                    d="M4 25 L8 12 L13 24 L17 9 L22 24 L28 11 L32 25 L38 14 L43 25 L49 15 L54 25"
                    stroke="#151515"
                    strokeWidth="1.9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>

                {/* Gabo Character */}
                <img
                  src="/images/character/gaboCharacter.png"
                  alt="Gabo illustration on diary cover"
                  loading="eager"
                  fetchPriority="high"
                  className="h-[218px] w-[167px] object-contain relative z-20 shrink-0"
                />

                {/* Grass tuft right of shoes */}
                <svg
                  viewBox="0 0 60 28"
                  fill="none"
                  className="w-12 h-5 -ml-2.5 mb-1.5 z-10 shrink-0"
                  aria-hidden="true"
                >
                  <path
                    d="M4 25 L10 15 L15 25 L21 11 L27 24 L33 10 L38 24 L45 13 L50 25 L56 17"
                    stroke="#151515"
                    strokeWidth="1.9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              {/* Blue Ballpoint Author Line: 'by Louis Gabriel Damondamon' */}
              <p
                className="text-center text-[20.5px] font-bold leading-none tracking-tight pt-0.5 pb-1 -rotate-1"
                style={{
                  fontFamily: 'var(--font-display)',
                  color: '#1b3f99',
                }}
              >
                by Louis Gabriel D. Damondamon
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * TAPE LOCK MECHANISM:
 * - Anchored permanently behind the back cover board at the right fore-edge.
 * - When CLOSED: Wraps around the edge and lies across the front cover (proud at z = 24px, zIndex 90).
 * - When OPENING: Unwraps! Flips 180deg backward to the right around the edge, laying flat to the side behind the back cover (z = -4px, zIndex 5).
 * - When CLOSING: Wraps back from behind the back cover around the edge onto the front cover to lock it shut!
 */
/**
 * Front face SVG of the tape lock: dark vintage crimson tape,
 * ragged hand-torn edge, and messy hand-drawn black marker padlock.
 */
function LockTapeFrontSvg({
  idPrefix = 'lockFront',
}: {
  idPrefix?: string
}) {
  const bodyGradId = `${idPrefix}-bodyGrad`
  const sheenGradId = `${idPrefix}-sheenGrad`
  const weavePatternId = `${idPrefix}-weave`
  const foldShadeId = `${idPrefix}-foldShade`

  return (
    <svg
      viewBox="0 0 68 78"
      fill="none"
      className="w-full h-full overflow-visible"
      style={{
        filter:
          'drop-shadow(0px 1.5px 2px rgba(0,0,0,0.5)) drop-shadow(0px 3px 6px rgba(0,0,0,0.25))',
      }}
    >
      <defs>
        {/* Dark Vintage Crimson Red Tape (Matching the book's deep spine cloth red) */}
        <linearGradient id={bodyGradId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#7a1016" />
          <stop offset="10%" stopColor="#8c141c" />
          <stop offset="30%" stopColor="#9b1620" />
          <stop offset="60%" stopColor="#821118" />
          <stop offset="85%" stopColor="#630b11" />
          <stop offset="95%" stopColor="#45060b" />
          <stop offset="100%" stopColor="#2a0307" />
        </linearGradient>

        {/* Tape Satin Sheen / Subtle Overhead Light Reflection */}
        <linearGradient id={sheenGradId} x1="0.1" y1="0" x2="0.9" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.18)" />
          <stop offset="25%" stopColor="rgba(255,255,255,0.06)" />
          <stop offset="50%" stopColor="rgba(255,255,255,0)" />
          <stop offset="75%" stopColor="rgba(0,0,0,0.08)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.25)" />
        </linearGradient>

        {/* Fine Cotton/Poly Scrim Fabric Weave (Authentic micro cloth weave) */}
        <pattern id={weavePatternId} width="3" height="3" patternUnits="userSpaceOnUse">
          <path d="M 0 1.5 H 3 M 1.5 0 V 3" stroke="rgba(255,255,255,0.08)" strokeWidth="0.45" />
          <circle cx="1.5" cy="1.5" r="0.35" fill="rgba(0,0,0,0.07)" />
        </pattern>

        {/* Fore-edge Cylindrical Roll Shadow at right edge x = 68 (Gentle wrap, not charred) */}
        <linearGradient id={foldShadeId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(0,0,0,0)" />
          <stop offset="70%" stopColor="rgba(0,0,0,0.12)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.38)" />
        </linearGradient>
      </defs>

      {/* 1. AUTHENTICALLY RAGGED HAND-TORN DARK RED TAPE BODY */}
      <path
        d="M 68 2 
           H 10.5 
           L 5.5 6.0 
           L 15.5 17.5 
           L 11.0 22.0 
           L 14.2 26.5 
           L 3.2 37.0 
           L 6.2 42.5 
           L 2.8 47.5 
           L 13.8 57.0 
           L 7.8 63.0 
           L 11.5 67.5 
           L 4.5 72.0 
           L 9.5 76.0 
           H 68 Z"
        fill={`url(#${bodyGradId})`}
      />

      {/* SATIN SURFACE SHEEN OVERLAY */}
      <path
        d="M 68 2 H 10.5 L 5.5 6.0 L 15.5 17.5 L 11.0 22.0 L 14.2 26.5 L 3.2 37.0 L 6.2 42.5 L 2.8 47.5 L 13.8 57.0 L 7.8 63.0 L 11.5 67.5 L 4.5 72.0 L 9.5 76.0 H 68 Z"
        fill={`url(#${sheenGradId})`}
      />

      {/* CLOTH FABRIC WEAVE TEXTURE */}
      <path
        d="M 68 2 H 10.5 L 5.5 6.0 L 15.5 17.5 L 11.0 22.0 L 14.2 26.5 L 3.2 37.0 L 6.2 42.5 L 2.8 47.5 L 13.8 57.0 L 7.8 63.0 L 11.5 67.5 L 4.5 72.0 L 9.5 76.0 H 68 Z"
        fill={`url(#${weavePatternId})`}
        opacity="0.36"
      />

      {/* RAGGED TORN FIBER DECKLE FRINGE HIGHLIGHT */}
      <path
        d="M 10.5 2 
           L 5.5 6.0 
           L 15.5 17.5 
           L 11.0 22.0 
           L 14.2 26.5 
           L 3.2 37.0 
           L 6.2 42.5 
           L 2.8 47.5 
           L 13.8 57.0 
           L 7.8 63.0 
           L 11.5 67.5 
           L 4.5 72.0 
           L 9.5 76.0"
        stroke="rgba(255, 220, 220, 0.45)"
        strokeWidth="0.85"
        strokeLinecap="round"
        fill="none"
      />

      {/* Loose frayed thread micro-whiskers */}
      <line x1="3.2" y1="37.0" x2="1.0" y2="37.5" stroke="rgba(255, 225, 225, 0.6)" strokeWidth="0.6" strokeLinecap="round" />
      <line x1="2.8" y1="47.5" x2="0.8" y2="47.2" stroke="rgba(255, 225, 225, 0.6)" strokeWidth="0.6" strokeLinecap="round" />
      <line x1="5.5" y1="6.0" x2="3.2" y2="5.5" stroke="rgba(255, 225, 225, 0.6)" strokeWidth="0.6" strokeLinecap="round" />

      {/* PHYSICAL 3D EDGE THICKNESS */}
      <line x1="10.5" y1="2.5" x2="68" y2="2.5" stroke="rgba(255,255,255,0.35)" strokeWidth="0.75" />
      <line x1="9.5" y1="75.5" x2="68" y2="75.5" stroke="rgba(0,0,0,0.4)" strokeWidth="0.75" />

      {/* DIAGONAL TENSION MICRO-CREASES */}
      <path d="M 14 8 C 28 15, 46 12, 65 19" stroke="rgba(255,255,255,0.12)" strokeWidth="0.9" strokeLinecap="round" fill="none" />
      <path d="M 13 9 C 27 16, 45 13, 64 20" stroke="rgba(0,0,0,0.18)" strokeWidth="0.8" strokeLinecap="round" fill="none" />
      <path d="M 16 68 C 30 61, 48 64, 66 57" stroke="rgba(255,255,255,0.1)" strokeWidth="0.9" strokeLinecap="round" fill="none" />
      <path d="M 15 69 C 29 62, 47 65, 65 58" stroke="rgba(0,0,0,0.18)" strokeWidth="0.8" strokeLinecap="round" fill="none" />

      {/* FORE-EDGE CYLINDRICAL WRAP SHADOW */}
      <rect x="58" y="2" width="10" height="74" fill={`url(#${foldShadeId})`} />

      {/* ================= MESSY HAND-DRAWN DOODLE PADLOCK ================= */}
      {/* Hand-Drawn Black Marker Shackle */}
      <path
        d="M 24.5 37.5 V 26.5 C 24.2 18.0, 44.5 17.5, 44.8 26.0 V 37.0"
        stroke="#0d0b0b"
        strokeWidth="3.6"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 26.0 34.5 V 27.0 C 26.0 20.5, 42.8 20.0, 43.0 26.5 V 34.5"
        stroke="#0d0b0b"
        strokeWidth="1.3"
        strokeLinecap="round"
        fill="none"
        opacity="0.5"
      />

      {/* Hand-Drawn Marker Padlock Body */}
      <path
        d="M 19 36.5 C 24 35.8, 43 36.0, 49.5 35.5 C 50.8 42, 50.2 55, 49.8 61.5 C 43 62.2, 25 61.8, 19.2 62.0 C 18.5 54, 18.8 43, 19 36.5 Z"
        fill="rgba(20, 3, 5, 0.45)"
      />
      <path
        d="M 18.5 36.2 C 27 35.8, 41 36.0, 49.2 35.6 C 50.4 43.5, 49.8 54, 49.5 61.8 C 41 62.4, 27 61.9, 19.0 62.0 C 18.4 53.5, 18.8 44, 18.5 36.2 Z"
        stroke="#0d0b0b"
        strokeWidth="3.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        fill="none"
      />

      {/* Sketchy pen overshoot strokes at corners */}
      <line x1="17.2" y1="36.5" x2="22.5" y2="36.0" stroke="#0d0b0b" strokeWidth="1.6" strokeLinecap="round" opacity="0.75" />
      <line x1="46.0" y1="35.5" x2="50.8" y2="35.5" stroke="#0d0b0b" strokeWidth="1.6" strokeLinecap="round" opacity="0.75" />
      <line x1="18.2" y1="59.5" x2="18.6" y2="63.5" stroke="#0d0b0b" strokeWidth="1.6" strokeLinecap="round" opacity="0.75" />

      {/* Messy hand-drawn hatch marks */}
      <path
        d="M 22.5 42.0 L 27.5 47.0 M 41.5 51.5 L 45.5 55.5"
        stroke="#0d0b0b"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.75"
      />

      {/* Hand-Drawn Bold Keyhole */}
      <circle cx="34.5" cy="46.0" r="3.4" fill="#0d0b0b" />
      <path
        d="M 32.5 47.8 L 30.8 56.2 C 32.8 56.8, 36.2 56.6, 38.2 56.0 L 36.5 47.8 Z"
        fill="#0d0b0b"
      />

      {/* Loose marker underline scribble */}
      <path
        d="M 21.0 64.5 C 27.5 65.5, 39.5 65.2, 47.0 64.0"
        stroke="#0d0b0b"
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.65"
      />
    </svg>
  )
}

/**
 * Back face SVG of the tape lock: adhesive underside with gum sheen,
 * cloth scrim weave, and mirrored hand-torn ragged edge.
 */
function LockTapeBackSvg({ idPrefix = 'lockBack' }: { idPrefix?: string }) {
  const backGradId = `${idPrefix}-grad`
  const backSheenId = `${idPrefix}-sheen`
  const backWeaveId = `${idPrefix}-weave`

  return (
    <svg
      viewBox="0 0 68 78"
      fill="none"
      className="w-full h-full overflow-visible"
      style={{
        filter:
          'drop-shadow(0px 2px 3px rgba(0,0,0,0.28)) drop-shadow(0px 5px 10px rgba(0,0,0,0.18))',
      }}
    >
      <defs>
        <linearGradient id={backGradId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#250306" />
          <stop offset="12%" stopColor="#45060b" />
          <stop offset="35%" stopColor="#630b11" />
          <stop offset="70%" stopColor="#7d1117" />
          <stop offset="90%" stopColor="#8c141c" />
          <stop offset="100%" stopColor="#7a1016" />
        </linearGradient>

        <linearGradient id={backSheenId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.06)" />
          <stop offset="50%" stopColor="rgba(255,255,255,0.18)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.12)" />
        </linearGradient>

        <pattern id={backWeaveId} width="3" height="3" patternUnits="userSpaceOnUse">
          <path d="M 0 1.5 H 3 M 1.5 0 V 3" stroke="rgba(255,255,255,0.08)" strokeWidth="0.45" />
          <circle cx="1.5" cy="1.5" r="0.35" fill="rgba(0,0,0,0.07)" />
        </pattern>
      </defs>

      {/* Mirrored ragged hand-torn tape body */}
      <path
        d="M 0 2 
           H 57.5 
           L 62.5 6.0 
           L 52.5 17.5 
           L 57.0 22.0 
           L 53.8 26.5 
           L 64.8 37.0 
           L 61.8 42.5 
           L 65.2 47.5 
           L 54.2 57.0 
           L 60.2 63.0 
           L 56.5 67.5 
           L 63.5 72.0 
           L 58.5 76.0 
           H 0 Z"
        fill={`url(#${backGradId})`}
      />

      {/* Back Gum Sheen */}
      <path
        d="M 0 2 H 57.5 L 62.5 6.0 L 52.5 17.5 L 57.0 22.0 L 53.8 26.5 L 64.8 37.0 L 61.8 42.5 L 65.2 47.5 L 54.2 57.0 L 60.2 63.0 L 56.5 67.5 L 63.5 72.0 L 58.5 76.0 H 0 Z"
        fill={`url(#${backSheenId})`}
      />

      {/* Cloth Scrim Under Adhesive */}
      <path
        d="M 0 2 H 57.5 L 62.5 6.0 L 52.5 17.5 L 57.0 22.0 L 53.8 26.5 L 64.8 37.0 L 61.8 42.5 L 65.2 47.5 L 54.2 57.0 L 60.2 63.0 L 56.5 67.5 L 63.5 72.0 L 58.5 76.0 H 0 Z"
        fill={`url(#${backWeaveId})`}
        opacity="0.32"
      />

      {/* Ragged Frayed Deckle Tear Edge Highlight */}
      <path
        d="M 57.5 2 
           L 62.5 6.0 
           L 52.5 17.5 
           L 57.0 22.0 
           L 53.8 26.5 
           L 64.8 37.0 
           L 61.8 42.5 
           L 65.2 47.5 
           L 54.2 57.0 
           L 60.2 63.0 
           L 56.5 67.5 
           L 63.5 72.0 
           L 58.5 76.0"
        stroke="rgba(255, 220, 220, 0.45)"
        strokeWidth="0.85"
        strokeLinecap="round"
        fill="none"
      />

      {/* Loose frayed thread micro-whiskers */}
      <line x1="64.8" y1="37.0" x2="67.0" y2="37.5" stroke="rgba(255, 225, 225, 0.6)" strokeWidth="0.6" strokeLinecap="round" />
      <line x1="65.2" y1="47.5" x2="67.2" y2="47.2" stroke="rgba(255, 225, 225, 0.6)" strokeWidth="0.6" strokeLinecap="round" />
      <line x1="62.5" y1="6.0" x2="64.8" y2="5.5" stroke="rgba(255, 225, 225, 0.6)" strokeWidth="0.6" strokeLinecap="round" />

      {/* Edge depth */}
      <line x1="0" y1="2.5" x2="57.5" y2="2.5" stroke="rgba(255,255,255,0.3)" strokeWidth="0.75" />
      <line x1="0" y1="75.5" x2="58.5" y2="75.5" stroke="rgba(0,0,0,0.35)" strokeWidth="0.75" />
    </svg>
  )
}

/**
 * TAPE LOCK MECHANISM:
 * - Anchored permanently behind the back cover board at the right fore-edge.
 * - When CLOSED: Wraps around the edge and lies across the front cover (proud at z = 24px, zIndex 90).
 * - When HOVERED: Peels up like a page corner! The ragged left tip lifts & curls in 3D (no scale enlargement!).
 * - When OPENING: Unpeels from left to right across the cover, curling backward like peeling tape, then flips behind back cover!
 * - When CLOSING: Wraps back from behind the back cover, rolls down and adheres flat against the front cover!
 */
function WrappingTapeLock({
  wrapperRef,
  claspRef,
  claspBaseRef,
  claspFlapRef,
  claspShadowRef,
  claspCreaseRef,
  isClosedIdle,
  isFullyOpen,
  isOpen,
  isDesktop,
  onOpen,
  onClose,
}: {
  wrapperRef: React.RefObject<HTMLDivElement | null>
  claspRef: React.RefObject<HTMLDivElement | null>
  claspBaseRef: React.RefObject<HTMLDivElement | null>
  claspFlapRef: React.RefObject<HTMLDivElement | null>
  claspShadowRef: React.RefObject<HTMLDivElement | null>
  claspCreaseRef: React.RefObject<HTMLDivElement | null>
  isClosedIdle: boolean
  isFullyOpen: boolean
  isOpen: boolean
  isDesktop: boolean
  onOpen: () => void
  onClose?: () => void
}) {
  return (
    <div
      ref={wrapperRef}
      className={`absolute right-0 top-[42.5%] w-[68px] h-[78px] transform-style-3d select-none ${
        isOpen ? 'z-[70]' : 'z-[90]'
      } ${
        isClosedIdle
          ? 'pointer-events-auto cursor-pointer group/clasp'
          : isFullyOpen && onClose
          ? 'pointer-events-auto cursor-pointer group/clasp'
          : 'pointer-events-none'
      }`}
      style={{
        willChange: 'transform, z-index',
      }}
    >
      {/* 1. UNDER-COVER TAPE ROOT (Anchored behind the back cover board at z = -4px) */}
      <div
        className="pointer-events-none absolute right-0 top-0 w-[36px] h-[78px] z-0 select-none overflow-visible"
        style={{
          transform: 'translate3d(0px, 0px, -4px)',
        }}
        aria-hidden="true"
      >
        <svg viewBox="0 0 36 78" fill="none" className="w-full h-full">
          <defs>
            <linearGradient id="lockTapeUnderGrad" x1="1" y1="0" x2="0" y2="0">
              <stop offset="0%" stopColor="#300407" />
              <stop offset="15%" stopColor="#5a090e" />
              <stop offset="45%" stopColor="#7a1016" />
              <stop offset="100%" stopColor="#96151d" />
            </linearGradient>
            <pattern id="lockTapeWeaveUnder" width="3" height="3" patternUnits="userSpaceOnUse">
              <path d="M 0 1.5 H 3 M 1.5 0 V 3" stroke="rgba(255,255,255,0.07)" strokeWidth="0.45" />
              <circle cx="1.5" cy="1.5" r="0.35" fill="rgba(0,0,0,0.08)" />
            </pattern>
          </defs>
          {/* Realistic dark red tape strip tucked under back cover board */}
          <rect
            x="0"
            y="2"
            width="36"
            height="74"
            fill="url(#lockTapeUnderGrad)"
          />
          <rect
            x="0"
            y="2"
            width="36"
            height="74"
            fill="url(#lockTapeWeaveUnder)"
            opacity="0.35"
          />
          {/* Subtle edge depth */}
          <line x1="0" y1="2.5" x2="36" y2="2.5" stroke="rgba(255,255,255,0.3)" strokeWidth="0.75" />
          <line x1="0" y1="75.5" x2="36" y2="75.5" stroke="rgba(0,0,0,0.45)" strokeWidth="0.75" />
        </svg>
      </div>

      {/* 2. PEEL AMBIENT DROP SHADOW (On book cover surface beneath tape, tracks torn flap) */}
      <div
        ref={claspShadowRef}
        className="tape-peel-shadow absolute right-0 top-0 w-[68px] h-[78px] pointer-events-none z-0 [transform:translate3d(0px,0px,13.5px)] opacity-0"
        style={{
          filter: 'blur(3.5px)',
        }}
        aria-hidden="true"
      >
        <svg viewBox="0 0 68 78" fill="none" className="w-full h-full overflow-visible">
          <path
            d="M 68 2 H 10.5 L 5.5 6.0 L 15.5 17.5 L 11.0 22.0 L 14.2 26.5 L 3.2 37.0 L 6.2 42.5 L 2.8 47.5 L 13.8 57.0 L 7.8 63.0 L 11.5 67.5 L 4.5 72.0 L 9.5 76.0 H 68 Z"
            fill="rgba(0,0,0,0.6)"
          />
        </svg>
      </div>

      {/* 3. ARTICULATED TAPE LOCK (Wraps over front cover when closed; flips 180deg to lay behind back cover when open!) */}
      <div
        ref={claspRef}
        onClick={
          isClosedIdle
            ? (e) => {
                e.stopPropagation()
                onOpen()
              }
            : isFullyOpen && onClose
            ? (e) => {
                e.stopPropagation()
                onClose()
              }
            : undefined
        }
        className={`absolute right-0 top-0 w-[68px] h-[78px] z-10 transform-style-3d ${
          isClosedIdle || (isFullyOpen && onClose)
            ? 'pointer-events-auto cursor-pointer'
            : 'pointer-events-none'
        }`}
        style={{
          transformOrigin: '100% 50%',
          transform: `translate3d(0px, 0px, ${isOpen ? -4 : 15}px) rotateY(${isOpen ? 180 : 0}deg)`,
          willChange: 'transform',
        }}
        aria-label={
          isClosedIdle
            ? 'Click lock to unlock and open diary'
            : isFullyOpen
            ? 'Click tape to close diary'
            : undefined
        }
        role={isClosedIdle || (isFullyOpen && onClose) ? 'button' : undefined}
        title={
          isClosedIdle
            ? 'Click lock to open diary'
            : isFullyOpen
            ? 'Click tape to close diary'
            : undefined
        }
        tabIndex={isClosedIdle || (isFullyOpen && !!onClose) ? 0 : -1}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            if (isClosedIdle) onOpen()
            else if (isFullyOpen && onClose) onClose()
          }
        }}
      >
        {/* UNPEELED TAPE BASE (Adhered flat to cover board at x = peelX..68 near right edge) */}
        <div
          ref={claspBaseRef}
          className="absolute right-0 top-0 w-[16px] h-[78px] overflow-hidden pointer-events-none backface-hidden"
          style={{
            transform: 'translateZ(1px)',
            display: 'none',
          }}
        >
          <div className="absolute right-0 top-0 w-[68px] h-[78px]">
            <LockTapeFrontSvg idPrefix="lockBase" />
          </div>
        </div>

        {/* PEEL CREASE HIGHLIGHT (Specular light along the cylindrical tape fold at peelX) */}
        <div
          ref={claspCreaseRef}
          className="pointer-events-none absolute right-[15.5px] top-[2px] bottom-[2px] w-[2.5px] opacity-0"
          style={{
            background:
              'linear-gradient(to right, rgba(255,255,255,0.55), rgba(255,255,255,0.1) 70%, transparent)',
            transform: 'translateZ(1.2px)',
          }}
          aria-hidden="true"
        />

        {/* PEELING FLAP (x = 0..peelX containing hand-torn ragged edge & messy doodle lock) */}
        <div
          ref={claspFlapRef}
          className="tape-peel-flap absolute right-0 top-0 w-[68px] h-[78px] origin-right transform-style-3d"
          style={{
            transformOrigin: '100% 50%',
          }}
        >
          {/* Front of Flap: contains the ragged edge & lock doodle */}
          <div
            className="absolute left-0 top-0 w-full h-[78px] overflow-visible pointer-events-none backface-hidden"
            style={{
              transform: 'translateZ(1px)',
            }}
          >
            <div className="absolute left-0 top-0 w-[68px] h-[78px] overflow-visible">
              <LockTapeFrontSvg idPrefix="lockFlap" />
            </div>
          </div>

          {/* Sticky Underside of Flap (Revealed when flap curls back past 90deg) */}
          <div
            className="absolute left-0 top-0 w-full h-[78px] overflow-visible pointer-events-none backface-hidden"
            style={{
              transform: 'rotateY(180deg) translateZ(1px)',
            }}
          >
            <div className="absolute right-0 top-0 w-[68px] h-[78px] overflow-visible">
              <LockTapeBackSvg idPrefix="lockFlapBack" />
            </div>
          </div>
        </div>

        {/* FULL BACK FACE (Visible when completely unwrapped at 180deg laying flat behind back cover!) */}
        <div
          className="absolute inset-0 pointer-events-none backface-hidden overflow-visible"
          style={{ transform: 'rotateY(180deg) translateZ(1px)' }}
        >
          <LockTapeBackSvg idPrefix="lockFullBack" />
        </div>
      </div>

      {/* 4. GENEROUS TOUCH/CLICK HIT TARGET FOR CLOSING DIARY ON MOBILE & PC */}
      {isFullyOpen && onClose && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onClose()
          }}
          className="absolute -right-10 -top-4 w-[96px] h-[110px] z-[80] cursor-pointer pointer-events-auto bg-transparent border-0 p-0 m-0 select-none touch-manipulation focus:outline-none"
          style={{
            transform: 'translateZ(25px)',
          }}
          aria-label="Click tape to close diary"
          title="Click tape to close diary"
        />
      )}

      {/* 5. SOLID GENEROUS TOUCH/CLICK HIT TARGET FOR OPENING DIARY WHEN CLOSED */}
      {isClosedIdle && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onOpen()
          }}
          className="absolute -right-2 top-0 w-[100px] h-[78px] z-30 cursor-pointer pointer-events-auto bg-transparent border-0 p-0 m-0 select-none touch-manipulation focus:outline-none"
          style={{
            transform: 'translateZ(25px)',
          }}
          aria-label="Click lock to unlock and open diary"
          title="Click lock to open diary"
        />
      )}

      {/* 6. VISUAL GUIDE: POINTING TO LOCK TO OPEN BOOK (Strictly visual cue - pointer-events-none) */}
      {!isOpen && (
        isDesktop ? (
          <div
            className={`absolute left-[calc(100%+14px)] top-[39px] -translate-y-1/2 z-40 flex items-center gap-2 select-none pointer-events-none transition-all duration-300 ${
              isClosedIdle
                ? 'opacity-100 scale-100 translate-x-0'
                : 'opacity-0 scale-90 translate-x-3'
            }`}
            style={{
              transform: 'translateZ(28px)',
            }}
            aria-hidden="true"
          >
            {/* Hand-drawn ink doodle arrow pointing LEFT directly at the padlock on the tape */}
            <div className="relative shrink-0">
              <svg
                viewBox="0 0 68 32"
                fill="none"
                className="w-16 h-8 drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]"
                aria-hidden="true"
              >
                <path
                  d="M64 16 C44 7, 24 8, 8 16"
                  stroke="#c9252c"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                />
                <path
                  d="M19 8 L7 16 L18 24"
                  stroke="#c9252c"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            {/* Pure handwriting text */}
            <div className="relative -top-1 flex flex-col select-none rotate-[-2deg]">
              <span
                className="font-bold text-[27px] tracking-wide text-[#c9252c] leading-none whitespace-nowrap drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)]"
                style={{
                  fontFamily: 'var(--font-display)',
                }}
              >
                click lock to open!
              </span>
            </div>
          </div>
        ) : (
          <div
            className={`absolute right-1 bottom-[calc(100%+8px)] z-50 flex flex-col items-end select-none pointer-events-none transition-opacity duration-300 ${
              isClosedIdle
                ? 'opacity-100'
                : 'opacity-0'
            }`}
            style={{
              transform: 'translateZ(28px)',
            }}
            aria-hidden="true"
          >
            {/* Handwritten scrawled text directly on dark cover */}
            <div className="rotate-[-3deg] filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]">
              <span
                className="font-bold text-[24px] tracking-wide text-[#ff4d56] leading-none whitespace-nowrap"
                style={{
                  fontFamily: 'var(--font-display)',
                  textShadow: '0 2px 4px #000, 0 0 8px rgba(255,77,86,0.7)',
                }}
              >
                tap lock to open!
              </span>
            </div>

            {/* Curved ink arrow arching down directly toward padlock (static, zero bobbing) */}
            <div className="relative pr-3 -mt-0.5 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]">
              <svg
                viewBox="0 0 42 38"
                fill="none"
                className="w-9 h-9"
                aria-hidden="true"
              >
                <path
                  d="M6 5 C16 4, 28 12, 28 26"
                  stroke="#ff4d56"
                  strokeWidth="3.4"
                  strokeLinecap="round"
                />
                <path
                  d="M17 18 L28 27 L35 16"
                  stroke="#ff4d56"
                  strokeWidth="3.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        )
      )}
    </div>
  )
}

export default function BookCover3D({
  isOpen,
  onOpen,
  onClose,
  isDesktop,
  interiorLeftPage,
  onProgressChange,
  onCoverSettled,
}: BookCover3DProps) {
  // Tracks which open/closed target the 3D cover has finished settling into
  const [settledForOpen, setSettledForOpen] = useState<boolean>(isOpen)

  const hingeRef = useRef<HTMLDivElement>(null)
  const exteriorFaceRef = useRef<HTMLDivElement>(null)
  const interiorFaceRef = useRef<HTMLDivElement>(null)
  const coverShadeRef = useRef<HTMLDivElement>(null)
  const tapeWrapperRef = useRef<HTMLDivElement>(null)
  const claspRef = useRef<HTMLDivElement>(null)
  const claspBaseRef = useRef<HTMLDivElement>(null)
  const claspFlapRef = useRef<HTMLDivElement>(null)
  const claspShadowRef = useRef<HTMLDivElement>(null)
  const claspCreaseRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef<number>(isOpen ? 1 : 0)
  const rafRef = useRef<number | null>(null)

  const isDesktopRef = useRef(isDesktop)
  const onProgressChangeRef = useRef(onProgressChange)
  const onCoverSettledRef = useRef(onCoverSettled)
  useLayoutEffect(() => {
    isDesktopRef.current = isDesktop
    onProgressChangeRef.current = onProgressChange
    onCoverSettledRef.current = onCoverSettled
  })

  const applyCoverTransform = useCallback(
    (rawP: number, animating: boolean) => {
      const p = clamp(rawP, 0, 1)
      progressRef.current = p

      // Physical tape peel phase: first 28% of timeline peels the tape across the cover and unwraps it
      const unwrapT = clamp(p / 0.28, 0, 1)

      // Front cover swing phase: 24% to 100% of timeline swings the front cover from 0deg to -180deg
      const swingT = clamp((p - 0.24) / 0.76, 0, 1)
      const angleDeg = -180 * swingT
      // Front board sits +10px above right page stack when closed, settling to 0px when open on left
      const zLift = Math.round((1 - swingT) * 10 * 100) / 100

      if (hingeRef.current) {
        // When settled open (!animating && swingT >= 0.999), completely hide the hinge
        // so it cannot cast a phantom 3D layer over the open pages or clip page flips!
        if (!animating && swingT >= 0.999) {
          hingeRef.current.style.display = 'none'
        } else {
          hingeRef.current.style.display = 'block'
        }
        hingeRef.current.style.transform = `translate3d(0px, 0px, ${zLift}px) rotateY(${
          Math.round(angleDeg * 100) / 100
        }deg)`
        // On 1-page portrait mode, once the cover swings past edge-on (-93deg), smoothly tuck away
        if (isDesktopRef.current) {
          hingeRef.current.style.opacity = '1'
        } else {
          const singlePageOpacity =
            swingT <= 0.52 ? 1 : 1 - clamp((swingT - 0.52) / 0.34, 0, 1)
          hingeRef.current.style.opacity = `${Math.round(singlePageOpacity * 1000) / 1000}`
        }
      }

      // Dynamic Face Culling: Prevents any backface bleed-through between exterior and interior
      if (exteriorFaceRef.current) {
        exteriorFaceRef.current.style.visibility = swingT >= 0.5 ? 'hidden' : 'visible'
      }
      if (interiorFaceRef.current) {
        interiorFaceRef.current.style.visibility =
          swingT < 0.5 || (!animating && swingT >= 0.999) ? 'hidden' : 'visible'
      }

      // Dynamic tape wrapper stacking: sits proud above front cover (z-90) until it rotates behind back cover (z-70)
      if (tapeWrapperRef.current) {
        tapeWrapperRef.current.style.zIndex = unwrapT >= 0.85 ? '70' : '90'
      }

      // Dynamic progressive tape peel and unwrap animation across front cover into back rest position!
      if (claspRef.current) {
        if (unwrapT <= 0) {
          // Closed and resting flat on front cover board; reset inline styles so CSS hover can curl the tip!
          claspRef.current.style.transform = 'translate3d(0px, 0px, 15px) rotateY(0deg)'
          if (claspBaseRef.current) {
            claspBaseRef.current.style.display = 'none'
            claspBaseRef.current.style.width = '0px'
          }
          if (claspFlapRef.current) {
            claspFlapRef.current.style.width = '68px'
            claspFlapRef.current.style.right = '0px'
            claspFlapRef.current.style.transform = ''
          }
          if (claspShadowRef.current) {
            claspShadowRef.current.style.opacity = ''
            claspShadowRef.current.style.transform = ''
          }
          if (claspCreaseRef.current) {
            claspCreaseRef.current.style.opacity = ''
            claspCreaseRef.current.style.right = '15.5px'
          }
        } else if (unwrapT < 0.78) {
          // Stage 1: Active progressive peeling across front cover
          const t = unwrapT / 0.78
          const eased = t * t * (3 - 2 * t)
          // Peel line travels from x = 16 to x = 68
          const peelX = Math.round(16 + eased * 52)
          const baseW = 68 - peelX
          const flapW = peelX
          const flapAngle = eased * 155
          const archLift = Math.sin(t * Math.PI) * 16
          const zPos = 15 + archLift

          claspRef.current.style.transform = `translate3d(0px, 0px, ${
            Math.round(zPos * 10) / 10
          }px) rotateY(0deg)`

          if (claspBaseRef.current) {
            claspBaseRef.current.style.display = 'block'
            claspBaseRef.current.style.width = `${baseW}px`
          }
          if (claspFlapRef.current) {
            claspFlapRef.current.style.width = `${flapW}px`
            claspFlapRef.current.style.right = `${baseW}px`
            claspFlapRef.current.style.transform = `translate3d(0px, 0px, 1px) rotateY(${
              Math.round(flapAngle * 10) / 10
            }deg)`
          }
          if (claspShadowRef.current) {
            const shOpacity = Math.sin(t * Math.PI) * 0.65
            claspShadowRef.current.style.opacity = `${Math.round(shOpacity * 100) / 100}`
            claspShadowRef.current.style.transform = `translate3d(${-2 - t * 14}px, ${
              2 + t * 4
            }px, 13.5px) scale(${Math.round((1 - t * 0.2) * 100) / 100})`
          }
          if (claspCreaseRef.current) {
            claspCreaseRef.current.style.opacity = `${Math.round((0.95 - t * 0.5) * 100) / 100}`
            claspCreaseRef.current.style.right = `${baseW - 0.5}px`
          }
        } else {
          // Stage 2: Settling phase: tape has cleared front cover, swings over fore-edge to lay behind back cover!
          const t2 = (unwrapT - 0.78) / 0.22
          const eased2 = t2 * t2 * (3 - 2 * t2)
          const baseAngle = eased2 * 180 // 0 to 180 deg (positive rotation outward into +Z!)
          const flapAngle = 155 * (1 - eased2) // flap flattens out as tape wraps
          const zPos = 15 - eased2 * 19 // 15 down to -4px behind back cover board

          claspRef.current.style.transform = `translate3d(0px, 0px, ${
            Math.round(zPos * 10) / 10
          }px) rotateY(${Math.round(baseAngle * 10) / 10}deg)`

          if (claspBaseRef.current) {
            claspBaseRef.current.style.display = 'none'
            claspBaseRef.current.style.width = '0px'
          }
          if (claspFlapRef.current) {
            claspFlapRef.current.style.width = '68px'
            claspFlapRef.current.style.right = '0px'
            claspFlapRef.current.style.transform = `translate3d(0px, 0px, 1px) rotateY(${
              Math.round(flapAngle * 10) / 10
            }deg)`
          }
          if (claspShadowRef.current) {
            claspShadowRef.current.style.opacity = '0'
          }
          if (claspCreaseRef.current) {
            claspCreaseRef.current.style.opacity = '0'
          }
        }
      }

      // Dynamic lighting across the front cover as it tilts toward overhead desk light
      if (coverShadeRef.current) {
        const tiltSin = Math.sin(Math.PI * swingT)
        coverShadeRef.current.style.opacity = `${Math.round(tiltSin * 0.26 * 1000) / 1000}`
      }

      if (onProgressChangeRef.current) {
        onProgressChangeRef.current(p, animating)
      }
    },
    []
  )

  // Ensure initial transform is applied synchronously before first paint without JSX style clobbering
  useLayoutEffect(() => {
    applyCoverTransform(progressRef.current, false)
    if (typeof window !== 'undefined') {
      ;(window as any).__testSetCoverProgress = (p: number) => applyCoverTransform(p, true)
    }
  }, [applyCoverTransform, isDesktop])

  useEffect(() => {
    const target = isOpen ? 1 : 0
    const start = progressRef.current
    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (Math.abs(target - start) < 0.001 || reducedMotion) {
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null
        applyCoverTransform(target, false)
        setSettledForOpen(isOpen)
        onCoverSettledRef.current?.(isOpen)
      })
      return () => {
        if (rafRef.current !== null) {
          cancelAnimationFrame(rafRef.current)
          rafRef.current = null
        }
      }
    }

    const duration = isOpen ? 1780 : 1480
    const startTime = performance.now()

    const step = (now: number) => {
      const t = clamp((now - startTime) / duration, 0, 1)
      // C-infinity continuous Hermite inertial curve
      const omt = 1 - t
      const eased = 0.16 * t * omt * omt + t * t * (3 - 2 * t)
      const current = start + (target - start) * clamp(eased, 0, 1)

      if (t < 1) {
        applyCoverTransform(current, true)
        rafRef.current = requestAnimationFrame(step)
      } else {
        rafRef.current = null
        applyCoverTransform(target, false)
        setSettledForOpen(isOpen)
        onCoverSettledRef.current?.(isOpen)
      }
    }

    rafRef.current = requestAnimationFrame(step)
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [applyCoverTransform, isOpen])

  const isTransitioning = settledForOpen !== isOpen
  const hideSettledHinge = isOpen && !isTransitioning
  const isClosedIdle = !isOpen && !isTransitioning
  const isFullyOpen = isOpen && !isTransitioning

  return (
    <>
      {/* 3D ROUNDED HARDCOVER LID (Swings 0deg to -180deg around left spine x = 0) */}
      <div
        key={isDesktop ? 'desktop-hinge' : 'mobile-hinge'}
        ref={hingeRef}
        className={`closed-book-wrapper absolute top-0 transform-style-3d select-none pointer-events-none ${
          hideSettledHinge ? 'invisible' : ''
        }`}
        style={{
          left: isDesktop ? '488px' : '0px',
          width: isDesktop ? '488px' : '100%',
          height: '100%',
          transformOrigin: '0px 50%',
          zIndex: hideSettledHinge ? -1 : 60,
          display: hideSettledHinge ? 'none' : 'block',
          visibility: hideSettledHinge ? 'hidden' : 'visible',
          willChange: 'transform',
        }}
      >
        {/* 3D ROUNDED CHECKERED CLOTH SPINE HINGE WALL (Left Edge x = 0) */}
        <div
          className="pointer-events-none absolute left-0 top-[2px] bottom-[2px] w-[14px] origin-left transform-style-3d"
          style={{
            transform: 'rotateY(-90deg)',
            backgroundColor: '#191213',
            backgroundImage: `
              linear-gradient(to right, rgba(0,0,0,0.6) 0%, rgba(255,255,255,0.18) 45%, rgba(0,0,0,0.7) 100%),
              repeating-linear-gradient(to bottom, #c4202a 0px, #c4202a 19px, #191214 19px, #191214 38px)
            `,
          }}
          aria-hidden="true"
        />

        {/* 3D HARDCOVER RIGHT BOARD THICKNESS WALL (Visible as lid swings through -90deg) */}
        <div
          className="pointer-events-none absolute right-0 top-[13px] bottom-[15px] w-[5px] origin-right bg-[#1e1c1b]"
          style={{
            transform: 'translateZ(-2.5px) rotateY(90deg)',
            boxShadow: 'inset 0 0 2px rgba(0,0,0,0.8)',
          }}
          aria-hidden="true"
        />

        {/* EXTERIOR FRONT HARDCOVER FACE (0deg) */}
        <div
          ref={exteriorFaceRef}
          className="cover-exterior absolute inset-0 transform-style-3d"
          style={{
            transform: 'translateZ(2.5px)',
          }}
        >
          <CoverArtwork />
          {/* Dynamic specular sheen as the cover lifts toward light */}
          <div
            ref={coverShadeRef}
            className="pointer-events-none absolute inset-0 rounded-r-[14px] z-40"
            style={{
              opacity: 0,
              background:
                'linear-gradient(115deg, rgba(255,255,255,0.45) 0%, rgba(255,252,245,0.12) 45%, rgba(0,0,0,0.35) 100%)',
            }}
            aria-hidden="true"
          />
        </div>

        {/* INTERIOR HARDCOVER FACE (180deg): Opens DIRECTLY to Page 1 (Left Page) */}
        <div
          ref={interiorFaceRef}
          className="cover-interior absolute inset-0 overflow-hidden rounded-l-xl bg-ink"
          style={{
            transform: 'rotateY(180deg) translateZ(2.5px)',
            visibility: hideSettledHinge ? 'hidden' : undefined,
          }}
        >
          {isDesktop && interiorLeftPage ? (
            <div className="w-full h-full p-[14px] pr-0 flex items-stretch">
              <div className="w-[474px] h-[614px] relative overflow-hidden rounded-l-sm">
                {interiorLeftPage}
              </div>
            </div>
          ) : (
            <div className="w-full h-full bg-[#171616] border-r border-white/10" />
          )}
        </div>
      </div>

      {/* REALISTIC BACK-COVER MOUNTED TAPE LOCK (Wraps from back to front; unwraps to the side!) */}
      <WrappingTapeLock
        wrapperRef={tapeWrapperRef}
        claspRef={claspRef}
        claspBaseRef={claspBaseRef}
        claspFlapRef={claspFlapRef}
        claspShadowRef={claspShadowRef}
        claspCreaseRef={claspCreaseRef}
        isClosedIdle={isClosedIdle}
        isFullyOpen={isFullyOpen}
        isOpen={isOpen}
        isDesktop={isDesktop}
        onOpen={onOpen}
        onClose={onClose}
      />
    </>
  )
}
