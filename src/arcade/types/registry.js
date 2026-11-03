// Plug-in game types: every src/arcade/types/<type>.check.js (label, icon, round count, checkRound)
// with its <type>.jsx round component. See src/arcade/format.js for the contract.
import { TYPES } from '../format.js'

const checks = import.meta.glob('./*.check.js', { eager: true, import: 'default' })
const rounds = import.meta.glob('./*.jsx', { eager: true, import: 'default' })

export const PLUGINS = Object.fromEntries(
  Object.entries(checks).map(([path, meta]) => {
    const id = path.slice(2, -'.check.js'.length)
    return [id, { ...meta, Round: rounds[`./${id}.jsx`] }]
  }),
)

// Label and icon for any type, built-in or plug-in.
export const typeInfo = (type) => TYPES[type] ?? PLUGINS[type] ?? { label: type, icon: '🎮' }
