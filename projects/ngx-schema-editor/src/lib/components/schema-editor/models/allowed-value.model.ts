/**
 * Allowed Value Types for Schema Editor and Dynamic Form
 *
 * This module defines the standard contract for allowed values (enum/oneOf)
 * used in JSON Schema. Both schema-editor and dynamic-form components
 * should use these types for consistency.
 *
 * JSON Schema Output:
 * - Simple values (string/number) → "enum": [...]
 * - Labeled values → "oneOf": [{ "const": value, "title": label }, ...]
 */

import { JsonSchema, JSONSchema7Definition } from '../../../models/json-schema.model';

/**
 * Labeled value using JSON Schema standard keywords
 * Uses { const, title } to match JSON Schema oneOf format directly
 */
export interface LabeledValue {
  /** The actual value stored in the data (JSON Schema keyword) */
  const: string | number;
  /** Display label shown to users (JSON Schema keyword) */
  title: string;
}

/**
 * Allowed value can be:
 * - string: simple string value
 * - number: simple numeric value
 * - LabeledValue: object with const and title for dropdowns (JSON Schema standard)
 */
export type AllowedValue = string | number | LabeledValue;

/**
 * Type guard to check if a value is a LabeledValue
 */
export function isLabeledValue(value: AllowedValue): value is LabeledValue {
  return typeof value === 'object' && value !== null && 'const' in value && 'title' in value;
}

/**
 * Get the raw value from an AllowedValue
 */
export function getRawValue(value: AllowedValue): string | number {
  if (isLabeledValue(value)) {
    return value.const;
  }
  return value;
}

/**
 * Get the display text for an AllowedValue
 */
export function getDisplayText(value: AllowedValue): string {
  if (isLabeledValue(value)) {
    return value.title;
  }
  return String(value);
}

/**
 * Parse oneOf array from JSON Schema into AllowedValue array
 * Only extracts items with { const, title } pattern for dropdown options
 */
export function parseOneOf(oneOf: JSONSchema7Definition[]): AllowedValue[] {
  const values: AllowedValue[] = [];

  for (const item of oneOf) {
    // Skip boolean schema definitions
    if (typeof item === 'boolean') continue;

    const constValue = item.const;
    const titleValue = item.title;

    if (constValue !== undefined) {
      if (titleValue && typeof titleValue === 'string') {
        // Has both const and title - use LabeledValue directly
        values.push({ const: constValue as string | number, title: titleValue });
      } else {
        // Only has const - treat as simple value
        values.push(constValue as string | number);
      }
    }
  }

  return values;
}

/**
 * Convert AllowedValue array to JSON Schema oneOf format
 * Returns valid JsonSchema objects with { const, title }
 */
export function toOneOf(values: AllowedValue[]): JsonSchema[] {
  return values.map(v => {
    if (isLabeledValue(v)) {
      // LabeledValue already has { const, title } - use directly
      return { const: v.const, title: v.title };
    }
    return { const: v };
  });
}

/**
 * Check if any values in the array are labeled
 */
export function hasLabeledValues(values: AllowedValue[]): boolean {
  return values.some(isLabeledValue);
}
