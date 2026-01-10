import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  inject,
  ApplicationRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { JsonSchema } from '../../models/json-schema.model';
import { FieldItemComponent, EditorField } from './field-item/field-item.component';

// Display type options for form rendering
type DisplayType = 'textbox' | 'dropdown' | 'textarea' | 'richtext' | 'datepicker' | 'datetimepicker' | 'timepicker' | 'stepper' | 'checkbox' | 'toggle';

@Component({
  selector: 'schema-editor',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatTooltipModule,
    MatMenuModule,
    MatButtonToggleModule,
    DragDropModule,
    FieldItemComponent,
  ],
  templateUrl: './schema-editor.component.html',
  styleUrl: './schema-editor.component.scss',
})
export class SchemaEditorComponent {
  private appRef = inject(ApplicationRef);

  @Input() set schema(value: JsonSchema | null) {
    if (value) {
      // Don't overwrite fields if we have uncommitted changes (fields with editors open or empty names)
      const hasUncommittedChanges = this.fields().some(f =>
        f.isEditingDefault || f.isEditingValues || f.isEditingValidators || !f.name
      ) || this.hasUncommittedChildFields(this.fields());

      this.schemaName.set(value.title || 'New Schema');

      if (!hasUncommittedChanges) {
        this.fields.set(this.jsonSchemaToEditorFields(value));
      }
    }
  }

  private hasUncommittedChildFields(fields: EditorField[]): boolean {
    for (const field of fields) {
      if (field.children) {
        if (field.children.some(c => c.isEditingDefault || c.isEditingValues || c.isEditingValidators || !c.name)) {
          return true;
        }
        if (this.hasUncommittedChildFields(field.children)) {
          return true;
        }
      }
    }
    return false;
  }

  @Input() showJsonToggle = true;
  @Input() showSchemaName = true;
  @Input() showDisplayType = false;

  @Output() schemaChange = new EventEmitter<JsonSchema>();
  @Output() save = new EventEmitter<JsonSchema>();

  schemaName = signal('New Schema');
  fields = signal<EditorField[]>([]);

  // View mode: 'visual' or 'json'
  viewMode = signal<'visual' | 'json'>('visual');
  jsonText = signal<string>('');
  jsonError = signal<string | null>(null);

  fieldTypes: Array<{ value: string; label: string; icon: string }> = [
    { value: 'string', label: 'String', icon: 'text_fields' },
    { value: 'number', label: 'Number', icon: 'pin' },
    { value: 'boolean', label: 'Boolean', icon: 'toggle_on' },
    { value: 'date', label: 'Date', icon: 'calendar_today' },
    { value: 'time', label: 'Time', icon: 'schedule' },
    { value: 'object', label: 'Object', icon: 'data_object' },
    { value: 'array', label: 'Array', icon: 'data_array' },
  ];

  stringDisplayTypes: Array<{ value: DisplayType; label: string; icon: string }> = [
    { value: 'textbox', label: 'Textbox', icon: 'edit' },
    { value: 'dropdown', label: 'Dropdown', icon: 'arrow_drop_down_circle' },
    { value: 'textarea', label: 'Textarea', icon: 'notes' },
    { value: 'richtext', label: 'Rich Text', icon: 'format_color_text' },
  ];

  dateDisplayTypes: Array<{ value: DisplayType; label: string; icon: string }> = [
    { value: 'datepicker', label: 'Date Picker', icon: 'calendar_today' },
    { value: 'datetimepicker', label: 'DateTime Picker', icon: 'schedule' },
    { value: 'textbox', label: 'Textbox', icon: 'edit' },
  ];

  timeDisplayTypes: Array<{ value: DisplayType; label: string; icon: string }> = [
    { value: 'timepicker', label: 'Time Picker', icon: 'schedule' },
    { value: 'textbox', label: 'Textbox', icon: 'edit' },
  ];

  numberDisplayTypes: Array<{ value: DisplayType; label: string; icon: string }> = [
    { value: 'textbox', label: 'Textbox', icon: 'edit' },
    { value: 'stepper', label: 'Stepper', icon: 'unfold_more' },
  ];

