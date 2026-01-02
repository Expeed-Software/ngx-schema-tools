import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AppStateService, StoredMapping } from '../../services/app-state.service';
import { AddMappingDialogComponent } from './add-mapping-dialog.component';

@Component({
  selector: 'mappings-page',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTooltipModule,
  ],
  template: `
    <div class="mappings-page">
      <div class="page-header">
        <div class="header-content">
          <h1>Data Mappings</h1>
        </div>
        <button mat-flat-button color="primary" (click)="openAddDialog()">
          <mat-icon>add</mat-icon>
          New Mapping
        </button>
      </div>

      <div class="mappings-content">
        @if (appState.mappings().length === 0) {
          <div class="empty-state">
            <mat-icon>account_tree</mat-icon>
            <h3>No mappings yet</h3>
            <p>Create a mapping to define how data transforms between schemas</p>
            <button mat-flat-button color="primary" (click)="openAddDialog()">
              <mat-icon>add</mat-icon>
              New Mapping
            </button>
          </div>
        } @else {
          <div class="mappings-list">
            @for (mapping of appState.mappings(); track mapping.id) {
              <div class="mapping-card">
                <div class="mapping-info">
                  <div class="mapping-name">{{ mapping.name }}</div>
                  <div class="mapping-flow">
                    <span class="schema-name source">{{ appState.getSchemaName(mapping.sourceSchemaId) }}</span>
                    <mat-icon class="flow-arrow">arrow_forward</mat-icon>
                    <span class="schema-name target">{{ appState.getSchemaName(mapping.targetSchemaId) }}</span>
                  </div>
                  <div class="mapping-meta">
                    Updated {{ formatDate(mapping.updatedAt) }}
                  </div>
                </div>
                <div class="mapping-actions">
                  <button mat-icon-button (click)="editMapping(mapping)" matTooltip="Edit mapping">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button [matMenuTriggerFor]="mappingMenu">
                    <mat-icon>more_vert</mat-icon>
                  </button>
                  <mat-menu #mappingMenu="matMenu">
                    <button mat-menu-item (click)="duplicateMapping(mapping)">
                      <mat-icon>content_copy</mat-icon>
                      <span>Duplicate</span>
                    </button>
                    <button mat-menu-item (click)="deleteMapping(mapping)" class="delete-action">
                      <mat-icon>delete</mat-icon>
                      <span>Delete</span>
                    </button>
                  </mat-menu>
                </div>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .mappings-page {
      height: 100%;
      display: flex;
      flex-direction: column;
      background: #f8fafc;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 32px;
      background: white;
      border-bottom: 1px solid #e2e8f0;

      h1 {
        margin: 0;
        font-size: 20px;
        font-weight: 600;
        color: #0f172a;
        letter-spacing: -0.3px;
      }
    }

    .mappings-content {
      flex: 1;
      overflow-y: auto;
      padding: 24px 32px;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 80px 24px;
      color: #94a3b8;
      text-align: center;

      > mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        margin-bottom: 16px;
        opacity: 0.3;
      }

      h3 {
        margin: 0 0 8px;
        font-size: 16px;
        font-weight: 600;
        color: #475569;
      }

      p {
        margin: 0 0 20px;
        font-size: 13px;
        color: #64748b;
      }
    }

    .mappings-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .mapping-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      background: white;
      border-radius: 10px;
      border: 1px solid #e2e8f0;
      transition: all 0.12s ease;

      &:hover {
        border-color: #cbd5e1;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
      }
    }

    .mapping-info {
      flex: 1;
    }

    .mapping-name {
      font-size: 14px;
      font-weight: 600;
      color: #0f172a;
      margin-bottom: 6px;
    }

    .mapping-flow {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;

      .schema-name {
        padding: 3px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 500;

        &.source {
          background: #eff6ff;
          color: #2563eb;
        }

        &.target {
          background: #f0fdf4;
          color: #16a34a;
        }
      }

      .flow-arrow {
        font-size: 16px;
        width: 16px;
        height: 16px;
        color: #cbd5e1;
      }
    }

    .mapping-meta {
      font-size: 11px;
      color: #94a3b8;
    }

    .mapping-actions {
      display: flex;
      align-items: center;
      gap: 2px;

      button {
        color: #94a3b8;
        width: 32px;
        height: 32px;

        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
        }

        &:hover {
          color: #475569;
        }
      }
    }

    .delete-action {
      color: #ef4444 !important;

      mat-icon {
        color: #ef4444;
      }
    }
  `],
})
export class MappingsPageComponent {
  appState = inject(AppStateService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  openAddDialog(): void {
    const dialogRef = this.dialog.open(AddMappingDialogComponent, {
      width: '450px',
      data: { schemas: this.appState.schemas() },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const newMapping = this.appState.addMapping({
          name: result.name,
          sourceSchemaId: result.sourceSchemaId,
          targetSchemaId: result.targetSchemaId,
        });
        this.snackBar.open('Mapping created', 'Close', { duration: 2000 });
        // Navigate to edit the new mapping
        this.router.navigate(['/mapper', newMapping.id]);
      }
    });
  }

  editMapping(mapping: StoredMapping): void {
    this.router.navigate(['/mapper', mapping.id]);
  }

  duplicateMapping(mapping: StoredMapping): void {
    this.appState.addMapping({
      name: mapping.name + ' (copy)',
      sourceSchemaId: mapping.sourceSchemaId,
      targetSchemaId: mapping.targetSchemaId,
      mappingData: mapping.mappingData,
    });
    this.snackBar.open('Mapping duplicated', 'Close', { duration: 2000 });
  }

  deleteMapping(mapping: StoredMapping): void {
    this.appState.deleteMapping(mapping.id);
    this.snackBar.open('Mapping deleted', 'Close', { duration: 2000 });
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'today';
    if (days === 1) return 'yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  }
}
