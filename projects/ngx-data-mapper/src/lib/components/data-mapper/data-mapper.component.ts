import {
  Component,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  HostListener,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  SchemaField,
  JsonSchema,
  FieldMapping,
  TransformationConfig,
  ArrayMapping,
  ArrayFilterConfig,
  ArrayToObjectMapping,
  ArraySelectorConfig,
  DefaultValue,
} from '../../models/schema.model';
import { MappingService } from '../../services/mapping.service';
import { SvgConnectorService, Point } from '../../services/svg-connector.service';
import { TransformationService } from '../../services/transformation.service';
import { SchemaTreeComponent, FieldPositionEvent } from '../schema-tree/schema-tree.component';
import { TransformationPopoverComponent } from '../transformation-popover/transformation-popover.component';
import { ArrayFilterModalComponent } from '../array-filter-modal/array-filter-modal.component';
import { ArraySelectorModalComponent } from '../array-selector-modal/array-selector-modal.component';
import { DefaultValuePopoverComponent } from '../default-value-popover/default-value-popover.component';

interface VisualConnection {
  id: string;
  mappingId: string;
  paths: string[];
  midPoint: Point;
  targetPoint: Point;
  hasTransformation: boolean;
  isSelected: boolean;
  isArrayMapping: boolean;
  isArrayToObjectMapping: boolean;
  hasFilter: boolean;
}

@Component({
  selector: 'data-mapper',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    SchemaTreeComponent,
    TransformationPopoverComponent,
    ArrayFilterModalComponent,
    ArraySelectorModalComponent,
    DefaultValuePopoverComponent,
  ],
  templateUrl: './data-mapper.component.html',
  styleUrl: './data-mapper.component.scss',
})
export class DataMapperComponent implements AfterViewInit, OnDestroy {
  @Input() sourceSchema!: JsonSchema;
  @Input() targetSchema!: JsonSchema;
  @Input() sampleData: Record<string, unknown> = {};

  @Output() mappingsChange = new EventEmitter<FieldMapping[]>();

  @ViewChild('svgContainer') svgContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('svgElement') svgElement!: ElementRef<SVGSVGElement>;

  private mappingService = inject(MappingService);
  private svgConnectorService = inject(SvgConnectorService);
  private transformationService = inject(TransformationService);

  // Field positions from both trees
  private sourcePositions = new Map<string, DOMRect>();
  private targetPositions = new Map<string, DOMRect>();

  // Visual state
  connections = signal<VisualConnection[]>([]);
  dragPath = signal<string | null>(null);
  selectedMappingId = signal<string | null>(null);
  popoverPosition = signal<{ x: number; y: number } | null>(null);

  // Array filter modal state
  showArrayFilterModal = signal(false);
  selectedArrayMapping = signal<ArrayMapping | null>(null);

  // Array selector modal state (for array-to-object)
  showArraySelectorModal = signal(false);
  selectedArrayToObjectMapping = signal<ArrayToObjectMapping | null>(null);

  // Default value popover state
  showDefaultValuePopover = signal(false);
  selectedDefaultValueField = signal<SchemaField | null>(null);
  defaultValuePopoverPosition = signal<{ x: number; y: number } | null>(null);

  // Computed values
  readonly mappings = computed(() => this.mappingService.allMappings());
  readonly arrayMappings = computed(() => this.mappingService.allArrayMappings());
  readonly defaultValues = computed(() => this.mappingService.allDefaultValues());
  readonly selectedMapping = computed(() => this.mappingService.selectedMapping());
  readonly showPopover = computed(() => this.selectedMappingId() !== null && this.popoverPosition() !== null && !this.showArrayFilterModal());

  private isDragging = false;
  private dragSourceField: SchemaField | null = null;
  private dragStartPoint: Point | null = null;
  private resizeObserver!: ResizeObserver;

  ngAfterViewInit(): void {
    this.setupResizeObserver();
  }

