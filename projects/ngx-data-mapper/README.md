# @expeed/ngx-data-mapper

A visual drag-and-drop data mapping component for Angular applications. Create field mappings between source and target JSON schemas with transformations, array mapping, and default values.

## Features

- **Drag & Drop Mapping**: Visually connect source fields to target fields
- **Multi-Source Mapping**: Combine multiple source fields into one target (concatenation)
- **Transformations**: Apply data transformations (uppercase, lowercase, trim, date formatting, number formatting, substring, replace, mask, templating)
- **Array Mapping**: Map array fields with optional filtering
- **Array-to-Object**: Select single item from array using first, last, or conditional logic
- **Default Values**: Set defaults for unmapped target fields
- **Endpoint Dragging**: Reassign mappings by dragging connection endpoints
- **Real-time Preview**: View transformations with sample data
- **Import/Export**: Save and load mappings as JSON

## Installation

```bash
npm install @expeed/ngx-data-mapper
```

### Peer Dependencies

```bash
npm install @angular/cdk @angular/material
```

## Usage

### Basic Usage

```typescript
import { Component } from '@angular/core';
import { DataMapperComponent, JsonSchema, FieldMapping } from '@expeed/ngx-data-mapper';

@Component({
  selector: 'app-mapper',
  standalone: true,
  imports: [DataMapperComponent],
  template: `
    <data-mapper
      [sourceSchema]="sourceSchema"
      [targetSchema]="targetSchema"
      [sampleData]="sampleData"
      (mappingsChange)="onMappingsChange($event)"
    />
  `
})
export class MapperComponent {
  sourceSchema: JsonSchema = {
    type: 'object',
    title: 'Source',
    properties: {
      firstName: { type: 'string', title: 'First Name' },
      lastName: { type: 'string', title: 'Last Name' },
      birthDate: { type: 'string', format: 'date', title: 'Birth Date' }
    }
  };

  targetSchema: JsonSchema = {
    type: 'object',
    title: 'Target',
    properties: {
      fullName: { type: 'string', title: 'Full Name' },
      age: { type: 'integer', title: 'Age' }
    }
  };

  sampleData = {
    firstName: 'John',
    lastName: 'Doe',
    birthDate: '1990-05-15'
  };

  onMappingsChange(mappings: FieldMapping[]): void {
    console.log('Mappings:', mappings);
  }
}
```

### With Schema Document (Multiple Definitions)

```typescript
import { SchemaDocument } from '@expeed/ngx-data-mapper';

sourceSchema: SchemaDocument = {
  $defs: {
    Customer: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        email: { type: 'string' }
      }
    }
  }
};

// Reference specific definition
sourceSchemaRef = '#/$defs/Customer';
```

```html
<data-mapper
  [sourceSchema]="sourceSchema"
  [targetSchema]="targetSchema"
  [sourceSchemaRef]="sourceSchemaRef"
  [targetSchemaRef]="targetSchemaRef"
  (mappingsChange)="onMappingsChange($event)"
/>
```

### Import/Export Mappings

```typescript
import { ViewChild } from '@angular/core';
import { DataMapperComponent } from '@expeed/ngx-data-mapper';

@ViewChild(DataMapperComponent) mapper!: DataMapperComponent;

exportMappings(): void {
  const json = this.mapper.exportMappings();
  // Save to file or API
}

importMappings(json: string): void {
  this.mapper.importMappings(json);
}

clearMappings(): void {
  this.mapper.clearAllMappings();
}
```

## API Reference

### DataMapperComponent

#### Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `sourceSchema` | `JsonSchema \| SchemaDocument` | - | Source schema definition |
| `targetSchema` | `JsonSchema \| SchemaDocument` | - | Target schema definition |
| `sourceSchemaRef` | `string` | - | JSON pointer to source definition (e.g., `#/$defs/Source`) |
| `targetSchemaRef` | `string` | - | JSON pointer to target definition (e.g., `#/$defs/Target`) |
| `sampleData` | `Record<string, unknown>` | `{}` | Sample data for transformation preview |

