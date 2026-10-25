import { DoodleTape, VerifiedStamp } from './InkDoodles'
import {
  type CutoutTapePreset,
  type InspectablePhoto,
  getCutoutPolygon,
} from './cutoutGeometry'

export type { CutoutTapePreset, InspectablePhoto }

interface MagazineCutoutProps {
  src: string
  alt: string
  caption?: string
  tilt?: number
  imgClassName?: string
  className?: string
  badge?: string
  stampRotate?: number
  tapePosition?: CutoutTapePreset
  variant?: 'default' | 'portrait' | 'shredded'
  priority?: boolean
  link?: string
  onInspect?: (photo: InspectablePhoto) => void
}

export function CutoutTapes({
  preset = 'corners',
  tilt = 0,
  size = 'sm',
}: {
  preset?: CutoutTapePreset
  tilt?: number
  size?: 'sm' | 'lg'
}) {
  if (preset === 'none') return null

  if (size === 'lg') {
    return (
      <>
        {preset === 'top' && (
          <div className="absolute -top-4 sm:-top-5 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
            <DoodleTape rotate={tilt > 0 ? -4 : 3} className="w-28 sm:w-36 h-8 sm:h-10" variant="beige" />
          </div>
        )}

        {preset === 'left-corners' && (
          <>
            <div className="absolute -top-4 sm:-top-5 -left-4 sm:-left-6 z-20 pointer-events-none">
              <DoodleTape rotate={-38} className="w-26 sm:w-32 h-7 sm:h-9" variant="beige" />
            </div>
            <div className="absolute -bottom-4 sm:-bottom-5 -left-4 sm:-left-6 z-20 pointer-events-none">
              <DoodleTape rotate={36} className="w-26 sm:w-32 h-7 sm:h-9" variant="beige" />
            </div>
          </>
        )}

        {preset === 'right-corners' && (
          <>
            <div className="absolute -top-4 sm:-top-5 -right-4 sm:-right-6 z-20 pointer-events-none">
              <DoodleTape rotate={38} className="w-26 sm:w-32 h-7 sm:h-9" variant="beige" />
            </div>
            <div className="absolute -bottom-4 sm:-bottom-5 -right-4 sm:-right-6 z-20 pointer-events-none">
              <DoodleTape rotate={-38} className="w-26 sm:w-32 h-7 sm:h-9" variant="beige" />
            </div>
          </>
        )}

        {preset === 'corners' && (
          <>
            <div className="absolute -top-4 sm:-top-5 -left-4 sm:-left-6 z-20 pointer-events-none">
              <DoodleTape rotate={-34} className="w-26 sm:w-32 h-7 sm:h-9" variant="beige" />
            </div>
            <div className="absolute -bottom-4 sm:-bottom-5 -right-4 sm:-right-6 z-20 pointer-events-none">
              <DoodleTape rotate={-30} className="w-26 sm:w-32 h-7 sm:h-9" variant="beige" />
            </div>
            <div className="absolute -bottom-4 sm:-bottom-5 -left-4 sm:-left-5 z-20 pointer-events-none">
              <DoodleTape rotate={32} className="w-24 sm:w-30 h-7 sm:h-8.5" variant="beige" />
            </div>
          </>
        )}

        {preset === 'portrait' && (
          <>
            <div className="absolute -top-3 sm:-top-4 -left-6 sm:-left-8 z-20 pointer-events-none">
              <DoodleTape rotate={-36} className="w-32 sm:w-40 h-8 sm:h-11" variant="beige" />
            </div>
            <div className="absolute -top-4 sm:-top-5 -right-6 sm:-right-8 z-20 pointer-events-none">
              <DoodleTape rotate={38} className="w-32 sm:w-40 h-8 sm:h-11" variant="beige" />
            </div>
            <div className="absolute -bottom-6 sm:-bottom-7 left-4 sm:left-6 z-20 pointer-events-none">
              <DoodleTape rotate={-28} className="w-28 sm:w-36 h-8 sm:h-10" variant="beige" />
            </div>
            <div className="absolute -bottom-4 sm:-bottom-5 -right-6 sm:-right-8 z-20 pointer-events-none">
              <DoodleTape rotate={-44} className="w-30 sm:w-38 h-8 sm:h-10.5" variant="beige" />
            </div>
          </>
        )}

        {preset === 'mixed-top' && (
          <>
            <div className="absolute -top-4 sm:-top-5 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
              <DoodleTape rotate={-2} className="w-28 sm:w-36 h-8 sm:h-10" variant="red" />
            </div>
            <div className="absolute -top-4 sm:-top-5 -right-4 sm:-right-6 z-20 pointer-events-none">
              <DoodleTape rotate={30} className="w-24 sm:w-30 h-7 sm:h-8.5" variant="beige" />
            </div>
            <div className="absolute -bottom-4 sm:-bottom-5 -left-4 sm:-left-6 z-20 pointer-events-none">
              <DoodleTape rotate={34} className="w-24 sm:w-30 h-7 sm:h-8.5" variant="beige" />
            </div>
          </>
        )}

        {preset === 'mixed-corners' && (
          <>
            <div className="absolute -top-4 sm:-top-5 -left-4 sm:-left-6 z-20 pointer-events-none">
              <DoodleTape rotate={-32} className="w-24 sm:w-30 h-7 sm:h-8.5" variant="beige" />
            </div>
            <div className="absolute -top-4 sm:-top-5 -right-4 sm:-right-6 z-20 pointer-events-none">
              <DoodleTape rotate={34} className="w-24 sm:w-30 h-7 sm:h-8.5" variant="red" />
            </div>
            <div className="absolute -bottom-4 sm:-bottom-5 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
              <DoodleTape rotate={2} className="w-26 sm:w-32 h-7 sm:h-9" variant="beige" />
            </div>
          </>
        )}

        {preset === 'red-corners' && (
          <>
            <div className="absolute -top-4 sm:-top-5 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
              <DoodleTape rotate={2} className="w-28 sm:w-36 h-8 sm:h-10" variant="red" />
            </div>
            <div className="absolute -bottom-4 sm:-bottom-5 -left-4 sm:-left-5 z-20 pointer-events-none">
              <DoodleTape rotate={32} className="w-24 sm:w-30 h-7 sm:h-8.5" variant="red" />
            </div>
            <div className="absolute -bottom-4 sm:-bottom-5 -right-4 sm:-right-5 z-20 pointer-events-none">
              <DoodleTape rotate={-32} className="w-24 sm:w-30 h-7 sm:h-8.5" variant="red" />
            </div>
          </>
        )}
      </>
    )
  }

  // size === 'sm' (for inline cutouts)
  return (
    <>
      {tapePositionPreset(preset, tilt)}
    </>
  )
}