  booleanDisplayTypes: Array<{ value: DisplayType; label: string; icon: string }> = [
    { value: 'checkbox', label: 'Checkbox', icon: 'check_box' },
    { value: 'toggle', label: 'Toggle', icon: 'toggle_on' },
  ];

  stringFormats: Array<{ value: string; label: string }> = [
    { value: '', label: '(none)' },
    { value: 'email', label: 'Email' },
    { value: 'uri', label: 'URI (URL)' },
    { value: 'uuid', label: 'UUID' },
  ];

  getDisplayTypes(fieldType: string): Array<{ value: DisplayType; label: string; icon: string }> {
    if (fieldType === 'date') return this.dateDisplayTypes;
    if (fieldType === 'time') return this.timeDisplayTypes;
    if (fieldType === 'number') return this.numberDisplayTypes;
    if (fieldType === 'boolean') return this.booleanDisplayTypes;
    return this.stringDisplayTypes;
  }

  private generateId(): string {
    return `field-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private cloneFields(fields: EditorField[]): EditorField[] {
    return fields.map(f => ({
      ...f,
      children: f.children ? this.cloneFields(f.children) : undefined,
    }));
  }

  getTypeIcon(type: string): string {
    return this.fieldTypes.find(t => t.value === type)?.icon || 'help_outline';
  }

  // Add a new field at the root level
  addField(): void {
    const newField: EditorField = {
      id: this.generateId(),
      name: '',
      type: 'string',
      displayType: 'textbox',
      expanded: false,
    };
    this.fields.update(fields => [...fields, newField]);
  }

  // Add a child field to an object or array
  addChildField(parent: EditorField): void {
    if (!parent.children) {
      parent.children = [];
    }
    const newField: EditorField = {
      id: this.generateId(),
      name: '',
      type: 'string',
      displayType: 'textbox',
    };
    parent.children.push(newField);
    parent.expanded = true;
    this.fields.update(fields => [...fields]);
  }

  // Handle field change from FieldItemComponent
  onFieldChange(): void {
    console.log('schema-editor onFieldChange called');
    this.fields().forEach(f => {
      if (f.type === 'object' || f.type === 'array') {
        console.log(`  field "${f.name}" expanded:${f.expanded} children:${f.children?.length}`);
      }
    });
    this.fields.update(fields => [...fields]);
    this.appRef.tick();
    this.emitChange();
  }

  // Handle field delete from FieldItemComponent
  onFieldDelete(field: EditorField): void {
    const index = this.fields().indexOf(field);
    if (index > -1) {
      this.fields.update(fields => {
        const newFields = [...fields];
        newFields.splice(index, 1);
        return newFields;
      });
      this.emitChange();
    }
  }

  // Handle field duplicate from FieldItemComponent
  onFieldDuplicate(field: EditorField): void {
    const index = this.fields().indexOf(field);
    if (index > -1) {
      const clone: EditorField = {
        ...field,
        id: this.generateId(),
        name: field.name + '_copy',
        children: field.children ? this.cloneFields(field.children) : undefined,
      };
      this.fields.update(fields => {
        const newFields = [...fields];
        newFields.splice(index + 1, 0, clone);
        return newFields;
      });
      this.emitChange();
    }
  }

  // Delete a field
  deleteField(field: EditorField, parentList: EditorField[]): void {
    const index = parentList.indexOf(field);
    if (index > -1) {
      parentList.splice(index, 1);
      this.fields.update(fields => [...fields]);
      this.emitChange();
    }
  }

  // Duplicate a field
  duplicateField(field: EditorField, parentList: EditorField[]): void {
    const index = parentList.indexOf(field);
    if (index > -1) {
      const clone: EditorField = {
        ...field,
        id: this.generateId(),
        name: field.name + '_copy',
        children: field.children ? this.cloneFields(field.children) : undefined,
      };
      parentList.splice(index + 1, 0, clone);
      this.fields.update(fields => [...fields]);
      this.emitChange();
    }
  }

  // Toggle field expansion
  toggleExpand(field: EditorField): void {
    field.expanded = !field.expanded;
    this.fields.update(fields => [...fields]);
  }

  // Handle field name input - only allow valid property name characters
  onFieldNameChange(field: EditorField, event: Event): void {
    const input = event.target as HTMLInputElement;
    // Remove invalid characters: only allow letters, numbers, underscores, and dollar signs
    // Property names should start with letter, underscore, or dollar sign
    const sanitized = input.value.replace(/[^a-zA-Z0-9_$]/g, '');
    field.name = sanitized;
    // Update input value if it was sanitized
    if (input.value !== sanitized) {
      input.value = sanitized;
    }
  }

  // Handle field name blur - ensure name is valid and emit change
  onFieldNameBlur(field: EditorField): void {
    if (!field.name.trim()) {
      field.name = 'unnamed';
    }
    this.fields.update(fields => [...fields]);
    this.emitChange();
  }

  // Handle field type change
  onFieldTypeChange(field: EditorField, type: string): void {
    field.type = type as EditorField['type'];
    // Initialize children array for object/array types
    if ((type === 'object' || type === 'array') && !field.children) {
      field.children = [];
    }
    // Set default display type based on field type
    if (type === 'string') {
      field.displayType = 'textbox';
    } else if (type === 'number') {
      field.displayType = 'textbox';
    } else if (type === 'boolean') {
      field.displayType = 'checkbox';
    } else if (type === 'date') {
      field.displayType = 'datepicker';
    } else if (type === 'time') {
      field.displayType = 'timepicker';
    } else {
      field.displayType = undefined;
    }
    this.fields.update(fields => [...fields]);
    this.emitChange();
  }

  // Handle display type change
  onDisplayTypeChange(field: EditorField, displayType: string): void {
    field.displayType = displayType as DisplayType;
    this.fields.update(fields => [...fields]);
    this.emitChange();
  }

  // Toggle required status
  toggleRequired(field: EditorField): void {
    field.required = !field.required;
    this.fields.update(fields => [...fields]);
    this.emitChange();
  }

  // Update field label (only update the field, don't trigger re-render)
  onLabelChange(field: EditorField, label: string): void {
    field.label = label;
  }

  // Emit change when label input loses focus
  onLabelBlur(): void {
    this.emitChange();
  }

  // Toggle allowed values editor
  toggleValuesEditor(field: EditorField): void {
    field.isEditingValues = !field.isEditingValues;
    if (field.isEditingValues) {
      // Close other editors
      field.isEditingDefault = false;
      field.isEditingValidators = false;
      if (!field.allowedValues) {
        field.allowedValues = [];
      }
    }
    this.fields.update(fields => [...fields]);
  }

  // Add allowed value
  addAllowedValue(field: EditorField, input: HTMLInputElement | Event): void {
    // Handle both direct input reference and event from button click
    let inputEl: HTMLInputElement | null = null;

    if (input instanceof HTMLInputElement) {
      inputEl = input;
    } else {
      // Find the input by traversing up to .values-header and then querying for .value-input
      const target = input.target as HTMLElement;
      const header = target.closest('.values-header');
      inputEl = header?.querySelector('.value-input') as HTMLInputElement;
    }

    if (!inputEl) return;

    const value = inputEl.value.trim();
    if (value && !field.allowedValues?.includes(value)) {
      if (!field.allowedValues) {
        field.allowedValues = [];
      }
      field.allowedValues.push(value);
      inputEl.value = '';
      this.fields.update(fields => [...fields]);
      this.emitChange();
    }
  }

  // Remove allowed value
  removeAllowedValue(field: EditorField, index: number): void {
    if (field.allowedValues) {
      field.allowedValues.splice(index, 1);
      if (field.allowedValues.length === 0) {
        field.allowedValues = undefined;
      }
      this.fields.update(fields => [...fields]);
      this.emitChange();
    }
  }

  // Handle Enter key in allowed value input
  onAllowedValueKeydown(event: KeyboardEvent, field: EditorField, input: HTMLInputElement): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.addAllowedValue(field, input);
    }
  }

  // Toggle default value editor
  toggleDefaultEditor(field: EditorField): void {
    field.isEditingDefault = !field.isEditingDefault;
    if (field.isEditingDefault) {
      // Close other editors
      field.isEditingValues = false;
      field.isEditingValidators = false;
    }
    this.fields.update(fields => [...fields]);
  }

  // Update default value
  onDefaultValueChange(field: EditorField, value: string): void {
    if (value === '') {
      field.defaultValue = undefined;
    } else if (field.type === 'number') {
      const num = parseFloat(value);
      field.defaultValue = isNaN(num) ? undefined : num;
    } else if (field.type === 'boolean') {
      field.defaultValue = value === 'true';
    } else {
      field.defaultValue = value;
    }
    this.fields.update(fields => [...fields]);
    this.emitChange();
  }

  // Clear default value
  clearDefaultValue(field: EditorField): void {
    field.defaultValue = undefined;
    field.isEditingDefault = false;
    this.fields.update(fields => [...fields]);
    this.emitChange();
  }

  // Handle Enter key in default value input
  onDefaultValueKeydown(event: KeyboardEvent, field: EditorField): void {
    if (event.key === 'Enter' || event.key === 'Escape') {
      field.isEditingDefault = false;
      this.fields.update(fields => [...fields]);
    }
  }

  // Toggle validators editor
  toggleValidatorsEditor(field: EditorField): void {
    field.isEditingValidators = !field.isEditingValidators;
    if (field.isEditingValidators) {
      // Close other editors
      field.isEditingValues = false;
      field.isEditingDefault = false;
    }
    this.fields.update(fields => [...fields]);
  }

  // Check if field has any validators set
  hasValidators(field: EditorField): boolean {
    if (field.type === 'string') {
      return !!(field.minLength || field.maxLength || field.pattern || field.format);
    }
    if (field.type === 'number') {
      return field.minimum !== undefined || field.maximum !== undefined;
    }
    return false;
  }

  // Update string format
  onFormatChange(field: EditorField, format: string): void {
    field.format = format || undefined;
    // Clear pattern when format is set (they're mutually exclusive)
    if (format) {
      field.pattern = undefined;
    }
    this.fields.update(fields => [...fields]);
    this.emitChange();
  }

  // Update minLength
  onMinLengthChange(field: EditorField, value: string): void {
    field.minLength = value ? parseInt(value, 10) : undefined;
    this.fields.update(fields => [...fields]);
    this.emitChange();
  }

  // Update maxLength
  onMaxLengthChange(field: EditorField, value: string): void {
    field.maxLength = value ? parseInt(value, 10) : undefined;
    this.fields.update(fields => [...fields]);
    this.emitChange();
  }

  // Update pattern
  onPatternChange(field: EditorField, value: string): void {
    field.pattern = value || undefined;
    this.fields.update(fields => [...fields]);
    this.emitChange();
  }

  // Update minimum
  onMinimumChange(field: EditorField, value: string): void {
    field.minimum = value ? parseFloat(value) : undefined;
    this.fields.update(fields => [...fields]);
    this.emitChange();
  }

  // Update maximum
  onMaximumChange(field: EditorField, value: string): void {
    field.maximum = value ? parseFloat(value) : undefined;
    this.fields.update(fields => [...fields]);
    this.emitChange();
  }

  // Move field up in list
  moveFieldUp(field: EditorField, parentList: EditorField[]): void {
    const index = parentList.indexOf(field);
    if (index > 0) {
      [parentList[index - 1], parentList[index]] = [parentList[index], parentList[index - 1]];
      this.fields.update(fields => [...fields]);
      this.emitChange();
    }
  }

  // Move field down in list
  moveFieldDown(field: EditorField, parentList: EditorField[]): void {
    const index = parentList.indexOf(field);
    if (index < parentList.length - 1) {
      [parentList[index], parentList[index + 1]] = [parentList[index + 1], parentList[index]];
      this.fields.update(fields => [...fields]);
      this.emitChange();
    }
  }

  // Handle drag and drop reorder
  onFieldDrop(event: CdkDragDrop<EditorField[]>): void {
    if (event.previousIndex !== event.currentIndex) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      this.fields.update(fields => [...fields]);
      // Don't emit change here - it causes parent to reset expanded state
      // Order change will be captured on next edit or save
    }
  }

  // Check if field can be indented (previous sibling must be object/array)
  canIndent(field: EditorField, parentList: EditorField[]): boolean {
    const index = parentList.indexOf(field);
    if (index <= 0) return false;
    const prevSibling = parentList[index - 1];
    return prevSibling.type === 'object' || prevSibling.type === 'array';
  }

  // Indent field - move into previous sibling's children
  indentField(field: EditorField, parentList: EditorField[]): void {
    const index = parentList.indexOf(field);
    if (index <= 0) return;

    const prevSibling = parentList[index - 1];
    if (prevSibling.type !== 'object' && prevSibling.type !== 'array') return;

    // Remove from current list
    parentList.splice(index, 1);

    // Add to previous sibling's children
    if (!prevSibling.children) {
      prevSibling.children = [];
    }
    prevSibling.children.push(field);

    // Always expand the target (keep open if already open, open if closed)
    prevSibling.expanded = true;

    this.fields.update(fields => [...fields]);
    // Don't emit change here - it causes parent to reset expanded state
    // Structure change will be captured on next edit or save
  }

  // Outdent field - move out of parent to grandparent level
  outdentField(field: EditorField, parentList: EditorField[], level: number): void {
    if (level === 0) return;

    // Find the parent object/array that contains this list
    const parent = this.findParentOfList(this.fields(), parentList);
    if (!parent) return;

    // Find the grandparent list
    const grandparentList = this.findParentList(this.fields(), parent);
    if (!grandparentList) return;

    // Remove from current list
    const index = parentList.indexOf(field);
    parentList.splice(index, 1);

    // Add to grandparent list after the parent
    const parentIndex = grandparentList.indexOf(parent);
    grandparentList.splice(parentIndex + 1, 0, field);

    this.fields.update(fields => [...fields]);
    // Don't emit change here - it causes parent to reset expanded state
    // Structure change will be captured on next edit or save
  }

  // Find the parent field that contains a given list
  private findParentOfList(searchIn: EditorField[], targetList: EditorField[]): EditorField | null {
    for (const field of searchIn) {
      if (field.children === targetList) {
        return field;
      }
      if (field.children) {
        const found = this.findParentOfList(field.children, targetList);
        if (found) return found;
      }
    }
    return null;
  }

  // Find the list that contains a given field
  private findParentList(searchIn: EditorField[], targetField: EditorField): EditorField[] | null {
    if (searchIn.includes(targetField)) {
      return searchIn;
    }
    for (const field of searchIn) {
      if (field.children) {
        const found = this.findParentList(field.children, targetField);
        if (found) return found;
      }
    }
    return null;
  }

  // Update schema name - only allow valid characters
  onSchemaNameChange(name: string, input?: HTMLInputElement): void {
    const sanitized = name.replace(/[^a-zA-Z0-9_$]/g, '');
    this.schemaName.set(sanitized);
    if (input && input.value !== sanitized) {
      input.value = sanitized;
    }
    this.emitChange();
  }

  // Emit change event
  private emitChange(): void {
    this.schemaChange.emit(this.toJsonSchema() as JsonSchema);
  }

  // Save the schema
  onSave(): void {
    this.save.emit(this.toJsonSchema() as JsonSchema);
  }

  // Convert JSON Schema to internal EditorField format
  private jsonSchemaToEditorFields(schema: JsonSchema, requiredFields: string[] = []): EditorField[] {
    const fields: EditorField[] = [];

    if (schema.type === 'object' && schema.properties) {
      const required = schema.required || requiredFields;
      for (const [name, propSchema] of Object.entries(schema.properties)) {
        fields.push(this.jsonSchemaPropertyToEditorField(name, propSchema, required.includes(name)));
      }
    }

    return fields;
  }

  private jsonSchemaPropertyToEditorField(name: string, schema: JsonSchema, isRequired: boolean): EditorField {
    const fieldType = this.jsonSchemaTypeToEditorType(schema);
    // Set displayType for string, number, boolean, date, and time fields
    let displayType: DisplayType | undefined;
    if (fieldType === 'string') {
      displayType = ((schema as Record<string, unknown>)['x-display-type'] as DisplayType | undefined) || 'textbox';
    } else if (fieldType === 'number') {
      displayType = ((schema as Record<string, unknown>)['x-display-type'] as DisplayType | undefined) || 'textbox';
    } else if (fieldType === 'boolean') {
      displayType = ((schema as Record<string, unknown>)['x-display-type'] as DisplayType | undefined) || 'checkbox';
    } else if (fieldType === 'date') {
      displayType = ((schema as Record<string, unknown>)['x-display-type'] as DisplayType | undefined) || 'datepicker';
    } else if (fieldType === 'time') {
      displayType = ((schema as Record<string, unknown>)['x-display-type'] as DisplayType | undefined) || 'timepicker';
    }

    // Preserve format for string types and date types
    let format: string | undefined;
    if (fieldType === 'string' && schema.format) {
      format = schema.format;
    } else if (fieldType === 'date' && schema.format) {
      format = schema.format; // Preserve 'date' vs 'date-time'
    }

    const field: EditorField = {
      id: this.generateId(),
      name,
      type: fieldType,
      format,
      displayType,
      label: schema.title,
      required: isRequired,
      allowedValues: schema.enum as string[] | undefined,
      defaultValue: schema.default as string | number | boolean | undefined,
      // Validators
      minLength: schema.minLength,
      maxLength: schema.maxLength,
      pattern: schema.pattern,
      minimum: schema.minimum,
      maximum: schema.maximum,
      expanded: false,
    };

    if (schema.type === 'object' && schema.properties) {
      field.children = this.jsonSchemaToEditorFields(schema, schema.required);
    } else if (schema.type === 'array' && schema.items) {
      if (schema.items.type === 'object' && schema.items.properties) {
        field.children = this.jsonSchemaToEditorFields(schema.items, schema.items.required);
      }
    }

    return field;
  }

  private jsonSchemaTypeToEditorType(schema: JsonSchema): EditorField['type'] {
    if (schema.format === 'date' || schema.format === 'date-time') {
      return 'date';
    }
    if (schema.format === 'time') {
      return 'time';
    }
    const type = Array.isArray(schema.type) ? schema.type[0] : schema.type;
    switch (type) {
      case 'string': return 'string';
      case 'number':
      case 'integer': return 'number';
      case 'boolean': return 'boolean';
      case 'object': return 'object';
      case 'array': return 'array';
      default: return 'string';
    }
  }

  // Convert to internal JSON format
  toJson(): string {
    return JSON.stringify(
      {
        name: this.schemaName(),
        fields: this.stripEditingState(this.fields()),
      },
      null,
      2
    );
  }

  // Convert to valid JSON Schema format
  toJsonSchema(): object {
    const required: string[] = [];
    const properties: Record<string, object> = {};

    for (const field of this.fields()) {
      if (field.required && field.name) {
        required.push(field.name);
      }
      if (field.name) {
        properties[field.name] = this.fieldToJsonSchema(field);
      }
    }

    const schema: Record<string, unknown> = {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      type: 'object',
      title: this.schemaName(),
      properties,
    };

    if (required.length > 0) {
      schema['required'] = required;
    }

    return schema;
  }

  private fieldToJsonSchema(field: EditorField): object {
    const schema: Record<string, unknown> = {};

    // Map type
    if (field.type === 'date') {
      schema['type'] = 'string';
      schema['format'] = field.format || 'date-time'; // Use preserved format or default
    } else if (field.type === 'time') {
      schema['type'] = 'string';
      schema['format'] = 'time';
    } else if (field.type === 'array') {
      schema['type'] = 'array';
      if (field.children && field.children.length > 0) {
        // If array has children, treat first child as item schema
        const itemProperties: Record<string, object> = {};
        const itemRequired: string[] = [];
        for (const child of field.children) {
          if (child.name) {
            itemProperties[child.name] = this.fieldToJsonSchema(child);
            if (child.required) {
              itemRequired.push(child.name);
            }
          }
        }
        const items: Record<string, unknown> = {
          type: 'object',
          properties: itemProperties,
        };
        if (itemRequired.length > 0) {
          items['required'] = itemRequired;
        }
        schema['items'] = items;
      }
    } else if (field.type === 'object') {
      schema['type'] = 'object';
      if (field.children && field.children.length > 0) {
        const childProperties: Record<string, object> = {};
        const childRequired: string[] = [];
        for (const child of field.children) {
          if (child.name) {
            childProperties[child.name] = this.fieldToJsonSchema(child);
            if (child.required) {
              childRequired.push(child.name);
            }
          }
        }
        schema['properties'] = childProperties;
        if (childRequired.length > 0) {
          schema['required'] = childRequired;
        }
      }
    } else {
      schema['type'] = field.type;
      // Preserve format for string types (email, uri, uuid, etc.)
      if (field.type === 'string' && field.format) {
        schema['format'] = field.format;
      }
    }

    // Add label as title
    if (field.label) {
      schema['title'] = field.label;
    }

    // Add enum for allowed values
    if (field.allowedValues && field.allowedValues.length > 0) {
      schema['enum'] = field.allowedValues;
    }

    // Add default value
    if (field.defaultValue !== undefined) {
      schema['default'] = field.defaultValue;
    }

    // Add validators
    if (field.minLength !== undefined) {
      schema['minLength'] = field.minLength;
    }
    if (field.maxLength !== undefined) {
      schema['maxLength'] = field.maxLength;
    }
    if (field.pattern) {
      schema['pattern'] = field.pattern;
    }
    if (field.minimum !== undefined) {
      schema['minimum'] = field.minimum;
    }
    if (field.maximum !== undefined) {
      schema['maximum'] = field.maximum;
    }

    // Add display type (custom extension)
    if (field.displayType) {
      schema['x-display-type'] = field.displayType;
    }

    return schema;
  }

  private stripEditingState(fields: EditorField[]): EditorField[] {
    return fields.map(f => {
      const { isEditingValues, isEditingDefault, isEditingValidators, ...rest } = f;
      return {
        ...rest,
        children: f.children ? this.stripEditingState(f.children) : undefined,
      };
    });
  }

  // Track by function for ngFor
  trackByFieldId(index: number, field: EditorField): string {
    return field.id;
  }

  // --- JSON View Methods ---

  setViewMode(mode: 'visual' | 'json'): void {
    if (mode === 'json') {
      // Sync JSON text from current schema state
      this.jsonText.set(JSON.stringify(this.toJsonSchema(), null, 2));
      this.jsonError.set(null);
    }
    this.viewMode.set(mode);
  }

  onJsonTextChange(text: string): void {
    this.jsonText.set(text);
    try {
      JSON.parse(text);
      this.jsonError.set(null);
    } catch (e) {
      this.jsonError.set((e as Error).message);
    }
  }

  applyJsonChanges(): void {
    try {
      const parsed = JSON.parse(this.jsonText()) as JsonSchema;
      // Update internal state from JSON
      this.schemaName.set(parsed.title || 'New Schema');
      this.fields.set(this.jsonSchemaToEditorFields(parsed));
      this.jsonError.set(null);
      this.emitChange();
    } catch (e) {
      this.jsonError.set((e as Error).message);
    }
  }

  formatJson(): void {
    try {
      const parsed = JSON.parse(this.jsonText());
      this.jsonText.set(JSON.stringify(parsed, null, 2));
      this.jsonError.set(null);
    } catch (e) {
      this.jsonError.set((e as Error).message);
    }
  }

  copyJson(): void {
    const text = this.jsonText();
    navigator.clipboard.writeText(text).catch(err => {
      console.error('Failed to copy JSON to clipboard:', err);
    });
  }
}
