import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
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
import {
  FilterCondition,
  FilterGroup,
  FilterItem,
  FilterOperator,
} from '../models/schema.model';

interface OperatorOption {
  value: FilterOperator;
  label: string;
  needsValue: boolean;
}

export interface ConditionField {
  path: string;
  name: string;
  type: 'string' | 'number' | 'boolean';
}

@Component({
  selector: 'condition-builder',
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
  ],
  templateUrl: './condition-builder.component.html',
  styleUrl: './condition-builder.component.scss',
})
export class ConditionBuilderComponent implements OnInit {
  // Available fields for conditions (optional - if not provided, uses 'value' as the only field)
  @Input() fields: ConditionField[] = [];

  // The condition group to edit
  @Input() condition: FilterGroup | null = null;

  // Whether to show a compact/inline version
  @Input() compact = false;

  // Emits when condition changes
  @Output() conditionChange = new EventEmitter<FilterGroup>();

  rootGroup!: FilterGroup;

  // Default field for transformation conditions (the input value)
  private defaultField: ConditionField = { path: 'value', name: 'Input value', type: 'string' };

  // Operators by type
  stringOperators: OperatorOption[] = [
    { value: 'equals', label: 'equals', needsValue: true },
    { value: 'notEquals', label: 'not equals', needsValue: true },
    { value: 'contains', label: 'contains', needsValue: true },
    { value: 'notContains', label: 'not contain', needsValue: true },
    { value: 'startsWith', label: 'starts with', needsValue: true },
    { value: 'endsWith', label: 'ends with', needsValue: true },
    { value: 'isEmpty', label: 'is empty', needsValue: false },
    { value: 'isNotEmpty', label: 'is not empty', needsValue: false },
  ];

  numberOperators: OperatorOption[] = [
    { value: 'equals', label: 'equals', needsValue: true },
    { value: 'notEquals', label: 'not equals', needsValue: true },
    { value: 'greaterThan', label: '>', needsValue: true },
    { value: 'lessThan', label: '<', needsValue: true },
    { value: 'greaterThanOrEqual', label: '>=', needsValue: true },
    { value: 'lessThanOrEqual', label: '<=', needsValue: true },
  ];

  booleanOperators: OperatorOption[] = [
    { value: 'isTrue', label: 'is true', needsValue: false },
    { value: 'isFalse', label: 'is false', needsValue: false },
  ];

  ngOnInit(): void {
    if (this.condition) {
      this.rootGroup = this.cloneGroup(this.condition);
    } else {
      this.rootGroup = this.createEmptyGroup();
    }
  }

  get availableFields(): ConditionField[] {
    return this.fields.length > 0 ? this.fields : [this.defaultField];
  }

  get showFieldSelector(): boolean {
    return this.fields.length > 1;
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
    return `cond-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private cloneGroup(group: FilterGroup): FilterGroup {
    return {
      ...group,
      children: group.children.map((child) =>
        child.type === 'group' ? this.cloneGroup(child) : { ...child }
      ),
    };
  }

  getOperatorsForField(fieldPath: string): OperatorOption[] {
    const field = this.availableFields.find((f) => f.path === fieldPath);
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
    const firstField = this.availableFields[0];
    const newCondition: FilterCondition = {
      id: this.generateId(),
      type: 'condition',
      field: firstField.path,
      fieldName: firstField.name,
      operator: 'isNotEmpty',
      value: '',
      valueType: firstField.type,
    };
    group.children = [...group.children, newCondition];
    this.emitChange();
  }

  addGroup(parentGroup: FilterGroup): void {
    const newGroup: FilterGroup = {
      id: this.generateId(),
      type: 'group',
      logic: parentGroup.logic === 'and' ? 'or' : 'and',
      children: [],
    };
    parentGroup.children = [...parentGroup.children, newGroup];
    this.emitChange();
  }

  removeItem(parentGroup: FilterGroup, itemId: string): void {
    parentGroup.children = parentGroup.children.filter((c) => c.id !== itemId);
    this.emitChange();
  }

  onFieldChange(condition: FilterCondition, fieldPath: string): void {
    const field = this.availableFields.find((f) => f.path === fieldPath);
    if (field) {
      condition.field = fieldPath;
      condition.fieldName = field.name;
      condition.valueType = field.type;
      const operators = this.getOperatorsForField(fieldPath);
      condition.operator = operators[0].value;
      condition.value = '';
    }
    this.emitChange();
  }

  onOperatorChange(condition: FilterCondition, operator: FilterOperator): void {
    condition.operator = operator;
    if (!this.operatorNeedsValue(operator)) {
      condition.value = '';
    }
    this.emitChange();
  }

  onValueChange(condition: FilterCondition, value: string | boolean): void {
    if (condition.valueType === 'number') {
      condition.value = parseFloat(value as string) || 0;
    } else {
      condition.value = value;
    }
    this.emitChange();
  }

  onLogicChange(group: FilterGroup, logic: 'and' | 'or'): void {
    group.logic = logic;
    this.emitChange();
  }

  private emitChange(): void {
    this.rootGroup = this.cloneGroup(this.rootGroup);
    this.conditionChange.emit(this.rootGroup);
  }

  getConditionSummary(): string {
    return this.summarizeGroup(this.rootGroup);
  }

  private summarizeGroup(group: FilterGroup): string {
    if (group.children.length === 0) return '';

    const parts = group.children.map(child => {
      if (child.type === 'condition') {
        return this.summarizeCondition(child);
      } else {
        return `(${this.summarizeGroup(child)})`;
      }
    });

    return parts.join(` ${group.logic.toUpperCase()} `);
  }

  private summarizeCondition(cond: FilterCondition): string {
    const opLabel = this.getOperatorLabel(cond.operator);
    if (this.operatorNeedsValue(cond.operator)) {
      return `${opLabel} "${cond.value}"`;
    }
    return opLabel;
  }

  private getOperatorLabel(operator: FilterOperator): string {
    const allOperators = [...this.stringOperators, ...this.numberOperators, ...this.booleanOperators];
    const op = allOperators.find((o) => o.value === operator);
    return op?.label || operator;
  }
}