function tapePositionPreset(preset: CutoutTapePreset, tilt: number) {
  switch (preset) {
    case 'top':
      return (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <DoodleTape rotate={tilt > 0 ? -4 : 3} className="w-16 h-5" variant="beige" />
        </div>
      )
    case 'left-corners':
      return (
        <>
          <div className="absolute -top-2.5 -left-3 z-20 pointer-events-none">
            <DoodleTape rotate={-38} className="w-15 h-4.5" variant="beige" />
          </div>
          <div className="absolute -bottom-2.5 -left-3 z-20 pointer-events-none">
            <DoodleTape rotate={36} className="w-15 h-4.5" variant="beige" />
          </div>
        </>
      )
    case 'right-corners':
      return (
        <>
          <div className="absolute -top-2.5 -right-3 z-20 pointer-events-none">
            <DoodleTape rotate={38} className="w-15 h-4.5" variant="beige" />
          </div>
          <div className="absolute -bottom-2.5 -right-3 z-20 pointer-events-none">
            <DoodleTape rotate={-38} className="w-15 h-4.5" variant="beige" />
          </div>
        </>
      )
    case 'corners':
      return (
        <>
          <div className="absolute -top-2.5 -left-3 z-20 pointer-events-none">
            <DoodleTape rotate={-34} className="w-15 h-4.5" variant="beige" />
          </div>
          <div className="absolute -bottom-2.5 -right-3 z-20 pointer-events-none">
            <DoodleTape rotate={-30} className="w-15 h-4.5" variant="beige" />
          </div>
          <div className="absolute -bottom-2.5 -left-2.5 z-20 pointer-events-none">
            <DoodleTape rotate={32} className="w-14 h-4" variant="beige" />
          </div>
        </>
      )
    case 'portrait':
      return (
        <>
          <div className="absolute -top-1 -left-5 z-20 pointer-events-none">
            <DoodleTape rotate={-36} className="w-22 h-6" variant="beige" />
          </div>
          <div className="absolute -top-2 -right-5 z-20 pointer-events-none">
            <DoodleTape rotate={38} className="w-22 h-6" variant="beige" />
          </div>
          <div className="absolute -bottom-4 left-2 z-20 pointer-events-none">
            <DoodleTape rotate={-28} className="w-18 h-5.5" variant="beige" />
          </div>
          <div className="absolute -bottom-2 -right-5 z-20 pointer-events-none">
            <DoodleTape rotate={-44} className="w-20 h-5.5" variant="beige" />
          </div>
        </>
      )
    case 'mixed-top':
      return (
        <>
          <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
            <DoodleTape rotate={-2} className="w-16 h-4.5" variant="red" />
          </div>
          <div className="absolute -top-2 -right-3 z-20 pointer-events-none">
            <DoodleTape rotate={30} className="w-14 h-4" variant="beige" />
          </div>
          <div className="absolute -bottom-2.5 -left-3 z-20 pointer-events-none">
            <DoodleTape rotate={34} className="w-14 h-4" variant="beige" />
          </div>
        </>
      )
    case 'mixed-corners':
      return (
        <>
          <div className="absolute -top-2.5 -left-3 z-20 pointer-events-none">
            <DoodleTape rotate={-32} className="w-14 h-4" variant="beige" />
          </div>
          <div className="absolute -top-2.5 -right-3 z-20 pointer-events-none">
            <DoodleTape rotate={34} className="w-14 h-4" variant="red" />
          </div>
          <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
            <DoodleTape rotate={2} className="w-15 h-4" variant="beige" />
          </div>
        </>
      )
    case 'red-corners':
      return (
        <>
          <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
            <DoodleTape rotate={2} className="w-16 h-4.5" variant="red" />
          </div>
          <div className="absolute -bottom-2.5 -left-2.5 z-20 pointer-events-none">
            <DoodleTape rotate={32} className="w-14 h-4" variant="red" />
          </div>
          <div className="absolute -bottom-2.5 -right-2.5 z-20 pointer-events-none">
            <DoodleTape rotate={-32} className="w-14 h-4" variant="red" />
          </div>
        </>
      )
    default:
      return null
  }
}

