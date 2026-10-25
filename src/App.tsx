import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import Nav from './components/Nav'
import Hero from './components/Hero'
import About from './components/About'
import {
  TechStackPageLeft,
  TechStackPageRight,
} from './components/TechStack'
import {
  AchievementsPageLeft,
  AchievementsPageRight,
} from './components/Achievements'
import {
  ProjectsPageLeft,
  ProjectsPageRight,
  ProjectsPageMoreLeft,
  ProjectsPageMoreRight,
} from './components/Projects'
import Certificates from './components/Certificates'
import Contact, { type SentNoteSnapshot } from './components/Contact'
import Footer from './components/Footer'
import CutoutModal from './components/CutoutModal'
import { TECH_GROUPS, type TechItem } from './data/portfolioData'
import type { InspectablePhoto } from './components/MagazineCutout'
import BookCover3D from './book/BookCover3D'
import BookLeafTurn from './book/BookLeafTurn'
import NotebookSheet from './book/NotebookSheet'
import PaperAirplaneFlight, {
  SpineReplacementTapes,
  TornSpineStub,
} from './book/PaperAirplaneFlight'
import { clamp, type Corner, type TurnDirection } from './book/flipGeometry'
import { usePageTurn } from './book/usePageTurn'

const TOTAL_PAGES = 12

// Locked coordinate canvas dimensions so the book NEVER reflows on zoom or resize
const DESKTOP_STAGE_W = 1024
const DESKTOP_STAGE_H = 764
const MOBILE_STAGE_W = 516
const MOBILE_STAGE_H = 724

// Desktop 2-page bound book spread geometry: 14 + 474 + 474 + 14 = 976px x 642px
const PAGE_W = 474
const PAGE_H = 614
const SPINE_W = 0
const COVER_PAD = 14

// Mobile single-page bound book geometry: 6 + 474 + 14 = 494px x 642px
const MOBILE_SPINE_W = 6
const MOBILE_BOOK_W = MOBILE_SPINE_W + PAGE_W + COVER_PAD // 494
const MOBILE_BOOK_H = PAGE_H + COVER_PAD * 2 // 642

// Page index 9 is a blank spread-filler on desktop; in 1-page mode we skip it
const BLANK_PAGE_INDEX = 9

const getAdjacentSinglePage = (page: number, dir: TurnDirection): number => {
  if (dir === 'next') {
    const next = page + 1
    return clamp(next === BLANK_PAGE_INDEX ? next + 1 : next, 0, TOTAL_PAGES - 1)
  } else {
    const prev = page - 1
    return clamp(prev === BLANK_PAGE_INDEX ? prev - 1 : prev, 0, TOTAL_PAGES - 1)
  }
}

