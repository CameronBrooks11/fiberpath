import { TOAST_DURATION_DEFAULT_MS } from "../lib/constants";

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
export class Notifications {
  toasts = $state<Toast[]>([]);
  #nextId = 0;

  push(type: ToastType, message: string, duration = TOAST_DURATION_DEFAULT_MS) {
    const id = this.#nextId++;
    this.toasts.push({ id, type, message });
    setTimeout(() => this.dismiss(id), duration);
    return id;
  }

  success(message: string) {
    return this.push("success", message);
  }
  error(message: string) {
    return this.push("error", message);
  }
  warning(message: string) {
    return this.push("warning", message);
  }
  info(message: string) {
    return this.push("info", message);
  }

  dismiss(id: number) {
    this.toasts = this.toasts.filter((t) => t.id !== id);
  }

  /** Clear all toasts (used to reset between tests). */
  clear() {
    this.toasts = [];
  }
}

export const notifications = new Notifications();
