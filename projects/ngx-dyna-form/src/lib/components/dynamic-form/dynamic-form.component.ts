import { Component, input, output, signal, computed, effect, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, FormControl, ReactiveFormsModule, Validators, ValidatorFn, AbstractControl } from '@angular/forms';
import { QuillModule } from 'ngx-quill';
import { Subject, takeUntil } from 'rxjs';

// =============================================================================
// Types
// =============================================================================

/**
 * Extended JSON Schema with x-display-type support for controlling form rendering
 */
export interface DynamicFormSchema {
  title?: string;
  type?: string | string[];
  description?: string;
  properties?: Record<string, DynamicFormSchema>;
  items?: DynamicFormSchema;
  required?: string[];
  enum?: unknown[];
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  minItems?: number;
  maxItems?: number;
  pattern?: string;
  format?: string;
  'x-display-type'?:
    | 'textbox'
    | 'textarea'
    | 'richtext'
    | 'datepicker'
    | 'datetimepicker'
    | 'timepicker'
    | 'radio'
    | 'checkbox'
    | 'toggle'
    | 'stepper'
    | 'select'
    | 'dropdown'  // Alias for select (from schema-editor)
    | 'multiselect'
    | 'tags'
    | 'email'
    | 'url'
    | 'phone';
  [key: string]: unknown;
}

/**
 * Option with optional label for dropdowns
 */
export interface FormFieldOption {
  value: string | number;
  label: string;
}

/**
 * Internal form field representation
 */
export interface FormField {
  name: string;
  label: string;
  type: string;
  displayType: string;
  required: boolean;
  options?: FormFieldOption[];
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  minItems?: number;
  maxItems?: number;
  pattern?: string;
  step?: number;
  placeholder?: string;
  description?: string;
  // For nested objects
  nestedFields?: FormField[];
  nestedRequired?: string[];
  // For arrays of objects
  itemFields?: FormField[];
  itemRequired?: string[];
}

