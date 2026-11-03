import { useEffect } from 'react'

// Scroll-driven motion for the whole page:
// - `.reveal` elements rise in when they scroll into view
// - children of `.stagger` containers rise in one after another (index in --i)
// - --progress (0–1) and --scroll (px) are kept on <html> for the progress bar and parallax
// Reveals are skipped for users who prefer reduced motion.
export function useReveal() {
  useEffect(() => {
    const root = document.documentElement

    let frame = 0
    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        const max = root.scrollHeight - window.innerHeight
        root.style.setProperty('--progress', max > 0 ? (window.scrollY / max).toFixed(4) : '0')
        root.style.setProperty('--scroll', String(Math.round(window.scrollY)))
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    const stopScroll = () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(frame)
    }

    if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return stopScroll
    }

    root.classList.add('js-reveal')
    document.querySelectorAll('.stagger').forEach((el) => {
      ;[...el.children].forEach((child, i) => child.style.setProperty('--i', i))
    })

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in')
            io.unobserve(e.target)
          }
        })
      },
      { rootMargin: '0px 0px -10% 0px' },
    )
    document.querySelectorAll('.reveal, .stagger').forEach((el) => io.observe(el))

    return () => {
      io.disconnect()
      stopScroll()
      root.classList.remove('js-reveal')
    }
  }, [])
}
