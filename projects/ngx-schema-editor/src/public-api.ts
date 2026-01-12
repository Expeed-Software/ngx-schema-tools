/*
 * Public API Surface of ngx-schema-editor
 */

// Main Component
export { SchemaEditorComponent } from './lib/components/schema-editor/schema-editor.component';

// Types and Utilities
export type { JsonSchema } from './lib/models/json-schema.model';
export { createEmptySchema } from './lib/models/json-schema.model';
export type { LabeledValue } from './lib/components/schema-editor/models/allowed-value.model';
