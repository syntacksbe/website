// The character creator and garage on the Arcade profile (#/profile). Each slot is one choice: its options are
// free, or have a price in gears and are sold in the shop as item `<slot>-<option>` (shopItems.js). The picks are
// saved in the profile (profile.js: `avatar` and `garage`); Avatar.jsx and Car.jsx draw them.
// No imports here, so the profile and the homepage radio can load this without the Arcade catalog.

export const TABS = [
  { id: 'body', label: 'Body' },
  { id: 'face', label: 'Face' },
  { id: 'hair', label: 'Hair' },
  { id: 'apparel', label: 'Clothes' },
  { id: 'garage', label: 'Garage' },
]

const COLORS = [
  { id: 'asphalt', name: 'Asphalt', color: '#23262e' },
  { id: 'bone', name: 'Bone', color: '#ece6dc' },
  { id: 'blaze', name: 'Blaze', color: '#ff5a1f' },
  { id: 'gold', name: 'Gold', color: '#ffb21a' },
  { id: 'teal', name: 'Teal', color: '#1fb5ad' },
  { id: 'olive', name: 'Olive', color: '#66753d' },
  { id: 'red', name: 'Brick red', color: '#b8372a' },
  { id: 'navy', name: 'Midnight', color: '#28334f' },
]

