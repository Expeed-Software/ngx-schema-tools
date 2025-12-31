import { Injectable } from '@angular/core';
import {
  TransformationConfig,
  TransformationType,
  SchemaField,
} from '../models/schema.model';

@Injectable({
  providedIn: 'root',
})
export class TransformationService {
  applyTransformation(
    sourceValues: Record<string, unknown>,
    sourceFields: SchemaField[],
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

      case 'custom':
        return this.applyCustomExpression(
          config.expression ?? '',
          sourceFields,
          sourceValues
        );

      default:
        return String(values[0] ?? '');
    }
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
    sourceFields: SchemaField[],
    sourceValues: Record<string, unknown>
  ): string {
    let result = template;
    sourceFields.forEach((field) => {
      const value = this.getValueByPath(sourceValues, field.path);
      result = result.replace(
        new RegExp(`\\{${field.name}\\}`, 'g'),
        String(value ?? '')
      );
      result = result.replace(
        new RegExp(`\\{${field.path}\\}`, 'g'),
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

  private applyCustomExpression(
    expression: string,
    sourceFields: SchemaField[],
    sourceValues: Record<string, unknown>
  ): string {
    try {
      // Create a safe context with field values
      const context: Record<string, unknown> = {};
      sourceFields.forEach((field) => {
        context[field.name] = this.getValueByPath(sourceValues, field.path);
      });

      // Very basic expression evaluation - in production use a proper parser
      const fn = new Function(...Object.keys(context), `return ${expression}`);
      return String(fn(...Object.values(context)));
    } catch (e) {
      console.error('Custom expression error:', e);
      return '[Error]';
    }
  }

  getTransformationLabel(type: TransformationType): string {
    const labels: Record<TransformationType, string> = {
      direct: 'Direct Mapping',
      concat: 'Concatenate',
      substring: 'Substring',
      replace: 'Find & Replace',
      uppercase: 'Uppercase',
      lowercase: 'Lowercase',
      dateFormat: 'Date Format',
      extractYear: 'Extract Year',
      extractMonth: 'Extract Month',
      extractDay: 'Extract Day',
      extractHour: 'Extract Hour',
      extractMinute: 'Extract Minute',
      extractSecond: 'Extract Second',
      numberFormat: 'Number Format',
      template: 'Template',
      custom: 'Custom Expression',
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
      { type: 'template', label: 'Template', category: 'String' },
      { type: 'dateFormat', label: 'Format Date', category: 'Date' },
      { type: 'extractYear', label: 'Extract Year', category: 'Date' },
      { type: 'extractMonth', label: 'Extract Month', category: 'Date' },
      { type: 'extractDay', label: 'Extract Day', category: 'Date' },
      { type: 'extractHour', label: 'Extract Hour', category: 'Date' },
      { type: 'extractMinute', label: 'Extract Minute', category: 'Date' },
      { type: 'extractSecond', label: 'Extract Second', category: 'Date' },
      { type: 'numberFormat', label: 'Number Format', category: 'Number' },
      { type: 'custom', label: 'Custom Expression', category: 'Advanced' },
    ];
  }
}
