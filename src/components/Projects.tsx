import { PROJECTS, type ProjectEntry } from '../data/portfolioData'
import MagazineCutout, {
  type CutoutTapePreset,
  type InspectablePhoto,
} from './MagazineCutout'
import {
  DoodleArrow,
  DoodleCodeBrackets,
  DoodleCoffee,
  DoodleLaptop,
  DoodleStar,
  SketchUnderline,
} from './InkDoodles'

interface ProjectsPageProps {
  onInspectPhoto: (photo: InspectablePhoto) => void
}

const TAPE_PRESETS: CutoutTapePreset[] = [
  'mixed-top',
  'corners',
  'red-corners',
]

function ProjectScrapbookList({
  items,
  onInspectPhoto,
  pageOffset = 0,
}: {
  items: ProjectEntry[]
  onInspectPhoto: (photo: InspectablePhoto) => void
  pageOffset?: number
}) {
  return (
    <div className="mt-1.5 flex-1 flex flex-col justify-between pb-1">
      {items.map((proj, idx) => {
        const isReversed = (idx + pageOffset) % 2 === 1
        const tapePreset = TAPE_PRESETS[(idx + pageOffset) % TAPE_PRESETS.length]
        const isCrimsonTag = (idx + pageOffset) % 2 === 0

        return (
          <article
            key={proj.id}
            className={`diary-item relative flex items-center gap-3 px-1 py-0 ${
              isReversed ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            {/* Taped shredded-paper screenshot cutout */}
            <div className="w-[116px] shrink-0">
              <MagazineCutout
                src={proj.img}
                alt={proj.title}
                tilt={proj.tilt}
                tapePosition={tapePreset}
                className="w-full"
                imgClassName="w-full h-[68px] object-cover"
                onInspect={() =>
                  onInspectPhoto({
                    src: proj.img,
                    title: proj.title,
                    caption: `${proj.desc} (${proj.tech.join(', ')})`,
                  })
                }
              />
            </div>

            {/* Handwritten annotations directly on the ruled notebook paper (no outer frames) */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1.5">
                <div className="min-w-0 shrink">
                  <h3 className="hand text-lg font-bold text-ink leading-tight">
                    {proj.title}
                  </h3>
                  <SketchUnderline className="w-full h-1.5 mt-0.5" color="red" />
                </div>

                <span
                  className={`hand text-[11px] font-bold px-1.5 py-0.5 border-2 border-ink rounded-xs shrink-0 whitespace-nowrap ${
                    isCrimsonTag
                      ? 'bg-crimson text-paper -rotate-2'
                      : 'bg-ink text-paper rotate-2'
                  }`}
                >
                  {proj.category}
                </span>
              </div>

              <p className="hand text-[0.84rem] leading-[1.14] text-ink mt-0.5">
                {proj.desc}
              </p>

              {/* Handwritten margin note + tech tags */}
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                <span className="hand text-[11.5px] font-bold text-crimson inline-flex items-center gap-1">
                  <DoodleArrow
                    color="red"
                    flip={!isReversed}
                    className="w-4 h-2.5 shrink-0"
                  />
                  <span>{proj.note}</span>
                </span>
              </div>

              <div className="flex flex-wrap gap-1 mt-0">
                {proj.tech.map((t) => (
                  <span
                    key={t}
                    className="hand text-[11px] font-bold text-ink-soft"
                  >
                    [{t}]
                  </span>
                ))}
              </div>
            </div>
          </article>
        )
      })}
    </div>
  )
}

export function ProjectsPageLeft({ onInspectPhoto }: ProjectsPageProps) {
  const firstHalf = PROJECTS.slice(0, 3)

  return (
    <div className="h-full flex flex-col relative pt-0.5 pb-3">
      {/* Margin Doodles (out of flex flow) */}
      <div className="absolute inset-0 pointer-events-none select-none" aria-hidden="true">
        <DoodleCodeBrackets
          variant="slash"
          className="w-10 h-6 absolute right-1 top-1 -rotate-6 opacity-90"
        />
        <DoodleStar className="w-5 h-5 absolute right-13 top-2 rotate-12" />
      </div>

      <div className="flex-1 flex flex-col">
        <div className="diary-item">
          <h2 className="hand text-[2.25rem] sm:text-[2.5rem] font-bold text-ink leading-none whitespace-nowrap">
            Shipped Work
          </h2>
          <SketchUnderline className="w-40 sm:w-44 h-3 mt-0.5" color="red" />
        </div>
        <p className="diary-item hand text-[0.98rem] leading-tight text-ink-soft mt-1">
          Torn screenshots taped on the lines (tap to zoom):
        </p>

        <ProjectScrapbookList
          items={firstHalf}
          onInspectPhoto={onInspectPhoto}
          pageOffset={0}
        />
      </div>
    </div>
  )
}

export function ProjectsPageRight({ onInspectPhoto }: ProjectsPageProps) {
  const secondHalf = PROJECTS.slice(3, 6)

  return (
    <div className="h-full flex flex-col relative pt-0.5 pb-3">
      {/* Margin Doodles (out of flex flow) */}
      <div className="absolute inset-0 pointer-events-none select-none" aria-hidden="true">
        <DoodleLaptop className="w-14 h-11 absolute right-1 top-0 rotate-6 opacity-90" />
        <DoodleCoffee className="w-7 h-8 absolute right-17 top-1 -rotate-6 opacity-85" />
      </div>

      <div className="flex-1 flex flex-col">
        <div className="diary-item">
          <h2 className="hand text-[2.25rem] sm:text-[2.5rem] font-bold text-ink leading-none whitespace-nowrap">
            More Builds
          </h2>
          <SketchUnderline className="w-40 sm:w-44 h-3 mt-0.5" color="red" />
        </div>
        <p className="diary-item hand text-[0.98rem] leading-tight text-ink-soft mt-1">
          Flutter apps, a Godot game, and more (tap to zoom):
        </p>

        <ProjectScrapbookList
          items={secondHalf}
          onInspectPhoto={onInspectPhoto}
          pageOffset={1}
        />
      </div>
    </div>
  )
}

export default ProjectsPageLeft