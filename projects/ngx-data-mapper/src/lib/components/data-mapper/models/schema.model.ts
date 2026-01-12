/**
 * Field type enumeration matching Java's FieldType enum
 */
export type FieldType = 'string' | 'number' | 'boolean' | 'object' | 'array' | 'date';

/**
 * Reference to a field - matches Java's FieldReference class.
 * This is the public API type used in FieldMapping output.
 */
export interface FieldReference {
  id: string;
  name: string;
  path: string;
  type: FieldType;
  description?: string;
}

/**
 * Internal type for tree rendering with UI state.
 * Extends FieldReference with tree-specific properties.
 */
export interface SchemaTreeNode extends FieldReference {
  children?: SchemaTreeNode[];
  expanded?: boolean;
  isArrayItem?: boolean;
  parentArrayPath?: string;
}

/**
 * Internal schema definition for tree rendering
 */
export interface SchemaDefinition {
  name: string;
  fields: SchemaTreeNode[];
}

export type TransformationType =
  | 'direct'
  | 'concat'
  | 'substring'
  | 'replace'
  | 'uppercase'
  | 'lowercase'
  | 'trim'
  | 'mask'
  | 'dateFormat'
  | 'extractYear'
  | 'extractMonth'
  | 'extractDay'
  | 'extractHour'
  | 'extractMinute'
  | 'extractSecond'
  | 'numberFormat'
  | 'template';

export interface TransformationCondition {
  enabled: boolean;
  root: FilterGroup;
}

export interface TransformationConfig {
  type: TransformationType;
  // For concat
  separator?: string;
  template?: string;
  // For substring
  startIndex?: number;
  endIndex?: number;
  // For replace
  searchValue?: string;
  replaceValue?: string;
  // For date format
  inputFormat?: string;
  outputFormat?: string;
  // For number format
  decimalPlaces?: number;
  prefix?: string;
  suffix?: string;
  // For mask
  pattern?: string;
  // Optional condition - transformation only applies if condition is met
  condition?: TransformationCondition;
}

export interface FieldMapping {
  id: string;
  sourceFields: SchemaTreeNode[];
  targetField: SchemaTreeNode;
  transformations: TransformationConfig[]; // Array of transformation steps applied in sequence
  // For array-to-array mappings
  isArrayMapping?: boolean;
  arrayMappingId?: string; // Reference to parent array mapping
  // For array-to-object mappings
  isArrayToObjectMapping?: boolean;
  arrayToObjectMappingId?: string; // Reference to parent array-to-object mapping
}

export type FilterOperator =
  | 'equals'
  | 'notEquals'
  | 'contains'
  | 'notContains'
  | 'startsWith'
  | 'endsWith'
  | 'greaterThan'
  | 'lessThan'
  | 'greaterThanOrEqual'
  | 'lessThanOrEqual'
  | 'isEmpty'
  | 'isNotEmpty'
  | 'isTrue'
  | 'isFalse';

export interface FilterCondition {
  id: string;
  type: 'condition';
  field: string; // Field path within the array item
  fieldName: string; // Display name
  operator: FilterOperator;
  value: string | number | boolean;
  valueType: 'string' | 'number' | 'boolean';
}

export interface FilterGroup {
  id: string;
  type: 'group';
  logic: 'and' | 'or';
  children: FilterItem[];
}

export type FilterItem = FilterCondition | FilterGroup;

export interface ArrayFilterConfig {
  enabled: boolean;
  root: FilterGroup;
}

export interface ArrayMapping {
  id: string;
  sourceArray: SchemaTreeNode;
  targetArray: SchemaTreeNode;
  itemMappings: FieldMapping[]; // Mappings for fields within the array items
  filter?: ArrayFilterConfig; // Optional filter on source array
}

// Selection mode for array-to-object mapping
export type ArraySelectionMode = 'first' | 'last' | 'condition';

export interface ArraySelectorConfig {
  mode: ArraySelectionMode;
  condition?: FilterGroup; // Reuse filter group for condition mode
}

export interface ArrayToObjectMapping {
  id: string;
  sourceArray: SchemaTreeNode;
  targetObject: SchemaTreeNode;
  selector: ArraySelectorConfig; // How to select the single item
  itemMappings: FieldMapping[]; // Mappings for fields within the selected item
}

export interface ConnectionPoint {
  fieldId: string;
  side: 'source' | 'target';
  x: number;
  y: number;
}

export interface Connection {
  id: string;
  mappingId: string;
  sourcePoints: ConnectionPoint[];
  targetPoint: ConnectionPoint;
  transformations: TransformationConfig[];
}

export interface DragState {
  isDragging: boolean;
  sourceField: SchemaTreeNode | null;
  startPoint: { x: number; y: number } | null;
  currentPoint: { x: number; y: number } | null;
  // For endpoint dragging (moving existing connection)
  dragMode: 'new' | 'move-source' | 'move-target';
  mappingId?: string;  // The mapping being modified when moving endpoint
  sourceFieldIndex?: number;  // For multi-source mappings, which source is being moved
}

export interface DefaultValue {
  id: string;
  targetField: SchemaTreeNode;
  value: string | number | boolean | Date | null;
}
