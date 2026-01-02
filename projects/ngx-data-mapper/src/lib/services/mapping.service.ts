import { Injectable, signal, computed } from '@angular/core';
import {
  FieldMapping,
  ArrayMapping,
  ArrayToObjectMapping,
  ArraySelectorConfig,
  SchemaField,
  TransformationConfig,
  Connection,
  DragState,
  ArrayFilterConfig,
  DefaultValue,
} from '../models/schema.model';

@Injectable({
  providedIn: 'root',
})
export class MappingService {
  private mappings = signal<FieldMapping[]>([]);
  private arrayMappings = signal<ArrayMapping[]>([]);
  private arrayToObjectMappings = signal<ArrayToObjectMapping[]>([]);
  private defaultValues = signal<DefaultValue[]>([]);
  private selectedMappingId = signal<string | null>(null);
  private _sourceSchemaRef = signal<string | null>(null);
  private _targetSchemaRef = signal<string | null>(null);
  private dragState = signal<DragState>({
    isDragging: false,
    sourceField: null,
    startPoint: null,
    currentPoint: null,
    dragMode: 'new',
  });

  readonly allMappings = computed(() => this.mappings());
  readonly allArrayMappings = computed(() => this.arrayMappings());
  readonly allArrayToObjectMappings = computed(() => this.arrayToObjectMappings());
  readonly allDefaultValues = computed(() => this.defaultValues());
  readonly sourceSchemaRef = computed(() => this._sourceSchemaRef());
  readonly targetSchemaRef = computed(() => this._targetSchemaRef());
  readonly selectedMapping = computed(() => {
    const id = this.selectedMappingId();
    return this.mappings().find((m) => m.id === id) || null;
  });
  readonly currentDragState = computed(() => this.dragState());

