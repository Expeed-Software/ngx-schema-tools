/**
 * Schema Editor Page - Example usage of the SchemaEditorComponent
 */
import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { SchemaEditorComponent, JsonSchema } from '@expeed/ngx-schema-editor';
import { AppStateService, StoredSchema } from '../../services/app-state.service';

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
    SchemaEditorComponent,
  ],
  templateUrl: './schema-editor-page.component.html',
  styleUrl: './schema-editor-page.component.scss',
})
export class SchemaEditorPageComponent {
  private snackBar = inject(MatSnackBar);
  appState = inject(AppStateService);

  // Currently selected schema
  selectedSchemaId = signal<string | null>(null);

  // Computed: get the currently selected schema
  selectedSchema = computed(() => {
    const id = this.selectedSchemaId();
    return this.appState.schemas().find(s => s.id === id) || null;
  });

  // --- Schema CRUD Operations ---

  createNewSchema(): void {
    const newSchema = this.appState.addSchema({
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      type: 'object',
      title: 'NewSchema',
      properties: {},
      required: [],
    });
    this.selectedSchemaId.set(newSchema.id);
  }

  selectSchema(id: string): void {
    this.selectedSchemaId.set(id);
  }

  onSchemaChange(updated: JsonSchema): void {
    const id = this.selectedSchemaId();
    if (!id) return;
    this.appState.updateSchema(id, updated);
  }

  duplicateSchema(schema: StoredSchema): void {
    const newSchema = this.appState.addSchema({
      ...JSON.parse(JSON.stringify(schema)),
      title: (schema.title || 'Schema') + '_copy',
    });
    this.selectedSchemaId.set(newSchema.id);
    this.snackBar.open('Schema duplicated', 'Close', { duration: 2000 });
  }

  deleteSchema(id: string): void {
    this.appState.deleteSchema(id);
    if (this.selectedSchemaId() === id) {
      this.selectedSchemaId.set(null);
    }
    this.snackBar.open('Schema deleted', 'Close', { duration: 2000 });
  }

  // --- Export/Import ---

  exportSchema(schema: StoredSchema): void {
    const { id, ...jsonSchema } = schema;
    const json = JSON.stringify(jsonSchema, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `${(schema.title || 'schema').toLowerCase()}.schema.json`;
    link.click();

    URL.revokeObjectURL(url);
    this.snackBar.open('Schema exported as JSON Schema', 'Close', { duration: 2000 });
  }

  importSchema(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = () => {
      try {
        const json = reader.result as string;
        const data = JSON.parse(json) as JsonSchema;

        const newSchema = this.appState.addSchema({
          ...data,
          title: data.title || 'ImportedSchema',
        });
        this.selectedSchemaId.set(newSchema.id);
        this.snackBar.open('Schema imported', 'Close', { duration: 2000 });
      } catch (error) {
        this.snackBar.open('Failed to import: invalid file', 'Close', { duration: 3000 });
      }
    };

    reader.readAsText(file);
    input.value = '';
  }

  getPropertyCount(schema: StoredSchema): number {
    return Object.keys(schema.properties || {}).length;
  }
}
