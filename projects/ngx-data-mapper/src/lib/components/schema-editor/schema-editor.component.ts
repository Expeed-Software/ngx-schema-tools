import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  computed,
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
import { DragDropModule } from '@angular/cdk/drag-drop';

export interface EditorField {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array';
  description?: string;
  required?: boolean;
  allowedValues?: string[];
  children?: EditorField[];
  expanded?: boolean;
  isEditing?: boolean;
  isEditingValues?: boolean;
}

export interface SchemaDefinition {
  name: string;
  fields: EditorField[];
}

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
    DragDropModule,
  ],
  templateUrl: './schema-editor.component.html',
  styleUrl: './schema-editor.component.scss',
})
export class SchemaEditorComponent {
  @Input() set schema(value: SchemaDefinition | null) {
    if (value) {
      this.schemaName.set(value.name);
      this.fields.set(this.cloneFields(value.fields));
    }
  }

  @Output() schemaChange = new EventEmitter<SchemaDefinition>();
  @Output() save = new EventEmitter<SchemaDefinition>();

  schemaName = signal('New Schema');
  fields = signal<EditorField[]>([]);

  fieldTypes: Array<{ value: string; label: string; icon: string }> = [
    { value: 'string', label: 'String', icon: 'text_fields' },
    { value: 'number', label: 'Number', icon: 'pin' },
    { value: 'boolean', label: 'Boolean', icon: 'toggle_on' },
    { value: 'date', label: 'Date', icon: 'calendar_today' },
    { value: 'object', label: 'Object', icon: 'data_object' },
    { value: 'array', label: 'Array', icon: 'data_array' },
  ];

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
      isEditing: true,
      expanded: false,
    };
    this.fields.update(fields => [...fields, newField]);
    this.emitChange();
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
      isEditing: true,
    };
    parent.children.push(newField);
    parent.expanded = true;
    this.fields.update(fields => [...fields]);
    this.emitChange();
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
        isEditing: false,
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

  // Start editing a field
  startEdit(field: EditorField): void {
    field.isEditing = true;
    this.fields.update(fields => [...fields]);
  }

  // Stop editing a field
  stopEdit(field: EditorField): void {
    field.isEditing = false;
    if (!field.name.trim()) {
      field.name = 'unnamed';
    }
    this.fields.update(fields => [...fields]);
    this.emitChange();
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

  // Handle field type change
  onFieldTypeChange(field: EditorField, type: string): void {
    field.type = type as EditorField['type'];
    // Initialize children array for object/array types
    if ((type === 'object' || type === 'array') && !field.children) {
      field.children = [];
    }
    this.fields.update(fields => [...fields]);
    this.emitChange();
  }

  // Toggle required status
  toggleRequired(field: EditorField): void {
    field.required = !field.required;
    this.fields.update(fields => [...fields]);
    this.emitChange();
  }

  // Update field description
  onDescriptionChange(field: EditorField, description: string): void {
    field.description = description;
    this.fields.update(fields => [...fields]);
    this.emitChange();
  }

  // Toggle allowed values editor
  toggleValuesEditor(field: EditorField): void {
    field.isEditingValues = !field.isEditingValues;
    if (field.isEditingValues && !field.allowedValues) {
      field.allowedValues = [];
    }
    this.fields.update(fields => [...fields]);
  }

  // Add allowed value
  addAllowedValue(field: EditorField, input: HTMLInputElement): void {
    const value = input.value.trim();
    if (value && !field.allowedValues?.includes(value)) {
      if (!field.allowedValues) {
        field.allowedValues = [];
      }
      field.allowedValues.push(value);
      input.value = '';
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

  // Handle keyboard events in field name input
  onFieldNameKeydown(event: KeyboardEvent, field: EditorField): void {
    if (event.key === 'Enter') {
      this.stopEdit(field);
    } else if (event.key === 'Escape') {
      field.isEditing = false;
      this.fields.update(fields => [...fields]);
    }
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
    prevSibling.expanded = true;

    this.fields.update(fields => [...fields]);
    this.emitChange();
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
    this.emitChange();
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
    this.schemaChange.emit({
      name: this.schemaName(),
      fields: this.fields(),
    });
  }

  // Save the schema
  onSave(): void {
    this.save.emit({
      name: this.schemaName(),
      fields: this.fields(),
    });
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
      schema['format'] = 'date-time';
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
    }

    // Add description
    if (field.description) {
      schema['description'] = field.description;
    }

    // Add enum for allowed values
    if (field.allowedValues && field.allowedValues.length > 0) {
      schema['enum'] = field.allowedValues;
    }

    return schema;
  }

  private stripEditingState(fields: EditorField[]): EditorField[] {
    return fields.map(f => {
      const { isEditing, isEditingValues, ...rest } = f;
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
}