// =============================================================================
// Dynamic Form Component
// =============================================================================
@Component({
  selector: 'dyna-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    QuillModule,
  ],
  template: `
    @if (fields().length > 0 && form) {
      <div class="dynamic-form" [formGroup]="form" [style.grid-template-columns]="'repeat(' + columns() + ', 1fr)'">
        @for (field of fields(); track field.name) {
          @if (!isFieldExcluded(field.name)) {
            <ng-container [ngTemplateOutlet]="fieldTemplate" [ngTemplateOutletContext]="{ field: field, formGroup: form, parentPath: '' }"></ng-container>
          }
        }
      </div>
    } @else if (emptyMessage()) {
      <p class="dynamic-form__empty">{{ emptyMessage() }}</p>
    }

    <!-- Field Template -->
    <ng-template #fieldTemplate let-field="field" let-formGroup="formGroup" let-parentPath="parentPath">
      <div
        class="form-field"
        [class.form-field--full-width]="isFullWidth(field, parentPath)"
        [class.form-field--error]="hasError(field.name, formGroup)"
        [class.form-field--fieldset]="field.displayType === 'fieldset'"
        [class.form-field--array]="field.displayType === 'array-objects'"
        [style.grid-column]="'span ' + getFieldColumnSpan(field.name, parentPath)"
        [formGroup]="formGroup"
      >
        @if (field.displayType !== 'checkbox' && field.displayType !== 'fieldset' && field.displayType !== 'array-objects') {
          <label class="form-field__label" [attr.for]="field.name">
            {{ field.label }}
            @if (field.required) {
              <span class="form-field__required">*</span>
            }
          </label>
        }

        @switch (field.displayType) {
          @case ('textbox') {
            <input
              type="text"
              class="form-field__input"
              [id]="field.name"
              [formControlName]="field.name"
              [placeholder]="field.placeholder || 'Enter ' + field.label.toLowerCase()"
              [attr.minlength]="field.minLength"
              [attr.maxlength]="field.maxLength"
            />
          }
          @case ('email') {
            <input
              type="email"
              class="form-field__input"
              [id]="field.name"
              [formControlName]="field.name"
              [placeholder]="field.placeholder || 'Enter email address'"
            />
          }
          @case ('url') {
            <input
              type="url"
              class="form-field__input"
              [id]="field.name"
              [formControlName]="field.name"
              [placeholder]="field.placeholder || 'https://example.com'"
            />
          }
          @case ('phone') {
            <input
              type="tel"
              class="form-field__input"
              [id]="field.name"
              [formControlName]="field.name"
              [placeholder]="field.placeholder || '+1 (555) 000-0000'"
            />
          }
          @case ('textarea') {
            <textarea
              class="form-field__textarea"
              rows="3"
              [id]="field.name"
              [formControlName]="field.name"
              [placeholder]="field.placeholder || 'Enter ' + field.label.toLowerCase()"
              [attr.minlength]="field.minLength"
              [attr.maxlength]="field.maxLength"
            ></textarea>
          }
          @case ('richtext') {
            <quill-editor
              class="form-field__quill"
              theme="snow"
              [formControlName]="field.name"
              [placeholder]="field.placeholder || 'Enter ' + field.label.toLowerCase()"
              [modules]="quillModules"
            ></quill-editor>
          }
          @case ('datepicker') {
            <input
              type="date"
              class="form-field__input"
              [id]="field.name"
              [formControlName]="field.name"
            />
          }
          @case ('timepicker') {
            <input
              type="time"
              class="form-field__input"
              [id]="field.name"
              [formControlName]="field.name"
            />
          }
          @case ('radio') {
            <div class="form-field__radio-group">
              @for (option of field.options; track option.value) {
                <label class="form-field__radio">
                  <input
                    type="radio"
                    [formControlName]="field.name"
                    [value]="option.value"
                  />
                  <span class="form-field__radio-label">{{ option.label }}</span>
                </label>
              }
            </div>
          }
          @case ('checkbox') {
            <label class="form-field__checkbox">
              <input
                type="checkbox"
                [formControlName]="field.name"
              />
              <span class="form-field__checkbox-label">{{ field.label }}</span>
              @if (field.required) {
                <span class="form-field__required">*</span>
              }
            </label>
          }
          @case ('toggle') {
            <label class="form-field__toggle">
              <input
                type="checkbox"
                class="toggle-input"
                [formControlName]="field.name"
              />
              <span class="toggle-switch"></span>
              <span class="form-field__toggle-label">{{ field.label }}</span>
              @if (field.required) {
                <span class="form-field__required">*</span>
              }
            </label>
          }
          @case ('stepper') {
            <div class="form-field__stepper">
              <button
                type="button"
                class="stepper-btn"
                (click)="decrementStepper(field, formGroup)"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </button>
              <input
                type="number"
                class="stepper-input"
                [id]="field.name"
                [formControlName]="field.name"
                [attr.min]="field.min"
                [attr.max]="field.max"
                [attr.step]="field.step || 1"
              />
              <button
                type="button"
                class="stepper-btn"
                (click)="incrementStepper(field, formGroup)"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </button>
            </div>
          }
          @case ('select') {
            <select
              class="form-field__select"
              [id]="field.name"
              [formControlName]="field.name"
            >
              <option value="">Select {{ field.label }}</option>
              @for (option of field.options; track option.value) {
                <option [value]="option.value">{{ option.label }}</option>
              }
            </select>
          }
          @case ('multiselect') {
            <div class="form-field__multiselect">
              @for (option of field.options; track option.value) {
                <label class="form-field__multiselect-option">
                  <input
                    type="checkbox"
                    [checked]="isOptionSelected(field.name, option.value, formGroup)"
                    (change)="toggleMultiselectOption(field.name, option.value, formGroup)"
                  />
                  <span>{{ option.label }}</span>
                </label>
              }
            </div>
          }
          @case ('multiselect-dropdown') {
            <div class="form-field__multiselect-dropdown" [class.open]="isDropdownOpen(field.name)">
              <button
                type="button"
                class="multiselect-dropdown__trigger"
                (click)="toggleDropdown(field.name)"
              >
                <span class="multiselect-dropdown__text">
                  {{ getMultiselectDisplayText(field, formGroup) }}
                </span>
                <svg class="multiselect-dropdown__arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
              @if (isDropdownOpen(field.name)) {
                <div class="multiselect-dropdown__panel">
                  @for (option of field.options; track option.value) {
                    <label class="multiselect-dropdown__option">
                      <input
                        type="checkbox"
                        [checked]="isOptionSelected(field.name, option.value, formGroup)"
                        (change)="toggleMultiselectOption(field.name, option.value, formGroup)"
                      />
                      <span>{{ option.label }}</span>
                    </label>
                  }
                </div>
              }
            </div>
          }
          @case ('tags') {
            <div class="form-field__tags">
              <div class="tags-list">
                @for (tag of getTagsValue(field.name, formGroup); track tag; let i = $index) {
                  <span class="tag">
                    {{ tag }}
                    <button type="button" class="tag-remove" (click)="removeTag(field.name, i, formGroup)">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </span>
                }
              </div>
              <input
                type="text"
                class="tags-input"
                [placeholder]="field.placeholder || 'Type and press Enter to add'"
                (keydown.enter)="addTag(field.name, $event, formGroup)"
              />
            </div>
          }
          @case ('fieldset') {
            <fieldset class="form-field__fieldset" [formGroupName]="field.name">
              <legend class="fieldset-legend">
                {{ field.label }}
                @if (field.required) {
                  <span class="form-field__required">*</span>
                }
              </legend>
              <div class="fieldset-content" [style.grid-template-columns]="'repeat(' + columns() + ', 1fr)'">
                @for (nestedField of field.nestedFields; track nestedField.name) {
                  @if (!isFieldExcluded(nestedField.name, parentPath ? parentPath + '.' + field.name : field.name)) {
                    <ng-container [ngTemplateOutlet]="nestedFieldTemplate" [ngTemplateOutletContext]="{ field: nestedField, formGroup: getNestedFormGroup(field.name, formGroup), parentPath: parentPath ? parentPath + '.' + field.name : field.name }"></ng-container>
                  }
                }
              </div>
            </fieldset>
          }
          @case ('array-objects') {
            <fieldset class="form-field__array" formArrayName="{{ field.name }}">
              <legend class="fieldset-legend">
                {{ field.label }}
                @if (field.required) {
                  <span class="form-field__required">*</span>
                }
              </legend>
              <div class="array-items">
                @for (item of getFormArrayControls(field.name, formGroup); track $index; let i = $index) {
                  <div class="array-item" [formGroupName]="i">
                    <div class="array-item__header">
                      <span class="array-item__number">#{{ i + 1 }}</span>
                      <button
                        type="button"
                        class="array-item__remove"
                        (click)="removeArrayItem(field.name, i, formGroup)"
                        [disabled]="getFormArrayControls(field.name, formGroup).length <= (field.minItems || 0)"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                      </button>
                    </div>
                    <div class="array-item__fields" [style.grid-template-columns]="'repeat(' + columns() + ', 1fr)'">
                      @for (itemField of field.itemFields; track itemField.name) {
                        @if (!isFieldExcluded(itemField.name, buildArrayItemPath(field.name, i, parentPath))) {
                          <ng-container [ngTemplateOutlet]="nestedFieldTemplate" [ngTemplateOutletContext]="{ field: itemField, formGroup: getArrayItemFormGroup(field.name, i, formGroup), parentPath: buildArrayItemPath(field.name, i, parentPath) }"></ng-container>
                        }
                      }
                    </div>
                  </div>
                }
              </div>
              <button
                type="button"
                class="array-add-btn"
                (click)="addArrayItem(field, formGroup)"
                [disabled]="field.maxItems && getFormArrayControls(field.name, formGroup).length >= field.maxItems"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Add {{ field.label | slice:0:-1 }}
              </button>
            </fieldset>
          }
          @default {
            <input
              type="text"
              class="form-field__input"
              [id]="field.name"
              [formControlName]="field.name"
              [placeholder]="field.placeholder || 'Enter ' + field.label.toLowerCase()"
            />
          }
        }

        <!-- Error messages -->
        @if (hasError(field.name, formGroup)) {
          <span class="form-field__error">
            {{ getErrorMessage(field, formGroup) }}
          </span>
        }

        <!-- Help text / description -->
        @if (field.description && !hasError(field.name, formGroup)) {
          <span class="form-field__help">{{ field.description }}</span>
        }
      </div>
    </ng-template>

    <!-- Nested Field Template (for fieldsets and arrays) -->
    <ng-template #nestedFieldTemplate let-field="field" let-formGroup="formGroup" let-parentPath="parentPath">
      <div
        class="form-field form-field--nested"
        [class.form-field--full-width]="isFullWidth(field, parentPath)"
        [class.form-field--error]="hasErrorNested(field.name, formGroup)"
        [style.grid-column]="'span ' + getFieldColumnSpan(field.name, parentPath)"
        [formGroup]="formGroup"
      >
        @if (field.displayType !== 'checkbox') {
          <label class="form-field__label" [attr.for]="field.name">
            {{ field.label }}
            @if (field.required) {
              <span class="form-field__required">*</span>
            }
          </label>
        }

        @switch (field.displayType) {
          @case ('textbox') {
            <input
              type="text"
              class="form-field__input"
              [formControlName]="field.name"
              [placeholder]="field.placeholder || 'Enter ' + field.label.toLowerCase()"
            />
          }
          @case ('email') {
            <input
              type="email"
              class="form-field__input"
              [formControlName]="field.name"
              [placeholder]="field.placeholder || 'Enter email'"
            />
          }
          @case ('select') {
            <select class="form-field__select" [formControlName]="field.name">
              <option value="">Select {{ field.label }}</option>
              @for (option of field.options; track option.value) {
                <option [value]="option.value">{{ option.label }}</option>
              }
            </select>
          }
          @case ('checkbox') {
            <label class="form-field__checkbox">
              <input type="checkbox" [formControlName]="field.name" />
              <span class="form-field__checkbox-label">{{ field.label }}</span>
            </label>
          }
          @case ('stepper') {
            <div class="form-field__stepper">
              <button type="button" class="stepper-btn" (click)="decrementStepper(field, formGroup)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </button>
              <input
                type="number"
                class="stepper-input"
                [formControlName]="field.name"
                [attr.min]="field.min"
                [attr.max]="field.max"
              />
              <button type="button" class="stepper-btn" (click)="incrementStepper(field, formGroup)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </button>
            </div>
          }
          @default {
            <input
              type="text"
              class="form-field__input"
              [formControlName]="field.name"
              [placeholder]="field.placeholder || 'Enter ' + field.label.toLowerCase()"
            />
          }
        }

        @if (hasErrorNested(field.name, formGroup)) {
          <span class="form-field__error">{{ getErrorMessageNested(field, formGroup) }}</span>
        }
      </div>
    </ng-template>
  `,
  styleUrl: './dynamic-form.component.scss',
})
export class DynamicFormComponent implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly destroy$ = new Subject<void>();

  // Track open dropdown states
  private openDropdowns = new Set<string>();

  // Inputs
  readonly schema = input<DynamicFormSchema | null>(null);
  readonly values = input<Record<string, unknown>>({});
  readonly columns = input<1 | 2>(2);
  readonly emptyMessage = input<string>('');
  readonly excludeFields = input<string[]>([]);
  readonly fieldColumns = input<Record<string, number>>({});
  readonly defaultFieldColumns = input<number>(1);

  // Outputs
  readonly valuesChange = output<Record<string, unknown>>();
  readonly validChange = output<boolean>();

  // Form - using signal for change detection
  readonly formSignal = signal<FormGroup | null>(null);
  get form(): FormGroup | null {
    return this.formSignal();
  }

  // Quill editor configuration
  readonly quillModules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ header: [1, 2, 3, false] }],
      ['link'],
      ['clean'],
    ],
    clipboard: {
      matchVisual: false,
    },
  };

  // Computed fields from schema
  readonly fields = computed<FormField[]>(() => {
    const schema = this.schema();
    if (!schema?.properties) return [];
    return this.parseSchemaToFields(schema);
  });

  // Track current schema to detect changes
  private currentSchemaRef: DynamicFormSchema | null = null;

  constructor() {
    // Rebuild form when schema changes, patch values when only values change
    effect(() => {
      const schema = this.schema();
      const values = this.values();
      const fields = this.fields();
      const currentForm = this.formSignal();

      if (!schema || fields.length === 0) return;

      // Check if schema actually changed (not just values)
      const schemaChanged = schema !== this.currentSchemaRef;

      if (schemaChanged || !currentForm) {
        // Schema changed or no form exists - rebuild
        this.currentSchemaRef = schema;
        this.buildForm(fields, values);
      }
      // Don't patch values - it interferes with Quill editor
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===========================================================================
  // Form Building
  // ===========================================================================

  private buildForm(fields: FormField[], values: Record<string, unknown>): void {
    this.destroy$.next();

    const group: Record<string, AbstractControl> = {};

    for (const field of fields) {
      group[field.name] = this.createControlForField(field, values[field.name]);
    }

    const newForm = this.fb.group(group);

    // Emit value changes
    newForm.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(formValues => {
      this.valuesChange.emit(formValues);
    });

    // Emit validity changes
    newForm.statusChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.validChange.emit(newForm?.valid ?? false);
    });

    // Set the form signal to trigger change detection
    this.formSignal.set(newForm);

    // Emit initial validity
    this.validChange.emit(newForm.valid);
  }

  private createControlForField(field: FormField, value: unknown): AbstractControl {
    const validators = this.getValidators(field);

    // Handle nested objects (fieldset)
    if (field.displayType === 'fieldset' && field.nestedFields) {
      const nestedGroup: Record<string, AbstractControl> = {};
      const nestedValue = (value as Record<string, unknown>) || {};

      for (const nestedField of field.nestedFields) {
        nestedGroup[nestedField.name] = this.createControlForField(nestedField, nestedValue[nestedField.name]);
      }

      return this.fb.group(nestedGroup);
    }

    // Handle array of objects
    if (field.displayType === 'array-objects' && field.itemFields) {
      const arrayValue = (value as Record<string, unknown>[]) || [];
      const formArray = this.fb.array<FormGroup>([]);

      for (const itemValue of arrayValue) {
        formArray.push(this.createArrayItemGroup(field.itemFields, itemValue));
      }

      // Add minimum items if needed
      while (formArray.length < (field.minItems || 0)) {
        formArray.push(this.createArrayItemGroup(field.itemFields, {}));
      }

      return formArray;
    }

    // Handle multiselect and tags (arrays of primitives)
    if (field.displayType === 'multiselect' || field.displayType === 'multiselect-dropdown' || field.displayType === 'tags') {
      const arrayValue = (value as unknown[]) || [];
      return new FormControl(arrayValue, validators);
    }

    // Handle primitive values
    const initialValue = value ?? (field.type === 'boolean' ? false : '');
    return new FormControl(initialValue, validators);
  }

  private createArrayItemGroup(itemFields: FormField[], itemValue: Record<string, unknown>): FormGroup {
    const group: Record<string, AbstractControl> = {};

    for (const field of itemFields) {
      group[field.name] = this.createControlForField(field, itemValue[field.name]);
    }

    return this.fb.group(group);
  }

  // ===========================================================================
  // Validators
  // ===========================================================================

  private getValidators(field: FormField): ValidatorFn[] {
    const validators: ValidatorFn[] = [];

    if (field.required) {
      validators.push(Validators.required);
    }

    if (field.minLength !== undefined) {
      validators.push(Validators.minLength(field.minLength));
    }

    if (field.maxLength !== undefined) {
      validators.push(Validators.maxLength(field.maxLength));
    }

    if (field.min !== undefined) {
      validators.push(Validators.min(field.min));
    }

    if (field.max !== undefined) {
      validators.push(Validators.max(field.max));
    }

    if (field.pattern) {
      validators.push(Validators.pattern(field.pattern));
    }

    if (field.displayType === 'email') {
      validators.push(Validators.email);
    }

    if (field.displayType === 'url') {
      validators.push(this.urlValidator());
    }

    return validators;
  }

  private urlValidator(): ValidatorFn {
    return (control: AbstractControl) => {
      if (!control.value) return null;
      const urlPattern = /^https?:\/\/.+/i;
      return urlPattern.test(control.value) ? null : { url: true };
    };
  }

  // ===========================================================================
  // Error Handling
  // ===========================================================================

  hasError(fieldName: string, formGroup: FormGroup): boolean {
    const control = formGroup.get(fieldName);
    return !!(control?.invalid && (control?.touched || control?.dirty));
  }

  hasErrorNested(fieldName: string, formGroup: FormGroup): boolean {
    const control = formGroup.get(fieldName);
    return !!(control?.invalid && (control?.touched || control?.dirty));
  }

  getErrorMessage(field: FormField, formGroup: FormGroup): string {
    const control = formGroup.get(field.name);
    return this.formatErrorMessage(field, control);
  }

  getErrorMessageNested(field: FormField, formGroup: FormGroup): string {
    const control = formGroup.get(field.name);
    return this.formatErrorMessage(field, control);
  }

  private formatErrorMessage(field: FormField, control: AbstractControl | null): string {
    if (!control?.errors) return '';

    if (control.errors['required']) {
      return `${field.label} is required`;
    }
    if (control.errors['email']) {
      return 'Please enter a valid email address';
    }
    if (control.errors['url']) {
      return 'Please enter a valid URL (starting with http:// or https://)';
    }
    if (control.errors['minlength']) {
      const minLength = control.errors['minlength'].requiredLength;
      return `${field.label} must be at least ${minLength} characters`;
    }
    if (control.errors['maxlength']) {
      const maxLength = control.errors['maxlength'].requiredLength;
      return `${field.label} must be no more than ${maxLength} characters`;
    }
    if (control.errors['min']) {
      return `${field.label} must be at least ${field.min}`;
    }
    if (control.errors['max']) {
      return `${field.label} must be no more than ${field.max}`;
    }
    if (control.errors['pattern']) {
      return `${field.label} format is invalid`;
    }

    return 'Invalid value';
  }

  // ===========================================================================
  // Schema Parsing
  // ===========================================================================

  private parseSchemaToFields(schema: DynamicFormSchema): FormField[] {
    const fields: FormField[] = [];
    const properties = schema.properties || {};
    const required = schema.required || [];

    for (const [name, prop] of Object.entries(properties)) {
      const type = Array.isArray(prop.type) ? prop.type[0] : (prop.type || 'string');
      let displayType = prop['x-display-type'] || this.inferDisplayType(prop, type);

      // Normalize display type aliases
      if (displayType === 'dropdown') displayType = 'select';

      const field: FormField = {
        name,
        label: prop.title || this.formatLabel(name),
        type,
        displayType,
        required: required.includes(name),
        options: this.parseOptions(prop),
        min: prop.minimum,
        max: prop.maximum,
        minLength: prop.minLength,
        maxLength: prop.maxLength,
        minItems: prop.minItems,
        maxItems: prop.maxItems,
        pattern: prop.pattern,
        placeholder: prop['placeholder'] as string,
        description: prop.description,
      };

      // Handle nested object
      if (displayType === 'fieldset' && prop.properties) {
        field.nestedFields = this.parseSchemaToFields(prop);
        field.nestedRequired = prop.required || [];
      }

      // Handle array of objects
      if (displayType === 'array-objects' && prop.items?.properties) {
        field.itemFields = this.parseSchemaToFields(prop.items);
        field.itemRequired = prop.items.required || [];
      }

      // Handle array of enums/oneOf (multiselect)
      if ((displayType === 'multiselect' || displayType === 'multiselect-dropdown') && prop.items) {
        field.options = this.parseOptions(prop.items);
      }

      fields.push(field);
    }

    return fields;
  }

  private inferDisplayType(prop: DynamicFormSchema, type: string): string {
    // Check x-display-type first (already handled in caller, but be safe)
    if (prop['x-display-type']) return prop['x-display-type'];

    // Check format
    if (prop.format === 'date' || prop.format === 'date-time') return 'datepicker';
    if (prop.format === 'time') return 'timepicker';
    if (prop.format === 'email') return 'email';
    if (prop.format === 'uri' || prop.format === 'url') return 'url';

    // Check for enum or oneOf (select)
    if (prop.enum && prop.enum.length > 0) return 'select';
    if (this.hasOneOfOptions(prop)) return 'select';

    // Check type
    if (type === 'boolean') return 'checkbox';
    if (type === 'number' || type === 'integer') return 'stepper';

    // Handle object type
    if (type === 'object' && prop.properties) return 'fieldset';

    // Handle array type
    if (type === 'array' && prop.items) {
      // Array of enums or oneOf = multiselect
      if (prop.items.enum && prop.items.enum.length > 0) return 'multiselect';
      if (this.hasOneOfOptions(prop.items)) return 'multiselect';
      // Array of objects = repeatable fieldset
      if (prop.items.type === 'object' && prop.items.properties) return 'array-objects';
      // Array of primitives = tags
      return 'tags';
    }

    return 'textbox';
  }

  /**
   * Check if schema has oneOf with const values (labeled options)
   */
  private hasOneOfOptions(schema: DynamicFormSchema): boolean {
    const oneOf = schema['oneOf'] as DynamicFormSchema[] | undefined;
    if (!oneOf || !Array.isArray(oneOf) || oneOf.length === 0) return false;
    // Check if at least one item has 'const'
    return oneOf.some(item => item && typeof item === 'object' && 'const' in item);
  }

  /**
   * Parse options from enum or oneOf format
   */
  private parseOptions(schema: DynamicFormSchema): FormFieldOption[] | undefined {
    // Handle simple enum
    if (schema.enum && Array.isArray(schema.enum) && schema.enum.length > 0) {
      return schema.enum.map(value => ({
        value: value as string | number,
        label: String(value),
      }));
    }

    // Handle oneOf with const/title (labeled values)
    const oneOf = schema['oneOf'] as DynamicFormSchema[] | undefined;
    if (oneOf && Array.isArray(oneOf) && oneOf.length > 0) {
      const options: FormFieldOption[] = [];
      for (const item of oneOf) {
        if (item && typeof item === 'object' && 'const' in item) {
          const constValue = item['const'] as string | number;
          const title = item.title as string | undefined;
          options.push({
            value: constValue,
            label: title || String(constValue),
          });
        }
      }
      if (options.length > 0) return options;
    }

    return undefined;
  }

  private formatLabel(name: string): string {
    return name
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  // ===========================================================================
  // Field Helpers
  // ===========================================================================

  /**
   * Get the number of columns a field should span.
   * Priority: fieldColumns override > always-full-width types > defaultFieldColumns
   */
  getFieldColumnSpan(fieldName: string, parentPath: string = ''): number {
    const totalColumns = this.columns();
    const fullPath = parentPath ? `${parentPath}.${fieldName}` : fieldName;
    const fieldColumnsMap = this.fieldColumns();

    // Check for explicit override in fieldColumns (supports path patterns like excludeFields)
    for (const [pattern, span] of Object.entries(fieldColumnsMap)) {
      const regexPattern = pattern
        .replace(/\./g, '\\.')
        .replace(/\[\*\]/g, '\\[\\d+\\]');
      const regex = new RegExp(`^${regexPattern}$`);
      if (regex.test(fullPath)) {
        return Math.min(span, totalColumns);
      }
    }

    // If columns is 1, everything is full width
    if (totalColumns === 1) {
      return 1;
    }

    // Return default
    return Math.min(this.defaultFieldColumns(), totalColumns);
  }

  /**
   * Check if field should be full width (for CSS class compatibility)
   */
  isFullWidth(field: FormField, parentPath: string = ''): boolean {
    // Fieldset and array-objects always full width (they contain nested grids)
    if (field.displayType === 'fieldset' || field.displayType === 'array-objects') {
      return true;
    }
    return this.getFieldColumnSpan(field.name, parentPath) >= this.columns();
  }

  // ===========================================================================
  // Stepper Operations
  // ===========================================================================

  incrementStepper(field: FormField, formGroup: FormGroup): void {
    const control = formGroup.get(field.name);
    if (!control) return;

    const current = (control.value as number) || 0;
    const step = field.step || 1;
    const max = field.max ?? Infinity;
    const newValue = Math.min(current + step, max);
    control.setValue(newValue);
    control.markAsTouched();
  }

  decrementStepper(field: FormField, formGroup: FormGroup): void {
    const control = formGroup.get(field.name);
    if (!control) return;

    const current = (control.value as number) || 0;
    const step = field.step || 1;
    const min = field.min ?? 0;
    const newValue = Math.max(current - step, min);
    control.setValue(newValue);
    control.markAsTouched();
  }

  // ===========================================================================
  // Multiselect Operations
  // ===========================================================================

  isOptionSelected(fieldName: string, option: string | number, formGroup: FormGroup): boolean {
    const control = formGroup.get(fieldName);
    const values = (control?.value as (string | number)[]) || [];
    return values.includes(option);
  }

  toggleMultiselectOption(fieldName: string, option: string | number, formGroup: FormGroup): void {
    const control = formGroup.get(fieldName);
    if (!control) return;

    const values = [...((control.value as (string | number)[]) || [])];
    const index = values.indexOf(option);

    if (index > -1) {
      values.splice(index, 1);
    } else {
      values.push(option);
    }

    control.setValue(values);
    control.markAsTouched();
  }

  // ===========================================================================
  // Multiselect Dropdown Operations
  // ===========================================================================

  isDropdownOpen(fieldName: string): boolean {
    return this.openDropdowns.has(fieldName);
  }

  toggleDropdown(fieldName: string): void {
    if (this.openDropdowns.has(fieldName)) {
      this.openDropdowns.delete(fieldName);
    } else {
      // Close other dropdowns
      this.openDropdowns.clear();
      this.openDropdowns.add(fieldName);
    }
  }

  getMultiselectDisplayText(field: FormField, formGroup: FormGroup): string {
    const control = formGroup.get(field.name);
    const values = (control?.value as (string | number)[]) || [];

    if (values.length === 0) {
      return `Select ${field.label}...`;
    }

    if (values.length === 1 && field.options) {
      const option = field.options.find(o => o.value === values[0]);
      return option?.label || String(values[0]);
    }

    return `${values.length} selected`;
  }

  // ===========================================================================
  // Tags Operations
  // ===========================================================================

  getTagsValue(fieldName: string, formGroup: FormGroup): string[] {
    const control = formGroup.get(fieldName);
    return (control?.value as string[]) || [];
  }

  addTag(fieldName: string, event: Event, formGroup: FormGroup): void {
    event.preventDefault();
    const input = event.target as HTMLInputElement;
    const value = input.value.trim();

    if (!value) return;

    const control = formGroup.get(fieldName);
    if (!control) return;

    const values = [...((control.value as string[]) || [])];
    if (!values.includes(value)) {
      values.push(value);
      control.setValue(values);
      control.markAsTouched();
    }

    input.value = '';
  }

  removeTag(fieldName: string, index: number, formGroup: FormGroup): void {
    const control = formGroup.get(fieldName);
    if (!control) return;

    const values = [...((control.value as string[]) || [])];
    values.splice(index, 1);
    control.setValue(values);
    control.markAsTouched();
  }

  // ===========================================================================
  // Nested Object Operations
  // ===========================================================================

  getNestedFormGroup(fieldName: string, formGroup: FormGroup): FormGroup {
    return formGroup.get(fieldName) as FormGroup;
  }

  // ===========================================================================
  // Array Operations
  // ===========================================================================

  getFormArrayControls(fieldName: string, formGroup: FormGroup): AbstractControl[] {
    const formArray = formGroup.get(fieldName) as FormArray;
    return formArray?.controls || [];
  }

  getArrayItemFormGroup(fieldName: string, index: number, formGroup: FormGroup): FormGroup {
    const formArray = formGroup.get(fieldName) as FormArray;
    return formArray.at(index) as FormGroup;
  }

  addArrayItem(field: FormField, formGroup: FormGroup): void {
    if (!field.itemFields) return;

    const formArray = formGroup.get(field.name) as FormArray;
    formArray.push(this.createArrayItemGroup(field.itemFields, {}));
  }

  removeArrayItem(fieldName: string, index: number, formGroup: FormGroup): void {
    const formArray = formGroup.get(fieldName) as FormArray;
    formArray.removeAt(index);
  }

  // ===========================================================================
  // Field Exclusion
  // ===========================================================================

  /**
   * Check if a field path should be excluded from rendering.
   * Supports:
   * - Top-level: 'fieldName'
   * - Nested: 'address.street'
   * - Array wildcard: 'contacts[*].phone' matches 'contacts[0].phone', etc.
   */
  isFieldExcluded(fieldName: string, parentPath: string = ''): boolean {
    const fullPath = parentPath ? `${parentPath}.${fieldName}` : fieldName;
    const excludes = this.excludeFields();

    return excludes.some(pattern => {
      // Convert pattern to regex: replace [*] with \[\d+\]
      const regexPattern = pattern
        .replace(/\./g, '\\.')
        .replace(/\[\*\]/g, '\\[\\d+\\]');
      const regex = new RegExp(`^${regexPattern}$`);
      return regex.test(fullPath);
    });
  }

  /**
   * Build path for array item fields
   */
  buildArrayItemPath(arrayName: string, index: number, parentPath: string = ''): string {
    const arrayPath = parentPath ? `${parentPath}.${arrayName}` : arrayName;
    return `${arrayPath}[${index}]`;
  }

  // ===========================================================================
  // Public Methods
  // ===========================================================================

  getValue(): Record<string, unknown> {
    return this.form?.value ?? {};
  }

  isValid(): boolean {
    return this.form?.valid ?? false;
  }

  markAllTouched(): void {
    this.form?.markAllAsTouched();
  }
}
