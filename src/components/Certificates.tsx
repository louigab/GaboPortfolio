import { useEffect, useState } from 'react'
import { CERTIFICATES } from '../data/portfolioData'
import MagazineCutout, {
  type CutoutTapePreset,
  type InspectablePhoto,
} from './MagazineCutout'
import {
  DoodleStar,
  SketchUnderline,
} from './InkDoodles'

interface CertificatesProps {
  onInspectPhoto: (photo: InspectablePhoto) => void
}

const CERT_SLOTS: {
  tilt: number
  tape: CutoutTapePreset
  stampRotate: number
  reverseRow: boolean
}[] = [
  {
    tilt: -2.4,
    tape: 'mixed-top',
    stampRotate: -12,
    reverseRow: false,
  },
  {
    tilt: 2.2,
    tape: 'red-corners',
    stampRotate: 10,
    reverseRow: true,
  },
]

const CERTS_PER_PAGE = 2

export default function Certificates({ onInspectPhoto }: CertificatesProps) {
  const totalCerts = CERTIFICATES.length
  const totalPages = Math.max(1, Math.ceil(totalCerts / CERTS_PER_PAGE))
  const [pageIdx, setPageIdx] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    if (totalPages <= 1 || isPaused) return
    const timer = window.setInterval(() => {
      setPageIdx((prev) => (prev + 1) % totalPages)
    }, 4800)
    return () => window.clearInterval(timer)
  }, [totalPages, isPaused])

  const startIdx = pageIdx * CERTS_PER_PAGE
  const visibleCerts = CERTIFICATES.slice(startIdx, startIdx + CERTS_PER_PAGE)

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="h-full flex flex-col justify-between relative pt-0.5 pb-6"
    >
      {/* Top Header & Scrapbook Folder Switcher (Scales cleanly as more certificates are added) */}
      <div>
        <div className="diary-item flex items-start justify-between gap-2">
          <div>
            <h2 className="hand text-[2.4rem] sm:text-[2.65rem] font-bold text-ink leading-none whitespace-nowrap">
              Certificates
            </h2>
            <SketchUnderline className="w-40 sm:w-44 h-3 mt-1" color="red" />
          </div>

          <div className="relative flex items-center gap-1 bg-crimson px-3 py-0.5 ink-pill rotate-1 shrink-0 mt-1">
            <DoodleStar className="w-4 h-4" variant="outline" />
            <span className="hand text-sm font-bold text-paper">
              {totalCerts} Verified · Tap to Zoom
            </span>
          </div>
        </div>

        <p className="diary-item hand text-[0.98rem] leading-tight text-ink-soft mt-1.5">
          Verified credentials taped in and ready to inspect
          (tap any clipping to zoom):
        </p>

        {/* Interactive Folder Pagination Bar */}
        <div className="diary-item flex items-center justify-between gap-2 mt-2 pb-1.5 border-b-2 border-dashed border-ink/25">
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalPages }).map((_, idx) => {
              const firstNum = idx * CERTS_PER_PAGE + 1
              const lastNum = Math.min((idx + 1) * CERTS_PER_PAGE, totalCerts)
              const isActive = idx === pageIdx
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPageIdx(idx)}
                  className={`btn hand text-xs font-bold px-2.5 py-0.5 border-2 border-ink rounded-xs cursor-pointer ${
                    isActive
                      ? 'bg-crimson text-paper -rotate-1 shadow-[2px_2px_0px_#111111]'
                      : 'bg-card text-ink rotate-1'
                  }`}
                >
                  Clippings {firstNum}–{lastNum}
                </button>
              )
            })}
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPageIdx((prev) => (prev - 1 + totalPages) % totalPages)}
              className="btn hand text-xs font-bold px-2 py-0.5 bg-card border-2 border-ink rounded-xs cursor-pointer hover:bg-crimson hover:text-paper"
              title="Previous certificate pair"
            >
              ◄ Prev
            </button>
            <button
              type="button"
              onClick={() => setPageIdx((prev) => (prev + 1) % totalPages)}
              className="btn hand text-xs font-bold px-2 py-0.5 bg-card border-2 border-ink rounded-xs cursor-pointer hover:bg-crimson hover:text-paper"
              title="Next certificate pair"
            >
              Next ►
            </button>
          </div>
        </div>
      </div>

      {/* 2 Uniform, Well-Organized Certificate Cutouts with Handwritten Margin Notes */}
      <div className="diary-item flex-1 min-h-0 flex flex-col justify-around pt-2.5 pb-1">
        {visibleCerts.map((cert, slotIdx) => {
          const slot = CERT_SLOTS[slotIdx % CERT_SLOTS.length]
          return (
            <article
              key={cert.id}
              className={`flex items-center gap-5 px-1.5 ${
                slot.reverseRow ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              {/* Uniform Torn Certificate Cutout */}
              <div className="w-[190px] shrink-0">
                <MagazineCutout
                  src={cert.img}
                  alt={cert.title}
                  tilt={slot.tilt}
                  variant="shredded"
                  tapePosition={slot.tape}
                  badge="VERIFIED"
                  stampRotate={slot.stampRotate}
                  className="w-full"
                  imgClassName="w-full h-[112px] object-cover"
                  onInspect={() =>
                    onInspectPhoto({
                      src: cert.img,
                      title: `${cert.title} (${cert.issuer})`,
                      caption: cert.note,
                    })
                  }
                />
              </div>

              {/* Handwritten Annotation Directly on the Lined Paper */}
              <div className="flex-1 min-w-0">
                <span className="inline-block hand text-xs font-bold px-2 py-0.5 bg-ink text-paper border-2 border-ink rounded-xs -rotate-1 mb-1">
                  {cert.issuer}
                </span>

                <div>
                  <h3 className="hand text-xl font-bold text-ink leading-tight">
                    {cert.title}
                  </h3>
                  <SketchUnderline className="w-32 h-2 mt-0.5" color="red" />
                </div>

                <p className="hand text-[0.92rem] leading-snug text-ink mt-1">
                  {cert.note}
                </p>


              </div>
            </article>
          )
        })}
      </div>

      {/* Bottom subtle developer / backstage pass footer */}
      <div className="flex items-center justify-end gap-2 pr-1">
        <span className="hand text-xs font-bold text-ink-soft">
          Showing {startIdx + 1}–{Math.min(startIdx + CERTS_PER_PAGE, totalCerts)} of{' '}
          {totalCerts} certificates (auto-cycles)
        </span>
        <div className="border-2 border-ink bg-card px-2 py-0.5 -rotate-2 shadow-2xs">
          <span className="hand text-[11px] font-bold text-ink leading-none block">
            DEV PASS · VERIFIED
          </span>
        </div>
      </div>
    </div>
  )
}