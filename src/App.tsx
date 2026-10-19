import { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import Nav from './components/Nav'
import Hero from './components/Hero'
import About from './components/About'
import {
  TechStackPageLeft,
  TechStackPageRight,
} from './components/TechStack'
import { AchievementsPageLeft, AchievementsPageRight } from './components/Achievements'
import { ProjectsPageLeft, ProjectsPageRight } from './components/Projects'
import Certificates from './components/Certificates'
import Contact from './components/Contact'
import Footer from './components/Footer'
import CutoutModal from './components/CutoutModal'
import { DoodleArrow, SpiralBinding } from './components/InkDoodles'
import { TECH_GROUPS, type TechItem } from './data/portfolioData'
import type { InspectablePhoto } from './components/MagazineCutout'

const TOTAL_PAGES = 10

// Locked coordinate canvas dimensions so the book NEVER reflows on zoom or resize
const DESKTOP_STAGE_W = 1024
const DESKTOP_STAGE_H = 735
const MOBILE_STAGE_W = 430
const MOBILE_STAGE_H = 735

export default function App() {
  const [currentPage, setCurrentPage] = useState(() => {
    if (typeof window === 'undefined') return 0
    const p = Number(new URLSearchParams(window.location.search).get('page'))
    return Number.isFinite(p) && p >= 0 && p < TOTAL_PAGES ? p : 0
  })

  // Track viewport size & compute uniform scale factor so zooming in/out or resizing
  // scales the entire fixed-size book as a single rigid object without internal reflow
  const [viewport, setViewport] = useState(() => ({
    w: typeof window !== 'undefined' ? window.innerWidth : DESKTOP_STAGE_W,
    h: typeof window !== 'undefined' ? window.innerHeight : DESKTOP_STAGE_H,
  }))

  useEffect(() => {
    const updateViewport = () => {
      setViewport({
        w: window.innerWidth,
        h: window.innerHeight,
      })
    }
    window.addEventListener('resize', updateViewport)
    window.visualViewport?.addEventListener('resize', updateViewport)
    return () => {
      window.removeEventListener('resize', updateViewport)
      window.visualViewport?.removeEventListener('resize', updateViewport)
    }
  }, [])

  // Use 2-page spread unless on a narrow portrait mobile screen
  const isDesktop = viewport.w >= 640 || viewport.w >= viewport.h * 0.82
  const stageW = isDesktop ? DESKTOP_STAGE_W : MOBILE_STAGE_W
  const stageH = isDesktop ? DESKTOP_STAGE_H : MOBILE_STAGE_H
  const stageScale = Math.min(viewport.w / stageW, viewport.h / stageH)

  const [flipDirection, setFlipDirection] = useState<'next' | 'prev'>('next')
  const [flipTrigger, setFlipTrigger] = useState(0)
  const [selectedTech, setSelectedTech] = useState<TechItem>(TECH_GROUPS[0].items[0])
  const [inspectedPhoto, setInspectedPhoto] = useState<InspectablePhoto | null>(null)

  const bookRef = useRef<HTMLDivElement>(null)
  const leftPageRef = useRef<HTMLDivElement>(null)
  const rightPageRef = useRef<HTMLDivElement>(null)
  const singlePageRef = useRef<HTMLDivElement>(null)

  // Touch swipe state (Emil Kowalski momentum + multi-touch protection)
  const touchState = useRef<{
    active: boolean
    startX: number
    startY: number
    startTime: number
    deltaX: number
  }>({
    active: false,
    startX: 0,
    startY: 0,
    startTime: 0,
    deltaX: 0,
  })

  const leftPageIndex = Math.floor(currentPage / 2) * 2
  const rightPageIndex = leftPageIndex + 1

  const canPrev = isDesktop ? leftPageIndex > 0 : currentPage > 0
  const canNext = isDesktop ? rightPageIndex < TOTAL_PAGES - 1 : currentPage < TOTAL_PAGES - 1

  const triggerBoundaryNudge = useCallback((dir: 'next' | 'prev') => {
    if (!bookRef.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const offset = dir === 'next' ? -12 : 12
    gsap.fromTo(
      bookRef.current,
      { x: offset },
      { x: 0, duration: 0.28, ease: 'back.out(2.5)' }
    )
  }, [])

  const goToPage = useCallback(
    (targetPage: number) => {
      const clamped = Math.max(0, Math.min(TOTAL_PAGES - 1, targetPage))
      const normalized = isDesktop ? Math.floor(clamped / 2) * 2 : clamped
      const currentNormalized = isDesktop ? leftPageIndex : currentPage
      if (normalized === currentNormalized) return

      setFlipDirection(normalized > currentNormalized ? 'next' : 'prev')
      setCurrentPage(normalized)
      setFlipTrigger((n) => n + 1)
    },
    [currentPage, isDesktop, leftPageIndex]
  )

  const handleNext = useCallback(() => {
    if (!canNext) {
      triggerBoundaryNudge('next')
      return
    }
    setFlipDirection('next')
    setCurrentPage((prev) => {
      const step = isDesktop ? 2 : 1
      const base = isDesktop ? Math.floor(prev / 2) * 2 : prev
      return Math.min(TOTAL_PAGES - 1, base + step)
    })
    setFlipTrigger((n) => n + 1)
  }, [canNext, isDesktop, triggerBoundaryNudge])

  const handlePrev = useCallback(() => {
    if (!canPrev) {
      triggerBoundaryNudge('prev')
      return
    }
    setFlipDirection('prev')
    setCurrentPage((prev) => {
      const step = isDesktop ? 2 : 1
      const base = isDesktop ? Math.floor(prev / 2) * 2 : prev
      return Math.max(0, base - step)
    })
    setFlipTrigger((n) => n + 1)
  }, [canPrev, isDesktop, triggerBoundaryNudge])

  // Keyboard Left / Right arrow navigation
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (inspectedPhoto) return
      const target = e.target as HTMLElement | null
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        handleNext()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        handlePrev()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handleNext, handlePrev, inspectedPhoto])

  // GSAP 3D Page-Flip & Stagger Choreography
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const ctx = gsap.context(() => {
      if (flipTrigger > 0) {
        if (isDesktop) {
          if (flipDirection === 'next') {
            if (rightPageRef.current) {
              gsap.fromTo(
                rightPageRef.current,
                {
                  rotationY: -48,
                  transformOrigin: 'left center',
                  transformPerspective: 1800,
                },
                {
                  rotationY: 0,
                  duration: 0.36,
                  ease: 'power3.out',
                  clearProps: 'transform',
                }
              )
            }
            if (leftPageRef.current) {
              gsap.fromTo(
                leftPageRef.current,
                {
                  rotationY: 18,
                  transformOrigin: 'right center',
                  transformPerspective: 1800,
                },
                {
                  rotationY: 0,
                  duration: 0.32,
                  ease: 'power3.out',
                  clearProps: 'transform',
                }
              )
            }
          } else {
            if (leftPageRef.current) {
              gsap.fromTo(
                leftPageRef.current,
                {
                  rotationY: 48,
                  transformOrigin: 'right center',
                  transformPerspective: 1800,
                },
                {
                  rotationY: 0,
                  duration: 0.36,
                  ease: 'power3.out',
                  clearProps: 'transform',
                }
              )
            }
            if (rightPageRef.current) {
              gsap.fromTo(
                rightPageRef.current,
                {
                  rotationY: -18,
                  transformOrigin: 'left center',
                  transformPerspective: 1800,
                },
                {
                  rotationY: 0,
                  duration: 0.32,
                  ease: 'power3.out',
                  clearProps: 'transform',
                }
              )
            }
          }
        } else if (singlePageRef.current) {
          gsap.fromTo(
            singlePageRef.current,
            {
              rotationY: flipDirection === 'next' ? -32 : 32,
              x: flipDirection === 'next' ? 20 : -20,
              transformOrigin: 'left center',
              transformPerspective: 1600,
            },
            {
              rotationY: 0,
              x: 0,
              duration: 0.32,
              ease: 'power3.out',
              clearProps: 'transform',
            }
          )
        }
      }

      // Subtle tactile settle for items on the page
      gsap.fromTo(
        '.diary-item',
        { y: 6, scale: 0.985, opacity: 0.92 },
        {
          y: 0,
          scale: 1,
          opacity: 1,
          duration: 0.24,
          stagger: 0.02,
          ease: 'power2.out',
          clearProps: 'transform,opacity',
        }
      )

      // Subtle settle on magazine cutouts
      gsap.fromTo(
        '.magazine-cutout',
        { scale: 0.96 },
        {
          scale: 1,
          duration: 0.28,
          stagger: 0.03,
          ease: 'back.out(1.6)',
        }
      )
    }, bookRef)

    return () => ctx.revert()
  }, [currentPage, isDesktop, flipDirection, flipTrigger])

  // Mobile Touch Swipe Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length > 1) return
    const touch = e.touches[0]
    touchState.current = {
      active: true,
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: Date.now(),
      deltaX: 0,
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchState.current.active || e.touches.length > 1) return
    const touch = e.touches[0]
    const dx = touch.clientX - touchState.current.startX
    const dy = touch.clientY - touchState.current.startY

    if (Math.abs(dy) > Math.abs(dx) * 1.2) return
    touchState.current.deltaX = dx

    if (singlePageRef.current && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const atBoundary = (dx > 0 && !canPrev) || (dx < 0 && !canNext)
      const dampedDx = atBoundary ? dx * 0.22 : dx * 0.45
      const rotY = Math.max(-25, Math.min(25, dampedDx * 0.18))
      singlePageRef.current.style.transform = `perspective(1600px) translate3d(${dampedDx}px, 0, 0) rotateY(${rotY}deg)`
    }
  }

  const handleTouchEnd = () => {
    if (!touchState.current.active) return
    const { deltaX, startTime } = touchState.current
    touchState.current.active = false

    const elapsed = Math.max(1, Date.now() - startTime)
    const velocity = Math.abs(deltaX) / elapsed

    if (singlePageRef.current) {
      singlePageRef.current.style.transform = ''
    }

    if (Math.abs(deltaX) >= 48 || (Math.abs(deltaX) >= 20 && velocity > 0.11)) {
      if (deltaX < 0) {
        handleNext()
      } else {
        handlePrev()
      }
    }
  }

  const renderPageContent = (pageIdx: number) => {
    switch (pageIdx) {
      case 0:
        return (
          <Hero
            onGoToPage={goToPage}
            onInspectPhoto={setInspectedPhoto}
            flipTrigger={flipTrigger}
          />
        )
      case 1:
        return <About onGoToPage={goToPage} onInspectPhoto={setInspectedPhoto} />
      case 2:
        return (
          <TechStackPageLeft
            selectedTech={selectedTech}
            onSelectTech={setSelectedTech}
          />
        )
      case 3:
        return (
          <TechStackPageRight
            selectedTech={selectedTech}
            onSelectTech={setSelectedTech}
          />
        )
      case 4:
        return <AchievementsPageLeft onInspectPhoto={setInspectedPhoto} />
      case 5:
        return <AchievementsPageRight onInspectPhoto={setInspectedPhoto} />
      case 6:
        return <ProjectsPageLeft onInspectPhoto={setInspectedPhoto} />
      case 7:
        return <ProjectsPageRight onInspectPhoto={setInspectedPhoto} />
      case 8:
        return <Certificates onInspectPhoto={setInspectedPhoto} />
      case 9:
      default:
        return <Contact />
    }
  }

  return (
    <div
      data-ui="diary-book"
      className="h-dvh w-dvw overflow-hidden bg-desk flex items-center justify-center select-none"
    >
      {/* FIXED-DIMENSION STAGE: Never reflows on browser zoom or window resize */}
      <div
        style={{
          width: `${stageW}px`,
          height: `${stageH}px`,
          transform: `scale(${stageScale})`,
          transformOrigin: 'center center',
        }}
        className="flex flex-col justify-between shrink-0"
      >
        {/* Top Notebook Index Tabs & Mascot Logo */}
        <Nav
          currentPage={currentPage}
          isDesktop={isDesktop}
          onGoToPage={goToPage}
          flipTrigger={flipTrigger}
        />

        {/* Main Open Book Stage */}
        <main
          id="main"
          ref={bookRef}
          className="flex-1 min-h-0 w-full px-6 py-1 flex items-center justify-center"
          onTouchStart={!isDesktop ? handleTouchStart : undefined}
          onTouchMove={!isDesktop ? handleTouchMove : undefined}
          onTouchEnd={!isDesktop ? handleTouchEnd : undefined}
        >
          {isDesktop ? (
            /* DESKTOP: LOCKED 976x642 2-PAGE OPEN NOTEBOOK SPREAD */
            <div className="book-cover w-[976px] h-[642px] shrink-0 grid grid-cols-[469px_10px_469px] bg-ink p-3.5 rounded-xl">
              {/* LEFT PAGE */}
              <section
                ref={leftPageRef}
                aria-label={`Notebook Page ${leftPageIndex + 1}`}
                className="notebook-page notebook-left relative h-full w-full min-w-0 bg-paper pl-8 pr-7 pt-3.5 pb-5 flex flex-col justify-between overflow-hidden rounded-l-sm"
              >
                {/* Top outer page number */}
                <div className="flex items-center justify-between text-ink-soft hand text-sm font-bold mb-0.5 shrink-0">
                  <span>p. {leftPageIndex + 1}</span>
                  <span>DIARY OF GABO</span>
                </div>

                <div className="flex-1 min-h-0">{renderPageContent(leftPageIndex)}</div>

                {/* Written-on-paper page turn note (bottom-left) */}
                {canPrev && (
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="group absolute bottom-1.5 left-8 z-30 flex items-center gap-1.5 bg-transparent border-0 p-0 hand text-lg font-bold text-ink/85 hover:text-ink cursor-pointer transition-transform duration-150 hover:-translate-x-1 select-none focus-visible:outline-none"
                    title="Turn to previous spread (Left Arrow)"
                  >
                    <DoodleArrow className="w-6 h-3.5 transition-transform group-hover:-translate-x-1" flip={true} />
                    <span className="underline decoration-pencil/40 underline-offset-4 group-hover:decoration-ink">
                      flip back
                    </span>
                  </button>
                )}
              </section>

              {/* CENTER SPIRAL SPINE (overlaps onto both pages) */}
              <div className="bg-ink flex items-center justify-center z-30 relative">
                <SpiralBinding rings={15} />
              </div>

              {/* RIGHT PAGE */}
              <section
                ref={rightPageRef}
                aria-label={`Notebook Page ${rightPageIndex + 1}`}
                className="notebook-page notebook-right relative h-full w-full min-w-0 bg-paper pl-10 pr-6 pt-3.5 pb-5 flex flex-col justify-between overflow-hidden rounded-r-sm"
              >
                {/* Top outer page number */}
                <div className="flex items-center justify-between text-ink-soft hand text-sm font-bold mb-0.5 shrink-0">
                  <span>LOUIS GABRIEL D. DAMONDAMON</span>
                  <span>p. {rightPageIndex + 1}</span>
                </div>

                <div className="flex-1 min-h-0">{renderPageContent(rightPageIndex)}</div>

                {/* Written-on-paper page turn note (bottom-right) */}
                {canNext && (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="group absolute bottom-1.5 right-6 z-30 flex items-center gap-1.5 bg-transparent border-0 p-0 hand text-lg font-bold text-ink/85 hover:text-ink cursor-pointer transition-transform duration-150 hover:translate-x-1 select-none focus-visible:outline-none"
                    title="Turn to next spread (Right Arrow)"
                  >
                    <span className="underline decoration-pencil/40 underline-offset-4 group-hover:decoration-ink">
                      flip page
                    </span>
                    <DoodleArrow className="w-6 h-3.5 transition-transform group-hover:translate-x-1" />
                  </button>
                )}
              </section>
            </div>
          ) : (
            /* MOBILE: SINGLE PAGE NOTEBOOK VIEW WITH SWIPE */
            <div className="book-cover w-full h-full grid grid-cols-[26px_minmax(0,1fr)] bg-ink p-1.5 rounded-xl">
              <div className="bg-ink flex items-center justify-center z-20">
                <SpiralBinding rings={10} />
              </div>

              <section
                ref={singlePageRef}
                aria-label={`Notebook Page ${currentPage + 1}`}
                className="notebook-page relative h-full w-full min-w-0 bg-paper pl-8 pr-3 pt-2.5 pb-7 flex flex-col justify-between overflow-hidden rounded-r-md"
              >
                <div className="flex items-center justify-between text-ink-soft hand text-xs font-bold mb-0.5 shrink-0">
                  <span>DIARY OF GABO</span>
                  <span>
                    Page {currentPage + 1} / {TOTAL_PAGES}
                  </span>
                </div>

                <div className="flex-1 min-h-0">{renderPageContent(currentPage)}</div>

                {/* Mobile bottom written page turn notes */}
                {canPrev && (
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="group absolute bottom-1.5 left-8 flex items-center gap-1 bg-transparent border-0 p-0 hand text-sm font-bold text-ink/80 hover:text-ink cursor-pointer select-none focus-visible:outline-none"
                  >
                    <DoodleArrow className="w-4 h-2.5" flip={true} />
                    <span className="underline decoration-pencil/40 underline-offset-2">flip back</span>
                  </button>
                )}
                {canNext && (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="group absolute bottom-1.5 right-4 flex items-center gap-1 bg-transparent border-0 p-0 hand text-sm font-bold text-ink/80 hover:text-ink cursor-pointer select-none focus-visible:outline-none"
                  >
                    <span className="underline decoration-pencil/40 underline-offset-2">flip page</span>
                    <DoodleArrow className="w-4 h-2.5" />
                  </button>
                )}
              </section>
            </div>
          )}
        </main>

        {/* Bottom Page-Turn Bar */}
        <Footer
          currentPage={currentPage}
          totalPages={TOTAL_PAGES}
          isDesktop={isDesktop}
        />
      </div>

      {/* Native Light-Dismiss Dialog for Inspecting Magazine Cutouts */}
      <CutoutModal photo={inspectedPhoto} onClose={() => setInspectedPhoto(null)} />
    </div>
  )
}