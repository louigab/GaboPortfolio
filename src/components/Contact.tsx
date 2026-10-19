import { useState } from 'react'
import GaboMascot from './GaboMascot'
import {
  DoodleArrow,
  DoodleCheck,
  DoodleCodeBrackets,
  DoodleCoffee,
  DoodleStar,
  DoodleTape,
  SketchUnderline,
  TornScrapButton,
} from './InkDoodles'

const NOTE_TOPICS = [
  'Commission or Project Work',
  'Internship or Job Offer',
]

export default function Contact() {
  const [selectedTopics, setSelectedTopics] = useState<string[]>([NOTE_TOPICS[0]])
  const [senderName, setSenderName] = useState('')
  const [noteMessage, setNoteMessage] = useState('')
  const [copied, setCopied] = useState(false)

  const toggleTopic = (topic: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    )
  }

  const buildMailtoHref = () => {
    const topicsStr = selectedTopics.length ? selectedTopics.join(', ') : 'Saying Hi'
    const subject = encodeURIComponent(`Note for Gabo: ${topicsStr}`)
    const bodyLines = [
      `Hi Gabo (Louis Gabriel),`,
      ``,
      `I flipped through your developer diary and checked: ${topicsStr}.`,
      noteMessage ? `\nNote: ${noteMessage}` : '',
      senderName ? `\nFrom: ${senderName}` : '',
    ]
    return `mailto:hello@gabo.dev?subject=${subject}&body=${encodeURIComponent(bodyLines.join('\n'))}`
  }

  const handleCopyEmail = () => {
    navigator.clipboard?.writeText('hello@gabo.dev').catch(() => {})
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2200)
  }

  return (
    <div className="h-full flex flex-col justify-between relative pt-0.5 pb-5">
      {/* Margin Doodles (out of flex flow) */}
      <div className="absolute inset-0 pointer-events-none select-none" aria-hidden="true">
        <DoodleCodeBrackets
          variant="slash"
          className="w-10 h-6 absolute right-1 top-1 rotate-6 opacity-90"
        />
        <DoodleStar className="w-5 h-5 absolute right-13 top-1.5 -rotate-12" />
        <DoodleCoffee className="w-8 h-9 absolute right-1 bottom-6 -rotate-6 opacity-85" />
      </div>

      <div>
        <div className="diary-item">
          <h2 className="hand text-[2.4rem] sm:text-[2.65rem] font-bold text-ink leading-none whitespace-nowrap">
            Pass a Note
          </h2>
          <SketchUnderline className="w-40 sm:w-44 h-3 mt-1" color="red" />
        </div>

        <p className="diary-item hand text-[0.98rem] leading-tight text-ink-soft mt-1.5">
          Check a box on the lines below, scribble a message, and pass it across the desk:
        </p>

        {/* Handwritten Note Form Directly on the Ruled Paper (NO UI container box) */}
        <div className="diary-item mt-2.5 space-y-2.5">
          {/* Scribbled Checkboxes directly on the lines */}
          <div>
            <span className="hand text-base sm:text-[1.08rem] font-bold text-ink block mb-0.5">
              Do you want to build something together? (Check any):
            </span>
            <div className="relative">
              <div className="space-y-0.5 pl-1">
                {NOTE_TOPICS.map((topic) => {
                  const isChecked = selectedTopics.includes(topic)
                  return (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => toggleTopic(topic)}
                      className="btn flex items-center gap-2 bg-transparent border-0 p-0 text-left cursor-pointer group"
                    >
                      <DoodleCheck checked={isChecked} className="w-4 h-4 shrink-0" />
                      <span
                        className={`hand text-sm sm:text-[1.05rem] leading-snug ${
                          isChecked
                            ? 'text-ink font-bold underline decoration-crimson decoration-2 underline-offset-3'
                            : 'text-ink-soft font-medium group-hover:text-ink'
                        }`}
                      >
                        {topic}
                      </span>
                    </button>
                  )
                })}
              </div>
              {/* Red arrow doodle pointing at the checkboxes */}
              <div
                className="hidden sm:flex absolute right-21 bottom-0 items-center gap-1 pointer-events-none select-none rotate-[-3deg]"
                aria-hidden="true"
              >
                <DoodleArrow color="red" flip className="w-11 h-6" />
                <span className="hand text-sm font-bold text-crimson whitespace-nowrap">
                  (pls hire me)
                </span>
              </div>
            </div>
          </div>

          {/* Underlined Notebook Lines for Input Fields (NO white box containers) */}
          <div className="grid sm:grid-cols-2 gap-3 pt-0.5">
            <label className="block">
              <span className="hand text-sm sm:text-base font-bold text-ink block leading-none">
                Your Name:
              </span>
              <input
                type="text"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="Write your name on this line..."
                className="w-full hand text-sm sm:text-base text-ink placeholder:text-ink-soft/55 notebook-line-input"
              />
            </label>

            <label className="block">
              <span className="hand text-sm sm:text-base font-bold text-ink block leading-none">
                Quick Note:
              </span>
              <input
                type="text"
                value={noteMessage}
                onChange={(e) => setNoteMessage(e.target.value)}
                placeholder="Let's build a web or mobile app!"
                className="w-full hand text-sm sm:text-base text-ink placeholder:text-ink-soft/55 notebook-line-input"
              />
            </label>
          </div>

          {/* Red Taped/Stamped Submit Button + Copy Email Stamp */}
          <div className="flex flex-wrap items-center gap-3 pt-2.5">
            <div className="relative inline-block">
              <div className="absolute -top-1.5 -left-1.5 z-20 pointer-events-none">
                <DoodleTape rotate={-16} className="w-10 h-3.5" variant="beige" />
              </div>
              <TornScrapButton href={buildMailtoHref()} tilt={-1.2}>
                Fold &amp; Send Email Note
              </TornScrapButton>
            </div>

            <button
              type="button"
              onClick={handleCopyEmail}
              className="btn hand text-sm sm:text-base font-bold px-2.5 py-1 bg-transparent text-ink border-2 border-dashed border-ink hover:border-crimson hover:text-crimson -rotate-1 cursor-pointer"
            >
              {copied ? '✓ Copied hello@gabo.dev!' : 'Copy hello@gabo.dev'}
            </button>
          </div>
        </div>

        {/* Direct Social Links Written/Stamped on a Single Row */}
        <div className="diary-item mt-3 flex flex-wrap items-center gap-2">
          <span className="hand text-sm sm:text-base font-bold text-ink inline-flex items-center gap-1">
            <span>Find me on:</span>
            <DoodleArrow color="red" className="w-5 h-3" />
          </span>
          <a
            href="https://github.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="btn tech-sticker tech-sticker-idle hand text-sm sm:text-base font-bold -rotate-2"
          >
            GitHub
          </a>
          <a
            href="https://linkedin.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="btn tech-sticker tech-sticker-idle hand text-sm sm:text-base font-bold rotate-1"
          >
            LinkedIn
          </a>
          <a
            href="mailto:hello@gabo.dev"
            className="btn tech-sticker tech-sticker-active hand text-sm sm:text-base font-bold -rotate-1"
          >
            hello@gabo.dev
          </a>
        </div>
      </div>

      {/* Mascot sign-off at bottom of Page 10 */}
      <div className="pt-0.5">
        <GaboMascot
          variant="compact"
          speech="Thanks for reading my diary! Pass me a note above and I will write right back."
        />
      </div>
    </div>
  )
}