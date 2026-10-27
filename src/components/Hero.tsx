import MagazineCutout from './MagazineCutout'
import GaboMascot from './GaboMascot'
import { TECH_GROUPS } from '../data/portfolioData'
import {
  DoodleAmp,
  DoodleCodeBrackets,
  DoodleCoffee,
  DoodleCrown,
  DoodleElectricGuitar,
  DoodleLaptop,
  DoodleMiniGuitar,
  DoodleMusicNotes,
  DoodleStar,
  SketchUnderline,
  TornScrapButton,
} from './InkDoodles'

interface HeroProps {
  onGoToPage: (pageIndex: number) => void
  flipTrigger?: number
  isDesktop?: boolean
}

export default function Hero({
  onGoToPage,
  flipTrigger = 0,
  isDesktop = true,
}: HeroProps) {
  return (
    <div className="h-full flex flex-col justify-between relative pt-0.5">
      {/* Background & Margin Doodles positioned to match the target reference image */}
      <div className="absolute inset-0 pointer-events-none select-none" aria-hidden="true">
        {/* Top-center / Top-right Developer Cluster (above character's head) */}
        <DoodleStar className="w-7 h-7 absolute left-[52%] top-0.5 -rotate-12" />
        <DoodleLaptop className="w-22 h-18 absolute left-[62%] -top-1 -rotate-6" />
        <DoodleCoffee className="w-9 h-11 absolute left-[49.5%] top-10 -rotate-6" />
        <DoodleCoffee className="w-9 h-11 absolute right-3 top-10 rotate-6" />

        {/* Coding brackets to the right of character's head */}
        <div className="absolute right-0.5 top-23 flex flex-col items-center space-y-0.5">
          <DoodleCodeBrackets variant="slash" className="w-11 h-7" />
          <DoodleCodeBrackets variant="open" className="w-11 h-7" />
        </div>

        {/* Left margin star (below 'g' of gabo) & zig-zag scribble */}
        <DoodleStar className="w-7 h-7 absolute -left-3.5 top-[122px] -rotate-12" />
        <svg
          viewBox="0 0 38 88"
          fill="none"
          className="w-6 h-16 absolute -left-6 top-[205px] opacity-90"
        >
          <path
            d="M4 68 L18 32 L12 72 L26 24 L22 68 L34 12"
            stroke="#111111"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {/* Bottom-left margin resting electric guitar */}
        <DoodleElectricGuitar className="w-14 h-44 absolute -left-6 bottom-1 rotate-12" />

        {/* Center Doodles in the channel between Portrait and Character */}
        <DoodleStar className="w-8 h-8 absolute left-[45.5%] top-[120px] rotate-12 z-20" />
        <DoodleMiniGuitar className="w-11 h-16 absolute left-[46.5%] top-[184px] -rotate-6 z-20" />

        {/* Right Margin Doodles beside Character's arm & shoes */}
        <DoodleStar className="w-5 h-5 absolute right-1.5 top-[174px] rotate-12" />
        <DoodleStar className="w-4 h-4 absolute right-0 top-[202px] -rotate-12" />
        <DoodleMusicNotes className="w-5 h-5 absolute right-1 top-[232px]" color="red" />
        <DoodleAmp className="w-12 h-12 absolute -right-0.5 top-[266px] rotate-2" />
        <DoodleStar className="w-7 h-7 absolute right-0.5 top-[328px] -rotate-6" />
      </div>

      {/* Top-Left Title Block */}
      <div className="diary-item relative z-10">
        <div className="flex items-center gap-1.5">
          <DoodleCrown className="w-7 h-5.5 shrink-0" />
          <span className="hand text-[1.05rem] text-ink font-normal tracking-tight leading-none">
            Personal Developer Portfolio
          </span>
        </div>
        <h1 className="hand text-[5.9rem] leading-[0.76] font-extrabold text-ink tracking-tight mt-0.5 ml-8">
          gabo
        </h1>
        {/* Red double marker underline tucked right beside the 'g' descender loop */}
        <SketchUnderline className="w-38 h-3.5 ml-10 -mt-0.5" color="red" />
      </div>

      {/* Middle Stage: Left Torn Portrait + Right Tall Character */}
      <div className="diary-item relative flex-1 min-h-0 flex items-center justify-between">
        {/* Left: Angled Torn Portrait Cutout sized so the center doodle channel stays open */}
        <div className="relative z-10 ml-2 mt-1">
          <MagazineCutout
            src="/images/profile/gaboPic.png"
            alt="Louis Gabriel D. Damondamon (Gabo)"
            tilt={-3.5}
            variant="portrait"
            tapePosition="portrait"
            priority={true}
            imgClassName="w-[172px] h-[194px] object-cover object-top"
          />
        </div>

        {/* Right: Tall Cartoon Gabo Character (positioned up so head sits under laptop/mugs) */}
        <div className="relative z-10 mr-12 -mt-18">
          <GaboMascot variant="hero" flipTrigger={flipTrigger} isDesktop={isDesktop} />
        </div>
      </div>

      {/* Bottom Section: Flip instruction on the lines + 2 Large Torn Red Scrap Buttons */}
      <div className="diary-item relative z-20 text-center pl-5 pr-1 pt-0.5">
        <p className="hand text-[1.12rem] leading-[1.2] font-medium text-ink mb-1.5 max-w-[310px] mx-auto">
          {isDesktop
            ? 'Grab a page corner to flip my diary, or use the Left/Right arrow keys!'
            : 'Swipe to flip pages, or grab a corner!'}
        </p>

        <div className="flex items-center justify-center gap-3.5">
          <TornScrapButton
            onClick={() => onGoToPage(2)}
            tilt={-1.4}
            className="w-[47%]"
          >
            See {TECH_GROUPS.reduce((sum, group) => sum + group.items.length, 0)} Tech Tools
          </TornScrapButton>
          <TornScrapButton
            onClick={() => onGoToPage(11)}
            tilt={-0.8}
            className="w-[47%]"
          >
            Pass Me a Note
          </TornScrapButton>
        </div>
      </div>
    </div>
  )
}