  ngOnDestroy(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  private setupResizeObserver(): void {
    this.resizeObserver = new ResizeObserver(() => {
      this.updateConnections();
    });

    if (this.svgContainer?.nativeElement) {
      this.resizeObserver.observe(this.svgContainer.nativeElement);
    }
  }

  onSourcePositionsChanged(positions: Map<string, DOMRect>): void {
    this.sourcePositions = positions;
    this.updateConnections();
  }

  onTargetPositionsChanged(positions: Map<string, DOMRect>): void {
    this.targetPositions = positions;
    this.updateConnections();
  }

  onFieldDragStart(event: FieldPositionEvent): void {
    if (!this.svgContainer?.nativeElement) return;

    const containerRect = this.svgContainer.nativeElement.getBoundingClientRect();
    const startPoint = this.svgConnectorService.calculateConnectionPoint(
      event.rect,
      'source',
      containerRect
    );

    this.isDragging = true;
    this.dragSourceField = event.field;
    this.dragStartPoint = startPoint;

    document.body.style.cursor = 'grabbing';
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (!this.isDragging || !this.dragStartPoint || !this.svgContainer?.nativeElement) return;

    const containerRect = this.svgContainer.nativeElement.getBoundingClientRect();
    const currentPoint: Point = {
      x: event.clientX - containerRect.left,
      y: event.clientY - containerRect.top,
    };

    const path = this.svgConnectorService.createDragPath(this.dragStartPoint, currentPoint);
    this.dragPath.set(path);
  }

  @HostListener('document:mouseup', ['$event'])
  onMouseUp(event: MouseEvent): void {
    if (this.isDragging) {
      this.dragPath.set(null);
      this.isDragging = false;
      this.dragSourceField = null;
      this.dragStartPoint = null;
      document.body.style.cursor = '';
    }
  }

  onFieldDrop(event: FieldPositionEvent): void {
    if (!this.dragSourceField) return;

    // Create mapping
    const mapping = this.mappingService.createMapping(
      [this.dragSourceField],
      event.field
    );

    this.mappingsChange.emit(this.mappingService.allMappings());
    this.updateConnections();

    // Reset drag state
    this.isDragging = false;
    this.dragSourceField = null;
    this.dragStartPoint = null;
    this.dragPath.set(null);
    document.body.style.cursor = '';
  }

  onConnectionClick(connection: VisualConnection, event: MouseEvent): void {
    event.stopPropagation();

    this.selectedMappingId.set(connection.mappingId);
    this.mappingService.selectMapping(connection.mappingId);

    // Position popover at click location
    this.popoverPosition.set({
      x: event.clientX,
      y: event.clientY,
    });

    this.updateConnections();
  }

  onTransformationNodeClick(connection: VisualConnection, event: MouseEvent): void {
    event.stopPropagation();

    // If it's an array mapping, show the filter modal
    if (connection.isArrayMapping) {
      const arrayMapping = this.mappingService.getArrayMapping(connection.mappingId);
      if (arrayMapping) {
        this.selectedArrayMapping.set(arrayMapping);
        this.showArrayFilterModal.set(true);
        return;
      }
    }

    // If it's an array-to-object mapping, show the selector modal
    if (connection.isArrayToObjectMapping) {
      const arrayToObjectMapping = this.mappingService.getArrayToObjectMapping(connection.mappingId);
      if (arrayToObjectMapping) {
        this.selectedArrayToObjectMapping.set(arrayToObjectMapping);
        this.showArraySelectorModal.set(true);
        return;
      }
    }

    this.onConnectionClick(connection, event);
  }

  onArrayFilterSave(filter: ArrayFilterConfig | undefined): void {
    const arrayMapping = this.selectedArrayMapping();
    if (arrayMapping) {
      this.mappingService.updateArrayFilter(arrayMapping.id, filter);
      this.mappingsChange.emit(this.mappingService.allMappings());
    }
    this.closeArrayFilterModal();
    this.updateConnections();
  }

  closeArrayFilterModal(): void {
    this.showArrayFilterModal.set(false);
    this.selectedArrayMapping.set(null);
  }

  onArraySelectorSave(selector: ArraySelectorConfig): void {
    const mapping = this.selectedArrayToObjectMapping();
    if (mapping) {
      this.mappingService.updateArrayToObjectSelector(mapping.id, selector);
      this.mappingsChange.emit(this.mappingService.allMappings());
    }
    this.closeArraySelectorModal();
    this.updateConnections();
  }

  closeArraySelectorModal(): void {
    this.showArraySelectorModal.set(false);
    this.selectedArrayToObjectMapping.set(null);
  }

  // Default value methods
  onDefaultValueClick(event: FieldPositionEvent): void {
    this.selectedDefaultValueField.set(event.field);
    this.defaultValuePopoverPosition.set({
      x: event.rect.right,
      y: event.rect.top + event.rect.height / 2,
    });
    this.showDefaultValuePopover.set(true);
  }

  onDefaultValueSave(value: string | number | boolean | Date | null): void {
    const field = this.selectedDefaultValueField();
    if (field) {
      this.mappingService.setDefaultValue(field, value);
      this.mappingsChange.emit(this.mappingService.allMappings());
    }
    this.closeDefaultValuePopover();
  }

  onDefaultValueDelete(): void {
    const field = this.selectedDefaultValueField();
    if (field) {
      this.mappingService.removeDefaultValue(field.id);
      this.mappingsChange.emit(this.mappingService.allMappings());
    }
    this.closeDefaultValuePopover();
  }

  closeDefaultValuePopover(): void {
    this.showDefaultValuePopover.set(false);
    this.selectedDefaultValueField.set(null);
    this.defaultValuePopoverPosition.set(null);
  }

  getExistingDefaultValue(fieldId: string): DefaultValue | undefined {
    return this.mappingService.getDefaultValue(fieldId);
  }

  onPopoverSave(config: TransformationConfig): void {
    const mappingId = this.selectedMappingId();
    if (mappingId) {
      this.mappingService.updateTransformation(mappingId, config);
      this.mappingsChange.emit(this.mappingService.allMappings());
    }
    this.closePopover();
    this.updateConnections();
  }

  onPopoverDelete(): void {
    const mappingId = this.selectedMappingId();
    if (mappingId) {
      this.mappingService.removeMapping(mappingId);
      this.mappingsChange.emit(this.mappingService.allMappings());
    }
    this.closePopover();
    this.updateConnections();
  }

  closePopover(): void {
    this.selectedMappingId.set(null);
    this.popoverPosition.set(null);
    this.mappingService.selectMapping(null);
    this.updateConnections();
  }

  private updateConnections(): void {
    if (!this.svgContainer?.nativeElement) return;

    const containerRect = this.svgContainer.nativeElement.getBoundingClientRect();
    const mappings = this.mappingService.allMappings();
    const selectedId = this.selectedMappingId();

    const newConnections: VisualConnection[] = [];

    for (const mapping of mappings) {
      const targetRect = this.targetPositions.get(mapping.targetField.id);
      if (!targetRect) continue;

      const targetPoint = this.svgConnectorService.calculateConnectionPoint(
        targetRect,
        'target',
        containerRect
      );

      const sourcePoints: Point[] = [];
      for (const sourceField of mapping.sourceFields) {
        const sourceRect = this.sourcePositions.get(sourceField.id);
        if (sourceRect) {
          sourcePoints.push(
            this.svgConnectorService.calculateConnectionPoint(
              sourceRect,
              'source',
              containerRect
            )
          );
        }
      }

      if (sourcePoints.length === 0) continue;

      let paths: string[];
      let midPoint: Point;

      if (sourcePoints.length === 1) {
        paths = [this.svgConnectorService.createBezierPath(sourcePoints[0], targetPoint)];
        midPoint = this.svgConnectorService.getMidPoint(sourcePoints[0], targetPoint);
      } else {
        const result = this.svgConnectorService.createMultiSourcePath(sourcePoints, targetPoint);
        paths = result.paths;
        midPoint = result.mergePoint;
      }

      // Check if this array mapping has a filter
      let hasFilter = false;
      if (mapping.isArrayMapping) {
        const arrayMapping = this.mappingService.getArrayMapping(mapping.id);
        hasFilter = arrayMapping?.filter?.enabled === true && (arrayMapping?.filter?.root?.children?.length ?? 0) > 0;
      }

      newConnections.push({
        id: `conn-${mapping.id}`,
        mappingId: mapping.id,
        paths,
        midPoint,
        targetPoint,
        hasTransformation: mapping.transformation.type !== 'direct',
        isSelected: mapping.id === selectedId,
        isArrayMapping: mapping.isArrayMapping || false,
        isArrayToObjectMapping: mapping.isArrayToObjectMapping || false,
        hasFilter,
      });
    }

    this.connections.set(newConnections);
  }

  getTransformationIcon(mappingId: string): string {
    const mapping = this.mappings().find((m) => m.id === mappingId);
    if (!mapping) return 'settings';

    // Show filter icon for array mappings with filter, otherwise loop icon
    if (mapping.isArrayMapping) {
      const arrayMapping = this.mappingService.getArrayMapping(mappingId);
      if (arrayMapping?.filter?.enabled && (arrayMapping?.filter?.root?.children?.length ?? 0) > 0) {
        return 'filter_alt';
      }
      return 'loop';
    }

    // Show appropriate icon for array-to-object mappings
    if (mapping.isArrayToObjectMapping) {
      const atoMapping = this.mappingService.getArrayToObjectMapping(mappingId);
      if (atoMapping?.selector.mode === 'first') return 'first_page';
      if (atoMapping?.selector.mode === 'last') return 'last_page';
      if (atoMapping?.selector.mode === 'condition') return 'filter_alt';
      return 'swap_horiz';
    }

    const icons: Record<string, string> = {
      direct: 'arrow_forward',
      concat: 'merge',
      substring: 'content_cut',
      replace: 'find_replace',
      uppercase: 'text_fields',
      lowercase: 'text_fields',
      dateFormat: 'calendar_today',
      extractYear: 'event',
      extractMonth: 'event',
      extractDay: 'event',
      extractHour: 'schedule',
      extractMinute: 'schedule',
      extractSecond: 'schedule',
      numberFormat: 'pin',
      template: 'code',
      custom: 'functions',
    };

    return icons[mapping.transformation.type] || 'settings';
  }

  clearAllMappings(): void {
    this.mappingService.clearAllMappings();
    this.mappingsChange.emit([]);
    this.updateConnections();
  }

  exportMappings(): string {
    return this.mappingService.exportMappings();
  }

  importMappings(json: string): void {
    this.mappingService.importMappings(json);
    this.mappingsChange.emit(this.mappingService.allMappings());
    this.updateConnections();
  }

  trackByConnectionId(index: number, connection: VisualConnection): string {
    return connection.id;
  }
}
