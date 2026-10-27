import { PHYSICAL_LEAVES } from './physicalBookLeaves'
import { tornVariantClass } from './tornEdges'

export interface PhysicalPaperStackProps {
  side: 'left' | 'right'
  currentSpread: number
  isBookOpen: boolean
}

/**
 * 3D Physical Paper Stack Component
 *
 * Renders the real physical leaves lying underneath the active spread:
 * - Left stack: leaves 0..currentSpread-1 (turned sheets lying on the left)
 * - Right stack: leaves 6 down to currentSpread+2 (unturned sheets lying on the right)
 *
 * Each sheet is stationary at its permanent 3D offset with its fixed hand-torn edge.
 */
export default function PhysicalPaperStack({
  side,
  currentSpread,
  isBookOpen,
}: PhysicalPaperStackProps) {
  if (!isBookOpen) return null

  if (side === 'left') {
    // Left stack: leaves 0..currentSpread-1
    // (Spread 0 has 0 turned leaves; Spread 1 has Leaf 0; Spread 2 has Leaf 0 & 1, etc.)
    const leaves = PHYSICAL_LEAVES.filter((l) => l.leafIndex < currentSpread)
    if (leaves.length === 0) return null

    return (
      <>
        {leaves.map((leaf) => {
          const depth = currentSpread - leaf.leafIndex
          const offsetX = leaf.leftOffset.x
          const offsetY = leaf.leftOffset.y
          const bgColor =
            depth === 1
              ? 'bg-[#ebe1cc]'
              : depth === 2
                ? 'bg-[#e6dcbf]'
                : 'bg-[#dfd4ba]'
          const shadow =
            depth >= 3
              ? 'drop-shadow(-2px 3px 4px rgba(18, 14, 10, 0.26))'
              : 'drop-shadow(-1px 1.5px 2px rgba(18, 14, 10, 0.14))'

          return (
            <div
              key={`left-leaf-${leaf.leafIndex}`}
              className="pointer-events-none absolute inset-0 z-0"
              style={{
                transform: `translate3d(${offsetX}px, ${offsetY}px, 0)`,
                filter: shadow,
              }}
              aria-hidden="true"
            >
              <div
                className={`notebook-page notebook-left ${tornVariantClass(leaf.tornVariant)} w-full h-full ${bgColor}`}
              />
            </div>
          )
        })}
      </>
    )
  }

  // Right stack: unturned leaves remaining in the right stack
  // Rendered from bottom to top (leaf 6 at bottom, leaf currentSpread+2 closest to top)
  const leaves = PHYSICAL_LEAVES.filter((l) => l.leafIndex > currentSpread + 1).slice().reverse()
  if (leaves.length === 0) return null

  return (
    <>
      {leaves.map((leaf) => {
        const depth = leaf.leafIndex - (currentSpread + 1)
        const offsetX = leaf.rightOffset.x
        const offsetY = leaf.rightOffset.y
        const bgColor =
          depth === 1
            ? 'bg-[#ebe1cc]'
            : depth === 2
              ? 'bg-[#e6dcbf]'
              : 'bg-[#dfd4ba]'
        const shadow =
          depth >= 3
            ? 'drop-shadow(2px 3px 4px rgba(18, 14, 10, 0.26))'
            : 'drop-shadow(1px 1.5px 2px rgba(18, 14, 10, 0.14))'

        return (
          <div
            key={`right-leaf-${leaf.leafIndex}`}
            className="pointer-events-none absolute inset-0 z-0"
            style={{
              transform: `translate3d(${offsetX}px, ${offsetY}px, 0)`,
              filter: shadow,
            }}
            aria-hidden="true"
          >
            <div
              className={`notebook-page notebook-right ${tornVariantClass(leaf.tornVariant)} w-full h-full ${bgColor}`}
            />
          </div>
        )
      })}
    </>
  )
}
