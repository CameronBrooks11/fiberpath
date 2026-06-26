import { mount } from "svelte";
import App from "./App.svelte";
import "./styles/index.css";

// Dev-only Svelte entry (index.svelte.html). Not part of the production rollup
// input, so `vite build` ships only the React app until the #221 cutover.
const target = document.getElementById("svelte-root");
if (!target) {
  throw new Error("#svelte-root not found");
}

mount(App, { target });
