/**
 * Mapper Page - Example usage of the DataMapperComponent
 *
 * This page demonstrates how to:
 * 1. Use the data-mapper component
 * 2. Provide source and target schemas
 * 3. Handle mapping changes
 * 4. Export/import mappings
 * 5. Apply custom styling via CSS variables
 */
import { Component, inject, OnInit, signal, computed, ViewChild, ElementRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DataMapperComponent, SchemaDocument, FieldMapping } from '@expeed/ngx-data-mapper';
import { AppStateService } from '../../services/app-state.service';
import { SampleDataService } from '../../services/sample-data.service';

@Component({
  selector: 'mapper-page',
  standalone: true,
  imports: [
    DataMapperComponent,  // Import the reusable component
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatTooltipModule,
  ],
  templateUrl: './mapper-page.component.html',
  styleUrl: './mapper-page.component.scss',
})
export class MapperPageComponent implements OnInit {
  private sampleDataService = inject(SampleDataService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  appState = inject(AppStateService);

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild(DataMapperComponent) dataMapper!: DataMapperComponent;

  // Current mapping ID from route
  mappingId = signal<string | null>(null);

  // Computed: current mapping
  currentMapping = computed(() => {
    const id = this.mappingId();
    return this.appState.mappings().find(m => m.id === id) || null;
  });

  // State: schemas and mappings
  sourceSchema = signal<SchemaDocument>({ type: 'object', title: '', properties: {} });
  targetSchema = signal<SchemaDocument>({ type: 'object', title: '', properties: {} });
  sampleData = signal<Record<string, unknown>>({});
  mappings = signal<FieldMapping[]>([]);

  // Name editing
  isEditingName = signal(false);

  startEditName(): void {
    this.isEditingName.set(true);
  }

  cancelEditName(): void {
    this.isEditingName.set(false);
  }

  saveName(newName: string): void {
    const trimmed = newName.trim();
    const id = this.mappingId();
    if (id && trimmed) {
      this.appState.updateMapping(id, { name: trimmed });
    }
    this.isEditingName.set(false);
  }

  ngOnInit(): void {
    // Get mapping ID from route
    const id = this.route.snapshot.paramMap.get('id');
    this.mappingId.set(id);

    if (id) {
      // Load schemas based on the mapping's source and target schema IDs
      const mapping = this.appState.mappings().find(m => m.id === id);
      if (mapping) {
        const sourceSchema = this.appState.schemas().find(s => s.id === mapping.sourceSchemaId);
        const targetSchema = this.appState.schemas().find(s => s.id === mapping.targetSchemaId);

        if (sourceSchema) {
          const { id: _, ...schema } = sourceSchema;
          this.sourceSchema.set(schema as SchemaDocument);
        }
        if (targetSchema) {
          const { id: _, ...schema } = targetSchema;
          this.targetSchema.set(schema as SchemaDocument);
        }

        // Load existing mapping data if available
        if (mapping.mappingData) {
          this.mappings.set(mapping.mappingData as FieldMapping[]);
        }
      }
    } else {
      // Fallback to sample data for demo
      this.sourceSchema.set(this.sampleDataService.getSourceSchema());
      this.targetSchema.set(this.sampleDataService.getTargetSchema());
    }

    this.sampleData.set(this.sampleDataService.getSampleData());
  }

  /**
   * Handle mapping changes from the data mapper component
   * This is called whenever the user creates, modifies, or deletes a mapping
   */
  onMappingsChange(mappings: FieldMapping[]): void {
    this.mappings.set(mappings);

    // Save mapping data to AppStateService
    const id = this.mappingId();
    if (id) {
      this.appState.updateMappingData(id, mappings);
    }
  }

  // --- Navigation ---

  goBack(): void {
    this.router.navigate(['/mappings']);
  }

  // --- Export/Import ---

  /** Export mappings to JSON file */
  exportMappings(): void {
    const json = this.dataMapper.exportMappings();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'mappings.json';
    link.click();

    URL.revokeObjectURL(url);

    this.snackBar.open('Mappings exported to file', 'Close', {
      duration: 3000,
    });
  }

  /** Open file dialog for import */
  importMappings(): void {
    this.fileInput.nativeElement.click();
  }

  /** Handle file selection for import */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = () => {
      try {
        const json = reader.result as string;
        this.dataMapper.importMappings(json);
        this.snackBar.open('Mappings imported successfully', 'Close', {
          duration: 3000,
        });
      } catch (error) {
        this.snackBar.open('Failed to import mappings: invalid file', 'Close', {
          duration: 3000,
        });
      }
    };

    reader.readAsText(file);
    input.value = '';
  }

  /** Clear all mappings */
  clearMappings(): void {
    this.dataMapper.clearAllMappings();
    this.snackBar.open('All mappings cleared', 'Close', {
      duration: 2000,
    });
  }
}
