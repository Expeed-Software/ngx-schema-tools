import { Injectable } from '@angular/core';
import { SchemaTreeNode, SchemaDefinition, FieldType } from '../models/schema.model';
import { JsonSchema, JSONSchema7Definition } from '../../../models/json-schema.model';

type Definitions = Record<string, JSONSchema7Definition>;

@Injectable({
  providedIn: 'root',
})
export class SchemaParserService {
  private idCounter = 0;

  parseSchema(
    schema: JsonSchema,
    schemaName: string = 'Schema'
  ): SchemaDefinition {
    this.idCounter = 0;

    // Extract definitions from the schema document itself
    const localDefs = schema.$defs || schema.definitions || {};

    let resolvedSchema: JsonSchema;

    if (schema.$ref) {
      // Resolve the reference
      resolvedSchema = this.resolveRef(schema.$ref, localDefs);
    } else if (schema.properties) {
      // Direct schema with properties
      resolvedSchema = schema;
    } else {
      throw new Error('Schema must have either $ref or properties');
    }

    // Build fields from the resolved schema
    const fields = this.buildFields(resolvedSchema, localDefs, '');

    return {
      name: schema.title || schemaName,
      fields,
    };
  }

  private resolveRef(
    ref: string,
    definitions: Definitions
  ): JsonSchema {
    // Handle different ref formats:
    // #/$defs/model, #/definitions/model
    let modelName: string;

    if (ref.startsWith('#/$defs/')) {
      modelName = ref.substring(8);
    } else if (ref.startsWith('#/definitions/')) {
      modelName = ref.substring(14);
    } else {
      throw new Error(`Invalid $ref format: ${ref}. Use #/$defs/name or #/definitions/name`);
    }

    const resolved = definitions[modelName];
    if (!resolved || typeof resolved === 'boolean') {
      throw new Error(`Cannot resolve reference: ${ref}. Definition "${modelName}" not found.`);
    }

    // If the resolved schema also has a $ref, resolve it recursively
    if (resolved.$ref) {
      return this.resolveRef(resolved.$ref, definitions);
    }

    return resolved;
  }

  private buildFields(
    schema: JsonSchema,
    definitions: Definitions,
    parentPath: string,
    arrayContext?: { isArrayItem: boolean; parentArrayPath: string }
  ): SchemaTreeNode[] {
    const fields: SchemaTreeNode[] = [];

    if (!schema.properties) {
      return fields;
    }

    for (const [name, propSchema] of Object.entries(schema.properties)) {
      // Skip boolean schema definitions
      if (typeof propSchema === 'boolean') continue;

      const path = parentPath ? `${parentPath}.${name}` : name;
      const field = this.buildField(name, propSchema, definitions, path, arrayContext);
      fields.push(field);
    }

    return fields;
  }

  private buildField(
    name: string,
    schema: JsonSchema,
    definitions: Definitions,
    path: string,
    arrayContext?: { isArrayItem: boolean; parentArrayPath: string }
  ): SchemaTreeNode {
    // Resolve $ref if present
    let resolvedSchema = schema;
    if (schema.$ref) {
      resolvedSchema = { ...this.resolveRef(schema.$ref, definitions), ...schema };
      delete resolvedSchema.$ref;
    }

    const fieldType = this.mapType(resolvedSchema);
    const field: SchemaTreeNode = {
      id: `field-${++this.idCounter}-${name}`,
      name,
      type: fieldType,
      path,
      description: resolvedSchema.description,
      isArrayItem: arrayContext?.isArrayItem,
      parentArrayPath: arrayContext?.parentArrayPath,
    };

    // Handle nested objects
    if (fieldType === 'object' && resolvedSchema.properties) {
      field.children = this.buildFields(resolvedSchema, definitions, path, arrayContext);
      field.expanded = true;
    }

    // Handle arrays with object items
    if (fieldType === 'array' && resolvedSchema.items) {
      // Skip boolean or array schema definitions for items
      if (typeof resolvedSchema.items === 'boolean' || Array.isArray(resolvedSchema.items)) {
        return field;
      }

      let itemSchema: JsonSchema = resolvedSchema.items;
      if (itemSchema.$ref) {
        itemSchema = this.resolveRef(itemSchema.$ref, definitions);
      }
      if (itemSchema.properties) {
        // Mark children as array items with reference to parent array
        field.children = this.buildFields(itemSchema, definitions, `${path}[]`, {
          isArrayItem: true,
          parentArrayPath: path,
        });
        field.expanded = true;
      }
    }

    return field;
  }

  private mapType(schema: JsonSchema): FieldType {
    const type = Array.isArray(schema.type) ? schema.type[0] : schema.type;
    const format = schema.format;

    // Check format first for date types
    if (format === 'date' || format === 'date-time' || format === 'time') {
      return 'date';
    }

    switch (type) {
      case 'string':
        return 'string';
      case 'number':
      case 'integer':
        return 'number';
      case 'boolean':
        return 'boolean';
      case 'object':
        return 'object';
      case 'array':
        return 'array';
      default:
        // If type is not specified but has properties, it's an object
        if (schema.properties) {
          return 'object';
        }
        return 'string';
    }
  }
}
