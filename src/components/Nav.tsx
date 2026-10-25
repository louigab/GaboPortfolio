import { NAV_TABS, type NavTabItem } from '../data/portfolioData'

interface NavProps {
  currentPage: number
  isDesktop: boolean
  onGoToPage: (pageIndex: number) => void
  flipTrigger: number
  isBookOpen?: boolean
  onToggleCover?: () => void
}

export default function Nav({
  currentPage,
  isDesktop,
  onGoToPage,
  isBookOpen = true,
  onToggleCover,
}: NavProps) {
  const activeSpread = Math.floor(currentPage / 2)

  // DESKTOP SPREAD MODE: 2-page spread nav bar with centered tabs
  // (Untouched — desktop behavior stays exactly as-is.)
  if (isDesktop) {
    return (
      <header className="w-full max-w-6xl mx-auto px-6 pt-1.5 pb-1 flex items-center justify-center gap-2 shrink-0 select-none">
        {/* Desktop Notebook Index Tabs */}
        <nav
          aria-label="Notebook sections"
          className="min-w-0 flex-1 flex items-center justify-center gap-2 py-0.5"
        >
          {/* Cover toggle tab */}
          {onToggleCover && (
            <button
              type="button"
              onClick={onToggleCover}
              aria-label={isBookOpen ? 'Close book' : 'Open book'}
              className={`btn hand text-base font-bold px-3 py-0.5 ink-tab whitespace-nowrap cursor-pointer transition-colors ${
                !isBookOpen
                  ? 'bg-crimson text-paper border-ink'
                  : 'bg-paper-2 text-ink-soft hover:text-ink'
              }`}
              title={isBookOpen ? 'Close to front cover' : 'Open book'}
            >
              {isBookOpen ? '📕 Close Book' : '📖 Open Book'}
            </button>
          )}

          {NAV_TABS.map((tab) => {
            const isTabActive = isBookOpen && tab.exactPages.includes(currentPage)
            const isSpreadActive = isBookOpen && tab.spreadIndexes.includes(activeSpread)
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onGoToPage(tab.targetPage)}
                aria-current={isTabActive ? 'page' : undefined}
                className={`btn hand text-lg font-bold px-3 py-0.5 ink-tab whitespace-nowrap cursor-pointer transition-colors ${
                  isTabActive
                    ? 'bg-crimson text-paper border-ink'
                    : isSpreadActive
                    ? 'bg-paper-2 text-ink border-ink hover:text-ink'
                    : 'bg-paper text-ink-soft hover:text-ink'
                }`}
              >
                {tab.label}
              </button>
            )
          })}
        </nav>
      </header>
    )
  }

  // MOBILE / TABLET PORTRAIT 1-PAGE MODE:
  // Fitted Single-Row Top Tabs:
  // - Open/Close Book is its OWN dedicated button (never mixed with section tabs)
  // - All section tabs are distinct and match the PC NAV_TABS exactly
  // - Sized to fit across the 494px width in a single row with ZERO horizontal scrolling
  // - Multi-page sections cycle pages when tapped
  const handleMobileTabClick = (tab: NavTabItem) => {
    // If book is closed, open directly to that section
    if (!isBookOpen) {
      onGoToPage(tab.targetPage)
      return
    }

    // If currently on this section, cycle to next page in section
    const isCurrentSection = tab.mobilePages.includes(currentPage)
    if (isCurrentSection && tab.mobilePages.length > 1) {
      const currentIndex = tab.mobilePages.indexOf(currentPage)
      const nextIndex = (currentIndex + 1) % tab.mobilePages.length
      onGoToPage(tab.mobilePages[nextIndex])
    } else {
      onGoToPage(tab.targetPage)
    }
  }

  return (
    <header className="w-full max-w-[494px] mx-auto pt-2 pb-0.5 shrink-0 select-none z-40">
      <nav
        aria-label="Notebook sections"
        className="w-full flex items-center justify-between gap-1 py-0.5"
      >
        {/* Dedicated Open/Close Book Toggle Button (Separate from section tabs!) */}
        {onToggleCover && (
          <button
            type="button"
            onClick={onToggleCover}
            aria-label={isBookOpen ? 'Close book' : 'Open book'}
            className={`btn hand text-xs sm:text-sm font-bold px-2 py-0.5 ink-tab whitespace-nowrap cursor-pointer transition-colors ${
              !isBookOpen
                ? 'bg-crimson text-paper border-ink'
                : 'bg-paper-2 text-ink-soft hover:text-ink'
            }`}
            title={isBookOpen ? 'Close to front cover' : 'Open book'}
          >
            {isBookOpen ? '📕 Close' : '📖 Open'}
          </button>
        )}

        {/* 7 Distinct Section Tabs (Matching PC NAV_TABS) */}
        {NAV_TABS.map((tab) => {
          const isSectionActive = isBookOpen && tab.mobilePages.includes(currentPage)
          const subIndex = tab.mobilePages.indexOf(currentPage)
          const subTotal = tab.mobilePages.length
          const label = tab.shortLabel || tab.label

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleMobileTabClick(tab)}
              aria-current={isSectionActive ? 'page' : undefined}
              title={
                isSectionActive && subTotal > 1
                  ? `${tab.label} (Page ${subIndex + 1} of ${subTotal} - tap to cycle)`
                  : tab.label
              }
              className={`btn hand font-bold text-xs sm:text-sm px-1.5 sm:px-2 py-0.5 ink-tab whitespace-nowrap cursor-pointer transition-colors ${
                isSectionActive
                  ? 'bg-crimson text-paper border-ink'
                  : 'bg-paper text-ink-soft hover:text-ink'
              }`}
            >
              <span>{label}</span>
              {isSectionActive && subTotal > 1 && (
                <span className="ml-0.5 text-[10px] font-mono opacity-80">
                  {subIndex + 1}/{subTotal}
                </span>
              )}
            </button>
          )
        })}
      </nav>
    </header>
  )
}
