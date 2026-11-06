import { useLayoutEffect, useRef, type ReactNode } from 'react'
import gsap from 'gsap'

/** The book falls along the viewing axis; shadow and dust remain on the desk. */
export default function BookArrival({ active, isDesktop, onSettled, children }: {
  active: boolean
  isDesktop: boolean
  onSettled: () => void
  children: ReactNode
}) {
  const body = useRef<HTMLDivElement>(null)
  const shadow = useRef<HTMLDivElement>(null)
  const dust = useRef<HTMLDivElement>(null)
  const complete = useRef(onSettled)
  useLayoutEffect(() => { complete.current = onSettled })

  useLayoutEffect(() => {
    if (!active || !body.current || !shadow.current || !dust.current) return
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let cancelled = false
    const settle = () => { if (!cancelled) complete.current() }
    const particles = dust.current.querySelectorAll('.arrival-dust')
    const outward = (i: number) => (i % 2 === 0 ? -1 : 1) * (18 + (i % 4) * 9)
    const drift = (i: number) => (i % 3 - 1) * 12 + 8
    const context = gsap.context(() => {
      const timeline = gsap.timeline({ onComplete: settle })
      // Positive Z is toward the viewer. Keep Y near zero: no entry from the top.
      gsap.set(body.current, { x: 10, y: 0, z: 1080, rotation: -4, rotationX: 11, rotationY: -6, transformOrigin: '50% 50%', willChange: 'transform' })
      gsap.set(shadow.current, { opacity: .035, scale: 1.6 })
      gsap.set(particles, { opacity: 0, scale: .3, x: 0, y: 0 })
      timeline.addLabel('impact', .66)
        .to(body.current, { x: 0, y: 0, z: 0, rotation: .7, rotationX: .8, rotationY: -.5, duration: .66, ease: 'power2.in' }, 0)
        .to(shadow.current, { opacity: .38, scale: 1, duration: .66, ease: 'power2.in' }, 0)
        .to(body.current, { z: 5, rotation: -.18, rotationX: -.35, rotationY: .15, duration: .11, ease: 'power1.out' }, 'impact')
        .to(body.current, { z: 0, rotation: 0, rotationX: 0, rotationY: 0, duration: .23, ease: 'power2.out' }, 'impact+=.11')
        .to(shadow.current, { opacity: 0, duration: .3, ease: 'power1.out' }, 'impact+=.11')
        .to(particles, { x: outward, y: drift, scale: 1, opacity: .24, duration: .14, ease: 'power1.out' }, 'impact')
        .to(particles, { x: i => outward(i) * 1.7, y: i => drift(i) * 1.8, scale: 1.9, opacity: 0, duration: .55, ease: 'power2.out' }, 'impact+=.14')
    })
    // If frames are throttled, finish safely rather than leaving a floating book.
    const fallback = window.setTimeout(settle, 1900)
    const interrupt = () => settle()
    const visibility = () => { if (document.hidden) settle() }
    motion.addEventListener('change', interrupt)
    window.addEventListener('resize', interrupt)
    document.addEventListener('visibilitychange', visibility)
    if (motion.matches) settle()
    return () => {
      cancelled = true
      window.clearTimeout(fallback)
      context.revert()
      motion.removeEventListener('change', interrupt)
      window.removeEventListener('resize', interrupt)
      document.removeEventListener('visibilitychange', visibility)
    }
  }, [active])

  return (
    <div className="book-arrival-scene relative w-full" style={{ perspective: '1800px' }} aria-busy={active}>
      <div ref={shadow} aria-hidden="true" className="arrival-desk-shadow" style={{ width: isDesktop ? '48%' : '94%' }} />
      <div ref={dust} className="arrival-dust-plane" aria-hidden="true">
        {Array.from({ length: 12 }, (_, i) => (
          <span key={i} className="arrival-dust" style={{
            left: `${i % 2 === 0 ? (isDesktop ? 26 : 3) : (isDesktop ? 74 : 97)}%`,
            top: `${23 + Math.floor(i / 2) * 14}%`,
            width: 28 + (i % 3) * 11,
            height: 12 + (i % 4) * 3,
          }} />
        ))}
      </div>
      <div ref={body} inert={active}>{children}</div>
    </div>
  )
}
