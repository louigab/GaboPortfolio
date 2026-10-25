import { useEffect, useRef } from 'react'
import type { InspectablePhoto } from './cutoutGeometry'
import { getCutoutPolygon } from './cutoutGeometry'
import { CutoutTapes } from './MagazineCutout'
import { VerifiedStamp } from './InkDoodles'

interface CutoutModalProps {
  photo: InspectablePhoto | null
  onClose: () => void
}

export default function CutoutModal({ photo, onClose }: CutoutModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (photo) {
      if (!dialog.open) {
        dialog.showModal()
      }
    } else if (dialog.open) {
      dialog.close()
    }
  }, [photo])

  // Handle native dialog close event (e.g. Esc key or light dismiss)
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    const handleClose = () => {
      onClose()
    }

    dialog.addEventListener('close', handleClose)
    return () => {
      dialog.removeEventListener('close', handleClose)
    }
  }, [onClose])

  if (!photo) return null

  const polyPoints = getCutoutPolygon(photo.src, photo.variant)
  const isPortrait = photo.variant === 'portrait'
  // Subtle organic tilt (clamped to ±1.2deg so rectangular margins stay tight & clean)
  const tiltDeg = photo.tilt != null ? Math.max(-1.2, Math.min(1.2, photo.tilt * 0.4)) : 0
  const hasTextOrLink = Boolean(photo.caption || photo.link)

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="cutout-dialog-caption"
      className="cutout-dialog fixed inset-0 w-full h-[100dvh] max-w-none max-h-none m-0 p-4 sm:p-6 md:p-8 bg-transparent border-0 outline-none flex items-center justify-center overflow-hidden backdrop:bg-ink/75 pointer-events-auto select-none"
      onClick={(e) => {
        // Dismiss if clicking directly on dialog backdrop outside the card
        if (e.target === dialogRef.current) {
          onClose()
        }
      }}
    >
      {/* Full-screen backdrop click dismiss layer */}
      <div
        className="absolute inset-0 w-full h-full -z-10"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Floating Close [Esc] button - pinned in upper-right corner of viewport */}
      <div className="fixed top-3.5 right-3.5 sm:top-5 sm:right-6 z-50 pointer-events-auto">
        <button
          type="button"
          onClick={onClose}
          className="btn hand text-sm sm:text-base font-bold px-3.5 py-1.5 bg-crimson text-paper ink-pill cursor-pointer -rotate-2 hover:scale-105 transition-transform shadow-[2px_3px_8px_rgba(0,0,0,0.55)]"
          aria-label="Close dialog"
        >
          Close [Esc]
        </button>
      </div>

      <h2 id="cutout-dialog-caption" className="sr-only">
        {photo.caption || photo.title || 'Scrapbook clipping'}
      </h2>

      {/* Perfectly centered wrapper constrained to viewport with generous breathing room */}
      <div
        className="cutout-card relative z-10 flex items-center justify-center max-w-[min(90vw,680px)] max-h-[min(82dvh,82vh)] p-2 sm:p-4 pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <figure
          className="magazine-cutout relative flex flex-col items-center select-none max-w-full max-h-full"
          style={{
            transform: tiltDeg !== 0 ? `rotate(${tiltDeg}deg)` : undefined,
          }}
        >
          {/* Torn Paper Scrap Backing SVG */}
          <svg
            viewBox="0 0 200 200"
            preserveAspectRatio="none"
            className={`absolute ${
              isPortrait
                ? '-inset-3.5 sm:-inset-4.5 w-[calc(100%+28px)] sm:w-[calc(100%+36px)] h-[calc(100%+28px)] sm:h-[calc(100%+36px)]'
                : '-inset-3 sm:-inset-4 w-[calc(100%+24px)] sm:w-[calc(100%+32px)] h-[calc(100%+24px)] sm:h-[calc(100%+32px)]'
            } pointer-events-none z-0 drop-shadow-[3px_6px_14px_rgba(17,17,17,0.45)]`}
            aria-hidden="true"
          >
            <polygon
              points={polyPoints}
              fill="#fcfaf5"
              stroke="#4a453d"
              strokeWidth="0.9"
              strokeLinejoin="round"
            />
            {isPortrait && (
              <path
                d="M4 74 L18 148 M9 78 L22 142"
                stroke="#111111"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            )}
          </svg>

          {/* Masking tape configuration scaled proportionately */}
          <CutoutTapes
            preset={photo.tapePosition ?? 'corners'}
            tilt={photo.tilt ?? 0}
            size="lg"
          />

          {/* Red rubber ink stamp badge (e.g. VERIFIED on Certificates) */}
          {photo.badge && (
            <div className="absolute bottom-3 right-2.5 z-20 pointer-events-none">
              <VerifiedStamp text={photo.badge} rotate={photo.stampRotate ?? -14} />
            </div>
          )}

          {/* Photograph + Caption container inside paper scrap */}
          <div className="relative z-10 flex flex-col items-center max-w-full max-h-full p-1.5 sm:p-2 min-h-0">
            {/* Image box: dynamically scales to ensure whole cutout + text fits inside screen */}
            <div className="flex-1 min-h-0 flex items-center justify-center overflow-hidden">
              <img
                src={photo.src}
                alt={photo.title || photo.caption || 'Cutout image'}
                className={`w-auto max-w-full object-contain block ${
                  hasTextOrLink
                    ? 'max-h-[44vh] sm:max-h-[48vh] md:max-h-[52vh]'
                    : 'max-h-[58vh] sm:max-h-[64vh] md:max-h-[68vh]'
                }`}
              />
            </div>

            {/* Handwritten Caption directly below photo */}
            {photo.caption && (
              <figcaption className="hand text-ink text-center text-sm sm:text-base md:text-lg leading-snug pt-2 sm:pt-2.5 pb-0.5 px-3 font-bold select-text max-w-xl mx-auto break-words shrink-0">
                {photo.caption}
              </figcaption>
            )}

            {/* Optional Project Site Sticker */}
            {photo.link && (
              <div className="flex justify-center mt-2 pb-0.5 shrink-0">
                <a
                  href={photo.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn tech-sticker tech-sticker-active hand text-xs sm:text-sm font-bold inline-flex items-center gap-1 px-3 py-1 -rotate-1 shadow-xs cursor-pointer hover:scale-105 transition-transform"
                >
                  <span>Visit Project Site ↗</span>
                </a>
              </div>
            )}
          </div>
        </figure>
      </div>
    </dialog>
  )
}
