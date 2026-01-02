import {
  Component,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  ViewChild,
  ViewChildren,
  QueryList,
  AfterViewInit,
  OnDestroy,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SchemaField, FieldMapping, DefaultValue } from '../../models/schema.model';
import { MappingService } from '../../services/mapping.service';

export interface FieldPositionEvent {
  field: SchemaField;
  element: HTMLElement;
  rect: DOMRect;
}

@Component({
  selector: 'schema-tree',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatTooltipModule],
  templateUrl: './schema-tree.component.html',
  styleUrl: './schema-tree.component.scss',
})
export class SchemaTreeComponent implements AfterViewInit, OnDestroy {
  @Input() schema!: { name: string; fields: SchemaField[] };
  @Input() side: 'source' | 'target' = 'source';
  @Input() mappings: FieldMapping[] = [];
  @Input() defaultValues: DefaultValue[] = [];

  @Output() fieldDragStart = new EventEmitter<FieldPositionEvent>();
  @Output() fieldDragEnd = new EventEmitter<void>();
  @Output() fieldDrop = new EventEmitter<FieldPositionEvent>();
  @Output() sourceDrop = new EventEmitter<FieldPositionEvent>(); // For endpoint dragging - drop on source field
  @Output() fieldPositionsChanged = new EventEmitter<Map<string, DOMRect>>();
  @Output() fieldDefaultValueClick = new EventEmitter<FieldPositionEvent>();

  @ViewChild('schemaFields') schemaFieldsContainer!: ElementRef<HTMLDivElement>;
  @ViewChildren('fieldItem') fieldItems!: QueryList<ElementRef>;

  private mappingService = inject(MappingService);
  private resizeObserver!: ResizeObserver;
  private scrollHandler = () => this.onScroll();

  ngAfterViewInit(): void {
    this.emitFieldPositions();

    this.resizeObserver = new ResizeObserver(() => {
      this.emitFieldPositions();
    });

    this.fieldItems.changes.subscribe(() => {
      this.emitFieldPositions();
    });

    // Add scroll listener to update connector positions
    if (this.schemaFieldsContainer?.nativeElement) {
      this.schemaFieldsContainer.nativeElement.addEventListener('scroll', this.scrollHandler, { passive: true });
    }
  }

  ngOnDestroy(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    if (this.schemaFieldsContainer?.nativeElement) {
      this.schemaFieldsContainer.nativeElement.removeEventListener('scroll', this.scrollHandler);
    }
  }

  onScroll(): void {
    this.emitFieldPositions();
  }

  emitFieldPositions(): void {
    setTimeout(() => {
      const positions = new Map<string, DOMRect>();
      this.fieldItems.forEach((item) => {
        const fieldId = item.nativeElement.getAttribute('data-field-id');
        if (fieldId) {
          positions.set(fieldId, item.nativeElement.getBoundingClientRect());
        }
      });
      this.fieldPositionsChanged.emit(positions);
    });
  }

  toggleExpand(field: SchemaField, event: Event): void {
    event.stopPropagation();
    field.expanded = !field.expanded;
    setTimeout(() => this.emitFieldPositions(), 50);
  }

  onDragStart(event: MouseEvent, field: SchemaField): void {
    if (this.side !== 'source') return;

    // Don't start new drag if endpoint dragging is in progress
    const dragState = this.mappingService.currentDragState();
    if (dragState.isDragging) return;

    const element = event.currentTarget as HTMLElement;
    const rect = element.getBoundingClientRect();

    this.fieldDragStart.emit({ field, element, rect });
  }

  isEndpointDragMode(): boolean {
    const dragState = this.mappingService.currentDragState();
    return dragState.isDragging && (dragState.dragMode === 'move-source' || dragState.dragMode === 'move-target');
  }

  isSourceEndpointDragging(): boolean {
    const dragState = this.mappingService.currentDragState();
    return dragState.isDragging && dragState.dragMode === 'move-source';
  }

  isTargetEndpointDragging(): boolean {
    const dragState = this.mappingService.currentDragState();
    return dragState.isDragging && dragState.dragMode === 'move-target';
  }

  onDragOver(event: DragEvent): void {
    if (this.side === 'target') {
      event.preventDefault();
    }
  }

  onDrop(event: MouseEvent, field: SchemaField): void {
    const element = event.currentTarget as HTMLElement;
    const rect = element.getBoundingClientRect();

    // Check if endpoint dragging is in progress (via MappingService drag state)
    const dragState = this.mappingService.currentDragState();

    // Handle source drop during endpoint dragging (moving source endpoint)
    if (this.side === 'source' && dragState.isDragging && dragState.dragMode === 'move-source') {
      this.sourceDrop.emit({ field, element, rect });
      return;
    }

    // Handle target drop (either endpoint dragging or new mapping)
    if (this.side === 'target') {
      this.fieldDrop.emit({ field, element, rect });
    }
  }

  getTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      string: 'text_fields',
      number: 'pin',
      boolean: 'toggle_on',
      object: 'data_object',
      array: 'data_array',
      date: 'calendar_today',
    };
    return icons[type] || 'help_outline';
  }

  isFieldMapped(field: SchemaField): boolean {
    if (this.side === 'source') {
      return this.mappings.some((m) =>
        m.sourceFields.some((sf) => sf.id === field.id)
      );
    } else {
      return this.mappings.some((m) => m.targetField.id === field.id);
    }
  }

  getFieldMappingCount(field: SchemaField): number {
    if (this.side === 'source') {
      return this.mappings.filter((m) =>
        m.sourceFields.some((sf) => sf.id === field.id)
      ).length;
    } else {
      const mapping = this.mappings.find((m) => m.targetField.id === field.id);
      return mapping ? mapping.sourceFields.length : 0;
    }
  }

  hasDefaultValue(field: SchemaField): boolean {
    return this.defaultValues.some(d => d.targetField.id === field.id);
  }

  getDefaultValueDisplay(field: SchemaField): string {
    const defaultValue = this.defaultValues.find(d => d.targetField.id === field.id);
    if (!defaultValue || defaultValue.value === null) return '';

    if (defaultValue.targetField.type === 'date' && defaultValue.value) {
      return new Date(defaultValue.value as string).toLocaleDateString();
    }
    return String(defaultValue.value);
  }

  onFieldClick(event: MouseEvent, field: SchemaField): void {
    // Only handle clicks on target fields that are leaf nodes (no children) or have specific types
    if (this.side !== 'target') return;
    if (field.type === 'object' || field.type === 'array') return;

    // Don't trigger if the field is already mapped (unless it has a default value)
    if (this.isFieldMapped(field) && !this.hasDefaultValue(field)) return;

    // Allow clicking on unmapped fields OR fields with default values (to edit them)
    if (!this.isFieldMapped(field) || this.hasDefaultValue(field)) {
      event.stopPropagation();

      const element = event.currentTarget as HTMLElement;
      const rect = element.getBoundingClientRect();

      this.fieldDefaultValueClick.emit({ field, element, rect });
    }
  }

  trackByFieldId(index: number, field: SchemaField): string {
    return field.id;
  }
}
