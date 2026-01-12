/**
 * Form Layout Page - Configure layout settings for dynamic forms.
 * Settings configured here are saved and used by the Dynamic Form page.
 */
import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AppStateService, SchemaUIConfig } from '../../services/app-state.service';

interface FieldConfig {
  path: string;
  label: string;
  excluded: boolean;
  columns: number;
}

@Component({
  selector: 'form-layout-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatCheckboxModule,
    MatInputModule,
    MatFormFieldModule,
    MatCardModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="page">
      <header class="page-header">
        <div class="header-content">
          <h1>Form Layout</h1>
          <p class="subtitle">Configure columns and field visibility for dynamic forms</p>
        </div>
      </header>

      <div class="page-body">
        <div class="sidebar-panel">
          <div class="panel-header">
            <h2>Select Schema</h2>
          </div>
          <div class="schema-list">
            @for (schema of appState.schemas(); track schema.id) {
              <div class="schema-item-wrapper">
                <button
                  class="schema-item"
                  [class.active]="selectedSchemaId() === schema.id"
                  [class.has-settings]="hasUIConfig(schema.id)"
                  (click)="onSchemaChange(schema.id)"
                >
                  <mat-icon>data_object</mat-icon>
                  <span class="schema-name">{{ schema.title || 'Untitled' }}</span>
                  <span class="schema-props">{{ getPropertyCount(schema) }} fields</span>
                  @if (hasUIConfig(schema.id)) {
                    <span class="settings-badge">configured</span>
                  }
                </button>
                @if (hasUIConfig(schema.id)) {
                  <button
                    class="delete-settings-btn"
                    (click)="deleteSettings(schema.id, $event)"
                    title="Remove UI settings"
                  >
                    <mat-icon>delete_outline</mat-icon>
                  </button>
                }
              </div>
            }
            @if (appState.schemas().length === 0) {
              <div class="empty-list">
                <mat-icon>info</mat-icon>
                <p>No schemas available.<br>Create one in the Schemas page.</p>
              </div>
            }
          </div>
        </div>

        <div class="main-panel">
          @if (selectedSchemaId()) {
            <div class="settings-container">
              <div class="settings-header">
                <h2>{{ selectedSchema()?.title || 'Settings' }}</h2>
                @if (selectedSchema()?.description) {
                  <p class="settings-description">{{ selectedSchema()?.description }}</p>
                }
              </div>

              <div class="settings-content">
                <!-- Grid Settings -->
                <div class="section">
                  <h3>Grid Settings</h3>
                  <div class="grid-settings">
                    <mat-form-field appearance="outline">
                      <mat-label>Total Columns</mat-label>
                      <mat-select [value]="totalColumns()" (selectionChange)="totalColumns.set($event.value)">
                        <mat-option [value]="1">1 Column</mat-option>
                        <mat-option [value]="2">2 Columns</mat-option>
                      </mat-select>
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Default Field Width</mat-label>
                      <mat-select [value]="defaultFieldColumns()" (selectionChange)="defaultFieldColumns.set($event.value)">
                        <mat-option [value]="1">1 Column</mat-option>
                        <mat-option [value]="2">2 Columns (Full)</mat-option>
                      </mat-select>
                    </mat-form-field>
                  </div>
                </div>

                <!-- Field Configuration -->
                <div class="section">
                  <h3>Field Configuration</h3>
                  <p class="section-hint">Configure visibility and width for each field</p>
                  <div class="field-list">
                    @for (field of fieldConfigs(); track field.path) {
                      <div class="field-config-row">
                        <mat-checkbox
                          [checked]="field.excluded"
                          (change)="updateFieldExcluded(field.path, $event.checked)"
                        >
                          Exclude
                        </mat-checkbox>
                        <span class="field-path">{{ field.path }}</span>
                        <mat-form-field appearance="outline" class="column-select">
                          <mat-select
                            [value]="field.columns"
                            [disabled]="field.excluded"
                            (selectionChange)="updateFieldColumns(field.path, $event.value)"
                          >
                            <mat-option [value]="1">1 col</mat-option>
                            <mat-option [value]="2">2 cols</mat-option>
                          </mat-select>
                        </mat-form-field>
                      </div>
                    }
                  </div>
                </div>
              </div>

              <div class="settings-footer">
                <button mat-stroked-button (click)="resetSettings()">
                  <mat-icon>restart_alt</mat-icon>
                  Reset
                </button>
                <button mat-flat-button color="primary" (click)="saveSettings()">
                  <mat-icon>save</mat-icon>
                  Save Settings
                </button>
              </div>
            </div>

            <div class="preview-panel">
              <div class="preview-header">
                <h3>Generated Configuration</h3>
              </div>
              <pre class="preview-json">{{ generatedConfig() | json }}</pre>
            </div>
          } @else {
            <div class="empty-main">
              <mat-icon>tune</mat-icon>
              <h2>Select a Schema</h2>
              <p>Choose a schema from the left panel to configure its UI settings</p>
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

    .schema-item-wrapper {
      display: flex;
      align-items: stretch;
      gap: 4px;
      margin-bottom: 8px;
    }

    .schema-item {
      display: flex;
      align-items: center;
      gap: 10px;
      flex: 1;
      padding: 10px 12px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      background: white;
      cursor: pointer;
      text-align: left;
      transition: all 0.15s ease;

      &:hover {
        border-color: #6366f1;
        background: #f8fafc;
      }

      &.active {
        border-color: #6366f1;
        background: #eef2ff;
      }

      &.has-settings {
        border-color: #10b981;
      }

      mat-icon {
        color: #6366f1;
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      .schema-name {
        flex: 1;
        font-size: 13px;
        font-weight: 500;
        color: #1e293b;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .schema-props {
        font-size: 11px;
        color: #64748b;
      }

      .settings-badge {
        font-size: 10px;
        color: #10b981;
        background: #d1fae5;
        padding: 2px 6px;
        border-radius: 4px;
        font-weight: 500;
      }
    }

    .delete-settings-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      padding: 0;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      background: white;
      color: #64748b;
      cursor: pointer;
      transition: all 0.15s ease;

      &:hover {
        border-color: #ef4444;
        background: #fef2f2;
        color: #ef4444;
      }

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    }

    .empty-list {
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

    .settings-container {
      flex: 1;
      background: white;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .settings-header {
      padding: 20px 24px;
      border-bottom: 1px solid #e2e8f0;

      h2 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: #1e293b;
      }

      .settings-description {
        margin: 4px 0 0;
        font-size: 14px;
        color: #64748b;
      }
    }

    .settings-content {
      flex: 1;
      padding: 24px;
      overflow: hidden;
    }

    .section {
      margin-bottom: 24px;

      &:last-child {
        margin-bottom: 0;
      }

      h3 {
        margin: 0 0 12px;
        font-size: 14px;
        font-weight: 600;
        color: #1e293b;
      }
    }

    .section-hint {
      margin: -8px 0 12px;
      font-size: 13px;
      color: #64748b;
    }

    .grid-settings {
      display: flex;
      gap: 16px;

      mat-form-field {
        flex: 1;

        ::ng-deep {
          .mat-mdc-form-field-subscript-wrapper {
            display: none;
          }

          .mat-mdc-form-field-infix {
            min-height: 40px;
            padding: 8px 0;
          }

          .mat-mdc-select-trigger {
            font-size: 13px;
          }
        }
      }
    }

    .field-list {
      display: flex;
      flex-direction: column;
      gap: 4px;
      max-height: 400px;
      overflow-y: auto;
    }

    .field-config-row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 4px 10px;
      background: #f8fafc;
      border-radius: 4px;
      border: 1px solid #e2e8f0;
      font-family: Roboto, sans-serif;

      ::ng-deep .mdc-form-field {
        font-size: 13px;
      }

      .field-path {
        flex: 1;
        font-size: 13px;
        font-family: inherit;
        color: #334155;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .column-select {
        width: 75px;

        ::ng-deep {
          .mat-mdc-form-field-subscript-wrapper {
            display: none;
          }

          .mat-mdc-text-field-wrapper {
            padding: 0 8px;
          }

          .mat-mdc-form-field-infix {
            min-height: 32px;
            padding: 4px 0;
          }

          .mat-mdc-select-trigger {
            font-size: 12px;
          }
        }
      }
    }

    .settings-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px 24px;
      border-top: 1px solid #e2e8f0;
      background: #f8fafc;
      border-radius: 0 0 12px 12px;

      button {
        display: flex;
        align-items: center;
        gap: 6px;
      }
    }

    .preview-panel {
      width: 400px;
      flex-shrink: 0;
      background: white;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      display: flex;
      flex-direction: column;
    }

    .preview-header {
      padding: 12px 16px;
      border-bottom: 1px solid #e2e8f0;

      h3 {
        margin: 0;
        font-size: 14px;
        font-weight: 600;
        color: #1e293b;
      }
    }

    .preview-json {
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
export class FormLayoutPageComponent {
  private snackBar = inject(MatSnackBar);
  appState = inject(AppStateService);

  selectedSchemaId = signal<string | null>(null);
  totalColumns = signal<1 | 2>(2);
  defaultFieldColumns = signal<number>(1);
  fieldConfigs = signal<FieldConfig[]>([]);

  selectedSchema = computed(() => {
    const id = this.selectedSchemaId();
    if (!id) return null;
    return this.appState.schemas().find(s => s.id === id) || null;
  });

  generatedConfig = computed((): SchemaUIConfig | null => {
    const schemaId = this.selectedSchemaId();
    if (!schemaId) return null;

    const excludeFields = this.fieldConfigs()
      .filter(f => f.excluded)
      .map(f => f.path);

    const fieldColumns: Record<string, number> = {};
    for (const field of this.fieldConfigs()) {
      if (!field.excluded && field.columns !== this.defaultFieldColumns()) {
        fieldColumns[field.path] = field.columns;
      }
    }

    return {
      schemaId,
      columns: this.totalColumns(),
      defaultFieldColumns: this.defaultFieldColumns(),
      fieldColumns,
      excludeFields,
    };
  });

  onSchemaChange(schemaId: string): void {
    this.selectedSchemaId.set(schemaId);
    this.loadSettingsForSchema(schemaId);
  }

  private loadSettingsForSchema(schemaId: string): void {
    const savedConfig = this.appState.getUIConfigBySchemaId(schemaId);

    if (savedConfig) {
      this.totalColumns.set(savedConfig.columns as 1 | 2);
      this.defaultFieldColumns.set(savedConfig.defaultFieldColumns);
      this.buildFieldConfigsFromSaved(savedConfig);
    } else {
      this.totalColumns.set(2);
      this.defaultFieldColumns.set(1);
      this.buildFieldConfigs();
    }
  }

  private buildFieldConfigs(): void {
    const schema = this.selectedSchema();
    if (!schema?.properties) {
      this.fieldConfigs.set([]);
      return;
    }

    const configs: FieldConfig[] = [];
    this.extractFields(schema.properties as Record<string, any>, '', configs);
    this.fieldConfigs.set(configs);
  }

  private buildFieldConfigsFromSaved(savedConfig: SchemaUIConfig): void {
    const schema = this.selectedSchema();
    if (!schema?.properties) {
      this.fieldConfigs.set([]);
      return;
    }

    const configs: FieldConfig[] = [];
    this.extractFields(schema.properties as Record<string, any>, '', configs);

    // Apply saved settings
    for (const config of configs) {
      if (savedConfig.excludeFields.includes(config.path)) {
        config.excluded = true;
      }
      if (savedConfig.fieldColumns[config.path]) {
        config.columns = savedConfig.fieldColumns[config.path];
      } else {
        config.columns = savedConfig.defaultFieldColumns;
      }
    }

    this.fieldConfigs.set(configs);
  }

  private extractFields(
    properties: Record<string, any>,
    parentPath: string,
    configs: FieldConfig[]
  ): void {
    for (const [name, prop] of Object.entries(properties)) {
      const path = parentPath ? `${parentPath}.${name}` : name;
      const label = prop.title || name;

      configs.push({
        path,
        label,
        excluded: false,
        columns: this.defaultFieldColumns(),
      });

      // Handle nested objects
      if (prop.type === 'object' && prop.properties) {
        this.extractFields(prop.properties, path, configs);
      }

      // Handle arrays of objects
      if (prop.type === 'array' && prop.items?.properties) {
        this.extractFields(prop.items.properties, `${path}[*]`, configs);
      }
    }
  }

  updateFieldExcluded(path: string, excluded: boolean): void {
    this.fieldConfigs.update(configs =>
      configs.map(c => c.path === path ? { ...c, excluded } : c)
    );
  }

  updateFieldColumns(path: string, columns: number): void {
    this.fieldConfigs.update(configs =>
      configs.map(c => c.path === path ? { ...c, columns } : c)
    );
  }

  saveSettings(): void {
    const config = this.generatedConfig();
    if (config) {
      this.appState.saveUIConfig(config);
      this.snackBar.open('Settings saved successfully', 'Close', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
      });
    }
  }

  resetSettings(): void {
    const schemaId = this.selectedSchemaId();
    if (schemaId) {
      this.appState.deleteUIConfig(schemaId);
      this.totalColumns.set(2);
      this.defaultFieldColumns.set(1);
      this.buildFieldConfigs();
      this.snackBar.open('Settings reset to default', 'Close', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
      });
    }
  }

  getPropertyCount(schema: { properties?: Record<string, unknown> }): number {
    return Object.keys(schema.properties || {}).length;
  }

  hasUIConfig(schemaId: string): boolean {
    return !!this.appState.getUIConfigBySchemaId(schemaId);
  }

  deleteSettings(schemaId: string, event: Event): void {
    event.stopPropagation();
    this.appState.deleteUIConfig(schemaId);

    // If this was the selected schema, reset the form
    if (this.selectedSchemaId() === schemaId) {
      this.totalColumns.set(2);
      this.defaultFieldColumns.set(1);
      this.buildFieldConfigs();
    }

    this.snackBar.open('UI settings removed', 'Close', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  }
}
