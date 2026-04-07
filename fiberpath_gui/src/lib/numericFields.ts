import type { Dispatch, SetStateAction } from "react";

export function parseNumericInput(value: string, integer = false): number {
  return integer
    ? Number.parseInt(value, 10)
    : Number.parseFloat(value);
}

export function setFieldError<T extends string>(
  setErrors: Dispatch<SetStateAction<Partial<Record<T, string>>>>,
  field: T,
  error: string | undefined,
) {
  setErrors((prev) => ({
    ...prev,
    [field]: error,
  }));
}
