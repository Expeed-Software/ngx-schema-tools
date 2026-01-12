# Angular Schema Tools

A monorepo containing Angular libraries for JSON Schema editing, visual data mapping, and dynamic form rendering.

## Libraries

| Library | Description | Version |
|---------|-------------|---------|
| [@expeed/ngx-schema-editor](./projects/ngx-schema-editor) | Visual JSON Schema editor | 1.0.0 |
| [@expeed/ngx-data-mapper](./projects/ngx-data-mapper) | Drag-and-drop field mapping | 1.3.3 |
| [@expeed/ngx-dyna-form](./projects/ngx-dyna-form) | Dynamic form renderer | 0.0.1 |

## Overview

These libraries work together to provide a complete schema-driven workflow:

1. **Define schemas** using the visual Schema Editor
2. **Create mappings** between source and target schemas using Data Mapper
3. **Render forms** dynamically from schemas using Dyna Form

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Schema Editor  │────▶│   Data Mapper   │────▶│   Dyna Form     │
│                 │     │                 │     │                 │
│ Create/Edit     │     │ Map fields      │     │ Render forms    │
│ JSON Schemas    │     │ Transform data  │     │ from schemas    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Quick Start

### Installation

```bash
# Install individual libraries as needed
npm install @expeed/ngx-schema-editor
npm install @expeed/ngx-data-mapper
npm install @expeed/ngx-dyna-form
```

### Peer Dependencies

```bash
npm install @angular/cdk @angular/material
```

For `ngx-dyna-form` with rich text support:
```bash
npm install ngx-quill quill
```

### Requirements

- Angular 19+
- Angular Material 19+
- Angular CDK 19+

## Library Summaries

### ngx-schema-editor

Visual JSON Schema builder with drag-and-drop field organization.

```typescript
import { SchemaEditorComponent } from '@expeed/ngx-schema-editor';

@Component({
  imports: [SchemaEditorComponent],
  template: `
    <schema-editor
      [schema]="schema"
      (schemaChange)="onSchemaChange($event)"
    />
  `
})
```

[Full Documentation](./projects/ngx-schema-editor/README.md)

### ngx-data-mapper

Visual field mapping between source and target schemas with transformations.

```typescript
import { DataMapperComponent } from '@expeed/ngx-data-mapper';

@Component({
  imports: [DataMapperComponent],
  template: `
    <data-mapper
      [sourceSchema]="source"
      [targetSchema]="target"
      (mappingsChange)="onMappingsChange($event)"
    />
  `
})
```

[Full Documentation](./projects/ngx-data-mapper/README.md)

### ngx-dyna-form

Dynamic form renderer from JSON Schema definitions.

```typescript
import { DynamicFormComponent } from '@expeed/ngx-dyna-form';

@Component({
  imports: [DynamicFormComponent],
  template: `
    <dyna-form
      [schema]="schema"
      [values]="formValues"
      (valuesChange)="onValuesChange($event)"
      (validChange)="onValidChange($event)"
    />
  `
})
```

[Full Documentation](./projects/ngx-dyna-form/README.md)

## Development

### Setup

```bash
npm install
```

### Build All Libraries

```bash
npm run build:libs
```

### Build Individual Library

```bash
ng build ngx-schema-editor
ng build ngx-data-mapper
ng build ngx-dyna-form
```

### Run Demo App

```bash
ng serve demo-app
```

### Project Structure

```
├── projects/
│   ├── ngx-schema-editor/    # Schema editor library
│   ├── ngx-data-mapper/      # Data mapping library
│   ├── ngx-dyna-form/        # Dynamic form library
│   └── demo-app/             # Demo application
├── dist/                     # Built libraries
└── package.json
```

## Technology Stack

- Angular 19+
- Angular Material
- Angular CDK
- ngx-quill (rich text)
- RxJS

## License

Apache 2.0
