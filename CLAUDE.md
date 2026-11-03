# Syntacks Website

Website for Syntacks, the freelance practice of Marc, a technical Salesforce consultant in Brussels.
Single-page React 18 + Vite site with interactive, gamified Salesforce demos.

## ⛔ Never deploy or publish

The owner tests the site locally until it is ready. Until they explicitly say otherwise:

- **Never deploy or publish the site.** Do not run the deploy workflow (`gh workflow run`, the Actions UI),
  do not re-add a `push` trigger to `.github/workflows/deploy.yml`, and do not change GitHub Pages settings.
- `.github/workflows/deploy.yml` is **manual-only** (`workflow_dispatch`) on purpose, so pushing to `main`
  only stores code on GitHub — it does not publish anything.
- Committing and pushing to GitHub (`syntacksbe/website`, branch `main`) is fine when the owner asks for it.
- The live site at https://syntacksbe.github.io/website/ still shows the last version that was deployed
  manually; it is not updated by pushes.

## Run and test locally

```bash
npm install --cache "$TMPDIR/npm-cache"   # the sandbox can't write to ~/.npm
npm run dev                               # http://localhost:5173/website/ (Arcade: /website/arcade/)
npm run build                             # production build into dist/ (git-ignored)
```

In Claude Code, start the dev server with the `website` entry in `.claude/launch.json`.
Before saying a change is done, check it in the browser:

- desktop and a 375px-wide phone viewport, in all three time-of-day themes (`?time=day`, `?time=sunset`, `?time=night`)
- no horizontal page overflow and no console errors
- `npm run build` passes

## Structure

- `src/content.js` — site copy: services, the certifications (in the order earned, with tier, rarity, stats and client-facing text), the work plan (two modes of four missions, plus tips), industries, .NET stack
- `src/components/` — one component per section, plus the five demos `GovernorDemo`, `IntegrationDemo`,
  `DataModelDemo`, `ServiceDeskDemo`, `SalesPipelineDemo`, which are only played in the Arcade (as simulations);
  `HealthCheck` is not part of the game
- `src/serviceDesk.js` and `src/salesPipeline.js` — the Service Desk Shift and Pipeline Quarter simulations as
  plain JS without React, so they can be reused in a future Salesforce-learning site; each run is seeded, so
  results compare fairly. `src/components/SimParts.jsx` holds what both share: the run loop (`useSim`), the
  switches (also flippable mid-game), the HUD with its timeline and the results screen
- `src/components/Services.jsx` — the services "loadout": pick a specialist, its scene from `ServiceScenes.jsx`
  loops on a screen (one clock `t` in seconds drives each scene; CSS transitions do the motion; reduced motion
  shows the last frame). Left alone it cycles through the six; each button opens that category in the Arcade
  (`arcade/#/?c=<category>`), org health goes to the health check
- `src/components/Certifications.jsx` — the skill tree as a card deck in the same style: a rail of cards, the
  chosen one big and holographic (tilts with the mouse, flips to its abilities) with a looping scene from
  `CertScenes.jsx`, and stat bars built from every card's `stats`. The last card is locked ("Your project")
- `src/game.jsx` — gamification: achievements, XP, levels, toasts; progress is saved in `localStorage`
  under `syntacks-arcade-v1` (clear it to reset)
- `src/useDayNight.js` (+ the inline script in `index.html`) — the theme follows the time in Brussels:
  `html[data-theme]` is `day` (08–18h), `sunset` (18–21h and 06–08h) or `night`; `?time=day|sunset|night` forces one
- `src/components/LoadingScreen.jsx` — comic-panel intro on the first visit only (`localStorage` key
  `syntacks-intro-seen`); `?intro` in the URL shows it again
- `src/components/MiniMap.jsx` — corner radar with fast-travel blips (hidden on phones, folded into a pill below 1440px)
- `src/radio.js` + `src/components/RadioDial.jsx` — Syntacks FM: synthwave generated with the Web Audio API
  (no audio files); off by default and only created when the visitor presses play
- `src/healthReport.js` — PDF of the health check, built with jsPDF (loaded on demand), in the chosen language
- `src/i18n.jsx` — English (default), Dutch and French for the homepage: `?lang=en|nl|fr`, then localStorage
  `syntacks-lang`, then the browser. `useLang()` gives `t('key')` from `src/strings.<lang>.js`; `useContent()` gives
  `content.js` / `content.nl.js` / `content.fr.js` (same shape); `healthChecks.nl.js` / `.fr.js` translate the checks.
  Nav, Contact, Wanted and RadioDial keep their own `TEXTS = { en, nl, fr }`. Check with `node scripts/check-i18n.mjs`.
  The Arcade stays English. Salesforce product and Setup names stay English in every language
