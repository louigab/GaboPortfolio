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
import type { InspectablePhoto } from './components/MagazineCutout'
import BookCover3D from './book/BookCover3D'
import BookLeafTurn from './book/BookLeafTurn'
import BookRiffle, { type BookRiffleLeaf } from './book/BookRiffle'
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

interface ActiveRiffleState {
  direction: TurnDirection
  targetPage: number
  leaves: BookRiffleLeaf[]
  underSheet: React.ReactNode | null
}

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

  // Closed book physical initial state (starts closed; opens immediately only if URL page parameter or ?open=1 is set)
  const [isBookOpen, setIsBookOpen] = useState(() => {
    if (typeof window === 'undefined') return false
    const search = new URLSearchParams(window.location.search)
    if (search.has('open') || search.get('open') === 'true' || search.get('open') === '1') return true
    const p = Number(search.get('page'))
    return Number.isFinite(p) && p > 0
  })

  // Tracks whether the 3D cover has fully settled into its open position (waits for full swing completion)
  const [isBookFullyOpen, setIsBookFullyOpen] = useState(() => isBookOpen)
  const [prevIsBookOpen, setPrevIsBookOpen] = useState(isBookOpen)
  if (prevIsBookOpen !== isBookOpen) {
    setPrevIsBookOpen(isBookOpen)
    if (!isBookOpen) {
      setIsBookFullyOpen(false)
    }
  }

  // Multi-page cascading riffle state & instant destination tab selection
  const [activeRiffle, setActiveRiffle] = useState<ActiveRiffleState | null>(null)
  const [navActivePage, setNavActivePage] = useState<number | null>(null)
  const goToPageRef = useRef<(targetPage: number) => void>(() => {})

  const handleCoverSettled = useCallback((settledOpen: boolean) => {
    setIsBookFullyOpen(settledOpen)
  }, [])

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
    if (isDesktop) {
      syncCoverPhysics(coverProgressRef.current)
    } else if (desktopBookStageRef.current) {
      desktopBookStageRef.current.style.transform = ''
    }
  }, [isDesktop, syncCoverPhysics])

  const onCommitTurn = useCallback(
    (dir: TurnDirection, targetPage?: number) => {
      let committedPage = targetPage
      setCurrentPage((prev) => {
        if (targetPage !== undefined) {
          if (!isDesktop && targetPage === BLANK_PAGE_INDEX) {
            committedPage = dir === 'next' ? 10 : 8
            return committedPage
          }
          committedPage = clamp(targetPage, 0, TOTAL_PAGES - 1)
          return committedPage
        }
        if (isDesktop) {
          const base = Math.floor(prev / 2) * 2
          committedPage =
            dir === 'next'
              ? Math.min(TOTAL_PAGES - 1, base + 2)
              : Math.max(0, base - 2)
          return committedPage
        }
        committedPage = getAdjacentSinglePage(prev, dir)
        return committedPage
      })
      setFlipTrigger((n) => n + 1)
      setNavActivePage(null)
    },
    [isDesktop]
  )

  const handleRiffleComplete = useCallback(() => {
    setActiveRiffle((curr) => {
      if (curr) {
        setCurrentPage(curr.targetPage)
      }
      return null
    })
    setNavActivePage(null)
    setFlipTrigger((n) => n + 1)
  }, [])

  const renderPageContent = useCallback(
    (pageIdx: number) => {
      switch (pageIdx) {
        case 0:
          return (
            <Hero
              onGoToPage={(p) => goToPageRef.current(p)}
              flipTrigger={flipTrigger}
              isDesktop={isDesktop}
            />
          )
        case 1:
          return (
            <About
              onGoToPage={(p) => goToPageRef.current(p)}
              onInspectPhoto={setInspectedPhoto}
            />
          )
        case 2:
          return <TechStackPageLeft />
        case 3:
          return <TechStackPageRight />
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
    },
    [certPageIdx, flipTrigger, handleNoteSent, isDesktop]
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
      if (activeAirplaneNote || activeRiffle) return
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

      if (normalized === currentNormalized) {
        if (currentPage !== clamped) {
          setCurrentPage(clamped)
        }
        setNavActivePage(null)
        return
      }

      // Immediately activate the target tab in the navigation bar!
      setNavActivePage(clamped)

      if (
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ) {
        setCurrentPage(clamped)
        setNavActivePage(null)
        return
      }

      if (isDesktop) {
        const fromSpread = Math.floor(leftPageIndex / 2)
        const toSpread = Math.floor(clamped / 2)
        const spreadDiff = toSpread - fromSpread
        const dir: TurnDirection = spreadDiff > 0 ? 'next' : 'prev'
        const dist = Math.abs(spreadDiff)

        if (dist === 1) {
          // Adjacent spread: smooth single-page turn
          pageTurn.triggerFlip(dir, {
            targetPage: clamped,
            corner: 'bottom',
            duration: 620,
          })
          return
        }

        // Non-adjacent spreads: multi-leaf cascading riffle through all intermediate pages!
        const leaves: BookRiffleLeaf[] = []
        if (dir === 'next') {
          for (let i = 0; i < dist; i++) {
            const frontIdx = (fromSpread + i) * 2 + 1
            const backIdx = (fromSpread + i + 1) * 2
            leaves.push({
              frontSheet: (
                <NotebookSheet
                  side="right"
                  pageIndex={frontIdx}
                  totalPages={TOTAL_PAGES}
                  interactive={false}
                >
                  {renderPageContent(frontIdx)}
                </NotebookSheet>
              ),
              backSheet: (
                <NotebookSheet
                  side="left"
                  pageIndex={backIdx}
                  totalPages={TOTAL_PAGES}
                  interactive={false}
                >
                  {renderPageContent(backIdx)}
                </NotebookSheet>
              ),
            })
          }
          const destRight = Math.min(TOTAL_PAGES - 1, toSpread * 2 + 1)
          const underSheet = (
            <NotebookSheet
              side="right"
              pageIndex={destRight}
              totalPages={TOTAL_PAGES}
              interactive={false}
            >
              {renderPageContent(destRight)}
            </NotebookSheet>
          )
          setActiveRiffle({
            direction: dir,
            targetPage: clamped,
            leaves,
            underSheet,
          })
        } else {
          for (let i = 0; i < dist; i++) {
            const frontIdx = (fromSpread - i) * 2
            const backIdx = (fromSpread - i - 1) * 2 + 1
            leaves.push({
              frontSheet: (
                <NotebookSheet
                  side="left"
                  pageIndex={frontIdx}
                  totalPages={TOTAL_PAGES}
                  interactive={false}
                >
                  {renderPageContent(frontIdx)}
                </NotebookSheet>
              ),
              backSheet: (
                <NotebookSheet
                  side="right"
                  pageIndex={backIdx}
                  totalPages={TOTAL_PAGES}
                  interactive={false}
                >
                  {renderPageContent(backIdx)}
                </NotebookSheet>
              ),
            })
          }
          const destLeft = toSpread * 2
          const underSheet = (
            <NotebookSheet
              side="left"
              pageIndex={destLeft}
              totalPages={TOTAL_PAGES}
              interactive={false}
            >
              {renderPageContent(destLeft)}
            </NotebookSheet>
          )
          setActiveRiffle({
            direction: dir,
            targetPage: clamped,
            leaves,
            underSheet,
          })
        }
      } else {
        // Mobile 1-page mode
        const validPages = [0, 1, 2, 3, 4, 5, 6, 7, 8, 10, 11]
        const fromIdx = validPages.indexOf(currentPage)
        const toIdx = validPages.indexOf(clamped)
        const pageDiff =
          fromIdx !== -1 && toIdx !== -1 ? toIdx - fromIdx : clamped - currentPage
        const dir: TurnDirection = pageDiff > 0 ? 'next' : 'prev'
        const dist = Math.abs(pageDiff)

        if (dist <= 1) {
          pageTurn.triggerFlip(dir, {
            targetPage: clamped,
            corner: 'bottom',
            duration: 620,
          })
          return
        }

        const leaves: BookRiffleLeaf[] = []
        if (dir === 'next') {
          for (let i = 0; i < dist; i++) {
            const frontPage = validPages[fromIdx + i]
            const backPage = validPages[fromIdx + i + 1]
            leaves.push({
              frontSheet: (
                <NotebookSheet
                  side="mobile"
                  pageIndex={frontPage}
                  totalPages={TOTAL_PAGES}
                  interactive={false}
                >
                  {renderPageContent(frontPage)}
                </NotebookSheet>
              ),
              backSheet: (
                <NotebookSheet
                  side="mobile"
                  pageIndex={backPage}
                  totalPages={TOTAL_PAGES}
                  interactive={false}
                >
                  {renderPageContent(backPage)}
                </NotebookSheet>
              ),
            })
          }
          const underSheet = (
            <NotebookSheet
              side="mobile"
              pageIndex={clamped}
              totalPages={TOTAL_PAGES}
              interactive={false}
            >
              {renderPageContent(clamped)}
            </NotebookSheet>
          )
          setActiveRiffle({
            direction: dir,
            targetPage: clamped,
            leaves,
            underSheet,
          })
        } else {
          for (let i = 0; i < dist; i++) {
            const frontPage = validPages[fromIdx - i]
            const backPage = validPages[fromIdx - i - 1]
            leaves.push({
              frontSheet: (
                <NotebookSheet
                  side="mobile"
                  pageIndex={frontPage}
                  totalPages={TOTAL_PAGES}
                  interactive={false}
                >
                  {renderPageContent(frontPage)}
                </NotebookSheet>
              ),
              backSheet: (
                <NotebookSheet
                  side="mobile"
                  pageIndex={backPage}
                  totalPages={TOTAL_PAGES}
                  interactive={false}
                >
                  {renderPageContent(backPage)}
                </NotebookSheet>
              ),
            })
          }
          const underSheet = (
            <NotebookSheet
              side="mobile"
              pageIndex={clamped}
              totalPages={TOTAL_PAGES}
              interactive={false}
            >
              {renderPageContent(clamped)}
            </NotebookSheet>
          )
          setActiveRiffle({
            direction: dir,
            targetPage: clamped,
            leaves,
            underSheet,
          })
        }
      }
    },
    [
      activeAirplaneNote,
      activeRiffle,
      currentPage,
      isBookOpen,
      isDesktop,
      leftPageIndex,
      pageTurn,
      renderPageContent,
    ]
  )

  useLayoutEffect(() => {
    goToPageRef.current = goToPage
  })

  const handleNext = useCallback(() => {
    if (activeAirplaneNote || activeRiffle) return
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
  }, [activeAirplaneNote, activeRiffle, canNext, isBookOpen, pageTurn, triggerBoundaryNudge])

  const handlePrev = useCallback(() => {
    if (activeAirplaneNote || activeRiffle) return
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
  }, [activeAirplaneNote, activeRiffle, canPrev, isBookOpen, pageTurn, triggerBoundaryNudge])

  const openBook = useCallback(() => {
    hasOpenedInitially.current = true
    setIsBookOpen(true)
  }, [])

  const toggleCover = useCallback(() => {
    if (activeAirplaneNote) return
    setActiveRiffle(null)
    setNavActivePage(null)
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
          if (isBookOpen && !activeAirplaneNote && !activeRiffle) {
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
      if (!isBookOpen || activeAirplaneNote || activeRiffle) return
      e.stopPropagation()
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

  const isFormTarget = (target: EventTarget | null): boolean => {
    if (!target || !(target instanceof HTMLElement)) return false
    const tag = target.tagName.toLowerCase()
    return (
      tag === 'input' ||
      tag === 'textarea' ||
      tag === 'select' ||
      target.isContentEditable ||
      !!target.closest('input, textarea, select, [contenteditable="true"]')
    )
  }

  // Mobile horizontal swipe gesture recognition (touch & pointer safe)
  const mobileSwipeStartRef = useRef<{
    x: number
    y: number
    time: number
    isForm: boolean
  } | null>(null)

  const handleMobileTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1 || !isBookOpen || activeAirplaneNote || inspectedPhoto) {
      mobileSwipeStartRef.current = null
      return
    }
    const t = e.touches[0]
    mobileSwipeStartRef.current = {
      x: t.clientX,
      y: t.clientY,
      time: performance.now(),
      isForm: isFormTarget(e.target),
    }
  }

  const handleMobileTouchEnd = (e: React.TouchEvent) => {
    const start = mobileSwipeStartRef.current
    mobileSwipeStartRef.current = null

    if (
      !start ||
      start.isForm ||
      pageTurn.isDragging ||
      !isBookOpen ||
      activeAirplaneNote ||
      inspectedPhoto
    ) {
      return
    }

    if (e.changedTouches.length === 0) return
    const touch = e.changedTouches[0]
    const dx = touch.clientX - start.x
    const dy = touch.clientY - start.y
    const dt = performance.now() - start.time

    const absX = Math.abs(dx)
    const absY = Math.abs(dy)
    const isHorizontal = absX > absY * 1.1

    const isFlick = absX >= 28 && dt < 450 && absX / dt >= 0.16
    const isSwipe = absX >= 40 && dt < 750
    const isDeliberate = absX >= 68 && dt < 1000

    if (isHorizontal && (isFlick || isSwipe || isDeliberate)) {
      if (dx < 0) {
        if (canNext) {
          handleNext()
        } else {
          triggerBoundaryNudge('next')
        }
      } else {
        if (canPrev) {
          handlePrev()
        } else {
          triggerBoundaryNudge('prev')
        }
      }
    }
  }

  const handleMobileTouchCancel = () => {
    mobileSwipeStartRef.current = null
  }

  const handleMobilePointerDown = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return
    if (!isBookOpen || activeAirplaneNote || inspectedPhoto) return
    mobileSwipeStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      time: performance.now(),
      isForm: isFormTarget(e.target),
    }
  }

  const handleMobilePointerUp = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return
    const start = mobileSwipeStartRef.current
    mobileSwipeStartRef.current = null

    if (
      !start ||
      start.isForm ||
      pageTurn.isDragging ||
      !isBookOpen ||
      activeAirplaneNote ||
      inspectedPhoto
    ) {
      return
    }

    const dx = e.clientX - start.x
    const dy = e.clientY - start.y
    const dt = performance.now() - start.time

    const absX = Math.abs(dx)
    const absY = Math.abs(dy)
    const isHorizontal = absX > absY * 1.1

    const isFlick = absX >= 28 && dt < 450 && absX / dt >= 0.16
    const isSwipe = absX >= 40 && dt < 750
    const isDeliberate = absX >= 68 && dt < 1000

    if (isHorizontal && (isFlick || isSwipe || isDeliberate)) {
      if (dx < 0) {
        if (canNext) {
          handleNext()
        } else {
          triggerBoundaryNudge('next')
        }
      } else {
        if (canPrev) {
          handlePrev()
        } else {
          triggerBoundaryNudge('prev')
        }
      }
    }
  }

  // Dynamic realistic paper stack depth (0 = empty, 1 = maximum pages)
  const effectivePage = navActivePage ?? currentPage
  const currentSpreadIdx = Math.floor(effectivePage / 2)
  const leftPaperStackRatio = isBookOpen ? currentSpreadIdx / 5 : 0
  const rightPaperStackRatio = isBookOpen ? (5 - currentSpreadIdx) / 5 : 1
  const mobilePaperStackRatio = isBookOpen
    ? (TOTAL_PAGES - 1 - effectivePage) / (TOTAL_PAGES - 1)
    : 1

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
        className="flex flex-col items-center justify-center shrink-0 relative"
      >
        {/* Top Notebook Index Bookmark Tabs */}
        <Nav
          currentPage={navActivePage ?? currentPage}
          isDesktop={isDesktop}
          onGoToPage={goToPage}
          flipTrigger={flipTrigger}
          isBookOpen={isBookOpen}
          isBookFullyOpen={isBookFullyOpen}
        />

        {/* Main 3D Perspective Book Stage */}
        <main
          id="main"
          ref={bookRef}
          className={`w-full flex items-center justify-center relative perspective-book transform-style-3d ${
            activeAirplaneNote ? 'z-30' : 'z-10'
          }`}
        >
          {isDesktop ? (
            /* ============================================================== */
            /* DESKTOP: 3D REALISTIC PHYSICAL BOOK SPREAD (976px x 642px)     */
            /* ============================================================== */
            <div
              key="desktop-stage"
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
              <div
                className={`absolute inset-0 ${!isBookOpen ? 'pointer-events-none' : ''}`}
                style={{ zIndex: 20 }}
              >
                {/* LEFT HARDCOVER BOARD (Visible once cover settles at -180deg) */}
                <div
                  ref={leftHalfRef}
                  className="absolute left-0 top-0 w-[488px] h-full bg-ink rounded-l-xl shadow-[0_18px_40px_rgba(0,0,0,0.38),inset_0_0_0_1px_rgba(255,255,255,0.06)]"
                  style={{ zIndex: 10 }}
                >
                  {/* Resting Left Book Page */}
                  <section
                    aria-label={`Book Page ${leftPageIndex + 1}`}
                    className="absolute top-[14px] left-[14px] w-[474px] h-[614px] z-10"
                  >
                    {/* Underlying deckled paper leaves (physical depth for turned pages) */}
                    <div
                      className="pointer-events-none absolute inset-0 z-0 transition-all duration-300 ease-out"
                      style={{
                        opacity: isBookOpen && leftPaperStackRatio > 0.35 ? 1 : 0,
                        transform: `translate3d(${-leftPaperStackRatio * 3.5}px, ${leftPaperStackRatio * 1.5}px, 0)`,
                        filter: 'drop-shadow(-2px 3px 4px rgba(18, 14, 10, 0.28))',
                      }}
                      aria-hidden="true"
                    >
                      <div className="notebook-page notebook-left w-full h-full bg-[#dfd4ba]" />
                    </div>

                    <div
                      className="pointer-events-none absolute inset-0 z-0 transition-all duration-300 ease-out"
                      style={{
                        opacity: isBookOpen && leftPaperStackRatio > 0.05 ? 1 : 0,
                        transform: `translate3d(${-leftPaperStackRatio * 1.8}px, ${leftPaperStackRatio * 0.8}px, 0)`,
                        filter: 'drop-shadow(-1px 2px 2.5px rgba(18, 14, 10, 0.18))',
                      }}
                      aria-hidden="true"
                    >
                      <div className="notebook-page notebook-left w-full h-full bg-[#ebe1cc]" />
                    </div>

                    <div
                      className="relative w-full h-full z-10"
                      style={{
                        opacity:
                          activeTurn?.direction === 'prev' ||
                          activeRiffle?.direction === 'prev'
                            ? 0
                            : 1,
                      }}
                    >
                      <NotebookSheet
                        side="left"
                        pageIndex={leftPageIndex}
                        totalPages={TOTAL_PAGES}
                        interactive={isBookOpen && !activeTurn && !activeRiffle}
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
                  style={{ zIndex: 10 }}
                >
                  {/* Resting Right Book Page (Page 2 lies physically beneath the front cover!) */}
                  <section
                    aria-label={`Book Page ${rightPageIndex + 1}`}
                    className="absolute top-[14px] left-0 w-[474px] h-[614px] z-10"
                  >
                    {/* Underlying deckled paper leaves (physical depth for remaining pages) */}
                    <div
                      className="pointer-events-none absolute inset-0 z-0 transition-all duration-300 ease-out"
                      style={{
                        opacity:
                          isBookOpen &&
                          rightPageIndex < TOTAL_PAGES - 1 &&
                          rightPaperStackRatio > 0.35
                            ? 1
                            : 0,
                        transform: `translate3d(${rightPaperStackRatio * 3.5}px, ${rightPaperStackRatio * 1.5}px, 0)`,
                        filter: 'drop-shadow(2px 3px 4px rgba(18, 14, 10, 0.28))',
                      }}
                      aria-hidden="true"
                    >
                      <div className="notebook-page notebook-right w-full h-full bg-[#dfd4ba]" />
                    </div>

                    <div
                      className="pointer-events-none absolute inset-0 z-0 transition-all duration-300 ease-out"
                      style={{
                        opacity:
                          isBookOpen &&
                          rightPageIndex < TOTAL_PAGES - 1 &&
                          rightPaperStackRatio > 0.05
                            ? 1
                            : 0,
                        transform: `translate3d(${rightPaperStackRatio * 1.8}px, ${rightPaperStackRatio * 0.8}px, 0)`,
                        filter: 'drop-shadow(1px 2px 2.5px rgba(18, 14, 10, 0.18))',
                      }}
                      aria-hidden="true"
                    >
                      <div className="notebook-page notebook-right w-full h-full bg-[#ebe1cc]" />
                    </div>
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
                        opacity:
                          activeTurn?.direction === 'next' ||
                          activeRiffle?.direction === 'next'
                            ? 0
                            : 1,
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
                        interactive={
                          isBookOpen &&
                          !activeTurn &&
                          !activeAirplaneNote &&
                          !activeRiffle
                        }
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
                  className="pointer-events-none absolute left-[488px] -translate-x-1/2 top-[6px] bottom-[6px] w-[12px] z-25 select-none"
                  style={{ zIndex: 25 }}
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

                {/* MULTI-LEAF CASCADING RIFFLE OR REAL-TIME CURL ENGINE */}
                {activeRiffle ? (
                  <BookRiffle
                    direction={activeRiffle.direction}
                    isDesktop={true}
                    pageW={PAGE_W}
                    pageH={PAGE_H}
                    spineW={SPINE_W}
                    offsetLeft={COVER_PAD}
                    offsetTop={COVER_PAD}
                    leaves={activeRiffle.leaves}
                    underSheet={activeRiffle.underSheet}
                    onComplete={handleRiffleComplete}
                  />
                ) : activeTurn && turnSheets ? (
                  <div
                    className="pointer-events-none absolute inset-0 z-50 select-none"
                    style={{ zIndex: 50 }}
                  >
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
                  </div>
                ) : null}
              </div>

              {/* 3D HINGED HARDCOVER (Opens directly into Page 1 on its inner face!) */}
              <BookCover3D
                isOpen={isBookOpen}
                onOpen={openBook}
                onClose={toggleCover}
                isDesktop={true}
                onProgressChange={syncCoverPhysics}
                onCoverSettled={handleCoverSettled}
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
              key="mobile-stage"
              className="relative shrink-0 transform-style-3d touch-pan-y"
              style={{
                width: `${MOBILE_BOOK_W}px`,
                height: `${MOBILE_BOOK_H}px`,
                transform: 'none',
              }}
              onTouchStart={handleMobileTouchStart}
              onTouchEnd={handleMobileTouchEnd}
              onTouchCancel={handleMobileTouchCancel}
              onPointerDown={handleMobilePointerDown}
              onPointerUp={handleMobilePointerUp}
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
                  className="absolute left-[6px] top-[14px] w-[474px] h-[614px] z-10 touch-pan-y"
                >
                  {/* Underlying deckled paper leaves on mobile */}
                  <div
                    className="pointer-events-none absolute inset-0 z-0 transition-all duration-300 ease-out"
                    style={{
                      opacity:
                        isBookOpen &&
                        currentPage < TOTAL_PAGES - 1 &&
                        mobilePaperStackRatio > 0.35
                          ? 1
                          : 0,
                      transform: `translate3d(${mobilePaperStackRatio * 3.5}px, ${mobilePaperStackRatio * 1.5}px, 0)`,
                      filter: 'drop-shadow(2px 3px 4px rgba(18, 14, 10, 0.28))',
                    }}
                    aria-hidden="true"
                  >
                    <div className="notebook-page notebook-right w-full h-full bg-[#dfd4ba]" />
                  </div>

                  <div
                    className="pointer-events-none absolute inset-0 z-0 transition-all duration-300 ease-out"
                    style={{
                      opacity:
                        isBookOpen &&
                        currentPage < TOTAL_PAGES - 1 &&
                        mobilePaperStackRatio > 0.05
                          ? 1
                          : 0,
                      transform: `translate3d(${mobilePaperStackRatio * 1.8}px, ${mobilePaperStackRatio * 0.8}px, 0)`,
                      filter: 'drop-shadow(1px 2px 2.5px rgba(18, 14, 10, 0.18))',
                    }}
                    aria-hidden="true"
                  >
                    <div className="notebook-page notebook-right w-full h-full bg-[#ebe1cc]" />
                  </div>

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
                      opacity:
                        activeTurn?.direction === 'next' || activeRiffle ? 0 : 1,
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
                      interactive={
                        isBookOpen &&
                        !activeTurn &&
                        !activeAirplaneNote &&
                        !activeRiffle
                      }
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

                  {/* Mobile right-edge corner drag handles for next page turn */}
                  {canNext && isBookOpen && (
                    <>
                      <div
                        className="page-drag-zone absolute right-0 top-0 w-14 h-16 z-40"
                        {...makeEdgeDragProps('next', 'top')}
                        title="Swipe or drag corner to flip page"
                      />
                      <div
                        className="page-drag-zone absolute right-0 bottom-0 w-14 h-16 z-40"
                        {...makeEdgeDragProps('next', 'bottom')}
                        title="Swipe or drag corner to flip page"
                      />
                      <div className="dog-ear-curl-cue br" aria-hidden="true" />
                    </>
                  )}

                  {/* Mobile left-edge corner drag handles for prev page turn */}
                  {canPrev && isBookOpen && (
                    <>
                      <div
                        className="page-drag-zone absolute left-0 top-0 w-14 h-16 z-40"
                        {...makeEdgeDragProps('prev', 'top')}
                        title="Swipe or drag corner to turn back"
                      />
                      <div
                        className="page-drag-zone absolute left-0 bottom-0 w-14 h-16 z-40"
                        {...makeEdgeDragProps('prev', 'bottom')}
                        title="Swipe or drag corner to turn back"
                      />
                      <div className="dog-ear-curl-cue bl" aria-hidden="true" />
                    </>
                  )}
                </section>
              </div>

              {/* Mobile Multi-Leaf Cascading Riffle or Curved Paper Leaf Turn */}
              {activeRiffle ? (
                <BookRiffle
                  direction={activeRiffle.direction}
                  isDesktop={false}
                  pageW={PAGE_W}
                  pageH={PAGE_H}
                  spineW={0}
                  offsetLeft={MOBILE_SPINE_W}
                  offsetTop={COVER_PAD}
                  leaves={activeRiffle.leaves}
                  underSheet={activeRiffle.underSheet}
                  onComplete={handleRiffleComplete}
                />
              ) : activeTurn && turnSheets ? (
                <div
                  className="pointer-events-none absolute inset-0 z-50 select-none"
                  style={{ zIndex: 50 }}
                >
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
                </div>
              ) : null}

              {/* Mobile 3D Hinged Cover */}
              <BookCover3D
                isOpen={isBookOpen}
                onOpen={openBook}
                onClose={toggleCover}
                isDesktop={false}
                onProgressChange={syncCoverPhysics}
                onCoverSettled={handleCoverSettled}
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
