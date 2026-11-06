import { PHYSICAL_LEAVES } from './physicalBookLeaves'
import { singlePageStackIds, stackLeafIds } from './leafState'
import { tornVariantClass } from './tornEdges'

export interface PhysicalPaperStackProps {
  side: 'left' | 'right'
  currentSpread: number
  isBookOpen: boolean
  excludedLeafIds?: readonly number[]
  pageIndex?: number
}

/** Only stationary physical sheets. Moving/revealed surfaces belong to the turn renderer. */
export default function PhysicalPaperStack({ side, currentSpread, isBookOpen, excludedLeafIds = [], pageIndex }: PhysicalPaperStackProps) {
  if (!isBookOpen) return null
  const ids = pageIndex === undefined
    ? stackLeafIds(currentSpread, side, excludedLeafIds)
    : singlePageStackIds(pageIndex, excludedLeafIds)
  if (!ids.length) return null
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true" data-paper-stack={side}>
      {ids.map((id, index) => {
        const leaf = PHYSICAL_LEAVES[id]
        const depth = ids.length - index
        return (
          <div key={id} data-leaf-id={id}
            className={`paper-stack-sheet absolute inset-0 torn-clip-${side} ${tornVariantClass(leaf.tornVariant)}`}
            style={{
              transform: `translate(${(side === 'left' ? -1 : 1) * depth * .24}px, ${depth * .08}px)`,
              backgroundColor: depth === 1 ? '#eee5d0' : '#e6dcc6',
              zIndex: index,
            }} />
        )
      })}
    </div>
  )
}
