import { useEffect, useState } from 'react'
import { ACHIEVEMENTS, type AchievementEntry } from '../data/portfolioData'
import GaboMascot from './GaboMascot'
import MagazineCutout, {
  type CutoutTapePreset,
  type InspectablePhoto,
} from './MagazineCutout'
import {
  DoodleArrow,
  DoodleCoffee,
  DoodleLaptop,
  DoodleLightning,
  DoodleMusicNotes,
  DoodleStar,
  DoodleTrophy,
  SketchUnderline,
} from './InkDoodles'

interface AchievementsPageProps {
  onInspectPhoto: (photo: InspectablePhoto) => void
}

const PAIR_TAPE_PRESETS: [CutoutTapePreset, CutoutTapePreset][] = [
  ['mixed-top', 'red-corners'],
  ['corners', 'mixed-corners'],
]

/**
 * Reusable 2-Photo Uniform Scrapbook Showcase with Auto-Cycling Carousel.
 * Displays at most 2 uniform-sized torn cutouts at a time and cycles through
 * additional photos automatically (or on click) when an event has > 2 photos.
 */
function AchievementPhotoPairCarousel({
  entry,
  calloutLabel,
  onInspectPhoto,
}: {
  entry: AchievementEntry
  calloutLabel: string
  onInspectPhoto: (photo: InspectablePhoto) => void
}) {
  const totalPhotos = entry.photos.length
  const totalPairs = Math.max(1, Math.ceil(totalPhotos / 2))
  const [pairIndex, setPairIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    if (totalPairs <= 1 || isPaused) return
    const timer = window.setInterval(() => {
      setPairIndex((prev) => (prev + 1) % totalPairs)
    }, 4200)
    return () => window.clearInterval(timer)
  }, [totalPairs, isPaused])

  const startIdx = (pairIndex * 2) % totalPhotos
  const visiblePhotos = [
    entry.photos[startIdx],
    entry.photos[(startIdx + 1) % totalPhotos],
  ]
  const tapePair = PAIR_TAPE_PRESETS[pairIndex % PAIR_TAPE_PRESETS.length]

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative"
    >
      {/* Shared Scrapbook Callout & Carousel Strip with generous bottom margin so top tape never covers text */}
      <div className="flex items-center justify-between mb-3.5 px-0.5">
        <div className="flex items-center gap-1.5">
          <span className="marker text-sm font-black text-crimson -rotate-2 inline-block">
            LOG:
          </span>
          <span className="hand text-sm font-bold text-ink underline decoration-crimson decoration-2 underline-offset-2">
            {calloutLabel}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {totalPairs > 1 && (
            <button
              type="button"
              onClick={() => setPairIndex((prev) => (prev - 1 + totalPairs) % totalPairs)}
              className="btn hand text-xs font-bold px-1.5 py-0.2 bg-card border-2 border-ink rounded-xs cursor-pointer hover:bg-crimson hover:text-paper"
              title="Previous photo pair"
            >
              ◄
            </button>
          )}
          <span className="hand text-xs font-bold text-ink-soft">
            Pics {startIdx + 1}–{Math.min(startIdx + 2, totalPhotos)}/{totalPhotos}
          </span>
          {totalPairs > 1 && (
            <button
              type="button"
              onClick={() => setPairIndex((prev) => (prev + 1) % totalPairs)}
              className="btn hand text-xs font-bold px-1.5 py-0.2 bg-card border-2 border-ink rounded-xs cursor-pointer hover:bg-crimson hover:text-paper"
              title="Next photo pair"
            >
              ►
            </button>
          )}
        </div>
      </div>

      {/* Uniform 2-Column Scrapbook Cutout Pair (identical Y-level, height & width on both pages) */}
      <div className="grid grid-cols-2 gap-4 items-start px-1.5">
        {visiblePhotos.map((photo, slotIdx) => {
          const isRightSlot = slotIdx === 1
          const tilt = isRightSlot ? 1.8 : -1.8
          return (
            <div
              key={`${entry.id}-${photo.src}`}
              className={`relative ${isRightSlot ? 'z-20' : 'z-10'}`}
            >
              <MagazineCutout
                src={photo.src}
                alt={`${entry.title} snapshot ${startIdx + slotIdx + 1}`}
                caption={photo.caption}
                tilt={tilt}
                tapePosition={tapePair[slotIdx]}
                className="w-full"
                imgClassName="w-full h-[92px] object-cover"
                onInspect={onInspectPhoto}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function AchievementsPageLeft({ onInspectPhoto }: AchievementsPageProps) {
  const entry = ACHIEVEMENTS[0]

  return (
    <div className="h-full flex flex-col relative pt-0.5 pb-6">
      {/* Top Section: Header, Summary & 3 Single-Line Bullet Notes */}
      <div>
        <div className="diary-item flex items-start justify-between gap-2">
          <div>
            <h2 className="hand text-[2.4rem] sm:text-[2.65rem] font-bold text-ink leading-none whitespace-nowrap">
              {entry.title}
            </h2>
            <SketchUnderline className="w-40 sm:w-44 h-3 mt-1" color="red" />
          </div>
          <span className="sticker font-bold text-xs tracking-wide shrink-0 mt-1">
            {entry.badgeText}
          </span>
        </div>

        <p className="diary-item hand text-[0.98rem] leading-[1.32] text-ink mt-1.5 min-h-[3.9rem]">
          {entry.summary}
        </p>

        <ul className="diary-item mt-2 space-y-1">
          {entry.bulletNotes.map((note) => (
            <li
              key={note}
              className="hand text-[0.88rem] leading-tight text-ink flex items-center gap-1.5 font-medium whitespace-nowrap"
            >
              <DoodleStar className="w-3.5 h-3.5 shrink-0" variant="red" />
              <span>{note}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Middle Section: Uniform 2-Cutout Scrapbook Pair locked at exact same Y-offset as Page 6 */}
      <div className="diary-item relative mt-3.5">
        <AchievementPhotoPairCarousel
          entry={entry}
          calloutLabel="Cybersecurity & Civic Tech Challenge"
          onInspectPhoto={onInspectPhoto}
        />
      </div>

      {/* Bottom margin notes & doodles pinned to bottom footer zone */}
      <div className="mt-auto flex items-center justify-between pl-2 pr-2 pt-1">
        <div
          className="flex items-center gap-2.5 pointer-events-none select-none"
          aria-hidden="true"
        >
          <DoodleLaptop className="w-12 h-9 -rotate-6" />
          <DoodleMusicNotes color="black" className="w-5 h-5" />
          <DoodleLightning className="w-7 h-6" />
        </div>
        <span className="hand text-xs font-bold text-crimson inline-flex items-center gap-1 pointer-events-none select-none">
          <DoodleArrow color="red" flip={true} className="w-6 h-3.5" />
          <span>tap any clipping to inspect full size</span>
        </span>
      </div>
    </div>
  )
}

export function AchievementsPageRight({ onInspectPhoto }: AchievementsPageProps) {
  const entry = ACHIEVEMENTS[1]

  return (
    <div className="h-full flex flex-col relative pt-0.5 pb-5">
      {/* Top Section: Header, Summary & 3 Single-Line Bullet Notes (Matches Page 5 structure pixel-for-pixel) */}
      <div>
        <div className="diary-item flex items-start justify-between gap-2">
          <div>
            <h2 className="hand text-[2.4rem] sm:text-[2.65rem] font-bold text-ink leading-none whitespace-nowrap">
              AppBuilders PH
            </h2>
            <SketchUnderline className="w-40 sm:w-44 h-3 mt-1" color="red" />
          </div>
          <div className="flex items-center gap-1 bg-crimson px-2.5 py-0.5 ink-pill rotate-1 shrink-0 mt-1">
            <DoodleTrophy className="w-4 h-4" />
            <span className="hand text-xs font-bold text-paper">
              9th Place Winner!
            </span>
          </div>
        </div>

        <p className="diary-item hand text-[0.98rem] leading-[1.32] text-ink mt-1.5 min-h-[3.9rem]">
          {entry.summary}
        </p>

        <ul className="diary-item mt-2 space-y-1">
          {entry.bulletNotes.map((note) => (
            <li
              key={note}
              className="hand text-[0.88rem] leading-tight text-ink flex items-center gap-1.5 font-medium whitespace-nowrap"
            >
              <DoodleStar className="w-3.5 h-3.5 shrink-0" variant="red" />
              <span>{note}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Middle Section: Uniform 2-Cutout Scrapbook Carousel locked at exact same Y-offset as Page 5 */}
      <div className="diary-item relative mt-3.5">
        <AchievementPhotoPairCarousel
          entry={entry}
          calloutLabel="Top 9 out of 281 · 3rd Runner Up!"
          onInspectPhoto={onInspectPhoto}
        />
      </div>

      {/* Bottom Section: Compact Mascot Speech Note with clean vertical clearance below photos */}
      <div className="diary-item mt-auto flex items-center justify-between gap-2 pt-1">
        <GaboMascot
          variant="compact"
          speech="4 competition clippings taped here — watch them cycle or click ◄ ► to flip!"
        />
        <div
          className="flex items-center gap-1.5 pr-16 pointer-events-none select-none"
          aria-hidden="true"
        >
          <DoodleCoffee className="w-6 h-7" />
          <DoodleStar className="w-4 h-4 rotate-12" />
        </div>
      </div>
    </div>
  )
}

export default AchievementsPageLeft