import { Injectable } from '@angular/core';
import {
  TransformationConfig,
  TransformationType,
  FieldReference,
  FilterGroup,
  FilterCondition,
  FilterItem,
  FilterOperator,
} from '../models/schema.model';

@Injectable({
  providedIn: 'root',
})
export class TransformationService {
  applyTransformation(
    sourceValues: Record<string, unknown>,
    sourceFields: FieldReference[],
    config: TransformationConfig
  ): string {
    const values = sourceFields.map((f) => this.getValueByPath(sourceValues, f.path));

    switch (config.type) {
      case 'direct':
        return String(values[0] ?? '');

      case 'concat':
        if (config.template) {
          return this.applyTemplate(config.template, sourceFields, sourceValues);
        }
        return values.join(config.separator ?? ' ');

      case 'substring':
        const str = String(values[0] ?? '');
        return str.substring(
          config.startIndex ?? 0,
          config.endIndex ?? str.length
        );

      case 'replace':
        return String(values[0] ?? '').replace(
          new RegExp(config.searchValue ?? '', 'g'),
          config.replaceValue ?? ''
        );

      case 'uppercase':
        return String(values[0] ?? '').toUpperCase();

      case 'lowercase':
        return String(values[0] ?? '').toLowerCase();

      case 'trim':
        return String(values[0] ?? '').trim();

      case 'mask':
        return this.applyMask(String(values[0] ?? ''), config.pattern ?? '');

      case 'dateFormat':
        return this.formatDate(
          values[0],
          config.inputFormat,
          config.outputFormat
        );

      case 'extractYear':
        return this.extractDatePart(values[0], 'year');

      case 'extractMonth':
        return this.extractDatePart(values[0], 'month');

      case 'extractDay':
        return this.extractDatePart(values[0], 'day');

      case 'extractHour':
        return this.extractDatePart(values[0], 'hour');

      case 'extractMinute':
        return this.extractDatePart(values[0], 'minute');

      case 'extractSecond':
        return this.extractDatePart(values[0], 'second');

      case 'numberFormat':
        return this.formatNumber(
          values[0],
          config.decimalPlaces,
          config.prefix,
          config.suffix
        );

      case 'template':
        return this.applyTemplate(
          config.template ?? '',
          sourceFields,
          sourceValues
        );

      default:
        return String(values[0] ?? '');
    }
  }

  /**
   * Apply a transformation to a single value (for chained transformations)
   */
  applyTransformationToValue(
    value: unknown,
    config: TransformationConfig
  ): string {
    const str = String(value ?? '');

    switch (config.type) {
      case 'direct':
        return str;

      case 'concat':
        // For single value, just return it (concat needs multiple values)
        return str;

      case 'substring':
        return str.substring(
          config.startIndex ?? 0,
          config.endIndex ?? str.length
        );

      case 'replace':
        return str.replace(
          new RegExp(config.searchValue ?? '', 'g'),
          config.replaceValue ?? ''
        );

      case 'uppercase':
        return str.toUpperCase();

      case 'lowercase':
        return str.toLowerCase();

      case 'trim':
        return str.trim();

      case 'mask':
        return this.applyMask(str, config.pattern ?? '');

      case 'dateFormat':
        return this.formatDate(value, config.inputFormat, config.outputFormat);

      case 'extractYear':
        return this.extractDatePart(value, 'year');

      case 'extractMonth':
        return this.extractDatePart(value, 'month');

      case 'extractDay':
        return this.extractDatePart(value, 'day');

      case 'extractHour':
        return this.extractDatePart(value, 'hour');

      case 'extractMinute':
        return this.extractDatePart(value, 'minute');

      case 'extractSecond':
        return this.extractDatePart(value, 'second');

      case 'numberFormat':
        return this.formatNumber(
          value,
          config.decimalPlaces,
          config.prefix,
          config.suffix
        );

      case 'template':
        // For single value, replace {0} with the value
        return (config.template ?? '').replace(/\{0\}/g, str);

      default:
        return str;
    }
  }

