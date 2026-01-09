/**
 * Application-wide constants
 *
 * Centralized location for magic numbers and configuration values
 * to improve maintainability and consistency.
 */

// ========================================
// STREAMING & PROGRESS
// ========================================

/**
 * Progress milestone percentages for toast notifications
 * Shows toast at 25%, 50%, and 75% streaming completion
 */
export const PROGRESS_MILESTONE_PERCENTAGES = [25, 50, 75];

/**
 * Maximum number of log entries to keep in memory
 * Older entries are automatically removed to prevent memory issues
 */
export const MAX_LOG_ENTRIES = 5000;

/**
 * Frequency of progress log entries (every N commands)
 * Reduces log verbosity during streaming
 */
export const LOG_PROGRESS_EVERY_N_COMMANDS = 10;

// ========================================
// TOAST NOTIFICATIONS
// ========================================

/**
 * Default toast display duration in milliseconds
 * Used for info, success, and warning toasts
 */
export const TOAST_DURATION_DEFAULT_MS = 4000;

/**
 * Extended toast duration for errors in milliseconds
 * Gives users more time to read error messages
 */
export const TOAST_DURATION_ERROR_MS = 6000;

// ========================================
// BAUD RATES
// ========================================

/**
 * Supported baud rates for Marlin serial communication
 */
export const BAUD_RATES = [115200, 250000, 500000] as const;

/**
 * Default baud rate for Marlin connections
 */
export const DEFAULT_BAUD_RATE = 250000;