#### Outputs

| Output | Type | Description |
|--------|------|-------------|
| `mappingsChange` | `EventEmitter<FieldMapping[]>` | Emits when mappings change |

#### Public Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `exportMappings()` | `string` | Export all mappings as JSON |
| `importMappings(json: string)` | `void` | Import mappings from JSON |
| `clearAllMappings()` | `void` | Remove all mappings |

## Transformations

Available transformation types:

| Type | Description | Example |
|------|-------------|---------|
| `uppercase` | Convert to uppercase | "hello" → "HELLO" |
| `lowercase` | Convert to lowercase | "HELLO" → "hello" |
| `trim` | Remove whitespace | " hello " → "hello" |
| `concat` | Concatenate multiple fields | "John" + "Doe" → "John Doe" |
| `substring` | Extract part of string | "hello"[0:3] → "hel" |
| `replace` | Replace text | "hello" → "hi" |
| `mask` | Mask characters | "1234567890" → "******7890" |
| `dateFormat` | Format date | "2024-01-15" → "Jan 15, 2024" |
| `numberFormat` | Format number | 1234.5 → "1,234.50" |
| `template` | Template string | "${firstName} ${lastName}" |
| `datePart` | Extract date part | Extract year, month, day |

## Array Mapping

### Array to Array

Map arrays with optional filtering:

```typescript
// Filter array items
{
  type: 'array-mapping',
  filter: {
    conditions: [
      { field: 'status', operator: 'equals', value: 'active' }
    ]
  }
}
```

### Array to Object

Select single item from array:

| Mode | Description |
|------|-------------|
| `first` | Select first item |
| `last` | Select last item |
| `condition` | Select item matching condition |

## Default Values

Set default values for unmapped target fields:

| Type | Description |
|------|-------------|
| `static` | Fixed value |
| `null` | Null value |
| `empty-string` | Empty string |
| `empty-array` | Empty array [] |
| `empty-object` | Empty object {} |
| `current-date` | Current date |
| `current-datetime` | Current date and time |
| `uuid` | Generated UUID |

## Styling

Customize appearance with CSS custom properties:

```css
data-mapper {
  --data-mapper-bg: #f8fafc;
  --data-mapper-panel-bg: #ffffff;
  --data-mapper-text-primary: #1e293b;
  --data-mapper-text-secondary: #64748b;
  --data-mapper-accent-primary: #6366f1;
  --data-mapper-connector-color: #6366f1;
  --data-mapper-border-color: #e2e8f0;
}
```

### Dark Theme

```css
data-mapper {
  --data-mapper-bg: #1e293b;
  --data-mapper-panel-bg: #334155;
  --data-mapper-text-primary: #f1f5f9;
  --data-mapper-text-secondary: #cbd5e1;
  --data-mapper-accent-primary: #818cf8;
  --data-mapper-connector-color: #818cf8;
  --data-mapper-border-color: #475569;
}
```

## Exports

```typescript
// Components
export { DataMapperComponent } from './lib/components/data-mapper/data-mapper.component';
export { SchemaTreeComponent } from './lib/components/schema-tree/schema-tree.component';

// Services
export { MappingService } from './lib/services/mapping.service';
export { TransformationService } from './lib/services/transformation.service';
export { SchemaParserService } from './lib/services/schema-parser.service';
export { SvgConnectorService } from './lib/services/svg-connector.service';

// Types
export { JsonSchema, SchemaDocument } from './lib/models/json-schema.model';
export { FieldMapping, FieldReference } from './lib/models/field-mapping.model';
export { TransformationConfig, TransformationType } from './lib/models/transformation.model';
export { ArrayMapping, ArrayToObjectMapping } from './lib/models/array-mapping.model';
export { DefaultValue, DefaultValueType } from './lib/models/default-value.model';
export { SchemaTreeNode, FieldType } from './lib/models/schema-tree.model';
```

## Requirements

- Angular 19+
- Angular Material 19+
- Angular CDK 19+

## License

Apache 2.0