  /**
   * Apply multiple transformations in sequence, respecting conditions
   */
  applyTransformations(
    sourceValues: Record<string, unknown>,
    sourceFields: FieldReference[],
    transformations: TransformationConfig[]
  ): string {
    if (transformations.length === 0) {
      return '';
    }

    // Get initial value for first transformation
    const initialValues = sourceFields.map((f) => this.getValueByPath(sourceValues, f.path));
    const initialValue = initialValues.length === 1 ? initialValues[0] : initialValues.join(' ');

    // Apply first transformation using source fields (check condition first)
    let result: string;
    if (this.isConditionMet(initialValue, transformations[0])) {
      result = this.applyTransformation(sourceValues, sourceFields, transformations[0]);
    } else {
      result = String(initialValue ?? '');
    }

    // Apply subsequent transformations to the result
    for (let i = 1; i < transformations.length; i++) {
      if (this.isConditionMet(result, transformations[i])) {
        result = this.applyTransformationToValue(result, transformations[i]);
      }
      // If condition not met, result passes through unchanged
    }

    return result;
  }

  private getValueByPath(obj: Record<string, unknown>, path: string): unknown {
    return path.split('.').reduce((acc: unknown, part) => {
      if (acc && typeof acc === 'object') {
        return (acc as Record<string, unknown>)[part];
      }
      return undefined;
    }, obj);
  }

  private applyTemplate(
    template: string,
    sourceFields: FieldReference[],
    sourceValues: Record<string, unknown>
  ): string {
    let result = template;
    // Replace positional placeholders {0}, {1}, etc.
    sourceFields.forEach((field, index) => {
      const value = this.getValueByPath(sourceValues, field.path);
      result = result.replace(
        new RegExp(`\\{${index}\\}`, 'g'),
        String(value ?? '')
      );
    });
    return result;
  }

  private formatDate(
    value: unknown,
    inputFormat?: string,
    outputFormat?: string
  ): string {
    if (!value) return '';
    try {
      const date = new Date(value as string);
      if (isNaN(date.getTime())) return String(value);

      // Simple format implementation
      const format = outputFormat ?? 'YYYY-MM-DD';
      return format
        .replace('YYYY', date.getFullYear().toString())
        .replace('MM', (date.getMonth() + 1).toString().padStart(2, '0'))
        .replace('DD', date.getDate().toString().padStart(2, '0'))
        .replace('HH', date.getHours().toString().padStart(2, '0'))
        .replace('mm', date.getMinutes().toString().padStart(2, '0'))
        .replace('ss', date.getSeconds().toString().padStart(2, '0'));
    } catch {
      return String(value);
    }
  }

  private extractDatePart(
    value: unknown,
    part: 'year' | 'month' | 'day' | 'hour' | 'minute' | 'second'
  ): string {
    if (!value) return '';
    try {
      const date = new Date(value as string);
      if (isNaN(date.getTime())) return String(value);

      switch (part) {
        case 'year':
          return date.getFullYear().toString();
        case 'month':
          return (date.getMonth() + 1).toString().padStart(2, '0');
        case 'day':
          return date.getDate().toString().padStart(2, '0');
        case 'hour':
          return date.getHours().toString().padStart(2, '0');
        case 'minute':
          return date.getMinutes().toString().padStart(2, '0');
        case 'second':
          return date.getSeconds().toString().padStart(2, '0');
        default:
          return String(value);
      }
    } catch {
      return String(value);
    }
  }

  private formatNumber(
    value: unknown,
    decimalPlaces?: number,
    prefix?: string,
    suffix?: string
  ): string {
    if (value === null || value === undefined) return '';
    const num = Number(value);
    if (isNaN(num)) return String(value);

    let formatted = decimalPlaces !== undefined
      ? num.toFixed(decimalPlaces)
      : num.toString();

    return `${prefix ?? ''}${formatted}${suffix ?? ''}`;
  }

  private applyMask(input: string, pattern: string): string {
    if (!pattern) return input;

    let result = '';
    let inputIndex = 0;

    for (let i = 0; i < pattern.length; i++) {
      const patternChar = pattern.charAt(i);
      if (patternChar === '#') {
        if (inputIndex < input.length) {
          result += input.charAt(inputIndex);
          inputIndex++;
        }
      } else {
        result += patternChar;
      }
    }

    return result;
  }

