/**
 * Retry utility for handling transient failures in Tauri commands
 */

export interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
  backoffMultiplier?: number;
  shouldRetry?: (error: unknown) => boolean;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  delayMs: 500,
  backoffMultiplier: 2,
  shouldRetry: (error: unknown) => {
    // Retry on network/IO errors, but not on validation errors
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      // Don't retry validation errors, schema errors, or user input errors
      if (message.includes('validation') || 
          message.includes('invalid') || 
          message.includes('schema') ||
          message.includes('bad parameter')) {
        return false;
      }
      // Retry on IO errors, connection issues, timeouts
      if (message.includes('failed to') ||
          message.includes('timeout') ||
          message.includes('connection') ||
          message.includes('enoent') ||
          message.includes('permission denied')) {
        return true;
      }
    }
    // Default: retry on unknown errors
    return true;
  },
};

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: unknown;
  let delay = opts.delayMs;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry if this is the last attempt
      if (attempt === opts.maxAttempts) {
        break;
      }

      // Check if we should retry this error
      if (!opts.shouldRetry(error)) {
        break;
      }

      // Wait before retrying with exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= opts.backoffMultiplier;
    }
  }

  // All retries failed, throw the last error
  throw lastError;
}

/**
 * Create a retryable version of an async function
 */
export function withRetry<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  options: RetryOptions = {}
): (...args: TArgs) => Promise<TResult> {
  return (...args: TArgs) => retry(() => fn(...args), options);
}
