import { createPortal } from "react-dom";
import { useState, useEffect } from "react";
import { validateWindDefinition } from "../../lib/commands";
import { projectToWindDefinition } from "../../types/converters";
import type { FiberPathProject } from "../../types/project";

interface ExportConfirmationDialogProps {
  project: FiberPathProject;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ExportConfirmationDialog({ project, onConfirm, onCancel }: ExportConfirmationDialogProps) {
  const [validationStatus, setValidationStatus] = useState<'checking' | 'valid' | 'invalid'>('checking');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  
  useEffect(() => {
    const validate = async () => {
      try {
        const windDef = projectToWindDefinition(project);
        console.log('Validating wind definition:', windDef);
        
        const result = await validateWindDefinition(JSON.stringify(windDef));
        console.log('Validation result:', result);
        
        // Check for both possible response formats
        const isValid = result.valid === true || result.status === 'ok';
        
        if (isValid) {
          setValidationStatus('valid');
        } else {
          setValidationStatus('invalid');
          const errors = result.errors?.map((e: { field: string; message: string }) => `${e.field}: ${e.message}`) || ['Validation failed'];
          console.error('Validation errors:', errors);
          setValidationErrors(errors);
        }
      } catch (error) {
        console.error('Validation exception:', error);
        setValidationStatus('invalid');
        const errorMessage = error instanceof Error ? error.message : String(error);
        setValidationErrors([`Validation error: ${errorMessage}`]);
      }
    };
    
    validate();
  }, [project]);
  
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };
  
  const layerCount = project.layers.length;
  const axisFormatLabel = project.axisFormat === 'xab' ? 'XAB (Rotational)' : 'XYZ (Legacy)';
  
  const dialogContent = (
    <div className="dialog-overlay" onClick={handleOverlayClick}>
      <div className="dialog-content dialog-content--medium">
        <div className="dialog-header">
          <h2>Export G-code</h2>
          <button className="dialog-close" onClick={onCancel} aria-label="Close">
            ×
          </button>
        </div>
        
        <div className="dialog-body">
          {validationStatus === 'checking' && (
            <div className="export-validation">
              <div className="export-validation__status export-validation__status--checking">
                <span className="spinner"></span>
                <span>Validating project...</span>
              </div>
            </div>
          )}
          
          {validationStatus === 'invalid' && (
            <div className="export-validation">
              <div className="export-validation__status export-validation__status--error">
                <span className="status-icon">⚠</span>
                <span>Validation Failed</span>
              </div>
              <div className="export-validation__errors">
                {validationErrors.map((error, idx) => (
                  <div key={idx} className="export-validation__error">{error}</div>
                ))}
              </div>
              <p className="export-validation__message">
                Please fix the errors above before exporting.
              </p>
            </div>
          )}
          
          {validationStatus === 'valid' && (
            <div className="export-summary">
              <div className="export-validation__status export-validation__status--success">
                <span className="status-icon">✓</span>
                <span>Project validated successfully</span>
              </div>
              
              <div className="export-summary__section">
                <h3>Export Configuration</h3>
                <div className="export-summary__grid">
                  <div className="export-summary__item">
                    <span className="export-summary__label">Layers:</span>
                    <span className="export-summary__value">{layerCount} layer{layerCount !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="export-summary__item">
                    <span className="export-summary__label">Axis Format:</span>
                    <span className="export-summary__value">{axisFormatLabel}</span>
                  </div>
                  <div className="export-summary__item">
                    <span className="export-summary__label">Default Feed Rate:</span>
                    <span className="export-summary__value">{project.defaultFeedRate} mm/min</span>
                  </div>
                  <div className="export-summary__item">
                    <span className="export-summary__label">Mandrel:</span>
                    <span className="export-summary__value">Ø{project.mandrel.diameter}mm × {project.mandrel.wind_length}mm</span>
                  </div>
                </div>
              </div>
              
              <div className="export-summary__note">
                <strong>Note:</strong> All {layerCount} layers will be included in the exported G-code file. 
                The layer scrubber in the preview is for visualization only.
              </div>
            </div>
          )}
        </div>
        
        <div className="dialog-footer">
          <button 
            className="button button--secondary" 
            onClick={onCancel}
          >
            Cancel
          </button>
          <button 
            className="button button--primary" 
            onClick={onConfirm}
            disabled={validationStatus !== 'valid'}
          >
            {validationStatus === 'checking' ? 'Validating...' : 'Export G-code'}
          </button>
        </div>
      </div>
    </div>
  );
  
  return createPortal(dialogContent, document.body);
}
