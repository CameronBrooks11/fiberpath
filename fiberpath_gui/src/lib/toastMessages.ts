/**
 * Toast message templates
 * 
 * Centralized location for toast notification messages to ensure
 * consistency across the application and make updates easier.
 */

// ========================================
// CONNECTION MESSAGES
// ========================================

export const toastMessages = {
    connection: {
        success: (port: string) => `Connected to ${port}`,
        failed: (error: string) => `Connection failed: ${error}`,
        disconnected: () => 'Disconnected from device',
        noPortSelected: () => 'Please select a serial port before connecting',
        noPortsFound: () => 'No serial ports found. Check your connections.',
        listPortsFailed: (error: string) => `Failed to list ports: ${error}`,
    },

    // ========================================
    // COMMAND MESSAGES
    // ========================================

    command: {
        failed: (error: string) => `Command failed: ${error}`,
        homingComplete: () => 'Homing complete',
        emergencyStop: () => 'Emergency stop activated!',
    },

    // ========================================
    // FILE SELECTION MESSAGES
    // ========================================

    file: {
        selected: (filename: string) => `Selected: ${filename}`,
        selectionFailed: (error: string) => `File selection failed: ${error}`,
    },

    // ========================================
    // STREAMING MESSAGES
    // ========================================

    streaming: {
        started: () => 'Streaming started',
        failed: (error: string) => `Failed to start streaming: ${error}`,
        complete: (commandsSent: number) => `Streaming complete: ${commandsSent} commands sent`,
        error: (error: string) => `Streaming error: ${error}`,
        progress: (percentage: number) => `Streaming ${percentage}% complete`,
        paused: () => 'Streaming paused',
        pauseFailed: (error: string) => `Pause failed: ${error}`,
        resumed: () => 'Streaming resumed',
        resumeFailed: (error: string) => `Resume failed: ${error}`,
        stopNotImplemented: () => 'Stop functionality not yet implemented',
    },
};
