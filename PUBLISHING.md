# Publishing to npm

## Build

```bash
npm run build:lib
```

## Publish

```bash
cd dist/ngx-data-mapper
npm publish --access public --auth-type=web
```

Browser will open for security key authentication.

## Verify

```bash
npm view @expeed/ngx-data-mapper
```

---

# Using the Library

## Install

```bash
npm install @expeed/ngx-data-mapper
```

## Import

```typescript
import {
  DataMapperComponent,
  SchemaEditorComponent,
  MappingService,
  SchemaParserService
} from '@expeed/ngx-data-mapper';
```

## Use in Component

```typescript
@Component({
  standalone: true,
  imports: [DataMapperComponent, SchemaEditorComponent],
  template: `
    <data-mapper
      [sourceSchema]="sourceSchema"
      [targetSchema]="targetSchema"
      (mappingsChange)="onMappingsChange($event)">
    </data-mapper>
  `
})
export class MyComponent {
  sourceSchema = { name: 'Source', fields: [] };
  targetSchema = { name: 'Target', fields: [] };

  onMappingsChange(mappings: FieldMapping[]) {
    console.log(mappings);
  }
}
```

## Peer Dependencies

Requires Angular 21 with Material:

```bash
npm install @angular/cdk @angular/material
```
