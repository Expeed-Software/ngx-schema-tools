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
import { Component, inject, OnInit, signal, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DataMapperComponent, JsonSchema, FieldMapping, MappingService } from 'ngx-data-mapper';
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
  private mappingService = inject(MappingService);
  private router = inject(Router);

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild(DataMapperComponent) dataMapper!: DataMapperComponent;

  // State: schemas and mappings
  sourceSchema = signal<JsonSchema>({ name: '', fields: [] });
  targetSchema = signal<JsonSchema>({ name: '', fields: [] });
  sampleData = signal<Record<string, unknown>>({});
  mappings = signal<FieldMapping[]>([]);

  ngOnInit(): void {
    // Load sample schemas for demo
    // In a real app, these would come from your API or the schema editor
    this.sourceSchema.set(this.sampleDataService.getSourceSchema());
    this.targetSchema.set(this.sampleDataService.getTargetSchema());
    this.sampleData.set(this.sampleDataService.getSampleData());
  }

  /**
   * Handle mapping changes from the data mapper component
   * This is called whenever the user creates, modifies, or deletes a mapping
   */
  onMappingsChange(mappings: FieldMapping[]): void {
    this.mappings.set(mappings);
  }

  // --- Navigation ---

  goToSchemaEditor(): void {
    this.router.navigate(['/schema']);
  }

  // --- Export/Import ---

  /** Export mappings to JSON file */
  exportMappings(): void {
    const json = JSON.stringify(this.mappings(), null, 2);
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
