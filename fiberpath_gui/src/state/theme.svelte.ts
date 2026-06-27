export type ThemeMode = "dark" | "light";
/** null = follow the system preference. */
export type ThemePreference = ThemeMode | null;

const STORAGE_KEY = "fiberpath-theme";
const DARK_QUERY = "(prefers-color-scheme: dark)";

function systemTheme(): ThemeMode {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return "dark";
  return window.matchMedia(DARK_QUERY).matches ? "dark" : "light";
}

function storedPreference(): ThemePreference {
  if (typeof window === "undefined") return null;
  const s = window.localStorage.getItem(STORAGE_KEY);
  return s === "dark" || s === "light" ? s : null;
}

/** Theme preference + resolution (replaces the React useTheme hook). */
export class ThemeStore {
  preference = $state<ThemePreference>(storedPreference());
  system = $state<ThemeMode>(systemTheme());

  readonly theme = $derived(this.preference ?? this.system);
  readonly isSystem = $derived(this.preference === null);
  readonly label = $derived(this.isSystem ? `System (${this.system})` : this.preference!);

  setPreference(p: ThemePreference) {
    this.preference = p;
    if (typeof window === "undefined") return;
    if (p === null) window.localStorage.removeItem(STORAGE_KEY);
    else window.localStorage.setItem(STORAGE_KEY, p);
  }

  /** Cycle dark → light → system. */
  cycle() {
    this.setPreference(
      this.preference === "dark" ? "light" : this.preference === "light" ? null : "dark",
    );
  }

  /** Watch the OS preference; returns an unsubscribe. Call once from the shell. */
  watchSystem(): () => void {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return () => {};
    }
    const mq = window.matchMedia(DARK_QUERY);
    const onChange = (e: MediaQueryListEvent) => (this.system = e.matches ? "dark" : "light");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }
}

export const theme = new ThemeStore();