// Every style is open to every build: there is no gender switch, so anyone can make themselves.
export const SLOTS = [
  {
    id: 'build', store: 'avatar', tab: 'body', label: 'Build',
    options: [{ id: 'broad', name: 'Broad' }, { id: 'slim', name: 'Slim' }, { id: 'curvy', name: 'Curvy' }],
  },
  {
    id: 'skin', store: 'avatar', tab: 'body', label: 'Skin tone', swatch: true, def: 's3',
    options: [
      { id: 's1', name: 'Tone 1', color: '#f6d9c6' },
      { id: 's2', name: 'Tone 2', color: '#eec29f' },
      { id: 's3', name: 'Tone 3', color: '#dba57d' },
      { id: 's4', name: 'Tone 4', color: '#c28761' },
      { id: 's5', name: 'Tone 5', color: '#9e6845' },
      { id: 's6', name: 'Tone 6', color: '#7c4c2e' },
      { id: 's7', name: 'Tone 7', color: '#5c3622' },
      { id: 's8', name: 'Tone 8', color: '#402518' },
    ],
  },
  {
    id: 'face', store: 'avatar', tab: 'body', label: 'Face shape',
    options: [{ id: 'oval', name: 'Oval' }, { id: 'round', name: 'Round' }, { id: 'square', name: 'Square jaw' }, { id: 'long', name: 'Long' }, { id: 'heart', name: 'Heart' }],
  },
  {
    id: 'eyes', store: 'avatar', tab: 'face', label: 'Eyes', def: 'almond',
    options: [{ id: 'round', name: 'Dots' }, { id: 'almond', name: 'Almond' }, { id: 'wide', name: 'Wide awake' }, { id: 'sleepy', name: 'Monday morning' }],
  },
  {
    id: 'eyeColor', store: 'avatar', tab: 'face', label: 'Eye colour', swatch: true,
    options: [
      { id: 'brown', name: 'Brown', color: '#5a3a22' },
      { id: 'hazel', name: 'Hazel', color: '#8a6a2a' },
      { id: 'green', name: 'Green', color: '#3f7a46' },
      { id: 'grey', name: 'Grey', color: '#6b7680' },
      { id: 'amber', name: 'Amber', color: '#c07a18' },
    ],
  },
  {
    id: 'lashes', store: 'avatar', tab: 'face', label: 'Lashes',
    options: [{ id: 'none', name: 'None' }, { id: 'lashes', name: 'Lashes' }, { id: 'liner', name: 'Winged liner' }],
  },
  {
    id: 'brows', store: 'avatar', tab: 'face', label: 'Eyebrows',
    options: [{ id: 'soft', name: 'Soft' }, { id: 'straight', name: 'Straight' }, { id: 'thick', name: 'Thick' }, { id: 'arched', name: 'Arched' }, { id: 'focused', name: 'Deploy face' }],
  },
  {
    id: 'mouth', store: 'avatar', tab: 'face', label: 'Mouth',
    options: [{ id: 'smile', name: 'Smile' }, { id: 'grin', name: 'Big grin' }, { id: 'neutral', name: 'Poker face' }, { id: 'smirk', name: 'Smirk' }],
  },
  {
    id: 'lips', store: 'avatar', tab: 'face', label: 'Lip colour', swatch: true,
    options: [
      { id: 'natural', name: 'Natural', color: '#5a2a20' },
      { id: 'nude', name: 'Nude', color: '#a8644a' },
      { id: 'brick', name: 'Brick red', color: '#b8372a' },
      { id: 'berry', name: 'Dark berry', color: '#6e1f3a' },
    ],
  },
  {
    id: 'hair', store: 'avatar', tab: 'hair', label: 'Hair style', def: 'crop',
    options: [
      { id: 'bald', name: 'Bald' },
      { id: 'buzz', name: 'Buzz cut' },
      { id: 'crop', name: 'Short crop' },
      { id: 'quiff', name: 'Quiff' },
      { id: 'sidepart', name: 'Side part' },
      { id: 'curly', name: 'Curls' },
      { id: 'afro', name: 'Afro' },
      { id: 'bob', name: 'Bob' },
      { id: 'long', name: 'Long' },
      { id: 'bun', name: 'Top bun' },
      { id: 'ponytail', name: 'Ponytail' },
      { id: 'mohawk', name: 'Mohawk', price: 150, text: 'A tall mohawk for your character. Admins with attitude.' },
    ],
  },
  {
    id: 'hairColor', store: 'avatar', tab: 'hair', label: 'Hair colour', swatch: true,
    options: [
      { id: 'black', name: 'Black', color: '#1d1a18' },
      { id: 'darkbrown', name: 'Dark brown', color: '#3b2619' },
      { id: 'brown', name: 'Brown', color: '#6b4428' },
      { id: 'auburn', name: 'Auburn', color: '#8c3b1e' },
      { id: 'blonde', name: 'Blonde', color: '#d8b46a' },
      { id: 'grey', name: 'Grey', color: '#9b9690' },
      { id: 'white', name: 'White', color: '#e8e4dc' },
      { id: 'dye-blaze', name: 'Blaze dye', color: '#ff5a1f', price: 100, text: 'Bright orange hair dye.' },
      { id: 'dye-teal', name: 'Teal dye', color: '#1fb5ad', price: 100, text: 'Miami teal hair dye.' },
    ],
  },
  {
    id: 'beard', store: 'avatar', tab: 'hair', label: 'Facial hair',
    options: [{ id: 'none', name: 'Clean shaven' }, { id: 'stubble', name: 'Stubble' }, { id: 'moustache', name: 'Moustache' }, { id: 'goatee', name: 'Goatee' }, { id: 'full', name: 'Full beard' }],
  },
  {
    id: 'top', store: 'avatar', tab: 'apparel', label: 'Top', def: 'hoodie',
    options: [
      { id: 'tee', name: 'T-shirt' },
      { id: 'hoodie', name: 'Hoodie' },
      { id: 'polo', name: 'Polo' },
      { id: 'shirt', name: 'Shirt and tie' },
      { id: 'blazer', name: 'Blazer', price: 200, text: 'Sharp enough for a steering committee.' },
      { id: 'track', name: 'Track jacket', price: 250, text: 'Two stripes, for sprint planning.' },
      { id: 'leather', name: 'Leather jacket', price: 300, text: 'For go-live night.' },
      { id: 'tux', name: 'Tuxedo', price: 450, text: 'Black tie, bow tie in your colour. For the release party.' },
    ],
  },
  { id: 'topColor', store: 'avatar', tab: 'apparel', label: 'Colour', swatch: true, def: 'blaze', options: COLORS },
  {
    id: 'glasses', store: 'avatar', tab: 'apparel', label: 'Glasses',
    options: [
      { id: 'none', name: 'None' },
      { id: 'round', name: 'Round frames' },
      { id: 'square', name: 'Square frames' },
      { id: 'shades', name: 'Aviators', price: 150, text: 'Gold-rimmed aviator shades.' },
      { id: 'visor', name: 'Holo visor', price: 300, text: 'A glowing visor, for reading debug logs.' },
    ],
  },
  {
    id: 'earrings', store: 'avatar', tab: 'apparel', label: 'Earrings',
    options: [{ id: 'none', name: 'None' }, { id: 'studs', name: 'Studs' }, { id: 'hoops', name: 'Gold hoops' }],
  },
  {
    id: 'hat', store: 'avatar', tab: 'apparel', label: 'Headwear',
    options: [
      { id: 'none', name: 'None' },
      { id: 'cap', name: 'Cap' },
      { id: 'beanie', name: 'Beanie' },
      { id: 'headset', name: 'Headset' },
      { id: 'hardhat', name: 'Hard hat', price: 200, text: 'Safety first on data migrations.' },
      { id: 'crown', name: 'Crown', price: 800, text: 'A gold crown, for top players.' },
    ],
  },
  {
    id: 'car', store: 'garage', tab: 'garage', label: 'Car',
    options: [
      { id: 'hatch', name: 'City hatch' },
      { id: 'coupe', name: 'Coupe' },
      { id: 'van', name: 'Deploy van', price: 250, text: 'Room for the whole release in the back.' },
      { id: 'pickup', name: 'Pickup', price: 300, text: 'Hauls data loads.' },
      { id: 'muscle', name: 'Muscle car', price: 450, text: 'Big engine, long hood, loud.' },
      { id: 'sports', name: 'Supercar', price: 700, text: 'Low, wide and very fast. With a spoiler.' },
    ],
  },
  {
    id: 'paint', store: 'garage', tab: 'garage', label: 'Paint', swatch: true, def: 'blaze',
    options: [
      ...COLORS,
      { id: 'chrome', name: 'Chrome', color: '#c9ced6', price: 300, text: 'Mirror chrome paint for your car.' },
      { id: 'chameleon', name: 'Chameleon', color: '#ff7a33', price: 400, text: 'Shifts from orange to teal.' },
    ],
  },
  {
    id: 'wheels', store: 'garage', tab: 'garage', label: 'Rims',
    options: [
      { id: 'stock', name: 'Stock' },
      { id: 'sport', name: 'Sport' },
      { id: 'chrome', name: 'Chrome spokes', price: 150, text: 'Shiny spoked rims.' },
      { id: 'gold', name: 'Gold rims', price: 250, text: 'Gold rims. Subtle.' },
    ],
  },
]

export const slotById = (id) => SLOTS.find((s) => s.id === id)

const defaults = (store) => Object.fromEntries(SLOTS.filter((s) => s.store === store).map((s) => [s.id, s.def ?? s.options[0].id]))
export const DEFAULT_AVATAR = defaults('avatar')
export const DEFAULT_GARAGE = { ...defaults('garage'), plate: '' }

// The option for a slot, falling back to the default when the saved id is unknown.
export function option(slot, id) {
  const s = slotById(slot)
  return s.options.find((o) => o.id === id) ?? s.options.find((o) => o.id === (s.def ?? s.options[0].id))
}

export const partItemId = (slot, id) => `${slot}-${id}`

// The paid parts, as shop items: kind 'outfit' (the character) or 'car' (the garage).
export const PART_ITEMS = SLOTS.flatMap((s) =>
  s.options.filter((o) => o.price).map((o) => ({
    id: partItemId(s.id, o.id), kind: s.store === 'avatar' ? 'outfit' : 'car', slot: s.id, value: o.id, name: o.name, text: o.text, price: o.price,
  })),
)

// Plates: up to 8 letters, digits and spaces.
export const cleanPlate = (s) => s.toUpperCase().replace(/[^A-Z0-9 ]/g, '').slice(0, 8)
