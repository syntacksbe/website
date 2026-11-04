// Builds the patch-notes blog from blog/posts/*.md:
// - blog/index.html (the list of releases) and blog/<slug>/index.html (one static page per post), which Vite picks
//   up as extra pages (see vite.config.js). The article is plain HTML in the page, so search engines read it
//   without JavaScript; src/blog/main.jsx then adds the site header, footer and theme around it.
// - public/blog/feed.xml (RSS), public/sitemap.xml and public/robots.txt.
// - src/blog/posts.index.js, the list the menus use (it is committed, like the Arcade catalog index).
// Runs before `npm run dev` and `npm run build`; `npm run blog` runs it by hand.
//
// A post is markdown with a front matter block:
//   title: Winter '27          the release name
//   version: 68.0              the API version
//   date: 2026-10-13           general availability (ISO date)
//   tagline: one line under the title
//   summary: one or two sentences for the list, the menu and the RSS feed
//   status: draft              optional: shows a "draft" ribbon until the owner has checked the post
//   sources:                   optional list of URLs, shown at the end
//     - https://...
// In the body, `## ` headings become the sections of the page (and its table of contents), and list items that
// start with a tag in brackets get a patch-notes badge: [new] [buff] [nerf] [fix] [breaking] [beta] [pilot] [retired].
// A `> ` quote is "Marc's take". Everything else is normal markdown.
import { readdirSync, readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { marked } from 'marked'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const POSTS_DIR = resolve(ROOT, 'blog/posts')
// Keep BASE in step with vite.config.js and SITE with where the site is served; change both once a custom
// domain is connected.
const BASE = '/website/'
const SITE = 'https://syntacksbe.github.io'
const abs = (path) => `${SITE}${BASE}${path}`

const TAGS = {
  new: 'New',
  buff: 'Buff',
  nerf: 'Nerf',
  fix: 'Fix',
  breaking: 'Breaking',
  beta: 'Beta',
  pilot: 'Pilot',
  retired: 'Retired',
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
const slugify = (s) => s.toLowerCase().replace(/<[^>]+>/g, '').replace(/&[^;]+;/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const fmtDate = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })

// Front matter: `key: value` lines and `key:` followed by `  - item` lines. No nesting beyond that.
function parseFrontMatter(src) {
  const m = src.match(/^---\n([\s\S]*?)\n---\n?/)
  if (!m) throw new Error('missing front matter')
  const meta = {}
  let list = null
  for (const line of m[1].split('\n')) {
    const item = line.match(/^\s+-\s+(.*)$/)
    if (item && list) {
      meta[list].push(item[1].trim())
      continue
    }
    const kv = line.match(/^([a-z]+):\s*(.*)$/)
    if (!kv) continue
    const [, key, value] = kv
    if (value === '') {
      meta[key] = []
      list = key
    } else {
      meta[key] = value.replace(/^["']|["']$/g, '')
      list = null
    }
  }
  return { meta, body: src.slice(m[0].length) }
}

// Markdown → HTML with heading ids, patch-notes tags on list items, and a table of contents from the h2s.
function render(body) {
  const sections = []
  const renderer = new marked.Renderer()
  renderer.heading = function ({ tokens, depth }) {
    const text = this.parser.parseInline(tokens)
    const id = slugify(text)
    if (depth === 2) sections.push({ id, text })
    return `<h${depth} id="${id}">${text}</h${depth}>\n`
  }
  renderer.listitem = function ({ tokens, task, checked, loose }) {
    let html = this.parser.parse(tokens, !!loose)
    const tag = html.match(/^(<p>)?\[(\w+)\]\s*/)
    if (tag && TAGS[tag[2].toLowerCase()]) {
      const key = tag[2].toLowerCase()
      html = html.replace(tag[0], `${tag[1] || ''}<span class="pn-tag pn-${key}">${TAGS[key]}</span> `)
      return `<li class="pn-item pn-item-${key}">${html}</li>\n`
    }
    return `<li>${html}</li>\n`
  }
  renderer.blockquote = function ({ tokens }) {
    return `<aside class="pn-take"><p class="pn-take-label">Marc's take</p>${this.parser.parse(tokens)}</aside>\n`
  }
  const html = marked.parse(body, { renderer, gfm: true })
  const counts = {}
  for (const key of Object.keys(TAGS)) {
    const n = html.split(`pn-item-${key}"`).length - 1
    if (n) counts[key] = n
  }
  // Split at the h2s: what comes before the first one is the intro, the rest is one panel per section, in the
  // order the headings were met (so `sections` lines up with `parts`).
  const parts = html.split(/(?=<h2 )/)
  const intro = parts[0]
  sections.forEach((s, i) => { s.html = parts[i + 1] || '' })
  return { html, intro, sections, counts }
}

function loadPosts() {
  const posts = readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith('.md'))
    .map((file) => {
      const slug = file.replace(/\.md$/, '')
      const { meta, body } = parseFrontMatter(readFileSync(resolve(POSTS_DIR, file), 'utf8'))
      for (const key of ['title', 'version', 'date', 'tagline', 'summary']) {
        if (!meta[key]) throw new Error(`${file}: front matter needs "${key}"`)
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(meta.date)) throw new Error(`${file}: date must be YYYY-MM-DD`)
      return { slug, ...meta, sources: meta.sources || [], ...render(body) }
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1)) // newest first
  return posts
}

// The <head> shared by every blog page. `depth` is how many folders deep the page is (for the favicon only,
// since everything else is absolute).
function head({ title, description, url, image, extra = '' }) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <link rel="canonical" href="${url}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${url}">
  <meta property="og:site_name" content="Syntacks">
  <meta name="twitter:card" content="summary">
  <meta name="theme-color" content="#f5f2ec">
  <link rel="alternate" type="application/rss+xml" title="Syntacks patch notes" href="${abs('blog/feed.xml')}">
  <script>
    // Pick day / sunset / night from Brussels time before the first paint (see src/useDayNight.js).
    (function () {
      var forced = new URLSearchParams(location.search).get('time');
      var hour = Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Brussels', hour: '2-digit', hour12: false }).format(new Date()));
      var phase = /^(day|sunset|night)$/.test(forced) ? forced : hour >= 21 || hour < 6 ? 'night' : hour >= 18 || hour < 8 ? 'sunset' : 'day';
      document.documentElement.dataset.theme = phase;
    })();
  </script>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Anton&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
${extra}</head>`
}

// The page body: the header and footer are React (src/blog/main.jsx) and mount into the two chrome divs around
// the static article.
const page = (headHtml, main) => `${headHtml}
<body class="blog-page">
  <div id="chrome-top"></div>
${main}
  <div id="chrome-bottom"></div>
  <div id="chrome"></div>
  <script type="module" src="/src/blog/main.jsx"></script>
</body>
</html>
`

const tagLegend = () =>
  `<ul class="pn-legend" aria-label="Tags">${Object.entries(TAGS)
    .map(([key, label]) => `<li><span class="pn-tag pn-${key}">${label}</span></li>`)
    .join('')}</ul>`

const countsLine = (counts) =>
  Object.entries(counts)
    .map(([key, n]) => `<span class="pn-count pn-count-${key}">${n} ${TAGS[key].toLowerCase()}</span>`)
    .join('')

function postPage(post, i, posts) {
  const url = abs(`blog/${post.slug}/`)
  const title = `Salesforce ${post.title} patch notes — Syntacks`
  const newer = posts[i - 1]
  const older = posts[i + 1]
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: `Salesforce ${post.title} patch notes`,
    description: post.summary,
    datePublished: post.date,
    author: { '@type': 'Person', name: 'Marc', url: abs('') },
    publisher: { '@type': 'Organization', name: 'Syntacks', url: abs('') },
    mainEntityOfPage: url,
  }
  const extra = `  <meta property="og:type" content="article">
  <meta property="article:published_time" content="${post.date}">
  <script type="application/ld+json">${JSON.stringify(ld)}</script>
`
  const main = `  <main class="pn container narrow">
    <p class="pn-crumbs"><a href="${BASE}">Syntacks</a> <span aria-hidden="true">›</span> <a href="${BASE}blog/">Patch notes</a></p>
    <header class="pn-head">
      <p class="pn-eyebrow">Salesforce release · patch notes</p>
      <div class="pn-title-row">
        <h1>${esc(post.title)}</h1>
        <span class="pn-stamp" aria-label="API version ${esc(post.version)}"><small>API</small>v${esc(post.version)}</span>
      </div>
      <p class="pn-tagline">${esc(post.tagline)}</p>
      <p class="pn-meta"><time datetime="${post.date}">${fmtDate(post.date)}</time> · by Marc${post.status === 'draft' ? ' · <span class="pn-draft">Draft, still checking against the release notes</span>' : ''}</p>
      <p class="pn-counts">${countsLine(post.counts)}</p>
      <div id="deck-launch"></div>
    </header>
    <article class="pn-body">
${post.intro}
    </article>
    <div class="pn-tabs-wrap">
      <p class="pn-tabs-hint"><b>Sections</b> <span class="pn-tabs-count"><span data-current>1</span> / ${post.sections.length}</span> · click a tab, use the arrows, or swipe</p>
      <nav class="pn-tabs" aria-label="Sections">
        <button type="button" class="pn-arrow pn-arrow-prev" data-dir="-1" aria-label="Previous section"><i></i><kbd class="pn-key" data-key="prev">Q</kbd></button>
        <div class="pn-tabs-list" role="tablist">
          ${post.sections.map((s, i) => `<a href="#${s.id}" role="tab" id="tab-${s.id}" aria-controls="${s.id}" aria-selected="${i === 0}">${s.text}</a>`).join('\n          ')}
        </div>
        <button type="button" class="pn-arrow pn-arrow-next" data-dir="1" aria-label="Next section"><i></i><kbd class="pn-key" data-key="next">E</kbd></button>
      </nav>
    </div>
    <div class="pn-panels">
${post.sections
  .map(
    (s, i) => `      <section class="pn-section pn-body${i === 0 ? ' is-active' : ''}" id="${s.id}" role="tabpanel" aria-labelledby="tab-${s.id}">
${s.html}
        <nav class="pn-section-nav" aria-label="Next section">
          ${i > 0 ? `<a href="#${post.sections[i - 1].id}" class="pn-prev"><small><kbd data-key="prev">Q</kbd> · Previous</small>${post.sections[i - 1].text}</a>` : '<span></span>'}
          ${i < post.sections.length - 1 ? `<a href="#${post.sections[i + 1].id}" class="pn-next"><small><kbd data-key="next">E</kbd> · Next</small>${post.sections[i + 1].text}</a>` : '<span></span>'}
        </nav>
      </section>`,
  )
  .join('\n')}
    </div>
    ${post.sources.length ? `<footer class="pn-sources"><h2 id="sources">Sources</h2><ul>${post.sources.map((u) => `<li><a href="${esc(u)}" rel="noopener">${esc(u.replace(/^https?:\/\//, ''))}</a></li>`).join('')}</ul></footer>` : ''}
    <details class="pn-legend-box"><summary>What the tags mean</summary>
      <dl>
        <div><dt><span class="pn-tag pn-new">New</span></dt><dd>Didn't exist before this release.</dd></div>
        <div><dt><span class="pn-tag pn-buff">Buff</span></dt><dd>Something you already use got better or roomier.</dd></div>
        <div><dt><span class="pn-tag pn-nerf">Nerf</span></dt><dd>Tighter limit or a feature that does less than before.</dd></div>
        <div><dt><span class="pn-tag pn-fix">Fix</span></dt><dd>Behaviour corrected; check that you didn't depend on the bug.</dd></div>
        <div><dt><span class="pn-tag pn-breaking">Breaking</span></dt><dd>Will break existing code or config unless you act.</dd></div>
        <div><dt><span class="pn-tag pn-beta">Beta</span></dt><dd>Available to try, not for production bets yet.</dd></div>
        <div><dt><span class="pn-tag pn-pilot">Pilot</span></dt><dd>Invite only. Ask your account team.</dd></div>
        <div><dt><span class="pn-tag pn-retired">Retired</span></dt><dd>Gone or going. Plan the migration.</dd></div>
      </dl>
    </details>
    <nav class="pn-pager" aria-label="Other releases">
      ${newer ? `<a class="pn-pager-newer" href="${BASE}blog/${newer.slug}/"><small>Next release</small>${esc(newer.title)}</a>` : '<span></span>'}
      ${older ? `<a class="pn-pager-older" href="${BASE}blog/${older.slug}/"><small>Previous release</small>${esc(older.title)}</a>` : '<span></span>'}
    </nav>
  </main>`
  return page(head({ title, description: post.summary, url, extra }), main)
}

function indexPage(posts) {
  const url = abs('blog/')
  const title = 'Salesforce release patch notes — Syntacks'
  const description = 'Every Salesforce release as game patch notes: what changed for Apex, LWC, Flow, Sales Cloud and Service Cloud, what Marc would actually use, and what breaks.'
  const extra = `  <meta property="og:type" content="website">\n`
  const main = `  <main class="pn pn-index container">
    <header class="pn-head">
      <p class="pn-eyebrow">Three releases a year · same rules as a game patch</p>
      <h1>Patch notes</h1>
      <p class="pn-tagline">Every Salesforce release, read the way I read a game patch: what's new, what got buffed or nerfed, what I'd actually use on a project, and what breaks. Apex, Lightning Web Components, Flow and core config first, then Sales Cloud and Service Cloud.</p>
      ${tagLegend()}
      <p class="pn-meta"><a class="btn btn-ghost btn-sm" href="${BASE}blog/feed.xml">RSS feed</a></p>
    </header>
    <ol class="pn-list" reversed>
      ${posts
        .map(
          (p) => `<li class="pn-card${p.status === 'draft' ? ' is-draft' : ''}">
        <a href="${BASE}blog/${p.slug}/">
          <span class="pn-card-version"><small>API</small>v${esc(p.version)}</span>
          <span class="pn-card-main">
            <strong>${esc(p.title)}</strong>
            <em>${esc(p.tagline)}</em>
            <span class="pn-card-summary">${esc(p.summary)}</span>
            <span class="pn-counts">${countsLine(p.counts)}</span>
          </span>
          <span class="pn-card-date"><time datetime="${p.date}">${fmtDate(p.date)}</time>${p.status === 'draft' ? '<b class="pn-draft">Draft</b>' : ''}</span>
        </a>
      </li>`,
        )
        .join('\n      ')}
    </ol>
  </main>`
  return page(head({ title, description, url, extra }), main)
}

function feed(posts) {
  const items = posts
    .map(
      (p) => `    <item>
      <title>Salesforce ${esc(p.title)} patch notes</title>
      <link>${abs(`blog/${p.slug}/`)}</link>
      <guid isPermaLink="true">${abs(`blog/${p.slug}/`)}</guid>
      <pubDate>${new Date(`${p.date}T08:00:00Z`).toUTCString()}</pubDate>
      <description>${esc(p.summary)}</description>
      <content:encoded><![CDATA[${p.html.replace(/\]\]>/g, ']]]]><![CDATA[>')}]]></content:encoded>
    </item>`,
    )
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>Syntacks patch notes</title>
    <link>${abs('blog/')}</link>
    <atom:link href="${abs('blog/feed.xml')}" rel="self" type="application/rss+xml"/>
    <description>Every Salesforce release as game patch notes, by Marc, technical Salesforce consultant in Brussels.</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>
`
}

function sitemap(posts) {
  const urls = [
    { loc: abs(''), priority: '1.0' },
    { loc: abs('arcade/'), priority: '0.8' },
    { loc: abs('blog/'), priority: '0.8', lastmod: posts[0]?.date },
    ...posts.map((p) => ({ loc: abs(`blog/${p.slug}/`), priority: '0.7', lastmod: p.date })),
  ]
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}<priority>${u.priority}</priority></url>`).join('\n')}
</urlset>
`
}

export function buildBlog({ quiet = false } = {}) {
  const posts = loadPosts()
  // Remove pages of posts that no longer exist, keep everything else in blog/.
  for (const entry of readdirSync(resolve(ROOT, 'blog'), { withFileTypes: true })) {
    if (entry.isDirectory() && entry.name !== 'posts' && !posts.some((p) => p.slug === entry.name)) {
      rmSync(resolve(ROOT, 'blog', entry.name), { recursive: true, force: true })
    }
  }
  posts.forEach((post, i) => {
    const dir = resolve(ROOT, 'blog', post.slug)
    mkdirSync(dir, { recursive: true })
    writeFileSync(resolve(dir, 'index.html'), postPage(post, i, posts))
  })
  writeFileSync(resolve(ROOT, 'blog/index.html'), indexPage(posts))
  mkdirSync(resolve(ROOT, 'public/blog'), { recursive: true })
  writeFileSync(resolve(ROOT, 'public/blog/feed.xml'), feed(posts))
  writeFileSync(resolve(ROOT, 'public/sitemap.xml'), sitemap(posts))
  writeFileSync(resolve(ROOT, 'public/robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${abs('sitemap.xml')}\n`)
  const index = posts.map(({ slug, title, version, date, tagline, summary, status }) => ({ slug, title, version, date, tagline, summary, ...(status ? { status } : {}) }))
  writeFileSync(
    resolve(ROOT, 'src/blog/posts.index.js'),
    `// Generated by scripts/build-blog.mjs from blog/posts/*.md (newest first). Don't edit by hand.\nexport const POSTS = ${JSON.stringify(index, null, 2)}\n`,
  )
  if (!quiet) console.log(`✓ blog: ${posts.length} post(s) → blog/*/index.html, public/blog/feed.xml, sitemap, src/blog/posts.index.js`)
  return posts
}

export const postFiles = () => (existsSync(POSTS_DIR) ? readdirSync(POSTS_DIR).filter((f) => f.endsWith('.md')).map((f) => resolve(POSTS_DIR, f)) : [])

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) buildBlog()
