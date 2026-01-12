/**
 * JSON Schema (draft-07) types
 * Re-exports from @types/json-schema
 */

import type { JSONSchema7, JSONSchema7Definition } from 'json-schema';

// Internal use only
export type { JSONSchema7Definition };

// Public API - simple alias for consumers
export type JsonSchema = JSONSchema7;

export function createEmptySchema(name: string): JsonSchema {
  return {
    type: 'object',
    title: name,
    properties: {},
  };
}
