// src/global.d.ts
import { IpcRenderer } from 'electron';

declare global {
    interface Window {
        electron: {
            plan: (windFilePath: string, outputFilePath: string) => Promise<{ message: string }>;
            plot: (gcodeFilePath: string, outputFilePath: string) => Promise<{ message: string }>;
            run: (gcodeFilePath: string, serialPort: string) => Promise<{ message: string }>;
        };
    }
}
