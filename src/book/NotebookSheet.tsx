import React from 'react'
import { getTornVariant, tornVariantClass } from './tornEdges'

export interface NotebookSheetProps {
  side: 'left' | 'right' | 'mobile'
  pageIndex: number
  totalPages: number
  children: React.ReactNode
  /** True on resting interactive pages; false on moving curl clones */
  interactive?: boolean
  onPrev?: () => void
  onNext?: () => void
}

export default function NotebookSheet({
  side,
  pageIndex,
  totalPages: _totalPages,
  children,
  interactive = true,
}: NotebookSheetProps) {
  // Unique hand-torn outer edge per physical sheet (5 silhouettes, repeating)
  const tornClass = tornVariantClass(getTornVariant(pageIndex))

  if (side === 'mobile') {
    // Matches the exact PC right-half page geometry, gutter depth, and typography
    // Skip counting blank desktop spread-4 filler page (index 9) so single-page numbers run sequentially
    const displayPage = pageIndex > 9 ? pageIndex : pageIndex + 1
    const runningHeader =
      pageIndex % 2 === 0 ? 'PORTFOLIO OF GABO' : 'LOUIS GABRIEL D. DAMONDAMON'

    return (
      <div
        className={`notebook-page notebook-right relative h-full w-full min-w-0 bg-paper pl-10 pr-6 pt-3.5 pb-5 flex flex-col justify-between overflow-hidden rounded-r-sm ${tornClass} ${
          interactive ? '' : 'pointer-events-none select-none'
        }`}
      >
        {/* Self-contained bound-book spine gutter shadow + paper arch highlight (100% identical to PC right sheet) */}
        <div
          className="pointer-events-none absolute inset-y-0 left-0 w-14 z-20"
          style={{
            background:
              'linear-gradient(to right, rgba(14, 10, 6, 0.38) 0px, rgba(16, 11, 7, 0.25) 2.5px, rgba(18, 13, 8, 0.13) 14px, rgba(18, 13, 8, 0.045) 28px, rgba(255, 255, 255, 0.25) 42px, transparent 100%)',
          }}
          aria-hidden="true"
        />
        {/* Subtle outer page-edge highlight */}
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-2 z-20"
          style={{
            background:
              'linear-gradient(to left, rgba(255, 255, 255, 0.45) 0%, transparent 100%)',
          }}
          aria-hidden="true"
        />

        <div className="flex items-center justify-between text-ink-soft hand text-sm font-bold mb-0.5 shrink-0 select-none relative z-10">
          <span>{runningHeader}</span>
          <span>p. {displayPage}</span>
        </div>

        <div className="flex-1 min-h-0 relative z-10">{children}</div>
      </div>
    )
  }

  if (side === 'left') {
    return (
      <div
        className={`notebook-page notebook-left relative h-full w-full min-w-0 bg-paper pl-8 pr-7 pt-3.5 pb-5 flex flex-col justify-between overflow-hidden rounded-l-sm ${tornClass} ${
          interactive ? '' : 'pointer-events-none select-none'
        }`}
      >
        {/* Self-contained bound-book spine gutter shadow + paper arch highlight (100% identical on resting & turning sheets) */}
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-14 z-20"
          style={{
            background:
              'linear-gradient(to left, rgba(14, 10, 6, 0.38) 0px, rgba(16, 11, 7, 0.25) 2.5px, rgba(18, 13, 8, 0.13) 14px, rgba(18, 13, 8, 0.045) 28px, rgba(255, 255, 255, 0.25) 42px, transparent 100%)',
          }}
          aria-hidden="true"
        />
        {/* Subtle outer page-edge highlight */}
        <div
          className="pointer-events-none absolute inset-y-0 left-0 w-2 z-20"
          style={{
            background:
              'linear-gradient(to right, rgba(255, 255, 255, 0.45) 0%, transparent 100%)',
          }}
          aria-hidden="true"
        />

        <div className="flex items-center justify-between text-ink-soft hand text-sm font-bold mb-0.5 shrink-0 select-none relative z-10">
          <span>p. {pageIndex + 1}</span>
          <span>PORTFOLIO OF GABO</span>
        </div>

        <div className="flex-1 min-h-0 relative z-10">{children}</div>
      </div>
    )
  }

  return (
    <div
      className={`notebook-page notebook-right relative h-full w-full min-w-0 bg-paper pl-10 pr-6 pt-3.5 pb-5 flex flex-col justify-between overflow-hidden rounded-r-sm ${tornClass} ${
        interactive ? '' : 'pointer-events-none select-none'
      }`}
    >
      {/* Self-contained bound-book spine gutter shadow + paper arch highlight (100% identical on resting & turning sheets) */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-14 z-20"
        style={{
          background:
            'linear-gradient(to right, rgba(14, 10, 6, 0.38) 0px, rgba(16, 11, 7, 0.25) 2.5px, rgba(18, 13, 8, 0.13) 14px, rgba(18, 13, 8, 0.045) 28px, rgba(255, 255, 255, 0.25) 42px, transparent 100%)',
        }}
        aria-hidden="true"
      />
      {/* Subtle outer page-edge highlight */}
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-2 z-20"
        style={{
          background:
            'linear-gradient(to left, rgba(255, 255, 255, 0.45) 0%, transparent 100%)',
        }}
        aria-hidden="true"
      />

      <div className="flex items-center justify-between text-ink-soft hand text-sm font-bold mb-0.5 shrink-0 select-none relative z-10">
        <span>LOUIS GABRIEL D. DAMONDAMON</span>
        <span>p. {pageIndex + 1}</span>
      </div>

      <div className="flex-1 min-h-0 relative z-10">{children}</div>
    </div>
  )
}
