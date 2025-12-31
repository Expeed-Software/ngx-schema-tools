import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  FieldMapping,
  TransformationConfig,
  TransformationType,
} from '../../models/schema.model';
import { TransformationService } from '../../services/transformation.service';

@Component({
  selector: 'transformation-popover',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    MatInputModule,
    MatFormFieldModule,
    MatTooltipModule,
  ],
  templateUrl: './transformation-popover.component.html',
  styleUrl: './transformation-popover.component.scss',
})
export class TransformationPopoverComponent implements OnInit, OnChanges {
  @Input() mapping!: FieldMapping;
  @Input() position: { x: number; y: number } = { x: 0, y: 0 };
  @Input() sampleData: Record<string, unknown> = {};

  @Output() save = new EventEmitter<TransformationConfig>();
  @Output() delete = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  private transformationService = inject(TransformationService);

  transformationType: TransformationType = 'direct';
  config: TransformationConfig = { type: 'direct' };
  preview: string = '';

  availableTransformations = this.transformationService.getAvailableTransformations();

  ngOnInit(): void {
    this.initFromMapping();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mapping'] || changes['sampleData']) {
      this.initFromMapping();
    }
  }

  private initFromMapping(): void {
    if (this.mapping) {
      this.config = { ...this.mapping.transformation };
      this.transformationType = this.config.type;
      this.updatePreview();
    }
  }

  onTypeChange(): void {
    this.config = {
      ...this.config,
      type: this.transformationType,
    };

    // Set defaults based on type
    switch (this.transformationType) {
      case 'concat':
        this.config.separator = this.config.separator ?? ' ';
        this.config.template = this.config.template ?? this.getDefaultTemplate();
        break;
      case 'substring':
        this.config.startIndex = this.config.startIndex ?? 0;
        this.config.endIndex = this.config.endIndex ?? 10;
        break;
      case 'replace':
        this.config.searchValue = this.config.searchValue ?? '';
        this.config.replaceValue = this.config.replaceValue ?? '';
        break;
      case 'dateFormat':
        this.config.outputFormat = this.config.outputFormat ?? 'YYYY-MM-DD';
        break;
      case 'numberFormat':
        this.config.decimalPlaces = this.config.decimalPlaces ?? 2;
        break;
    }

    this.updatePreview();
  }

  private getDefaultTemplate(): string {
    return this.mapping.sourceFields.map((f) => `{${f.name}}`).join(' ');
  }

  updatePreview(): void {
    if (!this.mapping || !this.sampleData) {
      this.preview = '';
      return;
    }

    this.preview = this.transformationService.applyTransformation(
      this.sampleData,
      this.mapping.sourceFields,
      this.config
    );
  }

  onConfigChange(): void {
    this.updatePreview();
  }

  onSave(): void {
    this.save.emit(this.config);
  }

  onDelete(): void {
    this.delete.emit();
  }

  onClose(): void {
    this.close.emit();
  }

  getSourceFieldNames(): string {
    return this.mapping.sourceFields.map((f) => f.name).join(', ');
  }

  getPopoverStyle(): Record<string, string> {
    return {
      left: `${this.position.x}px`,
      top: `${this.position.y}px`,
    };
  }
}