  getTransformationLabel(type: TransformationType): string {
    const labels: Record<TransformationType, string> = {
      direct: 'Direct Mapping',
      concat: 'Concatenate',
      substring: 'Substring',
      replace: 'Find & Replace',
      uppercase: 'Uppercase',
      lowercase: 'Lowercase',
      trim: 'Trim',
      mask: 'Mask',
      dateFormat: 'Date Format',
      extractYear: 'Extract Year',
      extractMonth: 'Extract Month',
      extractDay: 'Extract Day',
      extractHour: 'Extract Hour',
      extractMinute: 'Extract Minute',
      extractSecond: 'Extract Second',
      numberFormat: 'Number Format',
      template: 'Template',
    };
    return labels[type];
  }

  getAvailableTransformations(): { type: TransformationType; label: string; category?: string }[] {
    return [
      { type: 'direct', label: 'Direct Mapping' },
      { type: 'concat', label: 'Concatenate', category: 'String' },
      { type: 'substring', label: 'Substring', category: 'String' },
      { type: 'replace', label: 'Find & Replace', category: 'String' },
      { type: 'uppercase', label: 'Uppercase', category: 'String' },
      { type: 'lowercase', label: 'Lowercase', category: 'String' },
      { type: 'trim', label: 'Trim', category: 'String' },
      { type: 'mask', label: 'Mask', category: 'String' },
      { type: 'template', label: 'Template', category: 'String' },
      { type: 'dateFormat', label: 'Format Date', category: 'Date' },
      { type: 'extractYear', label: 'Extract Year', category: 'Date' },
      { type: 'extractMonth', label: 'Extract Month', category: 'Date' },
      { type: 'extractDay', label: 'Extract Day', category: 'Date' },
      { type: 'extractHour', label: 'Extract Hour', category: 'Date' },
      { type: 'extractMinute', label: 'Extract Minute', category: 'Date' },
      { type: 'extractSecond', label: 'Extract Second', category: 'Date' },
      { type: 'numberFormat', label: 'Number Format', category: 'Number' },
    ];
  }

  // Condition evaluation methods
  evaluateCondition(value: unknown, condition: FilterGroup): boolean {
    return this.evaluateGroup(value, condition);
  }

  private evaluateGroup(value: unknown, group: FilterGroup): boolean {
    if (group.children.length === 0) {
      return true; // Empty group is always true
    }

    if (group.logic === 'and') {
      return group.children.every(child => this.evaluateItem(value, child));
    } else {
      return group.children.some(child => this.evaluateItem(value, child));
    }
  }

  private evaluateItem(value: unknown, item: FilterItem): boolean {
    if (item.type === 'group') {
      return this.evaluateGroup(value, item);
    } else {
      return this.evaluateConditionItem(value, item);
    }
  }

  private evaluateConditionItem(value: unknown, condition: FilterCondition): boolean {
    const strValue = String(value ?? '');
    const numValue = Number(value);
    const condValue = condition.value;

    switch (condition.operator) {
      case 'equals':
        return strValue === String(condValue);
      case 'notEquals':
        return strValue !== String(condValue);
      case 'contains':
        return strValue.includes(String(condValue));
      case 'notContains':
        return !strValue.includes(String(condValue));
      case 'startsWith':
        return strValue.startsWith(String(condValue));
      case 'endsWith':
        return strValue.endsWith(String(condValue));
      case 'isEmpty':
        return strValue === '' || value === null || value === undefined;
      case 'isNotEmpty':
        return strValue !== '' && value !== null && value !== undefined;
      case 'greaterThan':
        return !isNaN(numValue) && numValue > Number(condValue);
      case 'lessThan':
        return !isNaN(numValue) && numValue < Number(condValue);
      case 'greaterThanOrEqual':
        return !isNaN(numValue) && numValue >= Number(condValue);
      case 'lessThanOrEqual':
        return !isNaN(numValue) && numValue <= Number(condValue);
      case 'isTrue':
        return value === true || strValue.toLowerCase() === 'true';
      case 'isFalse':
        return value === false || strValue.toLowerCase() === 'false';
      default:
        return true;
    }
  }

  /**
   * Check if a transformation's condition is met
   */
  isConditionMet(value: unknown, config: TransformationConfig): boolean {
    if (!config.condition?.enabled || !config.condition.root) {
      return true; // No condition means always apply
    }
    return this.evaluateCondition(value, config.condition.root);
  }
}
