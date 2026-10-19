import { useEffect, useRef } from 'react'
import type { InspectablePhoto } from './MagazineCutout'
import { DoodleTape, SketchUnderline } from './InkDoodles'

interface CutoutModalProps {
  photo: InspectablePhoto | null
  onClose: () => void
}

const MODAL_TORN_POINTS =
  '2,5 16,1 29,6 44,2 60,7 75,1 91,6 108,2 124,7 140,1 156,6 171,2 185,7 198,3 195,18 199,33 194,48 199,63 193,78 198,95 193,112 199,128 194,145 198,162 193,178 198,194 183,198 168,193 152,199 136,193 120,198 104,192 88,199 72,193 56,198 40,192 25,199 11,193 2,197 6,181 1,165 7,149 2,133 6,117 1,101 7,85 2,69 6,53 1,37 7,21'

export default function CutoutModal({ photo, onClose }: CutoutModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (photo) {
      if (!dialog.open) {
        dialog.showModal()
      }
    } else if (dialog.open) {
      dialog.close()
    }
  }, [photo])

  // Fallback for browsers without native closedby="any" support (modern-web-guidance: light-dismiss-a-dialog)
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    const handleClose = () => {
      onClose()
    }

    const handleClick = (event: MouseEvent) => {
      if ('closedBy' in HTMLDialogElement.prototype) return
      if (event.target !== dialog) return
      const rect = dialog.getBoundingClientRect()
      const isDialogContent =
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width

      if (!isDialogContent) {
        dialog.close()
      }
    }

    dialog.addEventListener('close', handleClose)
    dialog.addEventListener('click', handleClick)
    return () => {
      dialog.removeEventListener('close', handleClose)
      dialog.removeEventListener('click', handleClick)
    }
  }, [onClose])

  return (
    <dialog
      ref={dialogRef}
      closedby="any"
      aria-labelledby="cutout-dialog-title"
      className="cutout-dialog m-auto bg-transparent p-4 max-w-2xl w-[92vw] overflow-visible"
    >
      {photo && (
        <div className="relative p-5 sm:p-7">
          {/* Jagged torn-paper backing */}
          <svg
            viewBox="0 0 200 200"
            preserveAspectRatio="none"
            className="absolute inset-0 w-full h-full pointer-events-none z-0 drop-shadow-[4px_6px_8px_rgba(17,17,17,0.5)]"
            aria-hidden="true"
          >
            <polygon points={MODAL_TORN_POINTS} fill="#fcfaf5" stroke="#111111" strokeWidth="1.5" />
          </svg>

          {/* Frayed masking tape strips on top & corners */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
            <DoodleTape rotate={-2} className="w-28 h-8" variant="red" />
          </div>
          <div className="absolute -top-2 -left-3 z-20 pointer-events-none">
            <DoodleTape rotate={-34} className="w-20 h-6" variant="beige" />
          </div>
          <div className="absolute -bottom-2 -right-3 z-20 pointer-events-none">
            <DoodleTape rotate={-32} className="w-20 h-6" variant="beige" />
          </div>

          <div className="relative z-10">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <h3 id="cutout-dialog-title" className="hand text-2xl sm:text-3xl font-bold text-ink leading-none">
                  {photo.title}
                </h3>
                <SketchUnderline className="w-full h-3 mt-1" color="red" />
              </div>
              <form method="dialog">
                <button
                  type="submit"
                  className="btn hand text-lg font-bold px-3.5 py-1 bg-crimson text-paper ink-pill cursor-pointer -rotate-2"
                >
                  Close [Esc]
                </button>
              </form>
            </div>

            <div className="bg-paper-2 p-2 border border-ink/20">
              <img
                src={photo.src}
                alt={photo.title}
                className="w-full max-h-[60dvh] object-contain mx-auto block"
              />
            </div>

            <p className="hand text-xl font-bold text-ink text-center mt-3">{photo.caption}</p>
          </div>
        </div>
      )}
    </dialog>
  )
}
