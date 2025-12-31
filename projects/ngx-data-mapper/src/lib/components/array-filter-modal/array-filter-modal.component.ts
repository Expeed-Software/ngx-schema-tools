import { Component, Input, Output, EventEmitter, computed, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatRadioModule } from '@angular/material/radio';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import {
  ArrayMapping,
  ArrayFilterConfig,
  FilterCondition,
  FilterGroup,
  FilterItem,
  FilterOperator,
  SchemaField,
} from '../../models/schema.model';

interface OperatorOption {
  value: FilterOperator;
  label: string;
  needsValue: boolean;
}

@Component({
  selector: 'array-filter-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatInputModule,
    MatFormFieldModule,
    MatRadioModule,
    MatSlideToggleModule,
    MatTooltipModule,
    MatDividerModule,
  ],
  templateUrl: './array-filter-modal.component.html',
  styleUrl: './array-filter-modal.component.scss',
})
export class ArrayFilterModalComponent implements OnInit {
  @Input({ required: true }) arrayMapping!: ArrayMapping;
  @Output() save = new EventEmitter<ArrayFilterConfig | undefined>();
  @Output() close = new EventEmitter<void>();

  filterEnabled = signal(false);
  rootGroup = signal<FilterGroup>(this.createEmptyGroup());

  // Available fields from the source array's children
  availableFields = computed(() => {
    const fields: { path: string; name: string; type: string }[] = [];
    this.collectFields(this.arrayMapping.sourceArray.children || [], '', fields);
    return fields;
  });

  // Operators by type
  stringOperators: OperatorOption[] = [
    { value: 'equals', label: 'equals', needsValue: true },
    { value: 'notEquals', label: 'not equals', needsValue: true },
    { value: 'contains', label: 'contains', needsValue: true },
    { value: 'notContains', label: 'does not contain', needsValue: true },
    { value: 'startsWith', label: 'starts with', needsValue: true },
    { value: 'endsWith', label: 'ends with', needsValue: true },
    { value: 'isEmpty', label: 'is empty', needsValue: false },
    { value: 'isNotEmpty', label: 'is not empty', needsValue: false },
  ];

  numberOperators: OperatorOption[] = [
    { value: 'equals', label: 'equals', needsValue: true },
    { value: 'notEquals', label: 'not equals', needsValue: true },
    { value: 'greaterThan', label: 'greater than', needsValue: true },
    { value: 'lessThan', label: 'less than', needsValue: true },
    { value: 'greaterThanOrEqual', label: 'greater or equal', needsValue: true },
    { value: 'lessThanOrEqual', label: 'less or equal', needsValue: true },
  ];

  booleanOperators: OperatorOption[] = [
    { value: 'isTrue', label: 'is true', needsValue: false },
    { value: 'isFalse', label: 'is false', needsValue: false },
  ];

  ngOnInit(): void {
    // Initialize from existing filter config
    if (this.arrayMapping.filter?.enabled && this.arrayMapping.filter.root) {
      this.filterEnabled.set(true);
      this.rootGroup.set(this.cloneGroup(this.arrayMapping.filter.root));
    }
  }

  private createEmptyGroup(): FilterGroup {
    return {
      id: this.generateId(),
      type: 'group',
      logic: 'and',
      children: [],
    };
  }

