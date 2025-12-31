# Angular Data Mapper

Visual data mapping components for Angular applications. Create field mappings between source and target schemas with drag-and-drop, apply transformations, and define JSON schemas visually.

![Angular](https://img.shields.io/badge/Angular-21-dd0031?logo=angular)
![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)

## Features

### Data Mapper Component (`data-mapper`)
- Drag-and-drop field mapping between source and target schemas
- Visual SVG connectors with bezier curves
- Field transformations (uppercase, lowercase, trim, date formatting, etc.)
- Array mapping with filters and selectors
- Default values for unmapped target fields
- Real-time preview with sample data
- Import/export mappings as JSON

### Schema Editor Component (`schema-editor`)
- Visual schema builder with nested objects and arrays
- Field types: string, number, boolean, date, object, array
- Required field toggle
- Field descriptions
- Allowed values (enum) support
- Export as valid JSON Schema (draft 2020-12)
- Reorder fields with up/down buttons
- Indent/outdent to restructure hierarchy

## Project Structure

This is an Angular workspace with two projects:

```
angular-data-mapper/
├── projects/
│   ├── ngx-data-mapper/         # Library (reusable components)
│   │   ├── src/
│   │   │   ├── lib/
│   │   │   │   ├── components/  # Data mapper, schema editor, etc.
│   │   │   │   ├── services/    # Mapping, transformation, SVG services
│   │   │   │   └── models/      # TypeScript interfaces
│   │   │   └── public-api.ts    # Public exports
│   │   ├── ng-package.json
│   │   └── package.json
│   └── demo-app/                # Demo application
│       └── src/
│           └── app/
│               ├── pages/       # Demo pages
│               └── services/    # Sample data service
├── angular.json                 # Workspace configuration
├── package.json                 # Dependencies & scripts
└── tsconfig.json                # TypeScript configuration
```

## Installation

```bash
git clone https://github.com/your-username/angular-data-mapper.git
cd angular-data-mapper
npm install
```

## Development

```bash
# Build the library (required before running demo)
npm run build:lib

# Start demo app
npm start

# Build library in watch mode (for development)
npm run build:lib:watch

# Build demo for production
npm run build:demo:prod
```

Navigate to `http://localhost:4200/`

## Using the Library

### Installation in Your Project

After building, the library can be found in `dist/ngx-data-mapper`. You can:

1. **Link locally** for development:
   ```bash
   cd dist/ngx-data-mapper
   npm link
   # In your project
   npm link ngx-data-mapper
   ```

2. **Publish to npm** (after setting up package.json):
   ```bash
   cd dist/ngx-data-mapper
   npm publish
   ```

### Data Mapper Component

```html
<data-mapper
  [sourceSchema]="sourceSchema"
  [targetSchema]="targetSchema"
  [sampleData]="sampleData"
  (mappingsChange)="onMappingsChange($event)"
></data-mapper>
```

```typescript
import { DataMapperComponent, JsonSchema, FieldMapping } from 'ngx-data-mapper';

@Component({
  imports: [DataMapperComponent],
  // ...
})
export class YourComponent {
  sourceSchema: JsonSchema = {
    name: 'Source',
    fields: [
      { id: '1', name: 'firstName', type: 'string', path: 'firstName' },
      { id: '2', name: 'lastName', type: 'string', path: 'lastName' },
    ]
  };

  targetSchema: JsonSchema = {
    name: 'Target',
    fields: [
      { id: '1', name: 'fullName', type: 'string', path: 'fullName' },
    ]
  };

  sampleData = {
    firstName: 'John',
    lastName: 'Doe'
  };

  onMappingsChange(mappings: FieldMapping[]): void {
    console.log('Mappings updated:', mappings);
  }
}
```

### Schema Editor Component

```html
<schema-editor
  [schema]="schema"
  (schemaChange)="onSchemaChange($event)"
></schema-editor>
```

```typescript
import { SchemaEditorComponent, SchemaDefinition } from 'ngx-data-mapper';

@Component({
  imports: [SchemaEditorComponent],
  // ...
})
export class YourComponent {
  schema: SchemaDefinition = {
    name: 'Customer',
    fields: []
  };

  onSchemaChange(updated: SchemaDefinition): void {
    console.log('Schema updated:', updated);
  }
}
```

## Styling with CSS Variables

Both components support extensive theming via CSS custom properties.

### Data Mapper Variables

```css
data-mapper {
  /* Background & Layout */
  --data-mapper-bg: #f8fafc;
  --data-mapper-border-radius: 16px;
  --data-mapper-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);

  /* Panels */
  --data-mapper-panel-bg: white;
  --data-mapper-panel-width: 320px;
  --data-mapper-panel-border-radius: 12px;

  /* Text Colors */
  --data-mapper-text-primary: #1e293b;
  --data-mapper-text-secondary: #64748b;
  --data-mapper-text-muted: #94a3b8;

  /* Accent Colors */
  --data-mapper-accent-primary: #6366f1;
  --data-mapper-accent-success: #22c55e;
  --data-mapper-accent-warning: #f59e0b;
  --data-mapper-accent-danger: #ef4444;

  /* Connectors */
  --data-mapper-connector-color: #6366f1;
  --data-mapper-connector-width: 2px;

  /* Spacing & Typography */
  --data-mapper-spacing-sm: 8px;
  --data-mapper-spacing-md: 16px;
  --data-mapper-font-size-sm: 12px;
  --data-mapper-font-size-md: 14px;
}
```

### Schema Editor Variables

```css
schema-editor {
  /* Background & Layout */
  --schema-editor-bg: white;
  --schema-editor-border-radius: 12px;
  --schema-editor-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);

  /* Field Items */
  --schema-editor-field-bg: #f8fafc;
  --schema-editor-field-bg-hover: #f1f5f9;
  --schema-editor-field-border-radius: 8px;

  /* Text Colors */
  --schema-editor-text-primary: #1e293b;
  --schema-editor-text-secondary: #64748b;

  /* Accent Colors */
  --schema-editor-accent-primary: #3b82f6;
  --schema-editor-accent-success: #22c55e;
  --schema-editor-accent-warning: #f59e0b;
  --schema-editor-accent-danger: #ef4444;

  /* Spacing & Typography */
  --schema-editor-spacing-sm: 8px;
  --schema-editor-spacing-md: 16px;
  --schema-editor-font-size-sm: 12px;
  --schema-editor-font-size-md: 14px;
}
```

### Dark Theme Example

```css
data-mapper {
  --data-mapper-bg: #1e293b;
  --data-mapper-panel-bg: #334155;
  --data-mapper-text-primary: #f1f5f9;
  --data-mapper-text-secondary: #cbd5e1;
  --data-mapper-accent-primary: #818cf8;
  --data-mapper-connector-color: #818cf8;
}
```

## API Reference

### DataMapperComponent

#### Inputs
| Input | Type | Description |
|-------|------|-------------|
| `sourceSchema` | `JsonSchema` | Source schema for mapping |
| `targetSchema` | `JsonSchema` | Target schema for mapping |
| `sampleData` | `Record<string, unknown>` | Sample data for preview |

#### Outputs
| Output | Type | Description |
|--------|------|-------------|
| `mappingsChange` | `EventEmitter<FieldMapping[]>` | Emits when mappings change |

#### Methods
| Method | Description |
|--------|-------------|
| `importMappings(json: string)` | Import mappings from JSON string |
| `clearAllMappings()` | Remove all mappings |

### SchemaEditorComponent

#### Inputs
| Input | Type | Description |
|-------|------|-------------|
| `schema` | `SchemaDefinition` | Schema to edit |

#### Outputs
| Output | Type | Description |
|--------|------|-------------|
| `schemaChange` | `EventEmitter<SchemaDefinition>` | Emits on any change |
| `save` | `EventEmitter<SchemaDefinition>` | Emits on explicit save |

## Library Exports

The `ngx-data-mapper` library exports:

### Components
- `DataMapperComponent`
- `SchemaEditorComponent`
- `SchemaTreeComponent`
- `TransformationPopoverComponent`
- `ArrayFilterModalComponent`
- `ArraySelectorModalComponent`
- `DefaultValuePopoverComponent`

### Services
- `MappingService`
- `TransformationService`
- `SvgConnectorService`
- `SchemaParserService`

### Interfaces
- `JsonSchema`, `SchemaField`, `FieldMapping`
- `SchemaDefinition`, `EditorField`
- `TransformationConfig`, `ArrayMapping`, `ArrayFilterConfig`
- `SchemaDocument`, `ModelRegistry`

## Requirements

- Angular 21+
- Angular Material 21+
- Angular CDK 21+

## Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Serve demo app |
| `npm run build:lib` | Build the library |
| `npm run build:lib:watch` | Build library in watch mode |
| `npm run build:demo` | Build demo app |
| `npm run build` | Build both library and demo |

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
