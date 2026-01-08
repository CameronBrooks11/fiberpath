import { useState, FocusEvent } from "react";
import { useProjectStore } from "../../state/projectStore";
import type { HelicalLayer } from "../../types/project";

interface HelicalLayerEditorProps {
  layerId: string;
}

export function HelicalLayerEditor({ layerId }: HelicalLayerEditorProps) {
  const layers = useProjectStore((state) => state.project.layers);
  const updateLayer = useProjectStore((state) => state.updateLayer);
  
  const layer = layers.find(l => l.id === layerId);
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  if (!layer || layer.type !== 'helical' || !layer.helical) {
    return null;
  }
  
  const gcd = (a: number, b: number): number => {
    return b === 0 ? a : gcd(b, a % b);
  };
  
  const validateWindAngle = (value: number): string | undefined => {
    if (isNaN(value) || value <= 0 || value >= 90) {
      return "Wind angle must be between 0° and 90°";
    }
    return undefined;
  };
  
  const validatePositive = (value: number, name: string): string | undefined => {
    if (isNaN(value) || value < 0) {
      return `${name} must be non-negative`;
    }
    return undefined;
  };
  
  const validateCoprime = (pattern: number, skip: number): string | undefined => {
    if (gcd(pattern, skip) !== 1) {
      return "Pattern and skip must be coprime (GCD = 1)";
    }
    return undefined;
  };
  
  const handleChange = (field: keyof HelicalLayer, value: number | boolean) => {
    const currentHelical = layer.helical || {
      wind_angle: 45,
      pattern_number: 3,
      skip_index: 2,
      lock_degrees: 5,
      lead_in_mm: 10,
      lead_out_degrees: 5,
      skip_initial_near_lock: false
    };
    
    updateLayer(layerId, {
      helical: {
        ...currentHelical,
        [field]: value,
      },
    });
  };
  
  const handleBlur = (field: string, value: number) => {
    let error: string | undefined;
    
    switch (field) {
      case 'wind_angle':
        error = validateWindAngle(value);
        break;
      case 'pattern_number':
        error = validatePositive(value, 'Pattern number');
        if (!error && layer.helical) {
          error = validateCoprime(value, layer.helical.skip_index);
        }
        break;
      case 'skip_index':
        error = validatePositive(value, 'Skip index');
        if (!error && layer.helical) {
          error = validateCoprime(layer.helical.pattern_number, value);
        }
        break;
      case 'lock_degrees':
      case 'lead_out_degrees':
        error = validatePositive(value, field.replace('_', ' '));
        break;
      case 'lead_in_mm':
        error = validatePositive(value, 'Lead-in');
        break;
    }
    
    setErrors(prev => ({
      ...prev,
      [field]: error || '',
    }));
  };
  
  return (
    <div className="layer-editor">
      <h3 className="layer-editor__title">Helical Layer Properties</h3>
      
      <div className="layer-editor__group">
        <label htmlFor={`wind-angle-${layerId}`} className="layer-editor__label">
          Wind Angle
          <span className="layer-editor__tooltip" title="The angle of the helical wind path (0° to 90°)">ⓘ</span>
        </label>
        <div className="layer-editor__input-wrapper">
          <input
            id={`wind-angle-${layerId}`}
            type="number"
            step="0.1"
            value={layer.helical.wind_angle}
            onChange={(e) => handleChange('wind_angle', parseFloat(e.target.value))}
            onBlur={(e) => handleBlur('wind_angle', parseFloat(e.target.value))}
            className={`layer-editor__input ${errors.wind_angle ? 'layer-editor__input--error' : ''}`}
          />
          <span className="layer-editor__unit">°</span>
        </div>
        {errors.wind_angle && (
          <span className="layer-editor__error">{errors.wind_angle}</span>
        )}
      </div>
      
      <div className="layer-editor__group">
        <label htmlFor={`pattern-${layerId}`} className="layer-editor__label">
          Pattern Number
          <span className="layer-editor__tooltip" title="Number of circuits in the winding pattern">ⓘ</span>
        </label>
        <input
          id={`pattern-${layerId}`}
          type="number"
          step="1"
          value={layer.helical.pattern_number}
          onChange={(e) => handleChange('pattern_number', parseInt(e.target.value))}
          onBlur={(e) => handleBlur('pattern_number', parseInt(e.target.value))}
          className={`layer-editor__input ${errors.pattern_number ? 'layer-editor__input--error' : ''}`}
        />
        {errors.pattern_number && (
          <span className="layer-editor__error">{errors.pattern_number}</span>
        )}
      </div>
      
      <div className="layer-editor__group">
        <label htmlFor={`skip-${layerId}`} className="layer-editor__label">
          Skip Index
          <span className="layer-editor__tooltip" title="Number of patterns to skip (must be coprime with pattern number)">ⓘ</span>
        </label>
        <input
          id={`skip-${layerId}`}
          type="number"
          step="1"
          value={layer.helical.skip_index}
          onChange={(e) => handleChange('skip_index', parseInt(e.target.value))}
          onBlur={(e) => handleBlur('skip_index', parseInt(e.target.value))}
          className={`layer-editor__input ${errors.skip_index ? 'layer-editor__input--error' : ''}`}
        />
        {errors.skip_index && (
          <span className="layer-editor__error">{errors.skip_index}</span>
        )}
      </div>
      
      <div className="layer-editor__group">
        <label htmlFor={`lock-${layerId}`} className="layer-editor__label">
          Lock Degrees
          <span className="layer-editor__tooltip" title="Degrees of mandrel rotation for locking position">ⓘ</span>
        </label>
        <div className="layer-editor__input-wrapper">
          <input
            id={`lock-${layerId}`}
            type="number"
            step="0.1"
            value={layer.helical.lock_degrees}
            onChange={(e) => handleChange('lock_degrees', parseFloat(e.target.value))}
            onBlur={(e) => handleBlur('lock_degrees', parseFloat(e.target.value))}
            className={`layer-editor__input ${errors.lock_degrees ? 'layer-editor__input--error' : ''}`}
          />
          <span className="layer-editor__unit">°</span>
        </div>
        {errors.lock_degrees && (
          <span className="layer-editor__error">{errors.lock_degrees}</span>
        )}
      </div>
      
      <div className="layer-editor__group">
        <label htmlFor={`lead-in-${layerId}`} className="layer-editor__label">
          Lead-in
          <span className="layer-editor__tooltip" title="Linear distance for lead-in movement">ⓘ</span>
        </label>
        <div className="layer-editor__input-wrapper">
          <input
            id={`lead-in-${layerId}`}
            type="number"
            step="0.1"
            value={layer.helical.lead_in_mm}
            onChange={(e) => handleChange('lead_in_mm', parseFloat(e.target.value))}
            onBlur={(e) => handleBlur('lead_in_mm', parseFloat(e.target.value))}
            className={`layer-editor__input ${errors.lead_in_mm ? 'layer-editor__input--error' : ''}`}
          />
          <span className="layer-editor__unit">mm</span>
        </div>
        {errors.lead_in_mm && (
          <span className="layer-editor__error">{errors.lead_in_mm}</span>
        )}
      </div>
      
      <div className="layer-editor__group">
        <label htmlFor={`lead-out-${layerId}`} className="layer-editor__label">
          Lead-out Degrees
          <span className="layer-editor__tooltip" title="Degrees of rotation for lead-out movement">ⓘ</span>
        </label>
        <div className="layer-editor__input-wrapper">
          <input
            id={`lead-out-${layerId}`}
            type="number"
            step="0.1"
            value={layer.helical.lead_out_degrees}
            onChange={(e) => handleChange('lead_out_degrees', parseFloat(e.target.value))}
            onBlur={(e) => handleBlur('lead_out_degrees', parseFloat(e.target.value))}
            className={`layer-editor__input ${errors.lead_out_degrees ? 'layer-editor__input--error' : ''}`}
          />
          <span className="layer-editor__unit">°</span>
        </div>
        {errors.lead_out_degrees && (
          <span className="layer-editor__error">{errors.lead_out_degrees}</span>
        )}
      </div>
      
      <div className="layer-editor__group">
        <label className="layer-editor__checkbox-label">
          <input
            type="checkbox"
            checked={layer.helical.skip_initial_near_lock}
            onChange={(e) => handleChange('skip_initial_near_lock', e.target.checked)}
            className="layer-editor__checkbox"
          />
          <span className="layer-editor__checkbox-text">Skip Initial Near Lock</span>
        </label>
        <p className="layer-editor__hint">
          Skip the initial near-lock position check
        </p>
      </div>
    </div>
  );
}
