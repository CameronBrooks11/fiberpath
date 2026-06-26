<script lang="ts">
  // Dev-only scaffold for the #215 decision gate: shows the migrated config forms
  // in isolation so they can be viewed and visually compared against the React app.
  // The real Prepare/Machine workspace shell arrives in #216; index.html keeps
  // mounting React until the #221 cutover.
  import MandrelForm from "./components/forms/MandrelForm.svelte";
  import TowForm from "./components/forms/TowForm.svelte";
  import MachineSettingsForm from "./components/forms/MachineSettingsForm.svelte";
  import { projectSession } from "./state/project-session.svelte";
</script>

<div class="svelte-gate">
  <header class="svelte-gate__bar">
    <strong>FiberPath — Svelte 5 foundation (#215)</strong>
    <span>{projectSession.isDirty ? "● unsaved" : "saved"}</span>
  </header>
  <aside class="svelte-gate__panel">
    <h2 class="panel-header">Parameters</h2>
    <MandrelForm />
    <TowForm />
    <MachineSettingsForm />
  </aside>
</div>

<style>
  .svelte-gate {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: var(--color-surface, #1a1a1a);
    color: var(--color-text, #e0e0e0);
  }
  .svelte-gate__bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 1rem;
    border-bottom: 1px solid var(--color-border, #333);
    font-size: 0.85rem;
  }
  .svelte-gate__panel {
    width: 320px;
    padding: 1rem;
    overflow-y: auto;
  }
</style>
