export interface BackendValidationError {
  field: string;
  message: string;
}

export type UiValidationField =
  | "mandrel.diameter"
  | "mandrel.wind_length"
  | "tow.width"
  | "tow.thickness"
  | "machine.defaultFeedRate"
  | "layers.helical.wind_angle"
  | "layers.helical.pattern_number"
  | "layers.helical.skip_index"
  | "layers.helical.lock_degrees"
  | "layers.helical.lead_in_mm"
  | "layers.helical.lead_out_degrees"
  | "layers.skip.mandrel_rotation";

export type UiValidationErrors = Partial<Record<UiValidationField, string>>;

interface ValidationFieldMatcher {
  uiField: UiValidationField;
  patterns: string[];
}

interface MappedValidationErrors {
  fieldErrors: UiValidationErrors;
  unmappedErrors: BackendValidationError[];
}

const FIELD_MATCHERS: ValidationFieldMatcher[] = [
  {
    uiField: "mandrel.diameter",
    patterns: ["mandrel diameter", "diameter"],
  },
  {
    uiField: "mandrel.wind_length",
    patterns: ["wind length", "windlength"],
  },
  {
    uiField: "tow.width",
    patterns: ["tow width", "width"],
  },
  {
    uiField: "tow.thickness",
    patterns: ["tow thickness", "thickness"],
  },
  {
    uiField: "machine.defaultFeedRate",
    patterns: ["default feed rate", "defaultfeedrate", "feed rate", "feedrate"],
  },
  {
    uiField: "layers.helical.wind_angle",
    patterns: ["wind angle", "windangle"],
  },
  {
    uiField: "layers.helical.pattern_number",
    patterns: ["pattern number", "patternnumber"],
  },
  {
    uiField: "layers.helical.skip_index",
    patterns: ["skip index", "skipindex"],
  },
  {
    uiField: "layers.helical.lock_degrees",
    patterns: ["lock degrees", "lockdegrees"],
  },
  {
    uiField: "layers.helical.lead_in_mm",
    patterns: ["lead in mm", "leadinmm", "lead in"],
  },
  {
    uiField: "layers.helical.lead_out_degrees",
    patterns: ["lead out degrees", "leadoutdegrees", "lead out"],
  },
  {
    uiField: "layers.skip.mandrel_rotation",
    patterns: ["mandrel rotation", "mandrelrotation"],
  },
];

function normalizeValidationText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function mapValidationError(
  error: BackendValidationError,
): UiValidationField | null {
  const normalized = normalizeValidationText(`${error.field} ${error.message}`);
  for (const matcher of FIELD_MATCHERS) {
    if (matcher.patterns.some((pattern) => normalized.includes(pattern))) {
      return matcher.uiField;
    }
  }
  return null;
}

export function mapBackendValidationErrors(
  errors: BackendValidationError[],
): MappedValidationErrors {
  const fieldErrors: UiValidationErrors = {};
  const unmappedErrors: BackendValidationError[] = [];

  for (const error of errors) {
    const uiField = mapValidationError(error);
    if (!uiField) {
      unmappedErrors.push(error);
      continue;
    }

    if (!fieldErrors[uiField]) {
      fieldErrors[uiField] = error.message;
    }
  }

  return {
    fieldErrors,
    unmappedErrors,
  };
}
