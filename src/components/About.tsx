import MagazineCutout, { type InspectablePhoto } from './MagazineCutout'
import { DoodleLightning, RedStrikethrough, SketchUnderline } from './InkDoodles'

interface AboutProps {
  onGoToPage: (pageIndex: number) => void
  onInspectPhoto: (photo: InspectablePhoto) => void
}

export default function About({ onInspectPhoto }: AboutProps) {
  return (
    <div className="h-full flex flex-col justify-between relative pt-0.5 pb-6">
      <div>
        {/* Uniform Page Heading with red double marker underline */}
        <div className="diary-item">
          <h2 className="hand text-[2.4rem] sm:text-[2.65rem] font-bold text-ink leading-none whitespace-nowrap">
            About Me
          </h2>
          <SketchUnderline className="w-40 sm:w-44 h-3 mt-1" color="red" />
        </div>

        {/* About Me Copy directly on the notebook lines (fits on 3 lines) */}
        <p className="diary-item hand text-base sm:text-[1.1rem] leading-[1.35] text-ink mt-1.5">
          My full name is Louis Gabriel D. Damondamon, though everyone calls me{' '}
          <span className="red-marker-box">gabo.</span> I love exploring new tech and
          bringing cool ideas to life through code.
        </p>

        {/* "What I actually do:" written directly on the lines (NO UI container box) */}
        <div className="diary-item mt-2.5">
          <div className="inline-block">
            <h3 className="hand text-xl sm:text-[1.55rem] font-bold text-ink leading-none">
              What I actually do:
            </h3>
            <SketchUnderline className="w-full h-2 mt-0.5" color="red" />
          </div>

          <ol className="mt-1.5 space-y-1 hand text-base sm:text-[1.1rem] leading-[1.28] text-ink list-none pl-1.5">
            <li className="flex items-baseline gap-1.5">
              <span className="shrink-0 font-bold">1.</span>
              <span>
                <RedStrikethrough>Fix my sleep schedule</RedStrikethrough> Build apps,
                games, and cool stuff from scratch
              </span>
            </li>
            <li className="flex items-baseline gap-1.5">
              <span className="shrink-0 font-bold">2.</span>
              <span>
                <RedStrikethrough>Touch grass</RedStrikethrough> Mess around with new tech
                and figure out how things work
              </span>
            </li>
            <li className="flex items-center gap-1.5">
              <span className="shrink-0 font-bold">3.</span>
              <span className="inline-flex items-center flex-wrap gap-1.5">
                <span>Play the guitar way too loud</span>
                <DoodleLightning className="w-8 h-7 inline-block -mt-1 shrink-0" />
              </span>
            </li>
            <li className="flex items-baseline gap-1.5">
              <span className="shrink-0 font-bold">4.</span>
              <span>Team up with friends for hackathons</span>
            </li>
          </ol>
        </div>
      </div>

      {/* Bottom section: Uniform landscape scrapbook clippings with clear tape separation */}
      <div className="diary-item pb-1">
        <div className="flex items-center justify-between mb-3.5 px-0.5">
          <span className="hand text-base sm:text-[1.06rem] font-bold text-ink underline decoration-crimson decoration-2 underline-offset-3">
            Recent Scrapbook Clippings:
          </span>
          <span className="hand text-xs font-bold text-ink-soft">
            (tap clipping to zoom)
          </span>
        </div>

        <div className="relative grid grid-cols-2 gap-4 items-start px-2">
          <div className="relative z-10">
            <MagazineCutout
              src="/achievements/hack4gov_2025_1.jpg"
              alt="Hack4Gov 2025 Team"
              caption="Hack4Gov 2025"
              tilt={-1.8}
              tapePosition="corners"
              priority={true}
              className="w-full"
              imgClassName="w-full h-[80px] object-cover"
              onInspect={onInspectPhoto}
            />
          </div>
          <div className="relative z-20">
            <MagazineCutout
              src="/achievements/AppBuildersPH_9thPlace_1.jpg"
              alt="AppBuilders PH 9th Place"
              caption="AppBuilders PH (9th)"
              tilt={1.8}
              tapePosition="mixed-top"
              priority={true}
              className="w-full"
              imgClassName="w-full h-[80px] object-cover"
              onInspect={onInspectPhoto}
            />
          </div>
        </div>
      </div>
    </div>
  )
}