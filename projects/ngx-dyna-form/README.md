# @expeed/ngx-dyna-form

A dynamic form renderer for Angular that builds reactive forms from JSON Schema definitions. Supports various input types, validation, nested objects, and arrays.

## Features

- **JSON Schema-Driven**: Automatically render forms from JSON Schema
- **Display Type Hints**: Use `x-display-type` to control input rendering
- **Multiple Input Types**: textbox, textarea, richtext, datepicker, dropdown, radio, checkbox, toggle, stepper, tags, multiselect, multiselect-dropdown
- **Rich Text Editor**: Quill integration for HTML content editing
- **Nested Objects**: Render nested object properties as fieldsets
- **Array Support**: Dynamic arrays with add/remove functionality
- **Validation**: Apply validators from schema constraints (required, minLength, maxLength, pattern, min, max)
- **Grid Layout**: Configurable columns with field-level width control
- **Field Exclusion**: Exclude specific fields from rendering

## Installation

```bash
npm install @expeed/ngx-dyna-form
```

### Peer Dependencies

```bash
npm install @angular/cdk @angular/material ngx-quill quill
```

### Quill CSS Setup

Add Quill styles to your `angular.json`:

```json
{
  "styles": [
    "node_modules/quill/dist/quill.core.css",
    "node_modules/quill/dist/quill.snow.css"
  ]
}
```

## Usage

### Basic Usage

```typescript
import { Component, signal } from '@angular/core';
import { DynamicFormComponent, DynamicFormSchema } from '@expeed/ngx-dyna-form';

@Component({
  selector: 'app-form',
  standalone: true,
  imports: [DynamicFormComponent],
  template: `
    <dyna-form
      [schema]="schema"
      [values]="formValues()"
      (valuesChange)="onValuesChange($event)"
      (validChange)="onValidChange($event)"
    />

    <button [disabled]="!isValid()" (click)="submit()">
      Submit
    </button>
  `
})
export class FormComponent {
  schema: DynamicFormSchema = {
    type: 'object',
    title: 'Contact Form',
    properties: {
      name: {
        type: 'string',
        title: 'Full Name',
        minLength: 2
      },
      email: {
        type: 'string',
        title: 'Email',
        format: 'email'  // Auto-renders as email input with validation
      },
      message: {
        type: 'string',
        title: 'Message',
        'x-display-type': 'textarea'
      }
    },
    required: ['name', 'email']
  };

  formValues = signal<Record<string, unknown>>({});
  isValid = signal(false);

  onValuesChange(values: Record<string, unknown>): void {
    this.formValues.set(values);
  }

  onValidChange(valid: boolean): void {
    this.isValid.set(valid);
  }

  submit(): void {
    console.log('Submitting:', this.formValues());
  }
}
```

### With Grid Layout

```html
<dyna-form
  [schema]="schema"
  [values]="formValues()"
  [columns]="2"
  [defaultFieldColumns]="1"
  [fieldColumns]="{ 'description': 2, 'address.street': 2 }"
  [excludeFields]="['internalId', 'metadata']"
  (valuesChange)="onValuesChange($event)"
  (validChange)="onValidChange($event)"
/>
```

### Using ViewChild for Imperative Access

```typescript
import { ViewChild } from '@angular/core';
import { DynamicFormComponent } from '@expeed/ngx-dyna-form';

@ViewChild(DynamicFormComponent) dynaForm!: DynamicFormComponent;

submit(): void {
  if (this.dynaForm.isValid()) {
    const data = this.dynaForm.getValue();
    this.apiService.save(data).subscribe();
  } else {
    this.dynaForm.markAllTouched(); // Show validation errors
  }
}
```

## API Reference

### DynamicFormComponent

#### Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `schema` | `DynamicFormSchema` | `null` | JSON Schema defining the form |
| `values` | `Record<string, unknown>` | `{}` | Initial form values |
| `columns` | `1 \| 2` | `2` | Number of grid columns |
| `defaultFieldColumns` | `number` | `1` | Default column span for fields |
| `fieldColumns` | `Record<string, number>` | `{}` | Per-field column span overrides |
| `excludeFields` | `string[]` | `[]` | Field paths to exclude |
| `emptyMessage` | `string` | `''` | Message when no fields |

#### Outputs

| Output | Type | Description |
|--------|------|-------------|
| `valuesChange` | `EventEmitter<Record<string, unknown>>` | Emits on value changes |
| `validChange` | `EventEmitter<boolean>` | Emits on validity changes |

#### Public Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `getValue()` | `Record<string, unknown>` | Get current form values |
| `isValid()` | `boolean` | Check if form is valid |
| `markAllTouched()` | `void` | Mark all fields as touched |

## Display Types

Control how fields are rendered using `x-display-type`:

| Display Type | Description | Field Type |
|--------------|-------------|------------|
| `textbox` | Single-line text input | string |
| `textarea` | Multi-line text input | string |
| `richtext` | Quill rich text editor | string |
| `dropdown` | Select dropdown | string (enum) |
| `radio` | Radio button group | string (enum) |
| `datepicker` | Date picker | date |
| `datetimepicker` | Date and time picker | date |
| `timepicker` | Time picker | time |
| `stepper` | Number stepper with +/- | number |
| `checkbox` | Checkbox | boolean |
| `toggle` | Toggle switch | boolean |
| `multiselect` | Checkbox group | array (enum) |
| `multiselect-dropdown` | Dropdown with checkboxes | array (enum) |
| `tags` | Tag input | array (string) |

