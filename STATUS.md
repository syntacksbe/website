# Syntacks website — status and wrap-up

Read this first in a new session. It says where the site stands, what is open, what the owner has decided,
and which features are proposed next. `CLAUDE.md` describes the code structure and the rules; this file is the
project memory. Update it at the end of a session instead of re-reading the code next time.

Last updated: 2026-11-04.

## Where it stands

- Everything built so far is committed on `main` as one squashed commit (`d41f30a`, 2026-11-03) and deployed
  manually to https://syntacksbe.github.io/website/. Older history lives only in local branches
  `backup-before-squash`, `-2` to `-5`.
- The deploy workflow is manual-only. Pushing to `main` publishes nothing. Deploy only when the owner says so.
- Stack: React 18 + Vite 6, jsPDF (loaded on demand). No backend, no analytics, no cookies. State is in
  `localStorage` (`syntacks-arcade-v1`, `syntacks-arcade-catalog-v1`, `syntacks-gta-v1`, `syntacks-profile-v1`,
  `syntacks-intro-seen`, `syntacks-lang`, `syntacks-arcade-misses`).
- Checks: `npm run build`, `node scripts/check-i18n.mjs`, `node scripts/check-arcade.mjs` (the last one also
  regenerates the Arcade catalog index; run it after touching games).

## What is built

**Homepage** (`/website/`): comic-panel intro on first visit, hero, services loadout with looping scenes,
certification card deck (holographic, flips), heist-plan "How we'll work" with the crew, Experience with stats and
redacted case files plus the ".NET prequel" card, org health check with PDF report, in-game phone contact
(front-end demo, sends nothing), Syntacks FM radio (Web Audio, six stations plus two from the shop and one
hidden), corner mini-map, wanted stars, day / sunset / night theme by Brussels time, EN / NL / FR.

**GTA layer** (both pages, `src/gta/`): pause menu (M or P: map, stats, checklist, settings), character wheel
(hold C), tool wheel (hold Q), RP and rank-ups, side quests, police chase at five stars (`?chase` opens the
driving game directly), wasted and mission-failed screens.

**Arcade** (`/website/arcade/`): 150+ short Salesforce games in categories (quiz, bug, order, sort, match plus
plug-in types: SOQL builder, log detective, deploy conveyor, price is right, wire it up, escape rooms), the five
demos as seeded simulations, boss fight, swipe deck, speed run, hot seat, learning paths, review of missed
rounds, weekly challenge with a leaderboard (fake players for now), trophy cabinet, share cards, Daily Sforcle,
shop paid in gears (backgrounds, card borders, stations, character and garage parts), profile with a character
creator (body, face, hair, clothes, garage) and the SVG car.

**Patch notes blog** (`/website/blog/`, built 2026-11-04): each Salesforce release as game patch notes, one
markdown file per release in `blog/posts/`, rendered to static HTML by `scripts/build-blog.mjs` (runs with dev
and build), with an RSS feed, a sitemap and robots.txt. Scope per post: Apex, LWC and dev tooling, Flow and
automation (incl. approvals), core config, Sales Cloud, Service Cloud, breaking changes, "What I'd actually use"
and "What breaks". Inside a post the sections are GTA-style tabs (`src/blog/tabs.js`): a sticky strip under the
header, one panel at a time, switched by click, the arrow buttons on the strip, arrow keys, Q / E (A / E on AZERTY: a "Keyboard" setting in the
Arcade profile, auto-detected in Chrome) or a swipe, with the hash remembering the open section; without JavaScript
every section shows. Each post also has a **card deck mode** (`src/blog/Deck.jsx`, button in the post header): every tagged item
is a card, swipe right "I'll use this", up "Breaks for me", left "Skip" (or buttons, arrow keys, Backspace to undo),
pick sections first, progress saved per post in localStorage `syntacks-patch-deck-v1`, and the end screen is your
checklist for that release (breaks first) to copy or save as a .md file. The header has a "Patch notes" item with the three latest releases as sub-items (hover
panel on desktop, indented in the phone menu). Posts: Spring '26, Summer '26, Winter '27, researched from the
official release notes on 2026-11-04 and marked `status: draft` until the owner has checked them. English only;
the GTA layer is off on blog pages. Other reading modes proposed but not built: a boss-fight quiz per
release in the Arcade, the radio DJ reading the picks aloud, and a GTA loading-screen mode.

