import { open as openExternal } from "@tauri-apps/plugin-shell";
import { createPortal } from "react-dom";
import "../../styles/dialogs.css";

interface AboutDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AboutDialog({ isOpen, onClose }: AboutDialogProps) {
  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleDocsLink = () => {
    void openExternal("https://cameronbrooks11.github.io/fiberpath");
  };

  const handleGitHubLink = () => {
    void openExternal("https://github.com/CameronBrooks11/fiberpath");
  };

  const dialogContent = (
    <div className="dialog-overlay" onClick={handleOverlayClick}>
      <div className="dialog-content dialog-content--small">
        <div className="dialog-header">
          <h2>About FiberPath</h2>
          <button className="dialog-close" onClick={onClose}>×</button>
        </div>
        
        <div className="dialog-body">
          <div className="about-section">
            <div className="about-logo">
              <div className="about-icon">🧵</div>
              <div className="about-title">
                <h3>FiberPath</h3>
                <p className="about-version">Version 0.2.3</p>
              </div>
            </div>
          </div>

          <div className="about-section">
            <p className="about-description">
              Professional filament winding path planning and G-code generation software 
              for composite manufacturing. Create optimized winding patterns for cylindrical 
              mandrels with helical, hoop, and skip layers.
            </p>
          </div>

          <div className="about-section">
            <h4>Features</h4>
            <ul className="about-features">
              <li>Visual layer authoring with live preview</li>
              <li>JSON Schema validation</li>
              <li>Multiple axis formats (XAB, XYZ)</li>
              <li>Real-time G-code generation</li>
            </ul>
          </div>

          <div className="about-section">
            <h4>Links</h4>
            <div className="about-links">
              <button className="link-button" onClick={handleDocsLink}>
                📚 Documentation
              </button>
              <button className="link-button" onClick={handleGitHubLink}>
                💻 GitHub Repository
              </button>
            </div>
          </div>

          <div className="about-section about-footer">
            <p className="about-copyright">
              © 2026 Cameron Brooks
            </p>
            <p className="about-license">
              Open source software licensed under AGPL v3.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(dialogContent, document.body);
}