  private generateId(): string {
    return `mapping-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  startDrag(field: SchemaField, startPoint: { x: number; y: number }): void {
    this.dragState.set({
      isDragging: true,
      sourceField: field,
      startPoint,
      currentPoint: startPoint,
      dragMode: 'new',
    });
  }

  startEndpointDrag(
    mappingId: string,
    endpointType: 'source' | 'target',
    startPoint: { x: number; y: number },
    sourceFieldIndex?: number
  ): void {
    const mapping = this.mappings().find(m => m.id === mappingId);
    if (!mapping) return;

    // For source endpoint, we show the line from target back to cursor
    // For target endpoint, we show the line from source(s) to cursor
    const dragMode = endpointType === 'source' ? 'move-source' : 'move-target';

    this.dragState.set({
      isDragging: true,
      sourceField: endpointType === 'source'
        ? mapping.sourceFields[sourceFieldIndex ?? 0]
        : mapping.targetField,
      startPoint,
      currentPoint: startPoint,
      dragMode,
      mappingId,
      sourceFieldIndex,
    });
  }

  updateDragPosition(currentPoint: { x: number; y: number }): void {
    this.dragState.update((state) => ({
      ...state,
      currentPoint,
    }));
  }

  endDrag(): void {
    this.dragState.set({
      isDragging: false,
      sourceField: null,
      startPoint: null,
      currentPoint: null,
      dragMode: 'new',
    });
  }

  changeSourceField(mappingId: string, newSourceField: SchemaField, sourceFieldIndex?: number): void {
    const mapping = this.mappings().find(m => m.id === mappingId);
    if (!mapping) return;

    // Don't allow if new source is the same as target
    if (newSourceField.id === mapping.targetField.id) return;

    // Don't allow if source already exists in the mapping
    if (mapping.sourceFields.some(sf => sf.id === newSourceField.id)) return;

    if (sourceFieldIndex !== undefined && mapping.sourceFields.length > 1) {
      // Replace specific source field in multi-source mapping
      const newSourceFields = [...mapping.sourceFields];
      newSourceFields[sourceFieldIndex] = newSourceField;
      this.mappings.update(mappings =>
        mappings.map(m => m.id === mappingId ? { ...m, sourceFields: newSourceFields } : m)
      );
    } else {
      // Single source mapping - replace the source field
      this.mappings.update(mappings =>
        mappings.map(m => m.id === mappingId ? { ...m, sourceFields: [newSourceField] } : m)
      );
    }
  }

  changeTargetField(mappingId: string, newTargetField: SchemaField): void {
    const mapping = this.mappings().find(m => m.id === mappingId);
    if (!mapping) return;

    // Don't allow if new target is same as any source
    if (mapping.sourceFields.some(sf => sf.id === newTargetField.id)) return;

    // Check if another mapping already targets this field
    const existingMapping = this.mappings().find(
      m => m.targetField.id === newTargetField.id && m.id !== mappingId
    );

    if (existingMapping) {
      // Merge into existing mapping (add sources)
      const mergedSources = [
        ...existingMapping.sourceFields,
        ...mapping.sourceFields.filter(
          sf => !existingMapping.sourceFields.some(esf => esf.id === sf.id)
        ),
      ];

      this.mappings.update(mappings =>
        mappings
          .filter(m => m.id !== mappingId) // Remove old mapping
          .map(m => m.id === existingMapping.id
            ? {
                ...m,
                sourceFields: mergedSources,
                transformations: mergedSources.length > 1
                  ? [{ type: 'concat' as const, separator: ' ' }]
                  : m.transformations,
              }
            : m
          )
      );
    } else {
      // Simply update the target field
      this.mappings.update(mappings =>
        mappings.map(m => m.id === mappingId ? { ...m, targetField: newTargetField } : m)
      );
    }
  }

  createMapping(
    sourceFields: SchemaField[],
    targetField: SchemaField,
    transformation?: TransformationConfig
  ): FieldMapping {
    // Check if this is an array-to-array mapping
    const sourceField = sourceFields[0];
    if (sourceField.type === 'array' && targetField.type === 'array') {
      return this.createArrayMapping(sourceField, targetField);
    }

    // Check if this is an array-to-object mapping
    if (sourceField.type === 'array' && targetField.type === 'object') {
      return this.createArrayToObjectMapping(sourceField, targetField);
    }

    // Check if fields are within arrays and need array context
    const arrayMappingId = this.findOrCreateArrayContext(sourceField, targetField);

    // Check if fields need array-to-object context
    const arrayToObjectMappingId = this.findOrCreateArrayToObjectContext(sourceField, targetField);

    const existingMapping = this.mappings().find(
      (m) => m.targetField.id === targetField.id
    );

    if (existingMapping) {
      // Add source fields to existing mapping (for concat scenarios)
      const updatedMapping: FieldMapping = {
        ...existingMapping,
        sourceFields: [
          ...existingMapping.sourceFields,
          ...sourceFields.filter(
            (sf) => !existingMapping.sourceFields.some((esf) => esf.id === sf.id)
          ),
        ],
        transformations:
          existingMapping.sourceFields.length + sourceFields.length > 1
            ? [{ type: 'concat', separator: ' ', ...transformation }]
            : transformation ? [transformation] : [{ type: 'direct' }],
      };

      this.mappings.update((mappings) =>
        mappings.map((m) => (m.id === existingMapping.id ? updatedMapping : m))
      );

      return updatedMapping;
    }

    const newMapping: FieldMapping = {
      id: this.generateId(),
      sourceFields,
      targetField,
      transformations: transformation ? [transformation] : [{ type: 'direct' }],
      isArrayMapping: false, // Only true for array-to-array connections
      arrayMappingId, // Links to parent array mapping if within array context
      isArrayToObjectMapping: false,
      arrayToObjectMappingId, // Links to parent array-to-object mapping if applicable
    };

    this.mappings.update((mappings) => [...mappings, newMapping]);

    // If this is part of an array mapping, add to itemMappings
    if (arrayMappingId) {
      this.arrayMappings.update((ams) =>
        ams.map((am) =>
          am.id === arrayMappingId
            ? { ...am, itemMappings: [...am.itemMappings, newMapping] }
            : am
        )
      );
    }

    // If this is part of an array-to-object mapping, add to itemMappings
    if (arrayToObjectMappingId) {
      this.arrayToObjectMappings.update((ams) =>
        ams.map((am) =>
          am.id === arrayToObjectMappingId
            ? { ...am, itemMappings: [...am.itemMappings, newMapping] }
            : am
        )
      );
    }

    return newMapping;
  }

  private createArrayMapping(
    sourceArray: SchemaField,
    targetArray: SchemaField
  ): FieldMapping {
    // Check if array mapping already exists
    const existingArrayMapping = this.arrayMappings().find(
      (am) => am.sourceArray.id === sourceArray.id && am.targetArray.id === targetArray.id
    );

    if (existingArrayMapping) {
      // Return a dummy field mapping representing the array mapping
      const existing = this.mappings().find(m => m.id === existingArrayMapping.id);
      if (existing) return existing;
    }

    const arrayMapping: ArrayMapping = {
      id: this.generateId(),
      sourceArray,
      targetArray,
      itemMappings: [],
    };

    this.arrayMappings.update((ams) => [...ams, arrayMapping]);

    // Also create a field mapping to visualize the array connection
    const fieldMapping: FieldMapping = {
      id: arrayMapping.id,
      sourceFields: [sourceArray],
      targetField: targetArray,
      transformations: [{ type: 'direct' }],
      isArrayMapping: true,
    };

    this.mappings.update((mappings) => [...mappings, fieldMapping]);

    return fieldMapping;
  }

  private createArrayToObjectMapping(
    sourceArray: SchemaField,
    targetObject: SchemaField
  ): FieldMapping {
    // Check if array-to-object mapping already exists
    const existingMapping = this.arrayToObjectMappings().find(
      (am) => am.sourceArray.id === sourceArray.id && am.targetObject.id === targetObject.id
    );

    if (existingMapping) {
      const existing = this.mappings().find(m => m.id === existingMapping.id);
      if (existing) return existing;
    }

    const arrayToObjectMapping: ArrayToObjectMapping = {
      id: this.generateId(),
      sourceArray,
      targetObject,
      selector: { mode: 'first' }, // Default to first item
      itemMappings: [],
    };

    this.arrayToObjectMappings.update((ams) => [...ams, arrayToObjectMapping]);

    // Create a field mapping to visualize the connection
    const fieldMapping: FieldMapping = {
      id: arrayToObjectMapping.id,
      sourceFields: [sourceArray],
      targetField: targetObject,
      transformations: [{ type: 'direct' }],
      isArrayToObjectMapping: true,
    };

    this.mappings.update((mappings) => [...mappings, fieldMapping]);

    return fieldMapping;
  }

  private findOrCreateArrayContext(
    sourceField: SchemaField,
    targetField: SchemaField
  ): string | undefined {
    // If both fields are array items, check if an array mapping exists
    if (sourceField.isArrayItem && targetField.isArrayItem) {
      const existingArrayMapping = this.arrayMappings().find(
        (am) =>
          am.sourceArray.path === sourceField.parentArrayPath &&
          am.targetArray.path === targetField.parentArrayPath
      );

      if (existingArrayMapping) {
        return existingArrayMapping.id;
      }
    }

    return undefined;
  }

  private findOrCreateArrayToObjectContext(
    sourceField: SchemaField,
    targetField: SchemaField
  ): string | undefined {
    // If source is array item and target is within an object (not array item)
    if (sourceField.isArrayItem && !targetField.isArrayItem && targetField.path.includes('.')) {
      // Find the parent object path
      const targetParts = targetField.path.split('.');
      const parentObjectPath = targetParts.slice(0, -1).join('.');

      const existingMapping = this.arrayToObjectMappings().find(
        (am) =>
          am.sourceArray.path === sourceField.parentArrayPath &&
          am.targetObject.path === parentObjectPath
      );

      if (existingMapping) {
        return existingMapping.id;
      }
    }

    return undefined;
  }

  getArrayMapping(id: string): ArrayMapping | undefined {
    return this.arrayMappings().find((am) => am.id === id);
  }

  getArrayMappingForField(field: SchemaField): ArrayMapping | undefined {
    if (!field.parentArrayPath) return undefined;
    return this.arrayMappings().find(
      (am) =>
        am.sourceArray.path === field.parentArrayPath ||
        am.targetArray.path === field.parentArrayPath
    );
  }

  removeArrayMapping(arrayMappingId: string): void {
    // Remove the array mapping
    this.arrayMappings.update((ams) => ams.filter((am) => am.id !== arrayMappingId));

    // Remove all field mappings associated with this array mapping
    this.mappings.update((mappings) =>
      mappings.filter((m) => m.arrayMappingId !== arrayMappingId && m.id !== arrayMappingId)
    );
  }

  updateArrayFilter(arrayMappingId: string, filter: ArrayFilterConfig | undefined): void {
    this.arrayMappings.update((ams) =>
      ams.map((am) =>
        am.id === arrayMappingId ? { ...am, filter } : am
      )
    );
  }

  getArrayToObjectMapping(id: string): ArrayToObjectMapping | undefined {
    return this.arrayToObjectMappings().find((am) => am.id === id);
  }

  updateArrayToObjectSelector(mappingId: string, selector: ArraySelectorConfig): void {
    this.arrayToObjectMappings.update((ams) =>
      ams.map((am) =>
        am.id === mappingId ? { ...am, selector } : am
      )
    );
  }

  removeArrayToObjectMapping(mappingId: string): void {
    // Remove the array-to-object mapping
    this.arrayToObjectMappings.update((ams) => ams.filter((am) => am.id !== mappingId));

    // Remove all field mappings associated with this mapping
    this.mappings.update((mappings) =>
      mappings.filter((m) => m.arrayToObjectMappingId !== mappingId && m.id !== mappingId)
    );
  }

  updateMapping(
    mappingId: string,
    updates: Partial<FieldMapping>
  ): void {
    this.mappings.update((mappings) =>
      mappings.map((m) => (m.id === mappingId ? { ...m, ...updates } : m))
    );
  }

  updateTransformations(
    mappingId: string,
    transformations: TransformationConfig[]
  ): void {
    this.mappings.update((mappings) =>
      mappings.map((m) =>
        m.id === mappingId ? { ...m, transformations } : m
      )
    );
  }

  removeMapping(mappingId: string): void {
    this.mappings.update((mappings) =>
      mappings.filter((m) => m.id !== mappingId)
    );
    if (this.selectedMappingId() === mappingId) {
      this.selectedMappingId.set(null);
    }
  }

  removeSourceFromMapping(mappingId: string, sourceFieldId: string): void {
    const mapping = this.mappings().find((m) => m.id === mappingId);
    if (!mapping) return;

    if (mapping.sourceFields.length <= 1) {
      this.removeMapping(mappingId);
    } else {
      this.mappings.update((mappings) =>
        mappings.map((m) =>
          m.id === mappingId
            ? {
                ...m,
                sourceFields: m.sourceFields.filter(
                  (sf) => sf.id !== sourceFieldId
                ),
                transformations:
                  m.sourceFields.length - 1 === 1
                    ? [{ type: 'direct' }]
                    : m.transformations,
              }
            : m
        )
      );
    }
  }

  selectMapping(mappingId: string | null): void {
    this.selectedMappingId.set(mappingId);
  }

  getMappingForTarget(targetFieldId: string): FieldMapping | undefined {
    return this.mappings().find((m) => m.targetField.id === targetFieldId);
  }

  getMappingsForSource(sourceFieldId: string): FieldMapping[] {
    return this.mappings().filter((m) =>
      m.sourceFields.some((sf) => sf.id === sourceFieldId)
    );
  }

  clearAllMappings(): void {
    this.mappings.set([]);
    this.arrayMappings.set([]);
    this.arrayToObjectMappings.set([]);
    this.defaultValues.set([]);
    this.selectedMappingId.set(null);
    this._sourceSchemaRef.set(null);
    this._targetSchemaRef.set(null);
  }

  setSourceSchemaRef(ref: string | null): void {
    this._sourceSchemaRef.set(ref);
  }

  setTargetSchemaRef(ref: string | null): void {
    this._targetSchemaRef.set(ref);
  }

  // Default value methods
  setDefaultValue(targetField: SchemaField, value: string | number | boolean | Date | null): DefaultValue {
    const existingDefault = this.defaultValues().find(d => d.targetField.id === targetField.id);

    if (existingDefault) {
      const updated: DefaultValue = { ...existingDefault, value };
      this.defaultValues.update(dv => dv.map(d => d.id === existingDefault.id ? updated : d));
      return updated;
    }

    const newDefault: DefaultValue = {
      id: this.generateId(),
      targetField,
      value,
    };

    this.defaultValues.update(dv => [...dv, newDefault]);
    return newDefault;
  }

  getDefaultValue(targetFieldId: string): DefaultValue | undefined {
    return this.defaultValues().find(d => d.targetField.id === targetFieldId);
  }

  removeDefaultValue(targetFieldId: string): void {
    this.defaultValues.update(dv => dv.filter(d => d.targetField.id !== targetFieldId));
  }

  hasDefaultValue(targetFieldId: string): boolean {
    return this.defaultValues().some(d => d.targetField.id === targetFieldId);
  }

  exportMappings(name?: string, description?: string): string {
    const exportData: Record<string, unknown> = {
      version: '1.0',
      name: name || 'Mapping Configuration',
      description: description || '',
      mappings: this.mappings(),
      arrayMappings: this.arrayMappings(),
      arrayToObjectMappings: this.arrayToObjectMappings(),
      defaultValues: this.defaultValues(),
    };

    // Include schema refs if set
    if (this._sourceSchemaRef()) {
      exportData['sourceSchemaRef'] = this._sourceSchemaRef();
    }
    if (this._targetSchemaRef()) {
      exportData['targetSchemaRef'] = this._targetSchemaRef();
    }

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Export mappings as a MappingDocument object (not stringified)
   */
  exportMappingsAsObject(name?: string, description?: string): object {
    const exportData: Record<string, unknown> = {
      version: '1.0',
      name: name || 'Mapping Configuration',
      description: description || '',
      mappings: this.mappings(),
      arrayMappings: this.arrayMappings(),
      arrayToObjectMappings: this.arrayToObjectMappings(),
      defaultValues: this.defaultValues(),
    };

    // Include schema refs if set
    if (this._sourceSchemaRef()) {
      exportData['sourceSchemaRef'] = this._sourceSchemaRef();
    }
    if (this._targetSchemaRef()) {
      exportData['targetSchemaRef'] = this._targetSchemaRef();
    }

    return exportData;
  }

  importMappings(json: string): void {
    try {
      const data = JSON.parse(json);
      if (data.mappings) {
        this.mappings.set(data.mappings as FieldMapping[]);
        this.arrayMappings.set(data.arrayMappings as ArrayMapping[] || []);
        this.arrayToObjectMappings.set(data.arrayToObjectMappings as ArrayToObjectMapping[] || []);
        this.defaultValues.set(data.defaultValues as DefaultValue[] || []);
        this._sourceSchemaRef.set(data.sourceSchemaRef || null);
        this._targetSchemaRef.set(data.targetSchemaRef || null);
      } else {
        // Legacy format
        this.mappings.set(data as FieldMapping[]);
      }
    } catch (e) {
      console.error('Failed to import mappings:', e);
    }
  }
}
