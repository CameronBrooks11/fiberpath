/**
 * StreamControls - Left panel containing three control sections
 *
 * Sections:
 * 1. Connection - Port selection and connection management
 * 2. Manual Control - Common G-code commands and manual input
 * 3. File Streaming - G-code file streaming with progress
 */

import { ConnectionSection } from "./ConnectionSection";
import { ManualControlSection } from "./ManualControlSection";
import { FileStreamingSection } from "./FileStreamingSection";
import "./StreamControls.css";

export function StreamControls() {
  return (
    <div className="stream-controls">
      <ConnectionSection />
      <ManualControlSection />
      <FileStreamingSection />
    </div>
  );
}
