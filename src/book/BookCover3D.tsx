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
  isDesktop: boolean
  /** Actual Page 1 (or current left page) rendered physically on the inside of the hinged left cover! */
  interiorLeftPage?: React.ReactNode
  /** Notifies parent of real-time cover progress (0 = closed, 1 = fully open -180deg) so desk position & page shadows stay 1:1 synced */
  onProgressChange?: (progress: number, isAnimating: boolean) => void
}

function CoverArtwork({
  claspRef,
  initialOpen,
}: {
  claspRef: React.RefObject<HTMLDivElement | null>
  initialOpen: boolean
}) {
  const initialAngle = initialOpen ? 46 : 0

  return (
    <div className="cover-exterior relative w-full h-full rounded-r-[14px] rounded-l-[3px] overflow-visible select-none bg-[#171616] text-[#f5f2eb] shadow-[inset_0_1px_1px_rgba(255,255,255,0.12),inset_-3px_-3px_12px_rgba(0,0,0,0.75)]">
      {/* Matte worn black buckram/leatherette surface & subtle corner distress */}
      <div
        className="pointer-events-none absolute inset-0 rounded-r-[14px] rounded-l-[3px] overflow-hidden"
        style={{
          background: `
            radial-gradient(circle at 96% 4%, rgba(255,250,240,0.11) 0%, transparent 14%),
            radial-gradient(circle at 96% 97%, rgba(255,250,240,0.09) 0%, transparent 13%),
            radial-gradient(ellipse at 52% 28%, rgba(48,46,45,0.42) 0%, rgba(20,19,19,0.92) 72%, #111010 100%)
          `,
        }}
        aria-hidden="true"
      />

      {/* Left Red-and-Black Checkered Bookbinder's Cloth Spine Band */}
      <div
        className="pointer-events-none absolute left-0 top-0 bottom-0 w-[44px] rounded-l-[3px] overflow-hidden z-10"
        style={{
          backgroundColor: '#191213',
          backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.04) 22%, rgba(0,0,0,0.28) 78%, rgba(0,0,0,0.72) 100%),
            repeating-linear-gradient(to bottom, rgba(204, 32, 42, 0.92) 0px, rgba(204, 32, 42, 0.92) 19px, rgba(24, 16, 18, 0.88) 19px, rgba(24, 16, 18, 0.88) 38px),
            repeating-linear-gradient(to right, rgba(185, 28, 38, 0.55) 0px, rgba(185, 28, 38, 0.55) 11px, rgba(18, 13, 14, 0.65) 11px, rgba(18, 13, 14, 0.65) 22px)
          `,
          backgroundBlendMode: 'normal, normal, multiply',
          boxShadow:
            'inset -3px 0 5px rgba(0,0,0,0.85), 2px 0 3px rgba(0,0,0,0.65)',
        }}
        aria-hidden="true"
      >
        {/* Subtle vertical cloth weave highlight */}
        <div
          className="absolute inset-y-0 left-[6px] w-[3px] opacity-25"
          style={{
            background:
              'linear-gradient(to right, transparent, rgba(255,220,220,0.8), transparent)',
          }}
        />
      </div>

      {/* Deep Bookbinder's Hinge Groove right beside the cloth spine */}
      <div
        className="pointer-events-none absolute top-0 bottom-0 left-[44px] w-[5px] z-10"
        style={{
          background:
            'linear-gradient(to right, #080707 0%, #2a2828 65%, rgba(255,255,255,0.06) 100%)',
        }}
        aria-hidden="true"
      />

      {/* Debossed Perimeter Stitching Line */}
      <div
        className="pointer-events-none absolute top-[10px] bottom-[10px] left-[54px] right-[11px] rounded-r-[9px] border-[1.6px] border-dashed border-white/[0.11] z-10"
        style={{
          boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.65)',
        }}
        aria-hidden="true"
      />

      {/* BACKGROUND DOODLES ON MATTE BLACK COVER (Subtle Gloss-Black) */}
      <div
        className="pointer-events-none absolute inset-0 left-[44px] z-10 overflow-hidden"
        aria-hidden="true"
      >
        {/* Subtle gloss-black stars & code tags on left */}
        <svg
          viewBox="0 0 36 36"
          className="w-6 h-6 absolute left-[18px] top-[148px] opacity-65"
        >
          <path
            d="M18 3 L22 13 L33 14 L24.5 21 L27 32 L18 26 L9 32 L11.5 21 L3 14 L14 13 Z"
            stroke="#050505"
            strokeWidth="2.6"
            fill="rgba(0,0,0,0.35)"
          />
        </svg>
        <svg
          viewBox="0 0 36 36"
          className="w-5 h-5 absolute left-[38px] top-[196px] opacity-65"
        >
          <path
            d="M18 3 L22 13 L33 14 L24.5 21 L27 32 L18 26 L9 32 L11.5 21 L3 14 L14 13 Z"
            stroke="#050505"
            strokeWidth="2.6"
            fill="none"
          />
        </svg>
        <span className="hand font-extrabold text-[22px] text-black/80 drop-shadow-[0_1px_0_rgba(255,255,255,0.06)] absolute left-[34px] top-[278px] -rotate-6">
          &lt;/&gt;
        </span>
      </div>

      {/* MAIN COVER CONTENT COLUMN */}
      <div className="relative z-20 h-full pl-[58px] pr-[20px] pt-[18px] pb-[18px] flex flex-col items-center justify-between">
        {/* TOP TITLE LOCKUP: DEV LOG / crossed-out DIARY / of / GABO / A DEVELOPER PORTFOLIO */}
        <div className="w-full flex flex-col items-center text-center">
          {/* 'DEV LOG' scrawled cleanly above crossed-out serif 'DIARY' */}
          <div className="relative inline-block pt-[26px]">
            {/* Handwritten red 'DEV LOG' */}
            <span
              className="marker absolute top-0 left-[53%] -translate-x-1/2 -rotate-4 text-[30px] leading-none tracking-[0.06em] text-[#df252e] whitespace-nowrap z-20"
              style={{
                textShadow: '0 2px 5px rgba(0,0,0,0.75)',
              }}
            >
              DEV LOG
            </span>

            {/* Classic Serif 'DIARY' */}
            <span
              className="block uppercase text-[52px] leading-[0.88] tracking-[0.11em] text-[#dcd9d0] font-normal select-none"
              style={{
                fontFamily: 'Georgia, "Times New Roman", Times, serif',
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
                strokeWidth="5.8"
                strokeLinecap="round"
              />
              <path
                d="M12 24 C102 18, 194 12, 268 10"
                stroke="#a8181f"
                strokeWidth="2.4"
                strokeLinecap="round"
                opacity="0.85"
              />
            </svg>
          </div>

          {/* 'of' */}
          <span className="hand font-extrabold text-[32px] leading-[0.92] text-[#f5f3ee] mt-0.5">
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
                  'drop-shadow(0px 2px 0px #8f141a) drop-shadow(0px 5px 10px rgba(0,0,0,0.55))',
              }}
            >
              GABO
            </h1>
          </div>

          {/* 'A DEVELOPER PORTFOLIO' (nudged slightly below the GABO lockup) */}
          <p className="hand uppercase font-extrabold text-[23px] leading-tight tracking-[0.045em] text-[#f4f1ea] mt-2">
            A DEVELOPER LOGBOOK
          </p>
        </div>

        {/* CENTER/BOTTOM TAPED TORN RULED NOTEBOOK PAPER SCRAP */}
        <div className="relative w-[292px] h-[292px] mt-1 mb-16 flex items-center justify-center">
          {/* Layered Translucent Masking Tape Corners (matching reference cover photo) */}
          <DoodleTape
            className="w-[82px] h-6 absolute -top-2.5 -left-3 z-30 opacity-85"
            rotate={-40}
            variant="beige"
          />
          <DoodleTape
            className="w-[68px] h-5 absolute top-1 -left-4 z-30 opacity-65"
            rotate={-32}
            variant="beige"
          />

          <DoodleTape
            className="w-[84px] h-6 absolute -top-2 -right-3.5 z-30 opacity-85"
            rotate={38}
            variant="beige"
          />
          <DoodleTape
            className="w-[74px] h-5.5 absolute top-0.5 -right-3 z-30 opacity-72"
            rotate={-42}
            variant="beige"
          />

          <DoodleTape
            className="w-[82px] h-6 absolute -bottom-2 -left-3.5 z-30 opacity-85"
            rotate={36}
            variant="beige"
          />
          <DoodleTape
            className="w-[72px] h-5 absolute bottom-0.5 -left-3 z-30 opacity-70"
            rotate={-38}
            variant="beige"
          />

          <DoodleTape
            className="w-[82px] h-6 absolute -bottom-2.5 -right-3 z-30 opacity-85"
            rotate={-36}
            variant="beige"
          />
          <DoodleTape
            className="w-[68px] h-5 absolute bottom-0.5 -right-3.5 z-30 opacity-68"
            rotate={34}
            variant="beige"
          />

          {/* Drop shadow beneath torn paper */}
          <div
            className="relative w-full h-full drop-shadow-[0_6px_12px_rgba(0,0,0,0.75)]"
            style={{ transform: 'rotate(-1.2deg)' }}
          >
            {/* Jagged Hand-Torn Lined Notebook Paper Scrap */}
            <div
              className="relative w-full h-full overflow-hidden flex flex-col justify-between px-4 pt-3 pb-2.5"
              style={{
                backgroundColor: '#f3eee2',
                backgroundImage: `
                  radial-gradient(ellipse at 28% 34%, rgba(255,255,255,0.55) 0%, transparent 45%),
                  linear-gradient(128deg, transparent 22%, rgba(0,0,0,0.035) 26%, rgba(255,255,255,0.4) 28%, transparent 34%),
                  linear-gradient(212deg, transparent 48%, rgba(0,0,0,0.03) 52%, rgba(255,255,255,0.35) 54%, transparent 60%),
                  repeating-linear-gradient(
                    to bottom,
                    transparent 0px,
                    transparent 21px,
                    rgba(166, 186, 212, 0.65) 21px,
                    rgba(166, 186, 212, 0.65) 22px
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
                  src="/gaboCharacter.png"
                  alt="Gabo illustration on diary cover"
                  className="h-[218px] w-auto object-contain relative z-20"
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
                  fontFamily: '"Caveat", "Patrick Hand", cursive',
                  color: '#1b3f99',
                }}
              >
                by Louis Gabriel D. Damondamon
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT-EDGE FRAYED RED & BLACK LOCK CLASP STRAP (Unlatches in 3D!) */}
      <div
        ref={claspRef}
        className="pointer-events-none absolute right-[-2px] top-[42.5%] w-[62px] h-[78px] z-30 transform-style-3d"
        style={{
          transformOrigin: '100% 50%',
          transform: `rotateY(${initialAngle}deg) translateZ(2px)`,
          willChange: 'transform',
        }}
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 68 84"
          fill="none"
          className="w-full h-full drop-shadow-[-3px_3px_5px_rgba(0,0,0,0.65)]"
        >
          <defs>
            <linearGradient id="claspGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#c4212a" />
              <stop offset="68%" stopColor="#a81a22" />
              <stop offset="86%" stopColor="#261416" />
              <stop offset="100%" stopColor="#121010" />
            </linearGradient>
          </defs>
          {/* Frayed cloth/tape left edge wrapping cleanly onto right edge */}
          <path
            d="M6 4 L67 4 V80 L6 80 L10 74 L4 68 L9 62 L3 56 L9 50 L4 44 L10 38 L4 32 L9 26 L3 20 L9 14 L4 8 Z"
            fill="url(#claspGrad)"
            stroke="#120d0e"
            strokeWidth="1.5"
          />
          {/* Subtle horizontal weave lines */}
          <path
            d="M10 14 H64 M10 28 H64 M10 56 H64 M10 70 H64"
            stroke="rgba(0,0,0,0.22)"
            strokeWidth="1"
          />
          {/* Bold Hand-Drawn Black Padlock with Keyhole */}
          <path
            d="M24 37 V27 C24 19.5 44 19.5 44 27 V37"
            stroke="#0d0b0b"
            strokeWidth="3.4"
            strokeLinecap="round"
          />
          <rect
            x="19"
            y="36"
            width="30"
            height="27"
            rx="4"
            fill="rgba(165, 24, 32, 0.35)"
            stroke="#0d0b0b"
            strokeWidth="3.4"
          />
          <circle cx="34" cy="47" r="3.4" fill="#0d0b0b" />
          <path d="M32.2 49 L30.8 57 H37.2 L35.8 49 Z" fill="#0d0b0b" />
        </svg>
      </div>
    </div>
  )
}

