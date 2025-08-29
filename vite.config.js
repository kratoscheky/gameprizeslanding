import { defineConfig } from 'vite'

// Use relative asset paths so the generated `dist/index.html` works when
// opened directly (file://) or served from a subpath. Without this, Vite
// emits absolute paths like `/assets/...` which break when not served from
// the site root.
export default defineConfig({
  base: './'
})