export default function App() {
  const [currentPage, setCurrentPage] = useState(() => {
    if (typeof window === 'undefined') return 0
    const p = Number(new URLSearchParams(window.location.search).get('page'))
    return Number.isFinite(p) && p >= 0 && p < TOTAL_PAGES ? p : 0
  })

  // Closed book physical initial state (opens immediately if reduced-motion is preferred)
  const [isBookOpen, setIsBookOpen] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })

  // Track viewport size & compute uniform scale factor
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

  const hasOpenedInitially = useRef(isBookOpen)

  // Automatic opening animation on initial load only (waits briefly for cover fonts, settles closed, then unlatches & opens)
  useEffect(() => {
    if (hasOpenedInitially.current) return

    let cancelled = false
    let settleTimer: ReturnType<typeof setTimeout> | null = null

    const scheduleOpen = () => {
      if (cancelled || hasOpenedInitially.current) return
      settleTimer = setTimeout(() => {
        if (!cancelled && !hasOpenedInitially.current) {
          hasOpenedInitially.current = true
          setIsBookOpen(true)
        }
      }, 950)
    }

    const fontWait =
      typeof document !== 'undefined' && document.fonts?.ready
        ? Promise.race([
            document.fonts.ready,
            new Promise((resolve) => setTimeout(resolve, 650)),
          ])
        : Promise.resolve()

    fontWait.then(scheduleOpen)

    return () => {
      cancelled = true
      if (settleTimer !== null) clearTimeout(settleTimer)
    }
  }, [])

  // 2-page spread for PC and tablet in landscape; 1-page single sheet for phones and tablet in portrait
  const isDesktop =
    viewport.w > viewport.h
      ? viewport.w >= 768 && viewport.h >= 500
      : viewport.w >= 1100
  const stageW = isDesktop ? DESKTOP_STAGE_W : MOBILE_STAGE_W
  const stageH = isDesktop ? DESKTOP_STAGE_H : MOBILE_STAGE_H
  const stageScale = Math.min(viewport.w / stageW, viewport.h / stageH)

  // Normalize away from empty desktop-filler page 9 when in 1-page mode
  const [prevIsDesktop, setPrevIsDesktop] = useState(isDesktop)
  if (prevIsDesktop !== isDesktop) {
    setPrevIsDesktop(isDesktop)
    if (!isDesktop && currentPage === BLANK_PAGE_INDEX) {
      setCurrentPage(8)
    }
  }

  const [flipTrigger, setFlipTrigger] = useState(0)
  const [selectedTech, setSelectedTech] = useState<TechItem>(
    TECH_GROUPS[0].items[0]
  )
  const [certPageIdx, setCertPageIdx] = useState(0)
  const [inspectedPhoto, setInspectedPhoto] =
    useState<InspectablePhoto | null>(null)
  const [activeAirplaneNote, setActiveAirplaneNote] =
    useState<SentNoteSnapshot | null>(null)
  const [hasRippedNoteStub, setHasRippedNoteStub] = useState(false)

  const handleNoteSent = useCallback((snapshot: SentNoteSnapshot) => {
    setActiveAirplaneNote(snapshot)
  }, [])

  const handleAirplaneComplete = useCallback(() => {
    setHasRippedNoteStub(true)
    setActiveAirplaneNote(null)
  }, [])

  const airplaneExitX = Math.max(
    980,
    Math.ceil((viewport.w / Math.max(stageScale, 0.25)) * 0.85)
  )
  const airplaneExitY = -Math.max(
    720,
    Math.ceil((viewport.h / Math.max(stageScale, 0.25)) * 0.85)
  )

  const bookRef = useRef<HTMLDivElement>(null)
  const desktopBookStageRef = useRef<HTMLDivElement>(null)
  const groundShadowRef = useRef<HTMLDivElement>(null)
  const leftHalfRef = useRef<HTMLDivElement>(null)
  const spineBindingRef = useRef<HTMLDivElement>(null)
  const rightCoverShadowRef = useRef<HTMLDivElement>(null)
  const mobileCoverShadowRef = useRef<HTMLDivElement>(null)
  const spreadInnerRef = useRef<HTMLDivElement>(null)
  const mobileInnerRef = useRef<HTMLDivElement>(null)
  const coverProgressRef = useRef<number>(isBookOpen ? 1 : 0)

  const leftPageIndex = Math.floor(currentPage / 2) * 2
  const rightPageIndex = leftPageIndex + 1

  const canPrev = isDesktop ? leftPageIndex > 0 : currentPage > 0
  const canNext = isDesktop
    ? rightPageIndex < TOTAL_PAGES - 1
    : currentPage < TOTAL_PAGES - 1

  // Sync physical 3D book position, spine visibility, and cover-cast page shadows with zero crossfades
  const syncCoverPhysics = useCallback((progress: number) => {
    coverProgressRef.current = progress
    const swing = clamp((progress - 0.06) / 0.94, 0, 1)

    if (desktopBookStageRef.current) {
      // Closed book occupies [488..976]; shifting by -244px centers it, gliding to 0px as cover opens left
      const shiftX = Math.round(-244 * (1 - swing) * 100) / 100
      desktopBookStageRef.current.style.transform = `translate3d(${shiftX}px, 0px, 0px)`
    }

    if (groundShadowRef.current) {
      const shLeft = Math.round(488 * (1 - swing) * 10) / 10
      const shWidth = Math.round((488 + 488 * swing) * 10) / 10
      groundShadowRef.current.style.left = `${shLeft}px`
      groundShadowRef.current.style.width = `${shWidth}px`
    }

    if (leftHalfRef.current) {
      // Left half is physically mounted on the swinging front cover until it lands flat at -180deg
      leftHalfRef.current.style.visibility =
        progress >= 0.999 ? 'visible' : 'hidden'
    }

    if (spineBindingRef.current) {
      spineBindingRef.current.style.visibility =
        swing >= 0.14 ? 'visible' : 'hidden'
    }

    // Directional shadow cast by front hardcover onto Page 2 (right stack) as cover lifts/closes
    const shadowAlpha =
      swing >= 0.9
        ? 0
        : Math.round(
            Math.pow(clamp(1 - swing / 0.9, 0, 1), 1.35) * 0.85 * 1000
          ) / 1000

    if (rightCoverShadowRef.current) {
      rightCoverShadowRef.current.style.opacity = `${shadowAlpha}`
    }

    if (mobileCoverShadowRef.current) {
      mobileCoverShadowRef.current.style.opacity = `${shadowAlpha}`
    }
  }, [])

  useLayoutEffect(() => {
    syncCoverPhysics(coverProgressRef.current)
  }, [isDesktop, syncCoverPhysics])

  const onCommitTurn = useCallback(
    (dir: TurnDirection, targetPage?: number) => {
      setCurrentPage((prev) => {
        if (targetPage !== undefined) {
          if (!isDesktop && targetPage === BLANK_PAGE_INDEX) {
            return dir === 'next' ? 10 : 8
          }
          return clamp(targetPage, 0, TOTAL_PAGES - 1)
        }
        if (isDesktop) {
          const base = Math.floor(prev / 2) * 2
          return dir === 'next'
            ? Math.min(TOTAL_PAGES - 1, base + 2)
            : Math.max(0, base - 2)
        }
        return getAdjacentSinglePage(prev, dir)
      })
      setFlipTrigger((n) => n + 1)
    },
    [isDesktop]
  )

  const pageTurn = usePageTurn({
    onCommitTurn,
    canTurnNext: canNext,
    canTurnPrev: canPrev,
    pageW: PAGE_W,
    pageH: PAGE_H,
    spineW: isDesktop ? SPINE_W : 0,
    isDesktop,
  })

  const triggerBoundaryNudge = useCallback((dir: TurnDirection) => {
    if (
      !bookRef.current ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return
    }
    const offset = dir === 'next' ? -9 : 9
    gsap.fromTo(
      bookRef.current,
      { x: offset },
      { x: 0, duration: 0.26, ease: 'back.out(2.2)', clearProps: 'transform' }
    )
  }, [])

  const goToPage = useCallback(
    (targetPage: number) => {
      if (activeAirplaneNote) return
      let clamped = clamp(targetPage, 0, TOTAL_PAGES - 1)
      if (!isDesktop && clamped === BLANK_PAGE_INDEX) {
        clamped = 10
      }
      const normalized = isDesktop ? Math.floor(clamped / 2) * 2 : clamped
      const currentNormalized = isDesktop ? leftPageIndex : currentPage

      if (!isBookOpen) {
        hasOpenedInitially.current = true
        setCurrentPage(clamped)
        setIsBookOpen(true)
        return
      }

      if (isDesktop && normalized === currentNormalized) {
        setCurrentPage(clamped)
        return
      }

      if (normalized === currentNormalized) return
      const dir: TurnDirection =
        normalized > currentNormalized ? 'next' : 'prev'
      pageTurn.triggerFlip(dir, { targetPage: clamped, corner: 'bottom' })
    },
    [activeAirplaneNote, currentPage, isBookOpen, isDesktop, leftPageIndex, pageTurn]
  )

  const handleNext = useCallback(() => {
    if (activeAirplaneNote) return
    if (!isBookOpen) {
      hasOpenedInitially.current = true
      setIsBookOpen(true)
      return
    }
    if (!canNext) {
      triggerBoundaryNudge('next')
      return
    }
    pageTurn.triggerFlip('next', { corner: 'bottom' })
  }, [activeAirplaneNote, canNext, isBookOpen, pageTurn, triggerBoundaryNudge])

  const handlePrev = useCallback(() => {
    if (activeAirplaneNote) return
    if (!isBookOpen) {
      hasOpenedInitially.current = true
      setIsBookOpen(true)
      return
    }
    if (!canPrev) {
      triggerBoundaryNudge('prev')
      return
    }
    pageTurn.triggerFlip('prev', { corner: 'bottom' })
  }, [activeAirplaneNote, canPrev, isBookOpen, pageTurn, triggerBoundaryNudge])

  const openBook = useCallback(() => {
    hasOpenedInitially.current = true
    setIsBookOpen(true)
  }, [])

  const toggleCover = useCallback(() => {
    if (activeAirplaneNote) return
    hasOpenedInitially.current = true
    setIsBookOpen((prev) => !prev)
  }, [activeAirplaneNote])

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

  // Pointer drag helpers bound to inner page spread coordinates
  const getActiveSpreadRect = (): DOMRect | null => {
    const el = isDesktop ? spreadInnerRef.current : mobileInnerRef.current
    return el ? el.getBoundingClientRect() : null
  }

  const makeEdgeDragProps = (dir: TurnDirection, hoverCorner?: Corner) => ({
    onPointerEnter: hoverCorner
      ? () => {
          if (isBookOpen && !activeAirplaneNote) {
            pageTurn.onCornerHoverEnter(dir, hoverCorner)
          }
        }
      : undefined,
    onPointerLeave: hoverCorner
      ? () => {
          pageTurn.onCornerHoverLeave()
        }
      : undefined,
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
      if (!isBookOpen || activeAirplaneNote) return
      const rect = getActiveSpreadRect()
      if (rect) pageTurn.onPointerDownEdge(dir, e, rect)
    },
    onPointerMove: (e: React.PointerEvent<HTMLElement>) => {
      const rect = getActiveSpreadRect()
      if (rect) pageTurn.onPointerMoveEdge(e, rect)
    },
    onPointerUp: (e: React.PointerEvent<HTMLElement>) => {
      pageTurn.onPointerUpEdge(e)
    },
    onPointerCancel: () => {
      pageTurn.onLostCaptureEdge()
    },
    onLostPointerCapture: () => {
      pageTurn.onLostCaptureEdge()
    },
  })

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
        return (
          <About onGoToPage={goToPage} onInspectPhoto={setInspectedPhoto} />
        )
      case 2:
        return (
          <TechStackPageLeft
            selectedTech={selectedTech}
            onSelectTech={setSelectedTech}
            isDesktop={isDesktop}
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
        return <ProjectsPageMoreLeft onInspectPhoto={setInspectedPhoto} />
      case 9:
        return <ProjectsPageMoreRight />
      case 10:
        return (
          <Certificates
            onInspectPhoto={setInspectedPhoto}
            pageIdx={certPageIdx}
            onChangePageIdx={setCertPageIdx}
          />
        )
      case 11:
      default:
        return <Contact onNoteSent={handleNoteSent} />
    }
  }

  // Compute physical front / reverse / underlying sheets whenever a curl is active
  const activeTurn = pageTurn.activeTurn
  let turnSheets: {
    frontSheet: React.ReactNode
    backSheet: React.ReactNode
    underSheet: React.ReactNode | null
  } | null = null

  if (activeTurn) {
    if (isDesktop) {
      if (activeTurn.direction === 'next') {
        const destLeft =
          activeTurn.targetPage !== undefined
            ? Math.floor(activeTurn.targetPage / 2) * 2
            : Math.min(TOTAL_PAGES - 2, leftPageIndex + 2)
        const destRight = Math.min(TOTAL_PAGES - 1, destLeft + 1)

        turnSheets = {
          frontSheet: (
            <NotebookSheet
              side="right"
              pageIndex={rightPageIndex}
              totalPages={TOTAL_PAGES}
              interactive={false}
            >
              {renderPageContent(rightPageIndex)}
            </NotebookSheet>
          ),
          backSheet: (
            <NotebookSheet
              side="left"
              pageIndex={destLeft}
              totalPages={TOTAL_PAGES}
              interactive={false}
            >
              {renderPageContent(destLeft)}
            </NotebookSheet>
          ),
          underSheet: (
            <NotebookSheet
              side="right"
              pageIndex={destRight}
              totalPages={TOTAL_PAGES}
              interactive={false}
            >
              {renderPageContent(destRight)}
            </NotebookSheet>
          ),
        }
      } else {
        const destLeft =
          activeTurn.targetPage !== undefined
            ? Math.floor(activeTurn.targetPage / 2) * 2
            : Math.max(0, leftPageIndex - 2)
        const destRight = Math.min(TOTAL_PAGES - 1, destLeft + 1)

        turnSheets = {
          frontSheet: (
            <NotebookSheet
              side="left"
              pageIndex={leftPageIndex}
              totalPages={TOTAL_PAGES}
              interactive={false}
            >
              {renderPageContent(leftPageIndex)}
            </NotebookSheet>
          ),
          backSheet: (
            <NotebookSheet
              side="right"
              pageIndex={destRight}
              totalPages={TOTAL_PAGES}
              interactive={false}
            >
              {renderPageContent(destRight)}
            </NotebookSheet>
          ),
          underSheet: (
            <NotebookSheet
              side="left"
              pageIndex={destLeft}
              totalPages={TOTAL_PAGES}
              interactive={false}
            >
              {renderPageContent(destLeft)}
            </NotebookSheet>
          ),
        }
      }
    } else {
      // Mobile single-page curl sheets
      if (activeTurn.direction === 'next') {
        const dest =
          activeTurn.targetPage !== undefined
            ? activeTurn.targetPage
            : getAdjacentSinglePage(currentPage, 'next')
        turnSheets = {
          frontSheet: (
            <NotebookSheet
              side="mobile"
              pageIndex={currentPage}
              totalPages={TOTAL_PAGES}
              interactive={false}
            >
              {renderPageContent(currentPage)}
            </NotebookSheet>
          ),
          backSheet: (
            <div className="notebook-page notebook-left h-full w-full bg-paper rounded-l-md" />
          ),
          underSheet: (
            <NotebookSheet
              side="mobile"
              pageIndex={dest}
              totalPages={TOTAL_PAGES}
              interactive={false}
            >
              {renderPageContent(dest)}
            </NotebookSheet>
          ),
        }
      } else {
        const dest =
          activeTurn.targetPage !== undefined
            ? activeTurn.targetPage
            : getAdjacentSinglePage(currentPage, 'prev')
        turnSheets = {
          frontSheet: (
            <NotebookSheet
              side="mobile"
              pageIndex={dest}
              totalPages={TOTAL_PAGES}
              interactive={false}
            >
              {renderPageContent(dest)}
            </NotebookSheet>
          ),
          backSheet: (
            <div className="notebook-page notebook-left h-full w-full bg-paper rounded-l-md" />
          ),
          underSheet: (
            <NotebookSheet
              side="mobile"
              pageIndex={currentPage}
              totalPages={TOTAL_PAGES}
              interactive={false}
            >
              {renderPageContent(currentPage)}
            </NotebookSheet>
          ),
        }
      }
    }
  }

  // Mobile horizontal swipe gesture recognition
  const mobileTouchStartRef = useRef<{
    x: number
    y: number
    time: number
  } | null>(null)

  const handleMobileTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      mobileTouchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: Date.now(),
      }
    }
  }

  const handleMobileTouchEnd = (e: React.TouchEvent) => {
    if (
      !mobileTouchStartRef.current ||
      pageTurn.isDragging ||
      !isBookOpen ||
      activeAirplaneNote
    ) {
      mobileTouchStartRef.current = null
      return
    }
    const touch = e.changedTouches[0]
    const dx = touch.clientX - mobileTouchStartRef.current.x
    const dy = touch.clientY - mobileTouchStartRef.current.y
    const dt = Date.now() - mobileTouchStartRef.current.time
    mobileTouchStartRef.current = null

    if (Math.abs(dx) > 42 && Math.abs(dx) > Math.abs(dy) * 1.4 && dt < 600) {
      if (dx < 0 && canNext) {
        handleNext()
      } else if (dx > 0 && canPrev) {
        handlePrev()
      }
    }
  }

  return (
    <div
      data-ui="diary-book"
      data-dragging={pageTurn.isDragging ? 'true' : 'false'}
      className="h-dvh w-dvw overflow-clip bg-desk flex items-center justify-center select-none"
    >
      {/* Radial ambient desk lighting */}
      <div
        className="pointer-events-none absolute inset-0 select-none"
        style={{
          background:
            'radial-gradient(ellipse at 50% 38%, rgba(255,255,255,0.48) 0%, transparent 68%), radial-gradient(ellipse at 50% 92%, rgba(20,15,10,0.16) 0%, transparent 62%)',
        }}
        aria-hidden="true"
      />

      {/* FIXED-DIMENSION STAGE: Never reflows on browser zoom or window resize */}
      <div
        style={{
          width: `${stageW}px`,
          height: `${stageH}px`,
          transform: `scale(${stageScale})`,
          transformOrigin: 'center center',
        }}
        className="flex flex-col justify-between shrink-0 relative"
      >
        {/* Top Notebook Index Tabs & Mascot Logo */}
        <Nav
          currentPage={currentPage}
          isDesktop={isDesktop}
          onGoToPage={goToPage}
          flipTrigger={flipTrigger}
          isBookOpen={isBookOpen}
          onToggleCover={toggleCover}
        />

        {/* Main 3D Perspective Book Stage */}
        <main
          id="main"
          ref={bookRef}
          className={`flex-1 min-h-0 w-full ${
            isDesktop ? 'px-6 py-1 -top-6' : 'px-0 pt-1 pb-3 top-0'
          } flex items-center justify-center relative perspective-book transform-style-3d ${
            activeAirplaneNote ? 'z-30' : ''
          }`}
        >
          {isDesktop ? (
            /* ============================================================== */
            /* DESKTOP: 3D REALISTIC PHYSICAL BOOK SPREAD (976px x 642px)     */
            /* ============================================================== */
            <div
              ref={desktopBookStageRef}
              className="relative w-[976px] h-[642px] shrink-0 transform-style-3d"
              style={{
                willChange: 'transform',
              }}
            >
              {/* Ground Drop Shadow on Desk (synced 1:1 with cover swing) */}
              <div
                ref={groundShadowRef}
                className="pointer-events-none absolute -bottom-6 h-16 rounded-full"
                style={{
                  background:
                    'radial-gradient(ellipse at 50% 50%, rgba(18, 13, 8, 0.5) 0%, rgba(18, 13, 8, 0.22) 52%, transparent 76%)',
                  filter: 'blur(20px)',
                  transform: 'translateZ(-24px)',
                }}
                aria-hidden="true"
              />

              {/* Inner coordinate reference box for 2-page curl math (948px x 614px) */}
              <div
                ref={spreadInnerRef}
                className="pointer-events-none absolute"
                style={{
                  left: `${COVER_PAD}px`,
                  top: `${COVER_PAD}px`,
                  width: `${PAGE_W * 2 + SPINE_W}px`,
                  height: `${PAGE_H}px`,
                }}
                aria-hidden="true"
              />

              {/* Flat 2D Open-Book Plane (prevents 3D preserve-3d plane-splitting shifts between resting & turning states) */}
              <div className="absolute inset-0">
                {/* LEFT HARDCOVER BOARD (Visible once cover settles at -180deg) */}
                <div
                  ref={leftHalfRef}
                  className="absolute left-0 top-0 w-[488px] h-full bg-ink rounded-l-xl shadow-[0_18px_40px_rgba(0,0,0,0.38),inset_0_0_0_1px_rgba(255,255,255,0.06)]"
                >
                  {/* Resting Left Book Page */}
                  <section
                    aria-label={`Book Page ${leftPageIndex + 1}`}
                    className="absolute top-[14px] left-[14px] w-[474px] h-[614px] z-10"
                  >
                    <div
                      className="w-full h-full"
                      style={{
                        opacity: activeTurn?.direction === 'prev' ? 0 : 1,
                      }}
                    >
                      <NotebookSheet
                        side="left"
                        pageIndex={leftPageIndex}
                        totalPages={TOTAL_PAGES}
                        interactive={isBookOpen && !activeTurn}
                        onPrev={handlePrev}
                      >
                        {renderPageContent(leftPageIndex)}
                      </NotebookSheet>
                    </div>

                    {/* Left Outer Margin & Corner Drag Handles */}
                    {canPrev && isBookOpen && (
                      <>
                        <div
                          className="page-drag-zone absolute left-0 top-14 bottom-14 w-8 z-30"
                          {...makeEdgeDragProps('prev')}
                          title="Drag page edge to turn back"
                        />
                        <div
                          className="page-drag-zone absolute left-0 top-0 w-12 h-14 z-40"
                          {...makeEdgeDragProps('prev', 'top')}
                          title="Hover or drag corner to turn back"
                        />
                        <div
                          className="page-drag-zone absolute left-0 bottom-0 w-11 h-14 z-40"
                          {...makeEdgeDragProps('prev', 'bottom')}
                          title="Hover or drag corner to turn back"
                        />
                      </>
                    )}
                  </section>
                </div>

                {/* RIGHT HARDCOVER BACK BOARD (Always physically solid — ZERO crossfade!) */}
                <div
                  className={`absolute left-[488px] top-0 w-[488px] h-full bg-ink rounded-r-xl rounded-l-[3px] shadow-[0_18px_42px_rgba(0,0,0,0.42),0_6px_14px_rgba(0,0,0,0.26),inset_0_0_0_1px_rgba(255,255,255,0.06)] ${
                    !isBookOpen ? 'pointer-events-none' : ''
                  }`}
                >
                  {/* Resting Right Book Page (Page 2 lies physically beneath the front cover!) */}
                  <section
                    aria-label={`Book Page ${rightPageIndex + 1}`}
                    className="absolute top-[14px] left-0 w-[474px] h-[614px] z-10"
                  >
                    {/* Matte-black inside back hardcover liner exposed when Page 12 is ripped out */}
                    {rightPageIndex === TOTAL_PAGES - 1 && (
                      <div
                        className="pointer-events-none absolute inset-0 rounded-r-sm bg-[#141313] shadow-[inset_10px_0_24px_rgba(0,0,0,0.82)]"
                        aria-hidden="true"
                      >
                        <div className="absolute inset-[10px] left-[16px] rounded-r-xs border border-dashed border-white/[0.08]" />
                      </div>
                    )}

                    <div
                      className="relative w-full h-full z-10"
                      style={{
                        opacity: activeTurn?.direction === 'next' ? 0 : 1,
                        visibility:
                          activeAirplaneNote && rightPageIndex === TOTAL_PAGES - 1
                            ? 'hidden'
                            : 'visible',
                      }}
                    >
                      <NotebookSheet
                        side="right"
                        pageIndex={rightPageIndex}
                        totalPages={TOTAL_PAGES}
                        interactive={isBookOpen && !activeTurn && !activeAirplaneNote}
                        onNext={handleNext}
                      >
                        {renderPageContent(rightPageIndex)}
                      </NotebookSheet>
                      {rightPageIndex === TOTAL_PAGES - 1 &&
                        hasRippedNoteStub &&
                        !activeAirplaneNote && (
                          <>
                            <TornSpineStub />
                            <SpineReplacementTapes />
                          </>
                        )}
                    </div>

                    {/* Directional shadow cast onto Page 2 by the front hardcover lid */}
                    <div
                      ref={rightCoverShadowRef}
                      className="pointer-events-none absolute inset-0 z-40 rounded-r-sm"
                      style={{
                        background:
                          'linear-gradient(to right, rgba(10, 7, 5, 0.92) 0%, rgba(14, 10, 7, 0.72) 46%, rgba(18, 13, 9, 0.42) 100%)',
                      }}
                      aria-hidden="true"
                    />

                    {/* Right Outer Margin & Corner Drag Handles */}
                    {canNext && isBookOpen && (
                      <>
                        <div
                          className="page-drag-zone absolute right-0 top-14 bottom-14 w-8 z-30"
                          {...makeEdgeDragProps('next')}
                          title="Drag page edge to flip page"
                        />
                        <div
                          className="page-drag-zone absolute right-0 top-0 w-12 h-14 z-40"
                          {...makeEdgeDragProps('next', 'top')}
                          title="Hover or drag corner to flip page"
                        />
                        <div
                          className="page-drag-zone absolute right-0 bottom-0 w-11 h-14 z-40"
                          {...makeEdgeDragProps('next', 'bottom')}
                          title="Hover or drag corner to flip page"
                        />
                      </>
                    )}
                  </section>
                </div>

                {/* BOUND HARDCOVER BOOK SEWN CENTER SPINE SEAM & HEADBANDS */}
                <div
                  ref={spineBindingRef}
                  className="pointer-events-none absolute left-[488px] -translate-x-1/2 top-[6px] bottom-[6px] w-[12px] z-30 select-none"
                  aria-hidden="true"
                >
                  {/* Top woven crimson & black bookbinder headband */}
                  <div
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-[10px] h-[8px] rounded-t-xs border border-black/70 shadow-2xs"
                    style={{
                      backgroundImage:
                        'repeating-linear-gradient(to right, #c4202a 0px, #c4202a 2px, #191214 2px, #191214 4px)',
                    }}
                  />
                  {/* Crisp sewn center crease line */}
                  <div className="absolute left-1/2 -translate-x-1/2 top-[8px] bottom-[8px] w-[1px] bg-[#140f0a]/45" />
                  {/* Bottom woven crimson & black bookbinder tailband */}
                  <div
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[10px] h-[8px] rounded-b-xs border border-black/70 shadow-2xs"
                    style={{
                      backgroundImage:
                        'repeating-linear-gradient(to right, #c4202a 0px, #c4202a 2px, #191214 2px, #191214 4px)',
                    }}
                  />
                </div>

                {/* REAL-TIME CONICAL / CYLINDRICAL PAPER CURL ENGINE */}
                {activeTurn && turnSheets && (
                  <BookLeafTurn
                    direction={activeTurn.direction}
                    isDesktop={true}
                    pageW={PAGE_W}
                    pageH={PAGE_H}
                    spineW={SPINE_W}
                    offsetLeft={COVER_PAD}
                    offsetTop={COVER_PAD}
                    frontSheet={turnSheets.frontSheet}
                    backSheet={turnSheets.backSheet}
                    underSheet={turnSheets.backSheet ? turnSheets.underSheet : null}
                    registerFrameListener={pageTurn.registerFrameListener}
                    getCurrentCurl={pageTurn.getCurrentCurl}
                  />
                )}
              </div>

              {/* 3D HINGED HARDCOVER (Opens directly into Page 1 on its inner face!) */}
              <BookCover3D
                isOpen={isBookOpen}
                onOpen={openBook}
                isDesktop={true}
                onProgressChange={syncCoverPhysics}
                interiorLeftPage={
                  <NotebookSheet
                    side="left"
                    pageIndex={leftPageIndex}
                    totalPages={TOTAL_PAGES}
                    interactive={false}
                  >
                    {renderPageContent(leftPageIndex)}
                  </NotebookSheet>
                }
              />

              {/* 3D PAGE RIP, ORIGAMI AIRPLANE FOLD & LAUNCH OVERLAY */}
              {activeAirplaneNote && rightPageIndex === TOTAL_PAGES - 1 && (
                <PaperAirplaneFlight
                  key={activeAirplaneNote.id}
                  snapshot={activeAirplaneNote}
                  isDesktop={true}
                  pageW={PAGE_W}
                  pageH={PAGE_H}
                  offsetLeft={488}
                  offsetTop={COVER_PAD}
                  totalPages={TOTAL_PAGES}
                  exitX={airplaneExitX}
                  exitY={airplaneExitY}
                  onComplete={handleAirplaneComplete}
                />
              )}
            </div>
          ) : (
            /* ============================================================== */
            /* MOBILE: SINGLE PAGE 3D BOOK WITH PAPER CURL & SOLID COVER      */
            /* ============================================================== */
            <div
              className="relative shrink-0 transform-style-3d"
              style={{
                width: `${MOBILE_BOOK_W}px`,
                height: `${MOBILE_BOOK_H}px`,
              }}
            >
              {/* Ground Drop Shadow under Mobile Book */}
              <div
                className="pointer-events-none absolute -bottom-6 inset-x-2 h-16 rounded-full"
                style={{
                  background:
                    'radial-gradient(ellipse at 50% 50%, rgba(18, 13, 8, 0.5) 0%, rgba(18, 13, 8, 0.22) 52%, transparent 76%)',
                  filter: 'blur(18px)',
                  transform: 'translateZ(-20px)',
                }}
                aria-hidden="true"
              />

              {/* Solid Hardcover Back Board (494px x 642px) */}
              <div
                className={`relative w-full h-full bg-ink rounded-r-xl rounded-l-xs shadow-[0_18px_42px_rgba(0,0,0,0.42),0_6px_14px_rgba(0,0,0,0.26),inset_0_0_0_1px_rgba(255,255,255,0.06)] ${
                  !isBookOpen ? 'pointer-events-none' : ''
                }`}
              >
                {/* Bound hardcover sewn spine edge + top headband & bottom tailband */}
                <div
                  className="pointer-events-none absolute left-0 top-[6px] bottom-[6px] w-[6px] z-30 select-none"
                  aria-hidden="true"
                >
                  {/* Top woven crimson & black headband */}
                  <div
                    className="absolute top-0 left-0 w-[6px] h-[8px] rounded-tl-xs border border-black/70 shadow-2xs"
                    style={{
                      backgroundImage:
                        'repeating-linear-gradient(to right, #c4202a 0px, #c4202a 2px, #191214 2px, #191214 4px)',
                    }}
                  />
                  {/* Sewn crease line */}
                  <div className="absolute left-[5px] top-[8px] bottom-[8px] w-[1px] bg-[#140f0a]/60" />
                  {/* Bottom woven crimson & black tailband */}
                  <div
                    className="absolute bottom-0 left-0 w-[6px] h-[8px] rounded-bl-xs border border-black/70 shadow-2xs"
                    style={{
                      backgroundImage:
                        'repeating-linear-gradient(to right, #c4202a 0px, #c4202a 2px, #191214 2px, #191214 4px)',
                    }}
                  />
                </div>

                {/* Single Resting Book Page (474px x 614px matching desktop right page) */}
                <section
                  ref={mobileInnerRef}
                  aria-label={`Book Page ${currentPage + 1}`}
                  onTouchStart={handleMobileTouchStart}
                  onTouchEnd={handleMobileTouchEnd}
                  className="absolute left-[6px] top-[14px] w-[474px] h-[614px] z-10"
                >
                  {/* Matte-black inside back liner exposed when Page 12 is ripped */}
                  {currentPage === TOTAL_PAGES - 1 && (
                    <div
                      className="pointer-events-none absolute inset-0 rounded-r-sm bg-[#141313] shadow-[inset_10px_0_24px_rgba(0,0,0,0.82)]"
                      aria-hidden="true"
                    >
                      <div className="absolute inset-[10px] left-[16px] rounded-r-xs border border-dashed border-white/[0.08]" />
                    </div>
                  )}

                  <div
                    className="relative w-full h-full z-10"
                    style={{
                      opacity: activeTurn?.direction === 'next' ? 0 : 1,
                      visibility:
                        activeAirplaneNote && currentPage === TOTAL_PAGES - 1
                          ? 'hidden'
                          : 'visible',
                    }}
                  >
                    <NotebookSheet
                      side="mobile"
                      pageIndex={currentPage}
                      totalPages={TOTAL_PAGES}
                      interactive={isBookOpen && !activeTurn && !activeAirplaneNote}
                      onPrev={handlePrev}
                      onNext={handleNext}
                    >
                      {renderPageContent(currentPage)}
                    </NotebookSheet>
                    {currentPage === TOTAL_PAGES - 1 &&
                      hasRippedNoteStub &&
                      !activeAirplaneNote && (
                        <>
                          <TornSpineStub />
                          <SpineReplacementTapes />
                        </>
                      )}
                  </div>

                  {/* Cover cast shadow on mobile page */}
                  <div
                    ref={mobileCoverShadowRef}
                    className="pointer-events-none absolute inset-0 z-40 rounded-r-sm"
                    style={{
                      background:
                        'linear-gradient(to right, rgba(10, 7, 5, 0.92) 0%, rgba(14, 10, 7, 0.72) 46%, rgba(18, 13, 9, 0.42) 100%)',
                    }}
                    aria-hidden="true"
                  />

                  {/* Mobile right-edge drag handles for next page turn */}
                  {canNext && isBookOpen && (
                    <>
                      <div
                        className="page-drag-zone absolute right-0 top-14 bottom-14 w-8 z-30"
                        {...makeEdgeDragProps('next')}
                        title="Drag page edge to flip page"
                      />
                      <div
                        className="page-drag-zone absolute right-0 top-0 w-12 h-14 z-40"
                        {...makeEdgeDragProps('next', 'top')}
                        title="Hover or drag corner to flip page"
                      />
                      <div
                        className="page-drag-zone absolute right-0 bottom-0 w-11 h-14 z-40"
                        {...makeEdgeDragProps('next', 'bottom')}
                        title="Hover or drag corner to flip page"
                      />
                    </>
                  )}

                  {/* Mobile left-edge drag handles for prev page turn */}
                  {canPrev && isBookOpen && (
                    <>
                      <div
                        className="page-drag-zone absolute left-0 top-14 bottom-14 w-8 z-30"
                        {...makeEdgeDragProps('prev')}
                        title="Drag page edge to turn back"
                      />
                      <div
                        className="page-drag-zone absolute left-0 top-0 w-12 h-14 z-40"
                        {...makeEdgeDragProps('prev', 'top')}
                        title="Hover or drag corner to turn back"
                      />
                      <div
                        className="page-drag-zone absolute left-0 bottom-0 w-11 h-14 z-40"
                        {...makeEdgeDragProps('prev', 'bottom')}
                        title="Hover or drag corner to turn back"
                      />
                    </>
                  )}
                </section>
              </div>

              {/* Mobile Curved Paper Leaf Turn (474px x 614px) */}
              {activeTurn && turnSheets && (
                <BookLeafTurn
                  direction={activeTurn.direction}
                  isDesktop={false}
                  pageW={PAGE_W}
                  pageH={PAGE_H}
                  spineW={0}
                  offsetLeft={MOBILE_SPINE_W}
                  offsetTop={COVER_PAD}
                  frontSheet={turnSheets.frontSheet}
                  backSheet={turnSheets.backSheet}
                  underSheet={turnSheets.underSheet}
                  registerFrameListener={pageTurn.registerFrameListener}
                  getCurrentCurl={pageTurn.getCurrentCurl}
                />
              )}

              {/* Mobile 3D Hinged Cover */}
              <BookCover3D
                isOpen={isBookOpen}
                onOpen={openBook}
                isDesktop={false}
                onProgressChange={syncCoverPhysics}
              />

              {/* Mobile 3D Page Rip, Origami Airplane Fold & Launch Overlay */}
              {activeAirplaneNote && currentPage === TOTAL_PAGES - 1 && (
                <PaperAirplaneFlight
                  key={activeAirplaneNote.id}
                  snapshot={activeAirplaneNote}
                  isDesktop={false}
                  pageW={PAGE_W}
                  pageH={PAGE_H}
                  offsetLeft={MOBILE_SPINE_W}
                  offsetTop={COVER_PAD}
                  totalPages={TOTAL_PAGES}
                  exitX={airplaneExitX}
                  exitY={airplaneExitY}
                  onComplete={handleAirplaneComplete}
                />
              )}
            </div>
          )}
        </main>

        {/* Bottom Page-Turn Bar */}
        <Footer
          currentPage={currentPage}
          totalPages={TOTAL_PAGES}
          isDesktop={isDesktop}
          isBookOpen={isBookOpen}
          onPrev={handlePrev}
          onNext={handleNext}
          canPrev={canPrev}
          canNext={canNext}
        />
      </div>

      {/* Native Light-Dismiss Dialog for Inspecting Magazine Cutouts */}
      <CutoutModal
        photo={inspectedPhoto}
        onClose={() => setInspectedPhoto(null)}
      />
    </div>
  )
}