export default function BookCover3D({
  isOpen,
  onOpen,
  isDesktop,
  interiorLeftPage,
  onProgressChange,
}: BookCover3DProps) {
  // Tracks which open/closed target the 3D cover has finished settling into
  const [settledForOpen, setSettledForOpen] = useState<boolean>(isOpen)

  const hingeRef = useRef<HTMLDivElement>(null)
  const coverShadeRef = useRef<HTMLDivElement>(null)
  const claspRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef<number>(isOpen ? 1 : 0)
  const rafRef = useRef<number | null>(null)

  const touchStartRef = useRef<{ x: number; y: number } | null>(null)
  const isDesktopRef = useRef(isDesktop)
  const onProgressChangeRef = useRef(onProgressChange)
  useLayoutEffect(() => {
    isDesktopRef.current = isDesktop
    onProgressChangeRef.current = onProgressChange
  })

  const applyCoverTransform = useCallback(
    (rawP: number, animating: boolean) => {
      const p = clamp(rawP, 0, 1)
      progressRef.current = p

      // First 14% of opening unlatches the clasp before heavy board swings;
      // last 14% of closing snaps clasp shut onto the right edge.
      const clasp = clamp(p / 0.14, 0, 1)
      const swing = clamp((p - 0.06) / 0.94, 0, 1)

      const angleDeg = -180 * swing
      // Front board sits +10px above right page stack when closed, settling to 0px when open on left
      const zLift = Math.round((1 - swing) * 10 * 100) / 100

      if (hingeRef.current) {
        hingeRef.current.style.transform = `translate3d(0px, 0px, ${zLift}px) rotateY(${
          Math.round(angleDeg * 100) / 100
        }deg)`
        // On 1-page portrait mode, once the cover swings past edge-on (-93deg), smoothly tuck away
        // so wider portrait tablets never show an overhanging dark rectangle on the left desk margin
        if (isDesktopRef.current) {
          hingeRef.current.style.opacity = '1'
        } else {
          const singlePageOpacity =
            swing <= 0.52 ? 1 : 1 - clamp((swing - 0.52) / 0.34, 0, 1)
          hingeRef.current.style.opacity = `${Math.round(singlePageOpacity * 1000) / 1000}`
        }
      }

      if (claspRef.current) {
        const claspAngle = Math.round(clasp * 46 * 10) / 10
        claspRef.current.style.transform = `rotateY(${claspAngle}deg) translateZ(2px)`
      }

      // Dynamic lighting across the front cover as it tilts toward overhead desk light
      if (coverShadeRef.current) {
        const tiltSin = Math.sin(Math.PI * swing)
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
      // C-infinity continuous Hermite inertial curve: gentle start from rest, smooth mid-swing, cushioned landing
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

  return (
    <div
      ref={hingeRef}
      className={`closed-book-wrapper absolute top-0 transform-style-3d select-none ${
        hideSettledHinge
          ? 'pointer-events-none invisible'
          : isOpen || isTransitioning
            ? 'pointer-events-none'
            : 'cursor-pointer'
      } ${isClosedIdle ? 'book-idle-presence' : ''}`}
      style={{
        left: isDesktop ? '488px' : '0px',
        width: isDesktop ? '488px' : '100%',
        height: '100%',
        transformOrigin: '0px 50%',
        zIndex: hideSettledHinge ? -1 : 60,
        willChange: 'transform',
      }}
      onClick={!isOpen ? onOpen : undefined}
      onTouchStart={
        !isOpen
          ? (e) => {
              const t = e.touches[0]
              if (t) touchStartRef.current = { x: t.clientX, y: t.clientY }
            }
          : undefined
      }
      onTouchEnd={
        !isOpen
          ? (e) => {
              const start = touchStartRef.current
              touchStartRef.current = null
              const t = e.changedTouches[0]
              if (!start || !t) return
              const dx = t.clientX - start.x
              const dy = t.clientY - start.y
              if (dx < -32 && Math.abs(dx) > Math.abs(dy)) {
                onOpen()
              }
            }
          : undefined
      }
      role={!isOpen ? 'button' : undefined}
      tabIndex={!isOpen ? 0 : -1}
      aria-label={!isOpen ? 'Open Diary of Gabo' : undefined}
      onKeyDown={
        !isOpen
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onOpen()
              }
            }
          : undefined
      }
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
        className="absolute inset-0 backface-hidden transform-style-3d"
        style={{
          transform: 'translateZ(2.5px)',
        }}
      >
        <CoverArtwork claspRef={claspRef} initialOpen={isOpen} />
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
        className="cover-interior absolute inset-0 backface-hidden overflow-hidden rounded-l-xl bg-ink"
        style={{
          transform: 'rotateY(180deg) translateZ(2.5px)',
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
  )
}