- `src/components/Contact.jsx` — the in-game phone (home screen, Messages chat, "Mission passed"). It is a front-end
  demo: it sends nothing until a backend or form service is connected; LinkedIn stays the real contact
- `useWanted()` in `game.jsx` — the wanted level (badges, Arcade stars and the health check raise it). It is not shown in
  the header (the owner wants the header clean: the Arcade link is enough); five stars start the police chase, and the
  pause menu's stats show it. The Arcade header has an icon-only 🏆 button to the trophy cabinet. `src/radio.js` has six generated stations, plus two from the Arcade shop and a hidden one
- `arcade/index.html` + `src/arcade/` — the Arcade, a second page at `/website/arcade/` (see `vite.config.js`):
  a catalog of short Salesforce games. Game content is data in `src/arcade/games/<category>.js` following
  `src/arcade/format.js` (types: quiz, bug, order, sort, match); the five demos join as simulations.
  Check content with `node scripts/check-arcade.mjs`, which also regenerates `src/arcade/catalog.index.js` (the
  catalog list that loads first; each game's rounds load on demand). Run it after adding or changing games, or new games
  won't show up. Routes live in the hash (`#/`, `#/play/<game-id>`,
  `#/daily`); best stars per game are saved under `syntacks-arcade-catalog-v1`
  - plug-in game types live in `src/arcade/types/<type>.check.js` + `<type>.jsx` (+ css), their games in
    `src/arcade/extra/<type>.js` (SOQL builder, log detective, deploy conveyor, price is right, wire it up,
    escape rooms); a round component calls `onResult(score 0–1)` once and shows the answer when `done`
  - `src/arcade/modes.jsx` — boss fight, swipe deck, speed run and hot seat (the last two are generated per
    category from its quiz rounds in `catalog.js`); `src/arcade/Daily.jsx` — the Daily Sforcle word game
  - `src/arcade/fx.js` — particles, shake, haptics and synth sounds (sound off until the player turns it on)
  - `Listing` in `src/arcade/rounds.jsx` shows code as code, settings as a settings card and columns as a table
  - more routes: `#/paths` and `#/path/<id>` (learning paths in `paths.js`), `#/review` (rounds you missed, saved in
    `syntacks-arcade-misses`), `#/leaderboard` (weekly challenge plus FAKE standings from `fakeLeaderboard.js` until there
    is a backend) and `#/trophies` (every badge and Arcade trophy); `share.jsx` draws the share card on a canvas
  - `#/shop` (`Shop.jsx`, items in `shopItems.js`, gears in `shop.js`) and `#/profile` (`Profile.jsx`). Gears (⚙) come
    only from Arcade stars and trophies and are never shown as money; items are page backgrounds
    (`html[data-arcade-bg]`), card borders (`html[data-arcade-border]`), radio stations, and paid character and garage
    parts. The profile opens on a character creator (tabs Body, Face, Hair, Clothes, Garage): the SVG character
    (`Avatar.jsx`) and car (`Car.jsx`) are built from the slots in `avatarParts.js`; paid parts can be tried on and are
    saved only once bought. There is no gender switch: build (broad, slim, curvy) and every style are open to all.
    The character also shows in the header and on the leaderboard. Personal info, purchases and
    the equipped look go through `src/arcade/profile.js` (localStorage `syntacks-profile-v1` for now; swap its
    load/save for a database later). The homepage has no gears or shop
- `src/gta/` — the GTA layer on both pages (`GtaLayer.jsx`): pause menu (M/P: map, stats, checklist, settings),
  character wheel (hold C, homepage) and tool wheel (hold Q), RP and rank-up, side quests (`quests.js`), the police
  chase at five stars (`?chase` opens its driving game "Lose the heat" directly), the heist crew in "How we'll work", wasted / mission-failed screens. Its words are in
  `src/gta/strings.js` (en/nl/fr, checked by `check-i18n.mjs`); state in localStorage `syntacks-gta-v1`.
  The owner rejected scroll-triggered popup banners and a news ticker: don't bring them back
- `src/styles.css` — all styles; colour tokens on `:root`, overridden per `html[data-theme]`; every animation must
  respect `prefers-reduced-motion`
- `vite.config.js` — `base: '/website/'`; change to `'/'` if a custom domain is connected

## Content rules

- Focus on Salesforce. The .NET / C# / Xamarin background appears only in the "Before Salesforce" card.
- Never name former employers or the school.
- Use the first name "Marc" only. Contact goes through LinkedIn — don't publish an email address or phone
  number unless the owner provides one.
- Write in English; keep the existing tone (first person, short, concrete).
