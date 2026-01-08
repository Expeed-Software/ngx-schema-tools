import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SchemaEditorComponent, JsonSchema } from '@expeed/ngx-data-mapper';

@Component({
  selector: 'schema-creator-page',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    SchemaEditorComponent,
  ],
  template: `
    <div class="page-container">
      <header class="page-header">
        <h1>Schema Creator</h1>
        <p class="subtitle">Create schemas without schema name field</p>
      </header>

      <main class="page-main">
        <div class="editor-wrapper">
          <schema-editor
            [schema]="currentSchema()"
            [showSchemaName]="false"
            (schemaChange)="onSchemaChange($event)"
          ></schema-editor>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .page-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: #f8fafc;
    }

    .page-header {
      padding: 24px 32px;
      background: white;
      border-bottom: 1px solid #e2e8f0;

      h1 {
        margin: 0;
        font-size: 24px;
        font-weight: 600;
        color: #1e293b;
      }

      .subtitle {
        margin: 4px 0 0;
        font-size: 14px;
        color: #64748b;
      }
    }

    .page-main {
      flex: 1;
      padding: 24px 32px;
      overflow: auto;
    }

    .editor-wrapper {
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      padding: 24px;
      max-width: 1200px;
    }
  `],
})
export class SchemaCreatorPageComponent {
  currentSchema = signal<JsonSchema>({
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: 'object',
    title: 'NewSchema',
    properties: {},
    required: [],
  });

  onSchemaChange(updated: JsonSchema): void {
    this.currentSchema.set(updated);
  }
}
