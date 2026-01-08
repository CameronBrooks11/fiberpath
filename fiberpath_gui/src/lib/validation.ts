import Ajv from 'ajv';
import windSchema from '../../schemas/wind-schema.json';
import type { FiberPathWindDefinition } from '../types/wind-schema';

let ajv: Ajv | null = null;
let validate: any = null;

function getValidator() {
  if (!ajv) {
    ajv = new Ajv({ 
      allErrors: true,
      strict: false, // Allow Pydantic/OpenAPI keywords like 'discriminator'
      validateFormats: false, // Don't validate formats we don't need
    });
    validate = ajv.compile(windSchema);
  }
  return validate;
}

export interface ValidationError {
  field: string;
  message: string;
}

export function validateWindDefinition(data: unknown): { valid: boolean; errors: ValidationError[] } {
  const validator = getValidator();
  const valid = validator(data);
  
  if (valid) {
    return { valid: true, errors: [] };
  }
  
  const errors: ValidationError[] = (validator.errors || []).map((err: any) => ({
    field: err.instancePath || err.schemaPath,
    message: err.message || 'Validation error',
  }));
  
  return { valid: false, errors };
}

export function isValidWindDefinition(data: unknown): data is FiberPathWindDefinition {
  const validator = getValidator();
  return validator(data);
}
