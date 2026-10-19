import { DoodleTape, VerifiedStamp } from './InkDoodles'

export interface InspectablePhoto {
  src: string
  title: string
  caption: string
}

export type CutoutTapePreset =
  | 'top'
  | 'corners'
  | 'left-corners'
  | 'right-corners'
  | 'portrait'
  | 'mixed-top'
  | 'mixed-corners'
  | 'red-corners'
  | 'none'

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
  onInspect?: (photo: InspectablePhoto) => void
}

// Realistic paper cutout with slightly rough cut sides/top and ragged torn bottom edge
const REALISTIC_TORN_POLYGONS = [
  '2,3 38,1.5 79,2.5 124,1 165,2.5 198,2 199,52 197.5,108 199,164 198,189 185,194 171,189 156,196 140,190 123,197 106,191 89,198 72,191 55,197 38,191 21,196 4,190 1.5,142 2.5,88 1,36',
  '1.5,2.5 42,1 88,3 134,1.5 174,3 198.5,2 197.5,58 199,116 197.5,172 198.5,191 184,196 168,190 151,197 134,191 117,198 99,191 82,197 65,190 48,197 31,190 15,196 2,191 2.5,138 1,78',
]

// Extra-ragged top & bottom torn certificate/newspaper cutout
const SHREDDED_TORN_POLYGON =
  '3,6 18,2 34,7 52,2 71,6 90,1 110,6 129,2 148,6 167,2 184,6 198,3 196,48 199,96 196,144 198,191 183,196 167,191 150,197 132,191 114,198 96,191 78,197 60,191 42,197 24,191 6,195 2,146 4,94 1,42'

// Angled corner-cut portrait backing matching Page 1 reference
const PORTRAIT_TORN_POLYGON =
  '34,5 68,2 104,4 138,2 166,14 188,42 195,88 198,142 199,182 176,191 148,188 118,195 88,190 58,196 32,190 12,186 15,138 10,88 14,44'

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
  onInspect,
}: MagazineCutoutProps) {
  const handleClick = () => {
    if (onInspect) {
      onInspect({
        src,
        title: alt,
        caption: caption || alt,
      })
    }
  }

  const polyPoints =
    variant === 'portrait'
      ? PORTRAIT_TORN_POLYGON
      : variant === 'shredded'
        ? SHREDDED_TORN_POLYGON
        : REALISTIC_TORN_POLYGONS[src.length % REALISTIC_TORN_POLYGONS.length]

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
      {tapePosition === 'top' && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <DoodleTape rotate={tilt > 0 ? -4 : 3} className="w-16 h-5" variant="beige" />
        </div>
      )}

      {tapePosition === 'left-corners' && (
        <>
          <div className="absolute -top-2.5 -left-3 z-20 pointer-events-none">
            <DoodleTape rotate={-38} className="w-15 h-4.5" variant="beige" />
          </div>
          <div className="absolute -bottom-2.5 -left-3 z-20 pointer-events-none">
            <DoodleTape rotate={36} className="w-15 h-4.5" variant="beige" />
          </div>
        </>
      )}

      {tapePosition === 'right-corners' && (
        <>
          <div className="absolute -top-2.5 -right-3 z-20 pointer-events-none">
            <DoodleTape rotate={38} className="w-15 h-4.5" variant="beige" />
          </div>
          <div className="absolute -bottom-2.5 -right-3 z-20 pointer-events-none">
            <DoodleTape rotate={-38} className="w-15 h-4.5" variant="beige" />
          </div>
        </>
      )}

      {tapePosition === 'corners' && (
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
      )}

      {tapePosition === 'portrait' && (
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
      )}

      {tapePosition === 'mixed-top' && (
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
      )}

      {tapePosition === 'mixed-corners' && (
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
      )}

      {tapePosition === 'red-corners' && (
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
      )}

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
          <figcaption className="hand text-ink text-center text-sm sm:text-base leading-tight pt-1.5 pb-0.5 px-1 font-bold">
            {caption}
          </figcaption>
        )}
      </div>
    </figure>
  )
}
