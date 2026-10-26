import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'

interface GaboMascotProps {
  speech?: string
  variant?: 'hero' | 'compact' | 'logo'
  flipTrigger?: number
  className?: string
  isDesktop?: boolean
}

const BONUS_QUIPS_DESKTOP = [
  'Hey! Watch the glasses, I just cleaned them.',
  'Fun fact: this whole notebook has zero scrollbars!',
  'Built with React, Tailwind CSS, and GSAP page flips.',
  'Grab a page corner, or use the Left/Right arrow keys, to turn pages!',
  'Real photos = torn cutouts. Everything else = black & red ink!',
]

const BONUS_QUIPS_MOBILE = [
  'Hey! Watch the glasses, I just cleaned them.',
  'Fun fact: this whole notebook has zero scrollbars!',
  'Built with React, Tailwind CSS, and GSAP page flips.',
  'Swipe to flip pages, or grab a corner!',
  'Real photos = torn cutouts. Everything else = black & red ink!',
]

export default function GaboMascot({
  speech,
  variant = 'hero',
  flipTrigger = 0,
  className = '',
  isDesktop = true,
}: GaboMascotProps) {
  const bonusQuips = isDesktop ? BONUS_QUIPS_DESKTOP : BONUS_QUIPS_MOBILE
  const imgRef = useRef<HTMLImageElement>(null)
  const bubbleRef = useRef<HTMLDivElement>(null)
  const [customQuip, setCustomQuip] = useState<{
    index: number
    forSpeech?: string
    forTrigger: number
  } | null>(null)

  const activeQuipIndex =
    customQuip &&
    customQuip.forSpeech === speech &&
    customQuip.forTrigger === flipTrigger
      ? customQuip.index
      : null

  // Stepped "doodle boil" animation so the drawing feels alive like a flipbook
  useEffect(() => {
    if (!imgRef.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const ctx = gsap.context(() => {
      gsap.to(imgRef.current, {
        rotation: variant === 'hero' ? 1.1 : 2.0,
        y: -2,
        duration: 0.65,
        repeat: -1,
        yoyo: true,
        ease: 'steps(2)',
      })
    })
    return () => ctx.revert()
  }, [variant])

  // React with a quick hop when a page flips
  useEffect(() => {
    if (flipTrigger === 0 && activeQuipIndex === null) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (imgRef.current) {
      gsap.fromTo(
        imgRef.current,
        { scale: 0.96, y: 5 },
        { scale: 1, y: 0, duration: 0.28, ease: 'cubic-bezier(0.23, 1, 0.32, 1)' }
      )
    }
    if (bubbleRef.current) {
      gsap.fromTo(
        bubbleRef.current,
        { scale: 0.95, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.24, ease: 'cubic-bezier(0.23, 1, 0.32, 1)' }
      )
    }
  }, [flipTrigger, activeQuipIndex])

  const handleMascotClick = () => {
    setCustomQuip((prev) => {
      const currentIdx =
        prev && prev.forSpeech === speech && prev.forTrigger === flipTrigger
          ? prev.index
          : null
      return {
        index: currentIdx === null ? 0 : (currentIdx + 1) % bonusQuips.length,
        forSpeech: speech,
        forTrigger: flipTrigger,
      }
    })
    if (imgRef.current && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.fromTo(
        imgRef.current,
        { scale: 0.94, rotation: -3.5 },
        { scale: 1, rotation: 1.2, duration: 0.25, ease: 'back.out(2)' }
      )
    }
  }

  const activeSpeech = activeQuipIndex !== null ? bonusQuips[activeQuipIndex] : speech

  if (variant === 'logo') {
    return (
      <button
        type="button"
        onClick={handleMascotClick}
        className={`btn group inline-flex items-center gap-1.5 text-left cursor-pointer ${className}`}
        title="Click Gabo for a diary note!"
      >
        <span className="hand text-xl font-bold leading-none text-ink whitespace-nowrap">
          diary of gabo
        </span>
      </button>
    )
  }

  if (variant === 'hero') {
    return (
      <div className={`relative inline-flex flex-col items-center select-none ${className}`}>
        <button
          type="button"
          onClick={handleMascotClick}
          className="relative cursor-pointer group focus-visible:outline-2 bg-transparent border-0 p-0"
          aria-label="Click Gabo character for a fun diary comment"
          title="Tap Gabo!"
        >
          <img
            ref={imgRef}
            src="/images/character/gaboCharacter.png"
            alt="Drawn Wimpy Kid style illustration of Gabo with hands in pockets"
            className="h-[330px] w-auto object-contain drop-shadow-[0_1px_1px_rgba(0,0,0,0.08)]"
          />
        </button>

        {activeQuipIndex !== null && (
          <div
            ref={bubbleRef}
            className="speech-bubble absolute -top-11 right-0 z-30 bg-card px-2.5 py-1 text-ink w-44 shadow-sm pointer-events-none"
          >
            <p className="hand text-sm leading-tight text-ink font-semibold">
              {bonusQuips[activeQuipIndex]}
            </p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`relative flex items-end gap-2.5 select-none ${className}`}>
      <button
        type="button"
        onClick={handleMascotClick}
        className="relative shrink-0 cursor-pointer group focus-visible:outline-2 bg-transparent border-0 p-0"
        aria-label="Click Gabo character for a fun diary comment"
      >
        <img
          ref={imgRef}
          src="/images/character/gaboCharacter.png"
          alt="Drawn Wimpy Kid style illustration of Gabo"
          className="h-28 w-auto object-contain"
        />
        <span className="block hand text-[11px] text-ink-soft text-center -mt-0.5 underline decoration-dashed">
          (tap me!)
        </span>
      </button>

      {activeSpeech && (
        <div
          ref={bubbleRef}
          className="speech-bubble relative bg-card px-2.5 py-1.5 text-ink flex-1 max-w-[230px] mb-4"
        >
          <p className="hand text-base leading-snug text-ink">{activeSpeech}</p>
        </div>
      )}
    </div>
  )
}
