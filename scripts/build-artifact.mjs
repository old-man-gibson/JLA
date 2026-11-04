// Turns the single-file build into an artifact page: claude.ai wraps the page
// in its own <html>/<head>/<body>, so we emit just the title, styles, root
// element and script.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

const out = process.argv[2] ?? 'dist-artifact/page.html'
const html = readFileSync('dist-artifact/index.html', 'utf8')

const styles = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1])
const scripts = [...html.matchAll(/<script type="module"[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1])
if (styles.length === 0 || scripts.length === 0) throw new Error('Expected inlined <style> and <script> in the build')
for (const s of scripts) if (s.includes('</script')) throw new Error('Script contains a closing script tag')

const page = `<title>Nihongo Kana & Vocab</title>
<meta name="claude:viewport-fit-sides" content="cover">
<meta name="description" content="Kana drills and spaced-repetition vocabulary for learning Japanese.">
<style>
${styles.join('\n')}
</style>
<div id="root"></div>
${scripts.map((s) => `<script type="module">\n${s}\n</script>`).join('\n')}
`
mkdirSync(dirname(out), { recursive: true })
writeFileSync(out, page)
console.log(`Wrote ${out} (${(page.length / 1024).toFixed(0)} KB)`)