  private generateId(): string {
    return `filter-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private cloneGroup(group: FilterGroup): FilterGroup {
    return {
      ...group,
      children: group.children.map((child) =>
        child.type === 'group' ? this.cloneGroup(child) : { ...child }
      ),
    };
  }

  private collectFields(
    fields: SchemaField[],
    prefix: string,
    result: { path: string; name: string; type: string }[]
  ): void {
    for (const field of fields) {
      const path = prefix ? `${prefix}.${field.name}` : field.name;
      if (field.type !== 'object' && field.type !== 'array') {
        result.push({ path, name: field.name, type: field.type });
      }
      if (field.children) {
        this.collectFields(field.children, path, result);
      }
    }
  }

  getOperatorsForField(fieldPath: string): OperatorOption[] {
    const field = this.availableFields().find((f) => f.path === fieldPath);
    if (!field) return this.stringOperators;

    switch (field.type) {
      case 'number':
        return this.numberOperators;
      case 'boolean':
        return this.booleanOperators;
      default:
        return this.stringOperators;
    }
  }

  getFieldType(fieldPath: string): string {
    const field = this.availableFields().find((f) => f.path === fieldPath);
    return field?.type || 'string';
  }

  operatorNeedsValue(operator: FilterOperator): boolean {
    const allOperators = [...this.stringOperators, ...this.numberOperators, ...this.booleanOperators];
    const op = allOperators.find((o) => o.value === operator);
    return op?.needsValue ?? true;
  }

  isCondition(item: FilterItem): item is FilterCondition {
    return item.type === 'condition';
  }

  isGroup(item: FilterItem): item is FilterGroup {
    return item.type === 'group';
  }

  addCondition(group: FilterGroup): void {
    const fields = this.availableFields();
    const firstField = fields[0];
    const newCondition: FilterCondition = {
      id: this.generateId(),
      type: 'condition',
      field: firstField?.path || '',
      fieldName: firstField?.name || '',
      operator: 'equals',
      value: '',
      valueType: (firstField?.type as 'string' | 'number' | 'boolean') || 'string',
    };
    group.children = [...group.children, newCondition];
    this.triggerUpdate();
  }

  addGroup(parentGroup: FilterGroup): void {
    const newGroup: FilterGroup = {
      id: this.generateId(),
      type: 'group',
      logic: parentGroup.logic === 'and' ? 'or' : 'and', // Default to opposite logic
      children: [],
    };
    parentGroup.children = [...parentGroup.children, newGroup];
    this.triggerUpdate();
  }

  removeItem(parentGroup: FilterGroup, itemId: string): void {
    parentGroup.children = parentGroup.children.filter((c) => c.id !== itemId);
    this.triggerUpdate();
  }

  onFieldChange(condition: FilterCondition, fieldPath: string): void {
    const field = this.availableFields().find((f) => f.path === fieldPath);
    if (field) {
      condition.field = fieldPath;
      condition.fieldName = field.name;
      condition.valueType = field.type as 'string' | 'number' | 'boolean';
      // Reset operator to first valid option for new type
      const operators = this.getOperatorsForField(fieldPath);
      condition.operator = operators[0].value;
      condition.value = '';
    }
    this.triggerUpdate();
  }

  onOperatorChange(condition: FilterCondition, operator: FilterOperator): void {
    condition.operator = operator;
    if (!this.operatorNeedsValue(operator)) {
      condition.value = '';
    }
    this.triggerUpdate();
  }

  onValueChange(condition: FilterCondition, value: string | boolean): void {
    if (condition.valueType === 'number') {
      condition.value = parseFloat(value as string) || 0;
    } else {
      condition.value = value;
    }
    this.triggerUpdate();
  }

  onLogicChange(group: FilterGroup, logic: 'and' | 'or'): void {
    group.logic = logic;
    this.triggerUpdate();
  }

  private triggerUpdate(): void {
    // Trigger signal update by creating a new reference
    this.rootGroup.set(this.cloneGroup(this.rootGroup()));
  }

  hasConditions(group: FilterGroup): boolean {
    return group.children.length > 0;
  }

  countConditions(group: FilterGroup): number {
    let count = 0;
    for (const child of group.children) {
      if (child.type === 'condition') {
        count++;
      } else {
        count += this.countConditions(child);
      }
    }
    return count;
  }

  onSave(): void {
    if (!this.filterEnabled()) {
      this.save.emit(undefined);
    } else {
      this.save.emit({
        enabled: true,
        root: this.rootGroup(),
      });
    }
  }

  onClose(): void {
    this.close.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.onClose();
    }
  }
}
