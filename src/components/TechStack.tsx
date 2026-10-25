import { TECH_GROUPS, type TechItem } from '../data/portfolioData'
import GaboMascot from './GaboMascot'
import {
  DoodleArrow,
  DoodleCodeBrackets,
  DoodleCoffee,
  DoodleLaptop,
  DoodleLightning,
  DoodleStar,
  SketchUnderline,
} from './InkDoodles'

interface TechStackPageProps {
  selectedTech: TechItem
  onSelectTech: (item: TechItem) => void
  isDesktop?: boolean
}

const STICKER_TILTS = [-1.6, 1.3, -0.9, 1.8, -1.2, 0.8, -1.9, 1.1]

function CategoryDoodleMarker({ title }: { title: string }) {
  if (title.includes('Frontend')) {
    return (
      <span className="marker text-crimson text-lg font-bold tracking-tight">
        &lt;/&gt;
      </span>
    )
  }
  if (title.includes('Mobile')) {
    return (
      <span className="marker text-crimson text-lg font-bold tracking-tight">
        [app]
      </span>
    )
  }
  if (title.includes('Backend')) {
    return (
      <span className="marker text-crimson text-lg font-bold tracking-tight">
        &#123;api&#125;
      </span>
    )
  }
  if (title.includes('AI')) {
    return (
      <span className="marker text-crimson text-lg font-bold tracking-tight">
        (ai)
      </span>
    )
  }
  if (title.includes('Databases')) {
    return (
      <span className="marker text-crimson text-lg font-bold tracking-tight">
        (sql)
      </span>
    )
  }
  if (title.includes('Game')) {
    return (
      <span className="marker text-crimson text-lg font-bold tracking-tight">
        +2D+
      </span>
    )
  }
  return (
    <span className="marker text-crimson text-lg font-bold tracking-tight">
      git*
    </span>
  )
}

