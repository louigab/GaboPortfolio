import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import {
  DESKTOP_NAV_TABS,
  MOBILE_NAV_TABS,
  type NavTabItem,
} from '../data/portfolioData'

interface NavProps {
  currentPage: number
  isDesktop: boolean
  onGoToPage: (pageIndex: number) => void
  flipTrigger: number
  isBookOpen?: boolean
  isBookFullyOpen?: boolean
}

export default function Nav({
  currentPage,
  isDesktop,
  onGoToPage,
  isBookOpen = false,
  isBookFullyOpen = false,
}: NavProps) {
  const activeSpread = Math.floor(currentPage / 2)
  const isTargetVisible = isBookOpen && isBookFullyOpen
  const navRef = useRef<HTMLElement>(null)
  const isInitialLoadRef = useRef(true)
  const prevVisibleRef = useRef(isTargetVisible)
  const prevDesktopRef = useRef(isDesktop)

  // Handle tab entrance and exit animations synchronously with GSAP
  useLayoutEffect(() => {
    const navEl = navRef.current
    if (!navEl) return

    const buttons = navEl.querySelectorAll('.ink-tab-animate')
    if (!buttons.length) return

    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // Initial mount or responsive mode change: sync state without triggering entrance animation
    const isModeChange = prevDesktopRef.current !== isDesktop
    if (isInitialLoadRef.current || isModeChange) {
      isInitialLoadRef.current = false
      prevDesktopRef.current = isDesktop
      prevVisibleRef.current = isTargetVisible
      gsap.killTweensOf(buttons)

      if (isTargetVisible) {
        gsap.set(buttons, { clearProps: 'transform,opacity,scaleY' })
      } else {
        gsap.set(buttons, {
          y: 48,
          opacity: 0,
          scaleY: 0.65,
          transformOrigin: 'bottom center',
        })
      }
      return
    }

    // Only run animation when visibility actually transitions
    if (prevVisibleRef.current === isTargetVisible) return
    prevVisibleRef.current = isTargetVisible

    gsap.killTweensOf(buttons)

    if (reducedMotion) {
      if (isTargetVisible) {
        gsap.set(buttons, { clearProps: 'transform,opacity,scaleY' })
      } else {
        gsap.set(buttons, { y: 48, opacity: 0, scaleY: 0.65 })
      }
      return
    }

    if (isTargetVisible) {
      // Book is fully open: animate tabs sliding smoothly up from behind the book edge
      gsap.fromTo(
        buttons,
        {
          y: 48,
          opacity: 0,
          scaleY: 0.65,
          transformOrigin: 'bottom center',
        },
        {
          y: 0,
          opacity: 1,
          scaleY: 1,
          duration: 0.38,
          stagger: 0.035,
          ease: 'back.out(1.6)',
          clearProps: 'transform,opacity,scaleY',
        }
      )
    } else {
      // Book is closing: animate tabs sliding smoothly down deep behind the book edge
      gsap.to(buttons, {
        y: 48,
        opacity: 0,
        scaleY: 0.65,
        transformOrigin: 'bottom center',
        duration: 0.38,
        stagger: 0.03,
        ease: 'power2.inOut',
      })
    }
  }, [isTargetVisible, isDesktop])

  // DESKTOP SPREAD MODE: 2-page spread nav bar
  // Sits flush directly behind top edge of book like physical notebook bookmarks
  if (isDesktop) {
    return (
      <header className="w-full max-w-[976px] mx-auto px-2 h-[42px] flex items-end justify-center shrink-0 select-none relative z-0 -mb-[16px] overflow-visible pointer-events-none">
        <nav
          ref={navRef}
          aria-label="Notebook sections"
          aria-hidden={!isTargetVisible}
          inert={!isTargetVisible}
          className={`flex items-end justify-center gap-1.5 lg:gap-2 overflow-visible ${
            isTargetVisible ? 'pointer-events-auto' : 'pointer-events-none'
          }`}
        >
          {DESKTOP_NAV_TABS.map((tab) => {
            const isTabActive = isBookOpen && tab.exactPages.includes(currentPage)
            const isSpreadActive = isBookOpen && tab.spreadIndexes.includes(activeSpread)
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onGoToPage(tab.targetPage)}
                aria-current={isTabActive ? 'page' : undefined}
                tabIndex={isTargetVisible ? 0 : -1}
                className={`ink-tab-animate btn hand text-sm lg:text-base font-bold px-3 lg:px-3.5 pt-1.5 pb-5 ink-tab border-b-0 whitespace-nowrap cursor-pointer transition-colors ${
                  isTabActive
                    ? 'bg-crimson text-paper border-ink translate-y-[-3px] shadow-sm z-10'
                    : isSpreadActive
                    ? 'bg-paper-2 text-ink border-ink hover:text-ink hover:translate-y-[-1.5px]'
                    : 'bg-paper text-ink-soft hover:text-ink hover:translate-y-[-1.5px]'
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
  // Sits flush directly on top edge of mobile book like physical bookmarks
  const handleMobileTabClick = (tab: NavTabItem) => {
    if (!isBookOpen) {
      onGoToPage(tab.targetPage)
      return
    }

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
    <header className="w-full max-w-[494px] mx-auto px-1 h-[34px] flex items-end justify-between shrink-0 select-none relative z-0 -mb-[12px] overflow-visible pointer-events-none">
      <nav
        ref={navRef}
        aria-label="Notebook sections"
        aria-hidden={!isTargetVisible}
        inert={!isTargetVisible}
        className={`w-full flex items-end justify-between gap-0.5 overflow-visible ${
          isTargetVisible ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
      >
        {MOBILE_NAV_TABS.map((tab) => {
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
              tabIndex={isTargetVisible ? 0 : -1}
              title={
                isSectionActive && subTotal > 1
                  ? `${tab.label} (Page ${subIndex + 1} of ${subTotal} - tap to cycle)`
                  : tab.label
              }
              className={`ink-tab-animate btn hand font-bold text-xs px-1 pt-1 pb-4 ink-tab border-b-0 whitespace-nowrap cursor-pointer transition-colors ${
                isSectionActive
                  ? 'bg-crimson text-paper border-ink translate-y-[-2px] shadow-sm z-10'
                  : 'bg-paper text-ink-soft hover:text-ink hover:translate-y-[-1px]'
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
