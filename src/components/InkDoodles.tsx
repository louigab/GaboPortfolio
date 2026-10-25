import React from 'react'

export function DoodleCrown({ className = 'w-8 h-6' }: { className?: string }) {
  return (
    <img
      src="/doodles/crown.png"
      alt=""
      aria-hidden="true"
      className={`object-contain select-none pointer-events-none ${className}`}
    />
  )
}

export function DoodleStar({
  className = 'w-6 h-6',
  variant = 'red',
}: {
  className?: string
  variant?: 'red' | 'outline' | 'black'
}) {
  if (variant === 'outline') {
    return (
      <svg viewBox="0 0 40 40" fill="none" className={className} aria-hidden="true">
        <path
          d="M20 3 L24.5 14.5 L37 15.5 L27 23.5 L30.5 36 L20 29 L9.5 36 L13 23.5 L3 15.5 L15.5 14.5 Z"
          stroke="#111111"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    )
  }

  return (
    <img
      src="/doodles/star.png"
      alt=""
      aria-hidden="true"
      className={`object-contain select-none pointer-events-none ${className}`}
    />
  )
}

export function DoodleArrow({
  className = 'w-14 h-8',
  flip = false,
  color = 'black',
}: {
  className?: string
  flip?: boolean
  color?: 'black' | 'red'
}) {
  const stroke = color === 'red' ? '#c9252c' : '#111111'
  return (
    <svg
      viewBox="0 0 80 40"
      fill="none"
      className={className}
      style={flip ? { transform: 'scaleX(-1)' } : undefined}
      aria-hidden="true"
    >
      <path
        d="M4 28 C24 8, 48 10, 72 20"
        stroke={stroke}
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <path
        d="M59 10 L74 20 L60 29"
        stroke={stroke}
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function DoodleTrophy({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      <path
        d="M14 8 H34 V20 C34 27 29 31 24 31 C19 31 14 27 14 20 Z"
        fill="none"
        stroke="#111111"
        strokeWidth="2.8"
        strokeLinejoin="round"
      />
      <path
        d="M14 12 H7 V18 C7 22 10 24 14 24 M34 12 H41 V18 C41 22 38 24 34 24"
        stroke="#111111"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M24 31 V39 M16 40 H32" stroke="#111111" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

export function DoodlePin({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <circle cx="16" cy="12" r="7" fill="#c9252c" stroke="#111111" strokeWidth="2.5" />
      <path d="M16 19 L16 28" stroke="#111111" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}

export function DoodleCheck({
  checked,
  className = 'w-5 h-5',
}: {
  checked: boolean
  className?: string
}) {
  return (
    <svg viewBox="0 0 30 30" fill="none" className={className} aria-hidden="true">
      <path
        d="M4 6 L24 4.5 L25 24.5 L5 25.5 Z"
        stroke="#111111"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {checked && (
        <>
          <path
            d="M6 15 L12.5 22 L27 4"
            stroke="#c9252c"
            strokeWidth="3.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M7.5 16.5 L12.5 21 L25.5 6"
            stroke="#111111"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.55"
          />
        </>
      )}
    </svg>
  )
}

export function DoodleTape({
  className = 'w-20 h-6',
  rotate = -3,
  variant = 'beige',
}: {
  className?: string
  rotate?: number
  variant?: 'beige' | 'red'
}) {
  const isRed = variant === 'red'
  const fill = isRed ? '#b9252c' : '#ded2b6'
  const stroke = isRed ? '#7f161b' : '#a89b7d'
  const crease = isRed ? '#8f191f' : '#bfb193'

  return (
    <svg
      viewBox="0 0 120 36"
      fill="none"
      className={className}
      style={{ transform: `rotate(${rotate}deg)` }}
      aria-hidden="true"
    >
      {/* Frayed, jagged masking tape body */}
      <path
        d="M6 4 L113 2 L110 7 L116 11 L111 16 L117 21 L110 26 L115 32 L5 33 L9 27 L3 22 L8 17 L2 12 L9 8 Z"
        fill={fill}
        fillOpacity={isRed ? '0.9' : '0.78'}
        stroke={stroke}
        strokeWidth="1.2"
      />
      {/* Crinkled tape fibers and creases */}
      <path
        d="M18 5 L24 31 M52 3 L48 32 M86 4 L91 31 M14 14 C42 11, 76 19, 106 13"
        stroke={crease}
        strokeWidth="0.9"
        strokeLinecap="round"
        opacity="0.55"
      />
    </svg>
  )
}

export function VerifiedStamp({
  text = 'VERIFIED',
  className = '',
  rotate = -14,
}: {
  text?: string
  className?: string
  rotate?: number
}) {
  return (
    <div
      className={`inline-block select-none pointer-events-none ${className}`}
      style={{ transform: `rotate(${rotate}deg)` }}
      aria-hidden="true"
    >
      <div className="border-[2.5px] border-crimson px-2 py-0.5 bg-transparent shadow-[inset_0_0_0_1px_rgba(201,37,44,0.45)]">
        <span className="marker text-sm font-black tracking-widest text-crimson uppercase leading-none block">
          {text}
        </span>
      </div>
    </div>
  )
}

export function TornScrapButton({
  children,
  onClick,
  href,
  type = 'button',
  disabled = false,
  tilt = -1,
  className = '',
  variant = 'red',
}: {
  children: React.ReactNode
  onClick?: () => void
  href?: string
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  tilt?: number
  className?: string
  variant?: 'red' | 'ink'
}) {
  const fill = variant === 'red' ? '#c52832' : '#181818'
  const textColor = variant === 'red' ? 'text-ink' : 'text-paper'

  const content = (
    <>
      <svg
        viewBox="0 0 260 76"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full pointer-events-none z-0 drop-shadow-[0_4px_4px_rgba(17,17,17,0.32)]"
        aria-hidden="true"
      >
        {/* Realistic hand-torn red scrap paper with frayed edges */}
        <path
          d="M8 7 L22 4 L39 7 L58 3 L79 6 L104 2 L129 6 L154 3 L179 6 L203 3 L226 6 L244 4 L254 8 L251 16 L256 23 L250 31 L255 39 L249 47 L256 55 L250 63 L254 69 L238 72 L216 69 L192 73 L166 70 L141 74 L115 69 L89 74 L64 70 L41 73 L20 69 L6 71 L9 62 L4 54 L10 45 L3 37 L9 28 L4 20 L10 13 Z"
          fill={fill}
        />
        {/* Subtle paper texture highlight along top tear */}
        <path
          d="M12 6 L58 4 L129 7 L203 4 L248 7"
          stroke="#e04852"
          strokeWidth="1.2"
          opacity="0.45"
        />
      </svg>
      <span
        className={`relative z-10 hand text-[1.35rem] font-bold tracking-tight px-4 py-3 block leading-none whitespace-nowrap ${textColor}`}
      >
        {children}
      </span>
    </>
  )

  if (href) {
    return (
      <a
        href={href}
        style={{ transform: `rotate(${tilt}deg)` }}
        className={`btn relative inline-flex items-center justify-center cursor-pointer select-none ${className}`}
      >
        {content}
      </a>
    )
  }

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={{ transform: `rotate(${tilt}deg)` }}
      className={`btn relative inline-flex items-center justify-center cursor-pointer select-none bg-transparent border-0 p-0 disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
    >
      {content}
    </button>
  )
}

export function DoodleLaptop({ className = 'w-20 h-16' }: { className?: string }) {
  return (
    <img
      src="/doodles/laptop.png"
      alt=""
      aria-hidden="true"
      className={`object-contain select-none pointer-events-none ${className}`}
    />
  )
}

export function DoodleCoffee({ className = 'w-11 h-12' }: { className?: string }) {
  return (
    <img
      src="/doodles/coffee.png"
      alt=""
      aria-hidden="true"
      className={`object-contain select-none pointer-events-none ${className}`}
    />
  )
}

export function DoodleCodeBrackets({
  className = 'w-14 h-12',
  variant = 'slash',
}: {
  className?: string
  variant?: 'slash' | 'open' | 'both'
}) {
  const src =
    variant === 'both'
      ? '/doodles/brackets.png'
      : variant === 'open'
        ? '/doodles/brackets-open.png'
        : '/doodles/brackets-slash.png'
  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      className={`object-contain select-none pointer-events-none ${className}`}
    />
  )
}

export function DoodleLightning({ className = 'w-12 h-10' }: { className?: string }) {
  return (
    <img
      src="/doodles/lightning.png"
      alt=""
      aria-hidden="true"
      className={`object-contain select-none pointer-events-none ${className}`}
    />
  )
}

export function DoodleMusicNotes({
  className = 'w-10 h-9',
  color = 'red',
}: {
  className?: string
  color?: 'red' | 'black'
}) {
  const fill = color === 'red' ? '#c9252c' : '#111111'
  return (
    <svg viewBox="0 0 48 44" fill="none" className={className} aria-hidden="true">
      <path
        d="M16 32 V10 L38 6 V28"
        stroke={fill}
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M16 16 L38 12" stroke={fill} strokeWidth="2.8" />
      <ellipse cx="12" cy="33" rx="5.5" ry="4" transform="rotate(-18 12 33)" fill={fill} />
      <ellipse cx="34" cy="29" rx="5.5" ry="4" transform="rotate(-18 34 29)" fill={fill} />
    </svg>
  )
}

export function DoodleMiniGuitar({ className = 'w-12 h-20' }: { className?: string }) {
  return (
    <img
      src="/doodles/guitar-mini.png"
      alt=""
      aria-hidden="true"
      className={`object-contain select-none pointer-events-none ${className}`}
    />
  )
}

export function DoodleElectricGuitar({ className = 'w-14 h-44' }: { className?: string }) {
  return (
    <img
      src="/doodles/guitar-vertical.png"
      alt=""
      aria-hidden="true"
      className={`object-contain select-none pointer-events-none ${className}`}
    />
  )
}

export function DoodleAmp({ className = 'w-14 h-14' }: { className?: string }) {
  return (
    <img
      src="/doodles/amp.png"
      alt=""
      aria-hidden="true"
      className={`object-contain select-none pointer-events-none ${className}`}
    />
  )
}

export function DoodleExclamation({ className = 'w-8 h-10' }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 48" fill="none" className={className} aria-hidden="true">
      <path d="M14 6 L11 29" stroke="#111111" strokeWidth="4.5" strokeLinecap="round" />
      <circle cx="10" cy="39" r="3" fill="#111111" />
      <path d="M28 8 L22 31" stroke="#c9252c" strokeWidth="4.5" strokeLinecap="round" />
      <circle cx="20" cy="41" r="3" fill="#c9252c" />
    </svg>
  )
}

export function SpiralBinding({ rings = 15 }: { rings?: number }) {
  return (
    <div
      className="flex flex-col justify-between items-center py-3 h-full w-13 sm:w-14 shrink-0 -mx-6 select-none pointer-events-none"
      aria-hidden="true"
    >
      {Array.from({ length: rings }).map((_, idx) => (
        <svg key={idx} viewBox="0 0 60 22" className="w-13 sm:w-14 h-4 shrink-0">
          {/* Left & Right page punch holes */}
          <circle cx="9" cy="11" r="5" fill="#111111" />
          <circle cx="51" cy="11" r="5" fill="#111111" />
          {/* Top & bottom spiral wire loops */}
          <path
            d="M9 8.5 C21 4, 39 4, 51 8.5"
            stroke="#111111"
            strokeWidth="3.2"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M9 13.5 C21 9, 39 9, 51 13.5"
            stroke="#2b2b2b"
            strokeWidth="2.4"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      ))}
    </div>
  )
}

export const SketchUnderline: React.FC<{
  className?: string
  color?: 'red' | 'black'
}> = ({ className = 'w-full h-3.5', color = 'red' }) => {
  const stroke = color === 'red' ? '#c9252c' : '#111111'
  return (
    <svg
      viewBox="0 0 240 16"
      fill="none"
      className={className}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        d="M3 6 C68 2, 158 9, 237 4"
        stroke={stroke}
        strokeWidth="4.2"
        strokeLinecap="round"
      />
      <path
        d="M10 12 C86 8, 172 14, 229 10"
        stroke={stroke}
        strokeWidth="3.2"
        strokeLinecap="round"
        opacity="0.88"
      />
    </svg>
  )
}

export function RedStrikethrough({ children }: { children: React.ReactNode }) {
  return (
    <span className="relative inline-block mx-0.5 text-ink/85">
      <span>{children}</span>
      <svg
        viewBox="0 0 160 16"
        preserveAspectRatio="none"
        className="absolute left-[-2%] top-1/2 -translate-y-1/2 w-[104%] h-3.5 pointer-events-none"
        aria-hidden="true"
      >
        <path
          d="M2 9 C48 5, 112 11, 158 6"
          stroke="#c9252c"
          strokeWidth="3.4"
          strokeLinecap="round"
        />
        <path
          d="M6 12 C56 9, 108 13, 154 9"
          stroke="#c9252c"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.75"
        />
      </svg>
    </span>
  )
}