export function TechStackPageLeft({
  selectedTech,
  onSelectTech,
  isDesktop = true,
}: TechStackPageProps) {
  const leftGroups = TECH_GROUPS.filter((g) => g.page === 1)

  return (
    <div className="h-full flex flex-col justify-between relative pt-0.5 pb-6">
      {/* Margin Developer Doodles (out of flex flow) */}
      <div className="absolute inset-0 pointer-events-none select-none" aria-hidden="true">
        <DoodleLaptop className="w-15 h-12 absolute right-0 top-0 -rotate-6 opacity-90" />
        <DoodleStar className="w-5 h-5 absolute right-17 top-1.5 rotate-12" />
      </div>

      <div>
        <div className="diary-item">
          <h2 className="hand text-[2.65rem] font-bold text-ink leading-none whitespace-nowrap">
            Tech Arsenal
          </h2>
          <SketchUnderline className="w-44 h-3 mt-1" color="red" />
        </div>

        <p className="diary-item hand text-[0.98rem] leading-tight text-ink-soft mt-1.5">
          Everything I reach for to build and ship:
        </p>

        {/* Groups for Page 3 written directly on the ruled paper (NO wrapper boxes) */}
        <div className="mt-3 space-y-3">
          {leftGroups.map((group) => (
            <div key={group.title} className="diary-item">
              <div className="inline-flex items-center gap-2 mb-1">
                <CategoryDoodleMarker title={group.title} />
                <div>
                  <h3 className="hand text-2xl font-bold text-ink leading-none">
                    {group.title}
                  </h3>
                  <SketchUnderline className="w-full h-2 mt-0.5" color="red" />
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {group.items.map((item, idx) => {
                  const isSelected = selectedTech.name === item.name
                  const tilt = STICKER_TILTS[idx % STICKER_TILTS.length]
                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => onSelectTech(item)}
                      style={{ transform: `rotate(${tilt}deg)` }}
                      className={`btn tech-sticker hand text-base cursor-pointer ${
                        isSelected
                          ? 'tech-sticker-active font-bold'
                          : 'tech-sticker-idle font-semibold'
                      }`}
                    >
                      {isSelected && <span className="text-xs">★</span>}
                      <span>{item.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom margin note & coffee doodle positioned cleanly in open footer zone */}
      <div className="diary-item flex items-center justify-between pt-1 pr-1">
        {isDesktop ? (
          <span className="inline-flex items-center gap-1.5 hand text-xs font-bold text-crimson ml-auto mr-3 pointer-events-none select-none">
            <span>tap any sticker to read Gabo&apos;s note on p. 4</span>
            <DoodleArrow color="red" className="w-6 h-3.5" />
          </span>
        ) : (
          <p className="hand text-sm leading-tight text-ink max-w-[340px]">
            <strong className="text-crimson underline">{selectedTech.name}:</strong>{' '}
            {selectedTech.note}
          </p>
        )}
        <DoodleCoffee className="w-7 h-8 rotate-6 opacity-85 pointer-events-none select-none shrink-0 ml-auto" />
      </div>
    </div>
  )
}

export function TechStackPageRight({
  selectedTech,
  onSelectTech,
}: TechStackPageProps) {
  const rightGroups = TECH_GROUPS.filter((g) => g.page === 2)
  const totalTools = TECH_GROUPS.reduce((n, g) => n + g.items.length, 0)

  return (
    <div className="h-full flex flex-col justify-between relative pt-0.5 pb-5">
      {/* Margin Doodles (out of flex flow) */}
      <div className="absolute inset-0 pointer-events-none select-none" aria-hidden="true">
        <DoodleCodeBrackets
          variant="slash"
          className="w-10 h-6 absolute right-1 top-32 rotate-6 opacity-85"
        />
        <DoodleLightning className="w-9 h-7 absolute right-2 bottom-24 -rotate-6 opacity-85" />
      </div>

      <div>
        <div className="diary-item flex items-start justify-between gap-2">
          <div>
            <h2 className="hand text-[2.65rem] font-bold text-ink leading-none whitespace-nowrap">
              Tech Arsenal
            </h2>
            <SketchUnderline className="w-44 h-3 mt-1" color="red" />
          </div>
          <div className="flex items-center gap-1 bg-crimson px-3 py-0.5 ink-pill -rotate-2 shrink-0 mt-1">
            <DoodleStar className="w-4 h-4" variant="outline" />
            <span className="hand text-base font-bold text-paper">
              {totalTools} Tools Logged
            </span>
          </div>
        </div>

        <p className="diary-item hand text-[0.98rem] leading-tight text-ink-soft mt-1.5">
          Lots more where those came from:
        </p>

        {/* Groups for Page 4 written directly on the ruled paper (NO wrapper boxes) */}
        <div className="mt-3 space-y-2.5">
          {rightGroups.map((group) => (
            <div key={group.title} className="diary-item">
              <div className="inline-flex items-center gap-2 mb-1">
                <CategoryDoodleMarker title={group.title} />
                <div>
                  <h3 className="hand text-2xl font-bold text-ink leading-none">
                    {group.title}
                  </h3>
                  <SketchUnderline className="w-full h-2 mt-0.5" color="red" />
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {group.items.map((item, idx) => {
                  const isSelected = selectedTech.name === item.name
                  const tilt = STICKER_TILTS[(idx + 3) % STICKER_TILTS.length]
                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => onSelectTech(item)}
                      style={{ transform: `rotate(${tilt}deg)` }}
                      className={`btn tech-sticker hand text-base cursor-pointer ${
                        isSelected
                          ? 'tech-sticker-active font-bold'
                          : 'tech-sticker-idle font-semibold'
                      }`}
                    >
                      {isSelected && <span className="text-xs">★</span>}
                      <span>{item.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Live interactive mascot at bottom of Page 4 */}
      <div className="mt-1 pb-1 flex items-end justify-between gap-2">
        <GaboMascot
          variant="compact"
          speech={`${selectedTech.name}: ${selectedTech.note}`}
        />

      </div>
    </div>
  )
}

export default TechStackPageLeft