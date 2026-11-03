import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { beep } from '../arcade/fx.js'
import { useEconomy } from './economy.js'
import { readGta, writeGta } from './store.js'
import { useGtaText } from './text.js'

// The rank-up screen: the RP bar fills, then the new rank number slams in. It replaces the old level-up toast.
// The first visit only records the rank, so nobody gets a rank-up for arriving.
export default function RankUp() {
  const T = useGtaText().rank
  const { rank, rp, from, to, level } = useEconomy()
  const [show, setShow] = useState(null)

  useEffect(() => {
    const { seenRank } = readGta()
    if (!seenRank) {
      writeGta({ seenRank: rank })
      return
    }
    if (rank <= seenRank) return
    let timer
    const open = () => {
      if (document.documentElement.classList.contains('intro-open')) {
        timer = setTimeout(open, 1500)
        return
      }
      writeGta({ seenRank: rank })
      setShow({ rank, share: (rp - from) / (to - from) })
      beep('win')
    }
    timer = setTimeout(open, 900) // after the badge toast has started
    return () => clearTimeout(timer)
  }, [rank, rp, from, to])

  useEffect(() => {
    if (!show) return
    const timer = setTimeout(() => setShow(null), 3600)
    const onKey = (e) => e.key === 'Escape' && setShow(null)
    document.addEventListener('keydown', onKey)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('keydown', onKey)
    }
  }, [show])

  if (!show) return null
  return createPortal(
    <button type="button" className="gta-rankup" onClick={() => setShow(null)} aria-live="assertive">
      <small>{T.up}</small>
      <span className="gta-rankup-badge"><b key={show.rank}>{show.rank}</b></span>
      <span className="gta-rankup-bar" aria-hidden="true"><i style={{ '--to': show.share }} /></span>
      <strong>{T.rank} {show.rank} · {level.name}</strong>
    </button>,
    document.body,
  )
}
