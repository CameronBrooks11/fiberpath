import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

// Plain Svelte 5 + TypeScript (no SvelteKit). vitePreprocess lets <script lang="ts">
// and scoped <style> blocks run through Vite's transform pipeline.
export default {
  preprocess: vitePreprocess(),
};
