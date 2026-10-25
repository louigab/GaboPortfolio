import { useState } from 'react'
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
  'Commission / Project',
  'Internship / Job Offer',
]

export interface SentNoteSnapshot {
  id: number
  senderName: string
  senderEmail: string
  noteMessage: string
  selectedTopics: string[]
}

interface ContactProps {
  onNoteSent?: (snapshot: SentNoteSnapshot) => void
  /** Static non-interactive snapshot rendered onto the ripping/folding airplane sheet */
  snapshot?: SentNoteSnapshot
}

// Web3Forms Access Key: can be provided via VITE_WEB3FORMS_ACCESS_KEY in .env or fallback
const WEB3FORMS_KEY =
  (import.meta.env.VITE_WEB3FORMS_ACCESS_KEY as string | undefined) ||
  'YOUR_ACCESS_KEY_HERE'

export default function Contact({
  onNoteSent,
  snapshot,
}: ContactProps = {}) {
  const [selectedTopics, setSelectedTopics] = useState<string[]>([NOTE_TOPICS[0]])
  const [senderName, setSenderName] = useState('')
  const [senderEmail, setSenderEmail] = useState('')
  const [noteMessage, setNoteMessage] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'error'>('idle')
  const [statusMsg, setStatusMsg] = useState('')

  const activeTopics = snapshot ? snapshot.selectedTopics : selectedTopics
  const activeName = snapshot ? snapshot.senderName : senderName
  const activeEmail = snapshot ? snapshot.senderEmail : senderEmail
  const activeMessage = snapshot ? snapshot.noteMessage : noteMessage

  const toggleTopic = (topic: string) => {
    if (snapshot) return
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
      senderEmail ? `Email: ${senderEmail}` : '',
    ]
    return `mailto:louisgabriel.damondamon@gmail.com?subject=${subject}&body=${encodeURIComponent(bodyLines.join('\n'))}`
  }

  const clearErrors = () => {
    if (status === 'error') {
      setStatus('idle')
      setStatusMsg('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!senderName.trim()) {
      setStatus('error')
      setStatusMsg('Please write your name!')
      return
    }

    if (!senderEmail.trim()) {
      setStatus('error')
      setStatusMsg('Please write your email address so I can reply!')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(senderEmail.trim())) {
      setStatus('error')
      setStatusMsg('Please write a valid email address!')
      return
    }

    if (!noteMessage.trim()) {
      setStatus('error')
      setStatusMsg('Please scribble a short note before sending!')
      return
    }

    // If key hasn't been replaced yet, gracefully trigger mail client
    if (!WEB3FORMS_KEY || WEB3FORMS_KEY === 'YOUR_ACCESS_KEY_HERE') {
      window.location.href = buildMailtoHref()
      setTimeout(() => {
        setStatus('idle')
        setStatusMsg('')
      }, 3000)
      return
    }

    setStatus('sending')
    setStatusMsg('')

    try {
      const topicsStr = selectedTopics.length ? selectedTopics.join(', ') : 'Saying Hi'
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          access_key: WEB3FORMS_KEY,
          name: senderName || 'Anonymous Visitor',
          email: senderEmail || 'no-reply@gabo.dev',
          subject: `Portfolio Note from ${senderName || 'Visitor'}: ${topicsStr}`,
          message: noteMessage || '(No text message written)',
          topics: topicsStr,
          from_name: 'Gabo Portfolio Note',
        }),
      })

      const data = await response.json()

      if (data.success) {
        const sentSnapshot: SentNoteSnapshot = {
          id: Date.now(),
          senderName,
          senderEmail,
          noteMessage,
          selectedTopics: [...selectedTopics],
        }
        setStatus('idle')
        setStatusMsg('')
        setSenderName('')
        setSenderEmail('')
        setNoteMessage('')
        onNoteSent?.(sentSnapshot)
      } else {
        setStatus('error')
        setStatusMsg(data.message || 'Could not send directly. Opening email client...')
        setTimeout(() => {
          window.location.href = buildMailtoHref()
        }, 1200)
      }
    } catch {
      setStatus('error')
      setStatusMsg('Network issue. Opening your email app instead...')
      setTimeout(() => {
        window.location.href = buildMailtoHref()
      }, 1000)
    }
  }

  const FormOrDiv = snapshot ? 'div' : 'form'

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
          <h2 className="hand text-[2.65rem] font-bold text-ink leading-none whitespace-nowrap">
            Pass a Note
          </h2>
          <SketchUnderline className="w-44 h-3 mt-1" color="red" />
        </div>

        <p className="diary-item hand text-[0.98rem] leading-tight text-ink-soft mt-1.5">
          Check a box on the lines below, scribble a message, and pass it across the desk:
        </p>

        {/* Handwritten Note Form Directly on the Ruled Paper (NO UI container box) */}
        <FormOrDiv
          {...(snapshot ? {} : { onSubmit: handleSubmit, noValidate: true })}
          className="diary-item mt-2.5 space-y-2.5"
        >
          {/* Scribbled Checkboxes directly on the lines */}
          <div>
            <span className="hand text-[1.08rem] font-bold text-ink block mb-0.5">
              Do you want to build something together? (Check any):
            </span>
            <div className="relative">
              <div className="space-y-0.5 pl-1">
                {NOTE_TOPICS.map((topic) => {
                  const isChecked = activeTopics.includes(topic)
                  return (
                    <button
                      key={topic}
                      type="button"
                      tabIndex={snapshot ? -1 : 0}
                      onClick={() => toggleTopic(topic)}
                      className="btn flex items-center gap-2 bg-transparent border-0 p-0 text-left cursor-pointer group"
                    >
                      <DoodleCheck checked={isChecked} className="w-4 h-4 shrink-0" />
                      <span
                        className={`hand text-[1.05rem] leading-snug ${
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
                className="flex absolute right-21 bottom-0 items-center gap-1 pointer-events-none select-none rotate-[-3deg]"
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
          <div className="grid grid-cols-2 gap-3 pt-0.5">
            <label className="block">
              <span className="hand text-base font-bold text-ink block leading-none">
                Your Name:
              </span>
              <input
                type="text"
                value={activeName}
                readOnly={Boolean(snapshot)}
                tabIndex={snapshot ? -1 : 0}
                autoComplete={snapshot ? 'off' : undefined}
                onChange={(e) => {
                  setSenderName(e.target.value)
                  clearErrors()
                }}
                placeholder="Write your name on this line..."
                className="w-full hand text-base text-ink placeholder:text-ink-soft/55 notebook-line-input"
              />
            </label>

            <label className="block">
              <span className="hand text-base font-bold text-ink block leading-none">
                Your Email:
              </span>
              <input
                type="email"
                value={activeEmail}
                readOnly={Boolean(snapshot)}
                tabIndex={snapshot ? -1 : 0}
                autoComplete={snapshot ? 'off' : undefined}
                onChange={(e) => {
                  setSenderEmail(e.target.value)
                  clearErrors()
                }}
                placeholder="your.email@example.com"
                className="w-full hand text-base text-ink placeholder:text-ink-soft/55 notebook-line-input"
              />
            </label>
          </div>

          <label className="block">
            <span className="hand text-base font-bold text-ink block leading-none">
              Quick Note:
            </span>
            <input
              type="text"
              value={activeMessage}
              readOnly={Boolean(snapshot)}
              tabIndex={snapshot ? -1 : 0}
              autoComplete={snapshot ? 'off' : undefined}
              onChange={(e) => {
                setNoteMessage(e.target.value)
                clearErrors()
              }}
              placeholder="Let's build a web or mobile app!"
              className="w-full hand text-base text-ink placeholder:text-ink-soft/55 notebook-line-input"
            />
          </label>

          {/* Red Taped/Stamped Submit Button + Handwritten Alert strictly beside it */}
          <div className="flex items-center gap-2.5 pt-2 min-w-0">
            <div className="relative inline-block shrink-0">
              <div className="absolute -top-1.5 -left-1.5 z-20 pointer-events-none">
                <DoodleTape rotate={-16} className="w-10 h-3.5" variant="beige" />
              </div>
              <TornScrapButton
                type={snapshot ? 'button' : 'submit'}
                disabled={!snapshot && status === 'sending'}
                tilt={-1.2}
              >
                {!snapshot && status === 'sending' ? 'Sending Note...' : 'Fold & Send Email Note'}
              </TornScrapButton>
            </div>

            {!snapshot && statusMsg && (
              <span
                className="hand text-base font-bold leading-tight select-none transition-all truncate whitespace-normal text-crimson"
              >
                {statusMsg}
              </span>
            )}
          </div>
        </FormOrDiv>

        {/* Direct Social Links Written/Stamped on a Single Row */}
        <div className="diary-item mt-3 flex flex-wrap items-center gap-2">
          <span className="hand text-base font-bold text-ink inline-flex items-center gap-1">
            <span>Find me on:</span>
            <DoodleArrow color="red" className="w-5 h-3" />
          </span>
          <a
            href="https://github.com/louigab"
            target="_blank"
            rel="noopener noreferrer"
            className="btn tech-sticker tech-sticker-idle hand text-base font-bold -rotate-2"
          >
            GitHub
          </a>
          <a
            href="https://www.linkedin.com/in/louis-gabriel-damondamon/"
            target="_blank"
            rel="noopener noreferrer"
            className="btn tech-sticker tech-sticker-idle hand text-base font-bold rotate-1"
          >
            LinkedIn
          </a>
          <a
            href="mailto:louisgabriel.damondamon@gmail.com"
            className="btn tech-sticker tech-sticker-active hand text-base font-bold -rotate-1"
          >
            louisgabriel.damondamon@gmail.com
          </a>
        </div>
      </div>
    </div>
  )
}