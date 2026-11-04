import { readFileSync } from 'node:fs'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

// The Android shell's version, so the web app can tell an outdated APK to update.
const shellVersion = Number(/versionCode\s+(\d+)/.exec(readFileSync('android/app/build.gradle', 'utf8'))?.[1] ?? 0)

// `vite build` makes the site deployed to GitHub Pages (pass --base=/<repo>/).
// `vite build --mode artifact` inlines everything into one HTML file so the
// app can be published as a claude.ai artifact (see scripts/build-artifact.mjs).
export default defineConfig(({ mode }) => ({
  plugins: mode === 'artifact' ? [react(), viteSingleFile()] : [react()],
  build: mode === 'artifact' ? { outDir: 'dist-artifact' } : {},
  define: { __SHELL_VERSION__: JSON.stringify(shellVersion) },
}))
