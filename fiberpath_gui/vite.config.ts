import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { svelte } from "@sveltejs/vite-plugin-svelte";

// During the React -> Svelte 5 migration (epic #214) both plugins run side by
// side: plugin-react handles .tsx (the live app), plugin-svelte handles .svelte.
// The Svelte app is reachable in dev only via index.svelte.html and is NOT in
// the production rollup input below, so it is tree-shaken out of `vite build`
// until the #221 cutover flips index.html.
export default defineConfig({
  plugins: [react(), svelte()],
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
});
