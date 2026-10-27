import React from 'react'

/** Number of unique hand-torn paper silhouettes; the pattern repeats every N sheets. */
export const TORN_VARIANT_COUNT = 5

/**
 * Returns the physical sheet index (0 to 6) for a given page index in the 12-page book:
 * - Sheet 0: Page 1 (bound to left front cover)
 * - Sheet 1: Page 2 (recto) and Page 3 (verso)
 * - Sheet 2: Page 4 (recto) and Page 5 (verso)
 * - Sheet 3: Page 6 (recto) and Page 7 (verso)
 * - Sheet 4: Page 8 (recto) and Page 9 (verso)
 * - Sheet 5: Page 10 (recto) and Page 11 (verso)
 * - Sheet 6: Page 12 (bound to right back cover)
 */
export function getSheetIndex(pageIndex: number): number {
  if (pageIndex <= 0) return 0
  return Math.floor((pageIndex + 1) / 2)
}

/**
 * Torn-edge variant of a physical sheet.
 * Both the front (recto) and back (verso) of the same physical sheet share the exact
 * same hand-torn silhouette (mirrored left/right), so turning a page never morphs its edge.
 */
export function getTornVariant(pageIndex: number): number {
  const n = TORN_VARIANT_COUNT
  const sheetIndex = getSheetIndex(pageIndex)
  return ((sheetIndex % n) + n) % n
}

/** CSS modifier class that selects the torn silhouette for `.notebook-*` / `.torn-clip-*`. */
export function tornVariantClass(variant: number): string {
  const n = TORN_VARIANT_COUNT
  return `torn-v${((variant % n) + n) % n}`
}

/**
 * Reads the torn variant from a rendered sheet element so page-turn overlays can be
 * clipped to exactly the same silhouette as the sheet itself. Works for
 * `<NotebookSheet pageIndex />` and for plain elements carrying a `torn-vN` class.
 */
export function getSheetTornVariant(node: React.ReactNode): number {
  if (!React.isValidElement(node)) return 0
  const props = node.props as { pageIndex?: unknown; className?: unknown }
  if (typeof props.pageIndex === 'number') return getTornVariant(props.pageIndex)
  if (typeof props.className === 'string') {
    const m = /torn-v(\d+)/.exec(props.className)
    if (m) return Number(m[1])
  }
  return 0
}
