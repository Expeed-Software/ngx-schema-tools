import { Injectable } from '@angular/core';
import { SchemaField, JsonSchema } from '../models/schema.model';

export interface JsonSchemaDefinition {
  type?: string;
  format?: string;
  properties?: Record<string, JsonSchemaDefinition>;
  items?: JsonSchemaDefinition;
  $ref?: string;
  description?: string;
  enum?: string[];
  required?: string[];
  additionalProperties?: boolean | JsonSchemaDefinition;
}

export interface SchemaDocument {
  $ref?: string;
  $defs?: Record<string, JsonSchemaDefinition>;
  definitions?: Record<string, JsonSchemaDefinition>;
  exclude?: string[];
  include?: string[];
  properties?: Record<string, JsonSchemaDefinition>;
  type?: string;
  title?: string;
  description?: string;
}

export interface ModelRegistry {
  [modelName: string]: JsonSchemaDefinition;
}

@Injectable({
  providedIn: 'root',
})
export class SchemaParserService {
  private modelRegistry: ModelRegistry = {};
  private idCounter = 0;

  registerModels(models: ModelRegistry): void {
    this.modelRegistry = { ...this.modelRegistry, ...models };
  }

  clearRegistry(): void {
    this.modelRegistry = {};
  }

  parseSchema(
    schemaJson: string | SchemaDocument,
    schemaName: string = 'Schema'
  ): JsonSchema {
    const schema: SchemaDocument =
      typeof schemaJson === 'string' ? JSON.parse(schemaJson) : schemaJson;

    this.idCounter = 0;

    // Extract definitions from the schema document itself
    const localDefs = schema.$defs || schema.definitions || {};
    const combinedRegistry = { ...this.modelRegistry, ...localDefs };

    let resolvedSchema: JsonSchemaDefinition;

    if (schema.$ref) {
      // Resolve the reference
      resolvedSchema = this.resolveRef(schema.$ref, combinedRegistry);
    } else if (schema.properties) {
      // Direct schema with properties
      resolvedSchema = schema as JsonSchemaDefinition;
    } else {
      throw new Error('Schema must have either $ref or properties');
    }

    // Build fields from the resolved schema
    let fields = this.buildFields(resolvedSchema, combinedRegistry, '');

    // Apply exclude filter
    if (schema.exclude && schema.exclude.length > 0) {
      fields = this.applyExclude(fields, schema.exclude);
    }

    // Apply include filter (only if specified)
    if (schema.include && schema.include.length > 0) {
      fields = this.applyInclude(fields, schema.include);
    }

    return {
      name: schema.title || schemaName,
      fields,
    };
  }

  private resolveRef(
    ref: string,
    registry: Record<string, JsonSchemaDefinition>
  ): JsonSchemaDefinition {
    // Handle different ref formats:
    // #model, #/definitions/model, #/$defs/model, model
    let modelName: string;

    if (ref.startsWith('#/$defs/')) {
      modelName = ref.substring(8);
    } else if (ref.startsWith('#/definitions/')) {
      modelName = ref.substring(14);
    } else if (ref.startsWith('#')) {
      modelName = ref.substring(1);
    } else {
      modelName = ref;
    }

    const resolved = registry[modelName];
    if (!resolved) {
      throw new Error(`Cannot resolve reference: ${ref}. Model "${modelName}" not found in registry.`);
    }

    // If the resolved schema also has a $ref, resolve it recursively
    if (resolved.$ref) {
      return this.resolveRef(resolved.$ref, registry);
    }

    return resolved;
  }

  private buildFields(
    schema: JsonSchemaDefinition,
    registry: Record<string, JsonSchemaDefinition>,
    parentPath: string,
    arrayContext?: { isArrayItem: boolean; parentArrayPath: string }
  ): SchemaField[] {
    const fields: SchemaField[] = [];

    if (!schema.properties) {
      return fields;
    }

    for (const [name, propSchema] of Object.entries(schema.properties)) {
      const path = parentPath ? `${parentPath}.${name}` : name;
      const field = this.buildField(name, propSchema, registry, path, arrayContext);
      fields.push(field);
    }

    return fields;
  }

  private buildField(
    name: string,
    schema: JsonSchemaDefinition,
    registry: Record<string, JsonSchemaDefinition>,
    path: string,
    arrayContext?: { isArrayItem: boolean; parentArrayPath: string }
  ): SchemaField {
    // Resolve $ref if present
    let resolvedSchema = schema;
    if (schema.$ref) {
      resolvedSchema = { ...this.resolveRef(schema.$ref, registry), ...schema };
      delete resolvedSchema.$ref;
    }

    const fieldType = this.mapType(resolvedSchema);
    const field: SchemaField = {
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
      field.children = this.buildFields(resolvedSchema, registry, path, arrayContext);
      field.expanded = true;
    }

    // Handle arrays with object items
    if (fieldType === 'array' && resolvedSchema.items) {
      let itemSchema = resolvedSchema.items;
      if (itemSchema.$ref) {
        itemSchema = this.resolveRef(itemSchema.$ref, registry);
      }
      if (itemSchema.properties) {
        // Mark children as array items with reference to parent array
        field.children = this.buildFields(itemSchema, registry, `${path}[]`, {
          isArrayItem: true,
          parentArrayPath: path,
        });
        field.expanded = true;
      }
    }

    return field;
  }

  private mapType(
    schema: JsonSchemaDefinition
  ): 'string' | 'number' | 'boolean' | 'object' | 'array' | 'date' {
    const type = schema.type;
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

  private applyExclude(fields: SchemaField[], exclude: string[]): SchemaField[] {
    return fields
      .filter((field) => !exclude.includes(field.name) && !exclude.includes(field.path))
      .map((field) => {
        if (field.children) {
          // Filter nested fields by checking both full path and relative name
          const filteredChildren = this.applyExclude(field.children, exclude);
          return { ...field, children: filteredChildren };
        }
        return field;
      });
  }

  private applyInclude(fields: SchemaField[], include: string[]): SchemaField[] {
    return fields
      .filter((field) => {
        // Include if field name or path matches
        if (include.includes(field.name) || include.includes(field.path)) {
          return true;
        }
        // Include if any child path matches
        if (field.children) {
          return this.hasIncludedChild(field.children, include);
        }
        return false;
      })
      .map((field) => {
        if (field.children) {
          // Keep parent but filter children
          const filteredChildren = this.applyInclude(field.children, include);
          return { ...field, children: filteredChildren.length > 0 ? filteredChildren : field.children };
        }
        return field;
      });
  }

  private hasIncludedChild(fields: SchemaField[], include: string[]): boolean {
    return fields.some((field) => {
      if (include.includes(field.name) || include.includes(field.path)) {
        return true;
      }
      if (field.children) {
        return this.hasIncludedChild(field.children, include);
      }
      return false;
    });
  }

  // Utility method to create a schema document from model name
  createSchemaFromRef(
    modelRef: string,
    options?: { exclude?: string[]; include?: string[]; title?: string }
  ): SchemaDocument {
    return {
      $ref: modelRef,
      title: options?.title,
      exclude: options?.exclude,
      include: options?.include,
    };
  }
}
