/**
 * Trailing-edge debounce: calls `fn` once `delayMs` has elapsed since the last
 * invocation. Framework-agnostic; replaces the React `useDebouncedValue` hook for
 * the live-validation pattern in the config forms.
 */
export function debounce<A extends unknown[]>(
  fn: (...args: A) => void,
  delayMs = 300,
): (...args: A) => void {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  return (...args: A) => {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => fn(...args), delayMs);
  };
}
