/**
 * Dynamic Form Page - Example usage of the DynamicFormComponent.
 */
import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { DynamicFormComponent, DynamicFormSchema } from '@expeed/ngx-dyna-form';
import { AppStateService, SchemaUIConfig } from '../../services/app-state.service';

@Component({
  selector: 'dyna-form-page',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatCardModule,
    DynamicFormComponent,
  ],
  template: `
    <div class="page">
      <header class="page-header">
        <div class="header-content">
          <h1>Dynamic Form</h1>
          <p class="subtitle">Render forms from JSON Schema</p>
        </div>
      </header>

      <div class="page-body">
        <div class="sidebar-panel">
          <div class="panel-header">
            <h2>Select Schema</h2>
          </div>
          <div class="schema-list">
            @for (schema of appState.schemas(); track schema.id) {
              <button
                class="schema-item"
                [class.active]="selectedSchemaId() === schema.id"
                (click)="selectSchema(schema.id)"
              >
                <mat-icon>data_object</mat-icon>
                <span class="schema-name">{{ schema.title || 'Untitled' }}</span>
                <span class="schema-props">{{ getPropertyCount(schema) }} fields</span>
              </button>
            }
            @if (appState.schemas().length === 0) {
              <div class="empty-state">
                <mat-icon>info</mat-icon>
                <p>No schemas available.<br>Create one in the Schemas page.</p>
              </div>
            }
          </div>
        </div>

        <div class="main-panel">
          @if (selectedSchema()) {
            <div class="form-container">
              <div class="form-header">
                <h2>{{ selectedSchema()?.title || 'Form Preview' }}</h2>
                @if (selectedSchema()?.description) {
                  <p class="form-description">{{ selectedSchema()?.description }}</p>
                }
              </div>

              <div class="form-content">
                <dyna-form
                  [schema]="selectedSchema()"
                  [values]="formValues()"
                  [columns]="getColumns()"
                  [defaultFieldColumns]="uiConfig()?.defaultFieldColumns ?? 1"
                  [fieldColumns]="uiConfig()?.fieldColumns ?? {}"
                  [excludeFields]="uiConfig()?.excludeFields ?? []"
                  (valuesChange)="onValuesChange($event)"
                  (validChange)="onValidChange($event)"
                />
              </div>

              <div class="form-footer">
                <span class="validity-badge" [class.valid]="isValid()" [class.invalid]="!isValid()">
                  <mat-icon>{{ isValid() ? 'check_circle' : 'error' }}</mat-icon>
                  {{ isValid() ? 'Valid' : 'Invalid' }}
                </span>
                <button mat-flat-button color="primary" [disabled]="!isValid()">
                  <mat-icon>save</mat-icon>
                  Submit
                </button>
              </div>
            </div>

            <div class="output-panel">
              <div class="output-header">
                <h3>Form Values</h3>
                <button mat-icon-button (click)="copyValues()" matTooltip="Copy JSON">
                  <mat-icon>content_copy</mat-icon>
                </button>
              </div>
              <pre class="output-json">{{ formValues() | json }}</pre>
            </div>
          } @else {
            <div class="empty-main">
              <mat-icon>dynamic_form</mat-icon>
              <h2>Select a Schema</h2>
              <p>Choose a schema from the left panel to render as a form</p>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: #f8fafc;
    }

    .page-header {
      padding: 24px 32px;
      background: white;
      border-bottom: 1px solid #e2e8f0;
    }

    .header-content h1 {
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

    .page-body {
      display: flex;
      flex: 1;
      min-height: 0;
      overflow: hidden;
    }

    .sidebar-panel {
      width: 280px;
      background: white;
      border-right: 1px solid #e2e8f0;
      display: flex;
      flex-direction: column;
    }

    .panel-header {
      padding: 16px 20px;
      border-bottom: 1px solid #e2e8f0;

      h2 {
        margin: 0;
        font-size: 14px;
        font-weight: 600;
        color: #1e293b;
      }
    }

    .schema-list {
      flex: 1;
      overflow-y: auto;
      padding: 12px;
    }

    .schema-item {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
      padding: 12px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      background: white;
      cursor: pointer;
      text-align: left;
      margin-bottom: 8px;
      transition: all 0.15s ease;

      &:hover {
        border-color: #6366f1;
        background: #f8fafc;
      }

      &.active {
        border-color: #6366f1;
        background: #eef2ff;
      }

      mat-icon {
        color: #6366f1;
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      .schema-name {
        flex: 1;
        font-size: 14px;
        font-weight: 500;
        color: #1e293b;
      }

      .schema-props {
        font-size: 12px;
        color: #64748b;
      }
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 32px 16px;
      text-align: center;
      color: #64748b;

      mat-icon {
        font-size: 32px;
        width: 32px;
        height: 32px;
        margin-bottom: 12px;
        opacity: 0.5;
      }

      p {
        margin: 0;
        font-size: 13px;
        line-height: 1.5;
      }
    }

    .main-panel {
      flex: 1;
      display: flex;
      gap: 24px;
      padding: 24px;
      overflow: auto;
    }

    .form-container {
      flex: 1;
      background: white;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      display: flex;
      flex-direction: column;
      max-width: 800px;
    }

    .form-header {
      padding: 20px 24px;
      border-bottom: 1px solid #e2e8f0;

      h2 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: #1e293b;
      }

      .form-description {
        margin: 4px 0 0;
        font-size: 14px;
        color: #64748b;
      }
    }

    .form-content {
      flex: 1;
      padding: 24px;
      overflow: auto;
    }

    .form-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 24px;
      border-top: 1px solid #e2e8f0;
      background: #f8fafc;
      border-radius: 0 0 12px 12px;
    }

    .validity-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      font-weight: 500;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      &.valid {
        color: #10b981;
      }

      &.invalid {
        color: #ef4444;
      }
    }

    .output-panel {
      width: 320px;
      background: white;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      display: flex;
      flex-direction: column;
    }

    .output-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-bottom: 1px solid #e2e8f0;

      h3 {
        margin: 0;
        font-size: 14px;
        font-weight: 600;
        color: #1e293b;
      }
    }

    .output-json {
      flex: 1;
      margin: 0;
      padding: 16px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      line-height: 1.6;
      color: #334155;
      background: #f8fafc;
      overflow: auto;
      border-radius: 0 0 12px 12px;
    }

    .empty-main {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      color: #64748b;

      mat-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        margin-bottom: 16px;
        opacity: 0.3;
      }

      h2 {
        margin: 0 0 8px;
        font-size: 20px;
        font-weight: 600;
        color: #475569;
      }

      p {
        margin: 0;
        font-size: 14px;
      }
    }
  `],
})
export class DynaFormPageComponent {
  appState = inject(AppStateService);

  selectedSchemaId = signal<string | null>(null);
  formValues = signal<Record<string, unknown>>({});
  isValid = signal(false);

  selectedSchema = computed(() => {
    const id = this.selectedSchemaId();
    if (!id) return null;
    const schema = this.appState.schemas().find(s => s.id === id);
    return schema as unknown as DynamicFormSchema | null;
  });

  uiConfig = computed((): SchemaUIConfig | null => {
    const id = this.selectedSchemaId();
    if (!id) return null;
    return this.appState.getUIConfigBySchemaId(id) || null;
  });

  selectSchema(id: string): void {
    this.selectedSchemaId.set(id);
    this.formValues.set({});
  }

  onValuesChange(values: Record<string, unknown>): void {
    this.formValues.set(values);
  }

  onValidChange(valid: boolean): void {
    this.isValid.set(valid);
  }

  getPropertyCount(schema: { properties?: Record<string, unknown> }): number {
    return Object.keys(schema.properties || {}).length;
  }

  copyValues(): void {
    const json = JSON.stringify(this.formValues(), null, 2);
    navigator.clipboard.writeText(json);
  }

  getColumns(): 1 | 2 {
    return (this.uiConfig()?.columns ?? 2) as 1 | 2;
  }
}
