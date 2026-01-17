# @expeed/ngx-schema-editor

A visual JSON Schema editor component for Angular applications. Create and edit JSON Schema definitions with a drag-and-drop interface.

## Features

- Visual schema builder with drag-and-drop field reordering
- Support for all JSON Schema types: `string`, `number`, `integer`, `boolean`, `object`, `array`
- Nested object and array structures
- Field validators (minLength, maxLength, pattern, minimum, maximum, format)
- Enum values with optional display labels
- Display type hints (`x-display-type`) for form rendering
- Required field toggle
- Indent/outdent to restructure hierarchy
- Toggle between visual editor and raw JSON view
- Outputs valid JSON Schema (draft 2020-12)

## Installation

```bash
npm install @expeed/ngx-schema-editor
```

### Peer Dependencies

```bash
npm install @angular/cdk @angular/material
```

## Usage

### Basic Usage

```typescript
import { Component } from '@angular/core';
import { SchemaEditorComponent, JsonSchema } from '@expeed/ngx-schema-editor';

@Component({
  selector: 'app-schema-page',
  standalone: true,
  imports: [SchemaEditorComponent],
  template: `
    <schema-editor
      [schema]="schema"
      (schemaChange)="onSchemaChange($event)"
    />
  `
})
export class SchemaPageComponent {
  schema: JsonSchema = {
    type: 'object',
    title: 'Customer',
    properties: {}
  };

  onSchemaChange(updated: JsonSchema): void {
    console.log('Schema updated:', updated);
    this.schema = updated;
  }
}
```

### With Initial Schema

```typescript
schema: JsonSchema = {
  type: 'object',
  title: 'Customer',
  properties: {
    firstName: {
      type: 'string',
      title: 'First Name',
      minLength: 1,
      maxLength: 50
    },
    email: {
      type: 'string',
      title: 'Email',
      format: 'email'  // Form renderer auto-infers email input type
    },
    age: {
      type: 'integer',
      title: 'Age',
      minimum: 0,
      maximum: 150
    },
    status: {
      type: 'string',
      title: 'Status',
      oneOf: [
        { const: 'active', title: 'Active' },
        { const: 'inactive', title: 'Inactive' }
      ],
      'x-display-type': 'dropdown'
    }
  },
  required: ['firstName', 'email']
};
```

## API Reference

### SchemaEditorComponent

#### Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `schema` | `JsonSchema` | `{}` | The JSON Schema to edit |

#### Outputs

| Output | Type | Description |
|--------|------|-------------|
| `schemaChange` | `EventEmitter<JsonSchema>` | Emits when schema changes |

### JsonSchema Interface

```typescript
interface JsonSchema {
  type?: string;
  title?: string;
  description?: string;
  properties?: Record<string, JsonSchema>;
  items?: JsonSchema;
  required?: string[];
  enum?: unknown[];
  oneOf?: Array<{ const: unknown; title?: string }>;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  format?: string;
  default?: unknown;
  'x-display-type'?: string;
}
```

## Supported Field Types

| Type | Description |
|------|-------------|
| `string` | Text values |
| `number` | Decimal numbers |
| `integer` | Whole numbers |
| `boolean` | True/false values |
| `object` | Nested object with properties |
| `array` | Array of items |

## Display Types (x-display-type)

The editor supports the `x-display-type` extension property to hint how fields should be rendered in forms:

| Display Type | Field Type | Description |
|--------------|------------|-------------|
| `textbox` | String | Single-line text input |
| `textarea` | String | Multi-line text input |
| `richtext` | String | Rich text editor (HTML) |
| `dropdown` | String (enum) | Select dropdown |
| `radio` | String (enum) | Radio button group |
| `datepicker` | Date | Date picker |
| `datetimepicker` | Date | Date and time picker |
| `timepicker` | Time | Time picker |
| `stepper` | Number | Number stepper with +/- buttons |
| `checkbox` | Boolean | Checkbox |
| `toggle` | Boolean | Toggle switch |
| `multiselect` | Array (enum) | Checkbox group for multiple selection |
| `multiselect-dropdown` | Array (enum) | Dropdown with checkboxes for multiple selection |
| `tags` | Array (string) | Tag input for string arrays |

**Note:** Email and URL fields use `format` (email, uri) in JSON Schema. The form renderer auto-infers the appropriate input type from the format.

## Validators

Configure field validation constraints:

| Validator | Applies To | Description |
|-----------|------------|-------------|
| `minLength` | string | Minimum character length |
| `maxLength` | string | Maximum character length |
| `pattern` | string | Regex pattern |
| `format` | string | Built-in format (email, uri, date, etc.) |
| `minimum` | number/integer | Minimum value |
| `maximum` | number/integer | Maximum value |

## Enum Values

Define allowed values with optional display labels:

```typescript
// Simple enum
{
  type: 'string',
  enum: ['small', 'medium', 'large']
}

// Enum with labels (using oneOf)
{
  type: 'string',
  oneOf: [
    { const: 'sm', title: 'Small' },
    { const: 'md', title: 'Medium' },
    { const: 'lg', title: 'Large' }
  ]
}
```

## Styling

The component uses Angular Material and can be themed using CSS custom properties:

```css
schema-editor {
  --se-bg: #ffffff;
  --se-border: #e2e8f0;
  --se-text-primary: #1e293b;
  --se-text-secondary: #64748b;
  --se-accent: #6366f1;
}
```

## Exports

```typescript
// Components
export { SchemaEditorComponent } from './lib/components/schema-editor/schema-editor.component';

// Types
export { JsonSchema } from './lib/models/json-schema.model';
export { LabeledValue } from './lib/models/labeled-value.model';

// Utilities
export { isLabeledValue, getRawValue, getDisplayText } from './lib/utils/allowed-value.utils';
```

## Requirements

- Angular 21+
- Angular Material 21+
- Angular CDK 21+

## License

Apache 2.0
