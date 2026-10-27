import { getTornVariant } from './tornEdges'

/**
 * Physical Book Sheet Architecture
 *
 * A physical 12-page notebook bound by sewn center spine consists of 7 physical leaves:
 * - Leaf 0: Attached to left front cover board (Verso: Page 1)
 * - Leaf 1: Recto = Page 2, Verso = Page 3
 * - Leaf 2: Recto = Page 4, Verso = Page 5
 * - Leaf 3: Recto = Page 6, Verso = Page 7
 * - Leaf 4: Recto = Page 8, Verso = Page 9
 * - Leaf 5: Recto = Page 10, Verso = Page 11
 * - Leaf 6: Attached to right back cover board (Recto: Page 12 - airplane note)
 *
 * Each physical leaf has its own permanent hand-torn silhouette (repeating every 5 sheets)
 * and its physical resting offset in 3D space, which never changes.
 */

export interface PhysicalLeafDef {
  leafIndex: number
  rectoPageIndex?: number
  versoPageIndex?: number
  tornVariant: number
  rightOffset: { x: number; y: number }
  leftOffset: { x: number; y: number }
}

export const PHYSICAL_LEAVES: PhysicalLeafDef[] = [
  {
    leafIndex: 0,
    versoPageIndex: 0, // Page 1
    tornVariant: getTornVariant(0), // 0
    rightOffset: { x: 0, y: 0 },
    leftOffset: { x: 0, y: 0 },
  },
  {
    leafIndex: 1,
    rectoPageIndex: 1, // Page 2
    versoPageIndex: 2, // Page 3
    tornVariant: getTornVariant(1), // 1
    rightOffset: { x: 0, y: 0 },
    leftOffset: { x: 0, y: 0 },
  },
  {
    leafIndex: 2,
    rectoPageIndex: 3, // Page 4
    versoPageIndex: 4, // Page 5
    tornVariant: getTornVariant(3), // 2
    rightOffset: { x: 0, y: 0 },
    leftOffset: { x: 0, y: 0 },
  },
  {
    leafIndex: 3,
    rectoPageIndex: 5, // Page 6
    versoPageIndex: 6, // Page 7
    tornVariant: getTornVariant(5), // 3
    rightOffset: { x: 0, y: 0 },
    leftOffset: { x: 0, y: 0 },
  },
  {
    leafIndex: 4,
    rectoPageIndex: 7, // Page 8
    versoPageIndex: 8, // Page 9
    tornVariant: getTornVariant(7), // 4
    rightOffset: { x: 0, y: 0 },
    leftOffset: { x: 0, y: 0 },
  },
  {
    leafIndex: 5,
    rectoPageIndex: 9, // Page 10
    versoPageIndex: 10, // Page 11
    tornVariant: getTornVariant(9), // 0
    rightOffset: { x: 0, y: 0 },
    leftOffset: { x: 0, y: 0 },
  },
  {
    leafIndex: 6,
    rectoPageIndex: 11, // Page 12
    tornVariant: getTornVariant(11), // 1
    rightOffset: { x: 0, y: 0 },
    leftOffset: { x: 0, y: 0 },
  },
]