export default function MagazineCutout({
  src,
  alt,
  caption,
  tilt = -1.8,
  imgClassName = 'w-full h-36 object-cover',
  className = '',
  badge,
  stampRotate = -14,
  tapePosition = 'corners',
  variant = 'default',
  priority = false,
  link,
  onInspect,
}: MagazineCutoutProps) {
  const handleClick = () => {
    if (onInspect) {
      onInspect({
        src,
        title: alt,
        caption,
        link,
        tilt,
        variant,
        tapePosition,
        badge,
        stampRotate,
      })
    }
  }

  const polyPoints = getCutoutPolygon(src, variant)

  return (
    <figure
      className={`magazine-cutout group relative inline-block select-none ${
        onInspect ? 'cursor-pointer' : ''
      } ${className}`}
      style={{ transform: `rotate(${tilt}deg)` }}
      onClick={onInspect ? handleClick : undefined}
      role={onInspect ? 'button' : undefined}
      tabIndex={onInspect ? 0 : undefined}
      onKeyDown={
        onInspect
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                handleClick()
              }
            }
          : undefined
      }
      aria-label={onInspect ? `View cutout: ${caption || alt}` : undefined}
    >
      {/* Realistic torn magazine/photo paper backing SVG */}
      <svg
        viewBox="0 0 200 200"
        preserveAspectRatio="none"
        className={`absolute ${
          variant === 'portrait'
            ? '-inset-3 w-[calc(100%+24px)] h-[calc(100%+24px)]'
            : '-inset-2 w-[calc(100%+16px)] h-[calc(100%+16px)]'
        } pointer-events-none z-0 drop-shadow-[1px_3px_5px_rgba(17,17,17,0.3)]`}
        aria-hidden="true"
      >
        <polygon
          points={polyPoints}
          fill="#fcfaf5"
          stroke="#4a453d"
          strokeWidth="0.9"
          strokeLinejoin="round"
        />
        {variant === 'portrait' && (
          /* Hand-drawn diagonal ink scratch marks on the left edge of the portrait cutout */
          <path
            d="M4 74 L18 148 M9 78 L22 142"
            stroke="#111111"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        )}
      </svg>

      {/* Frayed Masking Tape Configurations */}
      <CutoutTapes preset={tapePosition} tilt={tilt} size="sm" />

      {/* Hand-drawn red rubber ink stamp (e.g. VERIFIED on Certificates) */}
      {badge && (
        <div className="absolute bottom-2 right-1 z-20 pointer-events-none">
          <VerifiedStamp text={badge} rotate={stampRotate} />
        </div>
      )}

      {/* Actual photograph inside the torn paper scrap */}
      <div className={`relative z-10 ${variant === 'portrait' ? 'p-1' : 'p-1'}`}>
        <img
          src={src}
          alt={alt}
          style={
            variant === 'portrait'
              ? {
                  clipPath:
                    'polygon(14% 2%, 84% 1%, 96% 20%, 99% 92%, 88% 96%, 58% 98%, 28% 96%, 4% 94%, 5% 22%)',
                }
              : undefined
          }
          className={`${imgClassName} block`}
          loading="eager"
          fetchPriority={priority ? 'high' : 'auto'}
        />
        {caption && (
          <figcaption className="hand text-ink text-center text-base leading-tight pt-1.5 pb-0.5 px-1 font-bold">
            {caption}
          </figcaption>
        )}
      </div>
    </figure>
  )
}