### Auto-Inferred Display Types

The following display types are automatically inferred from schema properties:

| Schema | Inferred Display Type | Renders As |
|--------|----------------------|------------|
| `format: 'email'` | `email` | `<input type="email">` |
| `format: 'uri'` / `'url'` | `url` | `<input type="url">` |
| `format: 'date'` / `'date-time'` | `datepicker` | `<input type="date">` |
| `format: 'time'` | `timepicker` | `<input type="time">` |
| `type: 'array'` + `items.enum` | `multiselect` | Checkbox group |
| `type: 'array'` + `items.type: 'string'` | `tags` | Tag input |
| `type: 'array'` + `items.type: 'object'` | `array-objects` | Repeatable fieldset |
| `type: 'object'` + `properties` | `fieldset` | Nested fieldset |

### Schema Example with Display Types

```typescript
const schema: DynamicFormSchema = {
  type: 'object',
  properties: {
    bio: {
      type: 'string',
      title: 'Biography',
      'x-display-type': 'richtext'
    },
    email: {
      type: 'string',
      title: 'Email',
      format: 'email'  // Auto-infers email input type
    },
    website: {
      type: 'string',
      title: 'Website',
      format: 'uri'  // Auto-infers url input type
    },
    birthDate: {
      type: 'string',
      title: 'Birth Date',
      format: 'date'  // Auto-infers datepicker
    },
    country: {
      type: 'string',
      title: 'Country',
      enum: ['US', 'UK', 'CA'],
      'x-display-type': 'dropdown'
    },
    notifications: {
      type: 'boolean',
      title: 'Enable Notifications',
      'x-display-type': 'toggle'
    },
    age: {
      type: 'integer',
      title: 'Age',
      minimum: 0,
      maximum: 150,
      'x-display-type': 'stepper'
    },
    skills: {
      type: 'array',
      title: 'Skills',
      items: { type: 'string' }  // Auto-infers tags input
    }
  }
};
```

## Allowed Values (Enum/OneOf)

Define allowed values for dropdowns, radio buttons, and multiselect fields:

```typescript
// Simple enum - values are used as both value and label
{
  type: 'string',
  title: 'Size',
  enum: ['small', 'medium', 'large'],
  'x-display-type': 'dropdown'
}

// Labeled values using oneOf - separate value and display label
{
  type: 'string',
  title: 'Size',
  oneOf: [
    { const: 'sm', title: 'Small' },
    { const: 'md', title: 'Medium' },
    { const: 'lg', title: 'Large' }
  ],
  'x-display-type': 'dropdown'
}

// Multiselect with labeled values
{
  type: 'array',
  title: 'Categories',
  items: {
    type: 'string',
    oneOf: [
      { const: 'tech', title: 'Technology' },
      { const: 'health', title: 'Healthcare' },
      { const: 'finance', title: 'Finance' }
    ]
  },
  'x-display-type': 'multiselect'
}
```

The `oneOf` format allows the form to display user-friendly labels while storing machine-readable values.

## Nested Objects

Nested objects render as fieldsets:

```typescript
const schema: DynamicFormSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', title: 'Name' },
    address: {
      type: 'object',
      title: 'Address',
      properties: {
        street: { type: 'string', title: 'Street' },
        city: { type: 'string', title: 'City' },
        zip: { type: 'string', title: 'ZIP Code' }
      },
      required: ['street', 'city']
    }
  }
};
```

## Array of Objects

Arrays of objects render with add/remove functionality:

```typescript
const schema: DynamicFormSchema = {
  type: 'object',
  properties: {
    contacts: {
      type: 'array',
      title: 'Contacts',
      minItems: 1,
      maxItems: 5,
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', title: 'Name' },
          email: { type: 'string', title: 'Email', format: 'email' }
        },
        required: ['name']
      }
    }
  }
};
```

## Field Exclusion

Exclude fields using paths with wildcard support:

```typescript
// Exclude specific fields
excludeFields: ['password', 'internalId']

// Exclude nested fields
excludeFields: ['address.country', 'metadata.createdAt']

// Exclude array item fields (wildcard)
excludeFields: ['contacts[*].phone']
```

## Validation

Validators are automatically applied from schema constraints:

| Schema Property | Validator |
|-----------------|-----------|
| `required` (in parent) | Required |
| `minLength` | Min length |
| `maxLength` | Max length |
| `pattern` | Regex pattern |
| `minimum` | Min value |
| `maximum` | Max value |
| `format: 'email'` | Email format |
| `format: 'uri'` | URL format |

## Styling

Customize with CSS custom properties:

```css
dyna-form {
  --df-color-primary: #3b82f6;
  --df-color-error: #ef4444;
  --df-color-text-primary: #1f2937;
  --df-color-text-secondary: #6b7280;
  --df-color-border: #e5e7eb;
  --df-color-surface: #ffffff;
  --df-radius-default: 0.375rem;
  --df-font-size-sm: 0.875rem;
}
```

## Exports

```typescript
// Components
export { DynamicFormComponent } from './lib/components/dynamic-form/dynamic-form.component';

// Types
export { DynamicFormSchema } from './lib/components/dynamic-form/dynamic-form.component';
export { FormField } from './lib/components/dynamic-form/dynamic-form.component';
```

## Requirements

- Angular 21+
- ngx-quill 30+ (for rich text)
- Quill 2.0+

## License

Apache 2.0
