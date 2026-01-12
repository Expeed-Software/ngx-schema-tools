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
import { MatCheckboxModule } from '@angular/material/checkbox';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import {
  FieldMapping,
  FilterGroup,
  TransformationConfig,
  TransformationType,
} from '../models/schema.model';
import { ConditionBuilderComponent } from '../condition-builder/condition-builder.component';
import { TransformationService } from '../services/transformation.service';

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
    MatCheckboxModule,
    DragDropModule,
    ConditionBuilderComponent,
  ],
  templateUrl: './transformation-popover.component.html',
  styleUrl: './transformation-popover.component.scss',
})
export class TransformationPopoverComponent implements OnInit, OnChanges {
  @Input() mapping!: FieldMapping;
  @Input() position: { x: number; y: number } = { x: 0, y: 0 };
  @Input() sampleData: Record<string, unknown> = {};

  @Output() save = new EventEmitter<TransformationConfig[]>();
  @Output() delete = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  private transformationService = inject(TransformationService);

  // Array of transformation steps
  steps: TransformationConfig[] = [];

  // Preview results for each step
  stepPreviews: string[] = [];
  // Input values for each step (to show input → output)
  stepInputs: string[] = [];
  finalPreview: string = '';

  // Track which step is expanded (-1 means none, used in single-step mode)
  expandedStepIndex: number = -1;

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
      // Copy transformations array, with fallback for empty/undefined
      if (this.mapping.transformations && this.mapping.transformations.length > 0) {
        this.steps = this.mapping.transformations.map(t => ({ ...t }));
      } else {
        // Fallback to a single direct transformation
        this.steps = [{ type: 'direct' }];
      }
      this.updatePreview();
    }
  }

  // Check if we're in multi-step mode (more than one step)
  get isMultiStep(): boolean {
    return this.steps.length > 1;
  }

  onStepTypeChange(index: number): void {
    const step = this.steps[index];

    // Set defaults based on type
    switch (step.type) {
      case 'concat':
        step.separator = step.separator ?? ' ';
        step.template = step.template ?? this.getDefaultTemplate();
        break;
      case 'substring':
        step.startIndex = step.startIndex ?? 0;
        step.endIndex = step.endIndex ?? 10;
        break;
      case 'replace':
        step.searchValue = step.searchValue ?? '';
        step.replaceValue = step.replaceValue ?? '';
        break;
      case 'dateFormat':
        step.outputFormat = step.outputFormat ?? 'YYYY-MM-DD';
        break;
      case 'numberFormat':
        step.decimalPlaces = step.decimalPlaces ?? 2;
        break;
      case 'mask':
        step.pattern = step.pattern ?? '(###) ###-####';
        break;
    }

    this.updatePreview();
  }

  private getDefaultTemplate(): string {
    return this.mapping.sourceFields.map((_, i) => `{${i}}`).join(' ');
  }

  addStep(): void {
    this.steps.push({ type: 'direct' });
    // Expand the newly added step
    this.expandedStepIndex = this.steps.length - 1;
    this.updatePreview();
  }

  removeStep(index: number): void {
    if (this.steps.length > 1) {
      this.steps.splice(index, 1);
      // Collapse after deletion
      this.expandedStepIndex = -1;
      this.updatePreview();
    }
  }

  onStepDrop(event: CdkDragDrop<TransformationConfig[]>): void {
    if (event.previousIndex !== event.currentIndex) {
      moveItemInArray(this.steps, event.previousIndex, event.currentIndex);
      // Move expanded index with the step
      if (this.expandedStepIndex === event.previousIndex) {
        this.expandedStepIndex = event.currentIndex;
      } else if (
        this.expandedStepIndex > event.previousIndex &&
        this.expandedStepIndex <= event.currentIndex
      ) {
        this.expandedStepIndex--;
      } else if (
        this.expandedStepIndex < event.previousIndex &&
        this.expandedStepIndex >= event.currentIndex
      ) {
        this.expandedStepIndex++;
      }
      this.updatePreview();
    }
  }

  toggleStep(index: number): void {
    if (this.expandedStepIndex === index) {
      this.expandedStepIndex = -1; // Collapse
    } else {
      this.expandedStepIndex = index; // Expand
    }
  }

  isStepExpanded(index: number): boolean {
    return this.expandedStepIndex === index;
  }

  updatePreview(): void {
    if (!this.mapping || !this.sampleData) {
      this.stepPreviews = [];
      this.stepInputs = [];
      this.finalPreview = '';
      return;
    }

    this.stepPreviews = [];
    this.stepInputs = [];
    let currentValue: unknown = null;

    // Get initial input from source fields
    const initialValues = this.mapping.sourceFields
      .map(f => this.getValueByPath(this.sampleData, f.path))
      .map(v => String(v ?? ''));
    const initialInput = initialValues.join(', ');

    // For the first step, use the source fields from sample data
    for (let i = 0; i < this.steps.length; i++) {
      const step = this.steps[i];

      if (i === 0) {
        // First step: input is from source fields
        this.stepInputs.push(initialInput);
        // Check condition before applying transformation
        if (this.transformationService.isConditionMet(initialInput, step)) {
          currentValue = this.transformationService.applyTransformation(
            this.sampleData,
            this.mapping.sourceFields,
            step
          );
        } else {
          currentValue = initialInput; // Pass through if condition not met
        }
      } else {
        // Subsequent steps: input is previous output
        this.stepInputs.push(this.stepPreviews[i - 1]);
        // Check condition before applying transformation
        if (this.transformationService.isConditionMet(currentValue, step)) {
          currentValue = this.transformationService.applyTransformationToValue(
            currentValue,
            step
          );
        }
        // If condition not met, currentValue passes through unchanged
      }

      this.stepPreviews.push(String(currentValue ?? ''));
    }

    this.finalPreview = this.stepPreviews[this.stepPreviews.length - 1] || '';
  }

  private getValueByPath(obj: Record<string, unknown>, path: string): unknown {
    return path.split('.').reduce((acc: unknown, part) => {
      if (acc && typeof acc === 'object') {
        return (acc as Record<string, unknown>)[part];
      }
      return undefined;
    }, obj);
  }

  onConfigChange(): void {
    this.updatePreview();
  }

  onSave(): void {
    // Filter out 'direct' transformations if they're not the only one
    const cleanedSteps = this.steps.length === 1
      ? this.steps
      : this.steps.filter(s => s.type !== 'direct');

    // If all filtered out, keep at least one direct
    const finalSteps = cleanedSteps.length > 0 ? cleanedSteps : [{ type: 'direct' as TransformationType }];

    this.save.emit(finalSteps);
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

  getStepTypeLabel(type: TransformationType): string {
    const t = this.availableTransformations.find(t => t.type === type);
    return t?.label || type;
  }

  // Condition methods
  hasCondition(step: TransformationConfig): boolean {
    return step.condition?.enabled === true;
  }

  toggleCondition(step: TransformationConfig, enabled: boolean): void {
    if (enabled) {
      if (!step.condition) {
        step.condition = {
          enabled: true,
          root: this.createEmptyConditionGroup(),
        };
      } else {
        step.condition.enabled = true;
      }
    } else {
      if (step.condition) {
        step.condition.enabled = false;
      }
    }
  }

  onConditionChange(step: TransformationConfig, group: FilterGroup): void {
    if (step.condition) {
      step.condition.root = group;
    }
  }

  private createEmptyConditionGroup(): FilterGroup {
    return {
      id: `cond-${Date.now()}`,
      type: 'group',
      logic: 'and',
      children: [],
    };
  }

  getConditionSummary(step: TransformationConfig): string {
    if (!step.condition?.enabled || !step.condition.root) return '';
    return this.summarizeConditionGroup(step.condition.root);
  }

  private summarizeConditionGroup(group: FilterGroup): string {
    if (group.children.length === 0) return '';

    const parts = group.children.map(child => {
      if (child.type === 'condition') {
        const opLabel = this.getOperatorLabel(child.operator);
        if (['isEmpty', 'isNotEmpty', 'isTrue', 'isFalse'].includes(child.operator)) {
          return opLabel;
        }
        return `${opLabel} "${child.value}"`;
      } else {
        return `(${this.summarizeConditionGroup(child)})`;
      }
    });

    return parts.join(` ${group.logic.toUpperCase()} `);
  }

  private getOperatorLabel(operator: string): string {
    const labels: Record<string, string> = {
      equals: '=',
      notEquals: '!=',
      contains: 'contains',
      notContains: 'not contain',
      startsWith: 'starts with',
      endsWith: 'ends with',
      isEmpty: 'is empty',
      isNotEmpty: 'is not empty',
      greaterThan: '>',
      lessThan: '<',
      greaterThanOrEqual: '>=',
      lessThanOrEqual: '<=',
      isTrue: 'is true',
      isFalse: 'is false',
    };
    return labels[operator] || operator;
  }
}
