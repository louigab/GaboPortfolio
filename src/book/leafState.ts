/** Seven physical leaves: two board-mounted endpapers and five turnable sheets. */
export function sheetForPage(page: number): number {
  return Math.max(0, Math.floor((page + 1) / 2))
}

/** Resting leaves in paint order, bottom first. Visible surfaces are excluded. */
export function stackLeafIds(spread: number, side: 'left' | 'right', excluded: readonly number[] = []): number[] {
  const ids = side === 'left'
    ? Array.from({ length: spread }, (_, i) => i)
    : Array.from({ length: Math.max(0, 5 - spread) }, (_, i) => 6 - i)
  return ids.filter(id => !excluded.includes(id))
}

export function transferLeafIds(from: number, to: number): number[] {
  return Array.from({ length: Math.abs(to - from) }, (_, i) => to > from ? from + i + 1 : from - i)
}

/** The compact viewport shows one face; its pile still belongs to that face's real side. */
export function singlePageStackIds(pageIndex: number, excluded: readonly number[] = []): number[] {
  return stackLeafIds(Math.floor(pageIndex / 2), pageIndex % 2 === 0 ? 'left' : 'right', excluded)
}
