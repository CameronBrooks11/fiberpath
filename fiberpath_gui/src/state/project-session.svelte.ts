import { createLayer } from "../types/project";
import type { Layer, LayerType, Mandrel, Tow } from "../types/project";
import { createEmptyDocument, type ProjectDocument } from "../types/document";
import type {
  UiValidationErrors,
  UiValidationField,
} from "../lib/validationErrors";

export { createEmptyDocument, type ProjectDocument };

/**
 * Reactive session around a single project. Replaces the Zustand `projectStore`:
 * persisted document and transient session state are separated, and dirtiness is
 * derived from a revision counter rather than a boolean set in every mutation
 * (one less thing to forget as the app grows).
 *
 * Layer mutations (add/remove/reorder/duplicate) land with the layer-editing
 * slice (#217); this gate slice wires only what the config forms need.
 */
export class ProjectSession {
  document = $state<ProjectDocument>(createEmptyDocument());
  filePath = $state<string | null>(null);
  selectedLayerId = $state<string | null>(null);
  validationErrors = $state<UiValidationErrors>({});

  /** Bumped on every document mutation; compared against {@link savedRevision}. */
  revision = $state(0);
  savedRevision = $state(0);

  readonly isDirty = $derived(this.revision !== this.savedRevision);

  /** The layer currently selected for editing, or null. */
  readonly selectedLayer = $derived(
    this.document.layers.find((l) => l.id === this.selectedLayerId) ?? null,
  );

  updateMandrel(patch: Partial<Mandrel>) {
    Object.assign(this.document.mandrel, patch);
    this.revision++;
  }

  // --- Layer operations ---------------------------------------------------
  // Selection is session-only (no revision bump); document mutations bump it.

  selectLayer(id: string | null) {
    this.selectedLayerId = id;
  }

  addLayer(type: LayerType): string {
    const layer = createLayer(type);
    this.document.layers.push(layer);
    this.selectedLayerId = layer.id;
    this.revision++;
    return layer.id;
  }

  removeLayer(id: string) {
    const index = this.document.layers.findIndex((l) => l.id === id);
    if (index === -1) return;
    this.document.layers.splice(index, 1);
    if (this.selectedLayerId === id) {
      this.selectedLayerId = this.document.layers[0]?.id ?? null;
    }
    this.revision++;
  }

  updateLayer(id: string, patch: Partial<Layer>) {
    const layer = this.document.layers.find((l) => l.id === id);
    if (!layer) return;
    Object.assign(layer, patch);
    this.revision++;
  }

  reorderLayers(from: number, to: number) {
    const layers = this.document.layers;
    if (from === to) return;
    if (from < 0 || from >= layers.length || to < 0 || to >= layers.length) return;
    const [moved] = layers.splice(from, 1);
    layers.splice(to, 0, moved);
    this.revision++;
  }

  duplicateLayer(id: string): string | null {
    const index = this.document.layers.findIndex((l) => l.id === id);
    if (index === -1) return null;
    // Shallow copy with a fresh id (matches the React store). Editors replace
    // each sub-object wholesale, so the shared hoop/helical/skip reference is
    // never mutated in place — no aliasing between original and copy.
    const copy: Layer = { ...this.document.layers[index], id: crypto.randomUUID() };
    this.document.layers.splice(index + 1, 0, copy);
    this.selectedLayerId = copy.id;
    this.revision++;
    return copy.id;
  }

  updateTow(patch: Partial<Tow>) {
    Object.assign(this.document.tow, patch);
    this.revision++;
  }

  updateDefaultFeedRate(feedRate: number) {
    this.document.defaultFeedRate = feedRate;
    this.revision++;
  }

  setValidationError(field: UiValidationField, message: string | undefined) {
    const next = { ...this.validationErrors };
    if (message) {
      next[field] = message;
    } else {
      delete next[field];
    }
    this.validationErrors = next;
  }

  setValidationErrors(errors: UiValidationErrors) {
    this.validationErrors = errors;
  }

  clearValidationErrors() {
    this.validationErrors = {};
  }

  /** Replace the open document (e.g. file open). Resets transient + dirty state. */
  loadDocument(document: ProjectDocument, filePath: string | null = null) {
    this.document = document;
    this.filePath = filePath;
    this.selectedLayerId = null;
    this.validationErrors = {};
    this.revision = 0;
    this.savedRevision = 0;
  }

  newDocument() {
    this.loadDocument(createEmptyDocument());
  }

  /** Mark the current revision as the on-disk one (call after a successful save). */
  markSaved() {
    this.savedRevision = this.revision;
  }
}

/** App-wide singleton. Components import and read it reactively. */
export const projectSession = new ProjectSession();
