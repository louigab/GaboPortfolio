import { SPREADS_META } from '../data/portfolioData'
import GaboMascot from './GaboMascot'

interface NavProps {
  currentPage: number
  isDesktop: boolean
  onGoToPage: (pageIndex: number) => void
  flipTrigger: number
}

export default function Nav({ currentPage, isDesktop, onGoToPage, flipTrigger }: NavProps) {
  const activeSpread = Math.floor(currentPage / 2)

  return (
    <header className="w-full max-w-6xl mx-auto px-2 sm:px-6 pt-1.5 pb-1 flex items-center justify-between gap-1.5 shrink-0">
      <GaboMascot variant="logo" flipTrigger={flipTrigger} className="shrink-0" />

      {/* Notebook Index Tabs */}
      <nav
        aria-label="Notebook sections"
        className="min-w-0 flex-1 flex items-center justify-end gap-1 sm:gap-2 overflow-x-auto py-0.5"
      >
        {SPREADS_META.map((spread) => {
          const isActive = activeSpread === spread.spreadIndex
          const targetPage = spread.spreadIndex * 2
          return (
            <button
              key={spread.spreadIndex}
              type="button"
              onClick={() => onGoToPage(targetPage)}
              aria-current={isActive ? 'page' : undefined}
              className={`btn hand text-xs sm:text-lg font-bold px-2 sm:px-3.5 py-0.5 ink-tab whitespace-nowrap cursor-pointer ${
                isActive ? 'bg-highlight text-ink' : 'bg-paper text-ink-soft'
              }`}
            >
              {spread.tabLabel}
            </button>
          )
        })}

        {!isDesktop && (
          <button
            type="button"
            onClick={() => onGoToPage(9)}
            className={`btn hand text-xs font-bold px-2 py-0.5 ink-tab whitespace-nowrap cursor-pointer ${
              currentPage === 9 ? 'bg-sticker text-ink' : 'bg-ink text-paper'
            }`}
          >
            Note
          </button>
        )}
      </nav>
    </header>
  )
}