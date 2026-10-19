import { SPREADS_META } from '../data/portfolioData'

interface FooterProps {
  currentPage: number
  totalPages: number
  isDesktop: boolean
}

export default function Footer({
  currentPage,
  totalPages,
  isDesktop,
}: FooterProps) {
  const spreadIndex = Math.floor(currentPage / 2)
  const spreadMeta = SPREADS_META[spreadIndex] || SPREADS_META[0]
  const leftNum = spreadIndex * 2 + 1
  const rightNum = leftNum + 1

  return (
    <footer className="w-full max-w-6xl mx-auto px-2.5 sm:px-6 pt-0.5 pb-2 flex items-center justify-center shrink-0 select-none">
      <div className="text-center min-w-0">
        <p className="hand text-base sm:text-lg font-bold text-ink-soft leading-none truncate">
          {isDesktop
            ? `Pages ${leftNum} & ${rightNum} of ${totalPages} · ${spreadMeta.tabLabel}`
            : `Page ${currentPage + 1}/${totalPages} · Swipe to flip`}
        </p>
      </div>
    </footer>
  )
}