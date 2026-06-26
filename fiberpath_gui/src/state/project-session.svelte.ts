import type { Layer, Mandrel, Tow } from "../types/project";
import type {
  UiValidationErrors,
  UiValidationField,
} from "../lib/validationErrors";

/**
 * The persisted part of a project — exactly what round-trips to a `.wind` file.
 * Transient UI state (file path, selection, dirty flag, validation) lives on the
 * session, NOT in here, so it can never leak into a saved document.
 */
export interface ProjectDocument {
  mandrel: Mandrel;
  tow: Tow;
  layers: Layer[];
  defaultFeedRate: number;
}

export function createEmptyDocument(): ProjectDocument {
  return {
    mandrel: { diameter: 150, wind_length: 750 },
    tow: { width: 12.7, thickness: 0.25 },
    layers: [],
    defaultFeedRate: 400,
  };
}

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

  updateMandrel(patch: Partial<Mandrel>) {
    Object.assign(this.document.mandrel, patch);
    this.revision++;
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
