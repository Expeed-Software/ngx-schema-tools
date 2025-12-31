/**
 * Schema Editor Page - Example usage of the SchemaEditorComponent
 *
 * This page demonstrates how to:
 * 1. Use the schema-editor component
 * 2. Manage a list of schemas
 * 3. Handle schema changes
 * 4. Export schemas as JSON Schema format
 * 5. Import schemas from files
 * 6. Apply custom styling via CSS variables
 */
import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { SchemaEditorComponent, SchemaDefinition, EditorField } from 'ngx-data-mapper';

// Extended interface with ID for storage
interface StoredSchema extends SchemaDefinition {
  id: string;
}

@Component({
  selector: 'schema-editor-page',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatMenuModule,
    SchemaEditorComponent,  // Import the reusable component
  ],
  templateUrl: './schema-editor-page.component.html',
  styleUrl: './schema-editor-page.component.scss',
})
export class SchemaEditorPageComponent implements OnInit {
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  // State: list of schemas and currently selected schema
  schemas = signal<StoredSchema[]>([]);
  selectedSchemaId = signal<string | null>(null);

  // Computed: get the currently selected schema
  selectedSchema = computed(() => {
    const id = this.selectedSchemaId();
    return this.schemas().find(s => s.id === id) || null;
  });

  // Generate unique IDs
  private generateId(): string {
    return `schema-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  ngOnInit(): void {
    // Load schemas from localStorage on init
    this.loadSchemas();
  }

  // --- Storage Methods ---

  private loadSchemas(): void {
    const saved = localStorage.getItem('objectSchemas');
    if (saved) {
      try {
        this.schemas.set(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load schemas:', e);
      }
    }
  }

  private saveSchemas(): void {
    localStorage.setItem('objectSchemas', JSON.stringify(this.schemas()));
  }

  // --- Navigation ---

  goToMapper(): void {
    this.router.navigate(['/mapper']);
  }

  // --- Schema CRUD Operations ---

  /** Create a new empty schema */
  createNewSchema(): void {
    const newSchema: StoredSchema = {
      id: this.generateId(),
      name: 'NewSchema',
      fields: [],
    };
    this.schemas.update(list => [...list, newSchema]);
    this.selectedSchemaId.set(newSchema.id);
    this.saveSchemas();
  }

  /** Select a schema for editing */
  selectSchema(id: string): void {
    this.selectedSchemaId.set(id);
  }

  /**
   * Handle schema changes from the editor component
   * This is called whenever the user modifies the schema
   */
  onSchemaChange(updated: SchemaDefinition): void {
    const id = this.selectedSchemaId();
    if (!id) return;

    this.schemas.update(list =>
      list.map(s => s.id === id ? { ...s, ...updated } : s)
    );
    this.saveSchemas();
  }

  /** Duplicate a schema */
  duplicateSchema(schema: StoredSchema): void {
    const duplicate: StoredSchema = {
      id: this.generateId(),
      name: schema.name + '_copy',
      fields: this.cloneFields(schema.fields),
    };
    this.schemas.update(list => [...list, duplicate]);
    this.selectedSchemaId.set(duplicate.id);
    this.saveSchemas();
    this.snackBar.open('Schema duplicated', 'Close', { duration: 2000 });
  }

  private cloneFields(fields: EditorField[]): EditorField[] {
    return fields.map(f => ({
      ...f,
      id: this.generateId(),
      children: f.children ? this.cloneFields(f.children) : undefined,
    }));
  }

  /** Delete a schema */
  deleteSchema(id: string): void {
    this.schemas.update(list => list.filter(s => s.id !== id));
    if (this.selectedSchemaId() === id) {
      this.selectedSchemaId.set(null);
    }
    this.saveSchemas();
    this.snackBar.open('Schema deleted', 'Close', { duration: 2000 });
  }

  // --- Export/Import ---

  /** Export schema as valid JSON Schema format */
  exportSchema(schema: StoredSchema): void {
    const jsonSchema = this.convertToJsonSchema(schema);
    const json = JSON.stringify(jsonSchema, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `${schema.name.toLowerCase()}.schema.json`;
    link.click();

    URL.revokeObjectURL(url);
    this.snackBar.open('Schema exported as JSON Schema', 'Close', { duration: 2000 });
  }

  /** Convert internal format to JSON Schema */
  private convertToJsonSchema(schema: StoredSchema): object {
    const required: string[] = [];
    const properties: Record<string, object> = {};

    for (const field of schema.fields) {
      if (field.required && field.name) {
        required.push(field.name);
      }
      if (field.name) {
        properties[field.name] = this.fieldToJsonSchema(field);
      }
    }

    const jsonSchema: Record<string, unknown> = {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      type: 'object',
      title: schema.name,
      properties,
    };

    if (required.length > 0) {
      jsonSchema['required'] = required;
    }

    return jsonSchema;
  }

  private fieldToJsonSchema(field: EditorField): object {
    const schema: Record<string, unknown> = {};

    if (field.type === 'date') {
      schema['type'] = 'string';
      schema['format'] = 'date-time';
    } else if (field.type === 'array') {
      schema['type'] = 'array';
      if (field.children && field.children.length > 0) {
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

    if (field.description) {
      schema['description'] = field.description;
    }

    if (field.allowedValues && field.allowedValues.length > 0) {
      schema['enum'] = field.allowedValues;
    }

    return schema;
  }

  /** Import schema from file (internal format) */
  importSchema(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = () => {
      try {
        const json = reader.result as string;
        const data = JSON.parse(json) as SchemaDefinition;

        const newSchema: StoredSchema = {
          id: this.generateId(),
          name: data.name || 'ImportedSchema',
          fields: data.fields || [],
        };

        this.schemas.update(list => [...list, newSchema]);
        this.selectedSchemaId.set(newSchema.id);
        this.saveSchemas();

        this.snackBar.open('Schema imported', 'Close', { duration: 2000 });
      } catch (error) {
        this.snackBar.open('Failed to import: invalid file', 'Close', { duration: 3000 });
      }
    };

    reader.readAsText(file);
    input.value = '';
  }
}
