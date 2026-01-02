import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { StoredSchema } from '../../services/app-state.service';

export interface AddMappingDialogData {
  schemas: StoredSchema[];
}

export interface AddMappingResult {
  name: string;
  sourceSchemaId: string;
  targetSchemaId: string;
}

@Component({
  selector: 'add-mapping-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
  ],
  template: `
    <h2 mat-dialog-title>Create New Mapping</h2>

    <mat-dialog-content>
      <div class="form-fields">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Mapping Name</mat-label>
          <input matInput [(ngModel)]="name" placeholder="e.g., Contact to Salesforce Lead">
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Source Schema</mat-label>
          <mat-select [(ngModel)]="sourceSchemaId">
            @for (schema of data.schemas; track schema.id) {
              <mat-option [value]="schema.id">
                <mat-icon>schema</mat-icon>
                {{ schema.title }}
              </mat-option>
            }
          </mat-select>
          <mat-hint>The schema to map from</mat-hint>
        </mat-form-field>

        <div class="arrow-divider">
          <mat-icon>arrow_downward</mat-icon>
        </div>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Target Schema</mat-label>
          <mat-select [(ngModel)]="targetSchemaId">
            @for (schema of data.schemas; track schema.id) {
              <mat-option [value]="schema.id">
                <mat-icon>schema</mat-icon>
                {{ schema.title }}
              </mat-option>
            }
          </mat-select>
          <mat-hint>The schema to map to</mat-hint>
        </mat-form-field>

        @if (data.schemas.length === 0) {
          <div class="no-schemas-warning">
            <mat-icon>warning</mat-icon>
            <span>No schemas available. Please create schemas first.</span>
          </div>
        }
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button
        mat-flat-button
        color="primary"
        [disabled]="!isValid()"
        (click)="create()"
      >
        Create Mapping
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .form-fields {
      display: flex;
      flex-direction: column;
      gap: 8px;
      min-width: 380px;
      padding-top: 8px;
    }

    .full-width {
      width: 100%;
    }

    .arrow-divider {
      display: flex;
      justify-content: center;
      padding: 8px 0;
      color: #94a3b8;

      mat-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
      }
    }

    .no-schemas-warning {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      background: #fef3c7;
      border-radius: 8px;
      color: #92400e;
      font-size: 14px;

      mat-icon {
        color: #f59e0b;
      }
    }

    mat-dialog-actions {
      padding: 16px 24px;
    }
  `],
})
export class AddMappingDialogComponent {
  private dialogRef = inject(MatDialogRef<AddMappingDialogComponent>);
  data = inject<AddMappingDialogData>(MAT_DIALOG_DATA);

  name = '';
  sourceSchemaId = '';
  targetSchemaId = '';

  isValid(): boolean {
    return !!(this.name.trim() && this.sourceSchemaId && this.targetSchemaId);
  }

  create(): void {
    if (this.isValid()) {
      this.dialogRef.close({
        name: this.name.trim(),
        sourceSchemaId: this.sourceSchemaId,
        targetSchemaId: this.targetSchemaId,
      } as AddMappingResult);
    }
  }
}