## Owner decisions (don't re-propose)

- No deploys without an explicit ask. Commit and push only when asked.
- Clean homepage header: only the Arcade link, no XP or wanted-star HUD. Arcade header: icon-only pills.
- No money anywhere. Gears are earned from Arcade stars and trophies and are never shown as currency.
- No scroll-triggered popup banners, no section title cards, no news ticker.
- No availability badge ("I can delegate work").
- No gender switch in the character creator: builds (broad, slim, curvy) and every style are open to all.
- Light theme by default; bold GTA / Vice-style look (blaze orange, gold, asphalt, teal, Anton headlines);
  no pastels, no pink-led palettes, no corporate blue; lots of motion but every animation respects
  `prefers-reduced-motion`.
- Content: Salesforce first, .NET only in the "Before Salesforce" card, first name "Marc" only, no former
  employers or school, contact via LinkedIn only, Salesforce product names stay English in every language.

## Open to-dos

1. Native-speaker check of Dutch and French (an agent wrote them; Dutch uses "je", French "vous").
2. The English Integrations service text still mentions "C# and .NET" outside the prequel card; nl/fr already
   drop it. Ask before changing the English.
3. Not yet checked on a real phone: the phone slide-in, the share-card PNG, the tiny scene text (about 7px).
4. Contact form and leaderboard need a backend before the site is fully public. Fake data is fine for now.
5. Crew wording and the radio ads are first drafts waiting for the owner's review.
6. Not started: own domain and SEO basics, privacy-friendly analytics, accessibility pass, pre-deploy checks,
   "Ask my org" assistant, city-map homepage.
7. The three patch-notes posts are drafts: check every item against the release notes (links at the end of each
   post), rewrite "Marc's take" in your own words, then remove `status: draft` from the front matter.

## Proposed features (2026-11-04, not started)

The owner asked for ideas. Picks with the biggest effect per hour are marked ★.

For winning work:
- ★ **Apex "bug bounty" linter**: paste a snippet, a client-side checker flags SOQL in loops, hard-coded IDs,
  missing bulkification, missing null checks, shown as a wanted list. Nothing leaves the browser.
- **Admin toolbox page**: 15-to-18 ID converter, CRON builder for scheduled Apex, SOQL formatter, field API-name
  generator, date-literal picker. Could live in the tool wheel (Q).
- **Bring your own numbers to the health check**: paste `sf org list limits --json` output or a Setup Audit
  Trail CSV and the gauges and the PDF use the real org, still client-side.
- ★ **Character sheet PDF**: one-page consultant profile with jsPDF (stats, certs, sectors, mission history,
  no employer names) for agencies that ask for a CV.
- ~~**Patch notes blog**~~: built 2026-11-04 (see "What is built").
- **Mission briefing wizard**: five questions give a phased plan with rough effort ranges and a brief the
  visitor can send on LinkedIn.

For the Arcade:
- ★ **Challenge links with ghost runs**: the sims are seeded, so a URL can carry seed and score and the
  challenger's timeline plays as a ghost. No backend.
- **Daily objectives and streaks**: three small goals a day paying gears, plus a streak counter.
- **Cheat codes** in the pause menu (hidden station, big-head avatars, sepia filter).
- **Photo mode**: avatar and car on a Vice-style poster with name and title, downloadable for LinkedIn.
- **Save-game export** as a code or QR to move progress between devices; bridge to the future database.
- **Cert bootcamp paths** weighted by the official exam-guide sections, with a readiness bar per section.
  Seed for the separate Salesforce-learning site the owner may build (keep sim logic in plain JS for that).

Plumbing:
- **PWA** (installable Arcade, Daily Sforcle offline).
- **Per-route Open Graph images** for shared links.
- **Backend for contact and leaderboard** on Cloudflare Pages Functions + D1 or Supabase.

## How to end a session

Update this file (state, decisions, to-dos, what was built), run the three checks, and commit when the owner
asks. Keep `CLAUDE.md` for structure and rules only.
