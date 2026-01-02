export interface SchemaField {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'date';
  path: string;
  children?: SchemaField[];
  expanded?: boolean;
  description?: string;
  isArrayItem?: boolean; // Marks fields that are children of an array
  parentArrayPath?: string; // Path to parent array for context
}

export interface SchemaDefinition {
  name: string;
  fields: SchemaField[];
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
  sourceFields: SchemaField[];
  targetField: SchemaField;
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
  sourceArray: SchemaField;
  targetArray: SchemaField;
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
  sourceArray: SchemaField;
  targetObject: SchemaField;
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
  sourceField: SchemaField | null;
  startPoint: { x: number; y: number } | null;
  currentPoint: { x: number; y: number } | null;
  // For endpoint dragging (moving existing connection)
  dragMode: 'new' | 'move-source' | 'move-target';
  mappingId?: string;  // The mapping being modified when moving endpoint
  sourceFieldIndex?: number;  // For multi-source mappings, which source is being moved
}

export interface DefaultValue {
  id: string;
  targetField: SchemaField;
  value: string | number | boolean | Date | null;
}
