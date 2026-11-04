import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import { buildBlog, postFiles } from './scripts/build-blog.mjs'

// The site is served from https://syntacksbe.github.io/website/.
// Change base to '/' once a custom domain is connected (and SITE/BASE in scripts/build-blog.mjs).
const root = import.meta.dirname

// The patch-notes pages are static HTML built from blog/posts/*.md; in dev a change to a post rebuilds them and
// reloads the page.
function blogPlugin() {
  let posts = buildBlog({ quiet: true })
  return {
    name: 'syntacks-blog',
    config: () => ({
      build: {
        rollupOptions: {
          input: Object.fromEntries([
            ['main', resolve(root, 'index.html')],
            ['arcade', resolve(root, 'arcade/index.html')],
            ['blog', resolve(root, 'blog/index.html')],
            ...posts.map((p) => [`blog-${p.slug}`, resolve(root, `blog/${p.slug}/index.html`)]),
          ]),
        },
      },
    }),
    configureServer(server) {
      for (const file of postFiles()) server.watcher.add(file)
      server.watcher.on('change', (file) => {
        if (!file.endsWith('.md') || !file.includes('/blog/posts/')) return
        try {
          posts = buildBlog()
          server.ws.send({ type: 'full-reload' })
        } catch (e) {
          server.config.logger.error(`blog: ${e.message}`)
        }
      })
    },
  }
}

export default defineConfig({
  base: '/website/',
  plugins: [react(), blogPlugin()],
  // Pages: the site itself, the Arcade at /website/arcade/, and the patch notes at /website/blog/ (the plugin
  // adds one entry per post).
})
