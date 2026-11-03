import { useEffect, useState } from 'react'

// A GTA-style loading screen tip while an Arcade game or simulation loads. The Arcade is English only.
// Keep these to well-established Salesforce facts.
export const TIPS = [
  'Governor limits count per transaction: 100 SOQL queries in synchronous Apex, 200 in asynchronous.',
  'One transaction can run 150 DML statements. Bulkify: collect the records, then save them in one go.',
  'Apex needs 75% test coverage across your org to deploy to production.',
  'Hard-coded record IDs differ between sandbox and production. Use Custom Metadata or a query instead.',
  'A before-save flow updating the same record is much faster than an after-save one.',
  'Synchronous Apex gets 10 seconds of CPU time per transaction. Asynchronous gets 60.',
  'A Full sandbox copies all your data. A Developer sandbox copies only metadata.',
  'Master-detail: the child inherits sharing from the parent and is deleted with it.',
  'Platform Events let systems talk without waiting on each other.',
  '“with sharing” makes Apex respect the running user’s record access.',
  'A query in a loop is the fastest way to hit the 100-query limit.',
  'Permission sets add access on top of a profile. Prefer them over new profiles.',
  'Bulk API is built for large data loads: think hundreds of thousands of records.',
  'Salesforce ships three releases a year: Spring, Summer and Winter.',
]

export default function LoadingTip({ what = 'Loading' }) {
  const [tip, setTip] = useState(() => Math.floor(Math.random() * TIPS.length))
  useEffect(() => {
    const id = setInterval(() => setTip((n) => (n + 1) % TIPS.length), 5000)
    return () => clearInterval(id)
  }, [])
  return (
    <div className="gta-loading" aria-busy="true">
      <p className="gta-loading-what"><i className="hp-spinner" aria-hidden="true" /> {what}…</p>
      <p className="gta-loading-tip"><b>Tip</b> <span key={tip}>{TIPS[tip]}</span></p>
    </div>
  )
}
