/*
 * Public API Surface of ngx-data-mapper
 */

// Main Component
export { DataMapperComponent } from './lib/components/data-mapper/data-mapper.component';

// Input Types
export type { JsonSchema } from './lib/models/json-schema.model';

// Output Types - Field References and Mappings
export type {
  FieldType,
  FieldReference,
  SchemaTreeNode,
  FieldMapping,
  ArrayMapping,
  ArrayToObjectMapping,
  DefaultValue,
  TransformationType,
  TransformationConfig,
} from './lib/components/data-mapper/models/schema.model';
