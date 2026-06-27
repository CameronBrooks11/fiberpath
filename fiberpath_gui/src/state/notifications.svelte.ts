import { TOAST_DURATION_DEFAULT_MS, TOAST_DURATION_ERROR_MS } from "../lib/constants";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

/**
 * Toast notifications (replaces the Zustand toastStore). File operations and
 * other flows push transient feedback here; {@link Toasts} renders it.
 */
interface ToastTimer {
  handle: ReturnType<typeof setTimeout>;
  remaining: number;
  startedAt: number;
}

export class Notifications {
  toasts = $state<Toast[]>([]);
  #nextId = 0;
  #timers = new Map<number, ToastTimer>();

  #arm(id: number, remaining: number) {
    const handle = setTimeout(() => this.dismiss(id), remaining);
    this.#timers.set(id, { handle, remaining, startedAt: Date.now() });
  }

  push(type: ToastType, message: string, duration = TOAST_DURATION_DEFAULT_MS) {
    const id = this.#nextId++;
    this.toasts.push({ id, type, message });
    this.#arm(id, duration);
    return id;
  }

  /** Pause a toast's auto-dismiss timer (e.g. while hovered/focused). */
  pause(id: number) {
    const t = this.#timers.get(id);
    if (!t) return;
    clearTimeout(t.handle);
    t.remaining = Math.max(0, t.remaining - (Date.now() - t.startedAt));
  }

  /** Resume a paused timer with its remaining time. */
  resume(id: number) {
    const t = this.#timers.get(id);
    if (t) this.#arm(id, t.remaining);
  }

  success(message: string) {
    return this.push("success", message);
  }
  error(message: string) {
    return this.push("error", message, TOAST_DURATION_ERROR_MS);
  }
  warning(message: string) {
    return this.push("warning", message);
  }
  info(message: string) {
    return this.push("info", message);
  }

  dismiss(id: number) {
    const t = this.#timers.get(id);
    if (t) {
      clearTimeout(t.handle);
      this.#timers.delete(id);
    }
    this.toasts = this.toasts.filter((toast) => toast.id !== id);
  }

  /** Clear all toasts (used to reset between tests). */
  clear() {
    for (const t of this.#timers.values()) clearTimeout(t.handle);
    this.#timers.clear();
    this.toasts = [];
  }
}

export const notifications = new Notifications();
