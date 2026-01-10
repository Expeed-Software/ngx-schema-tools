import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectorRef,
  ApplicationRef,
  inject,
  signal,
  OnInit,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

// Display type options for form rendering
type DisplayType = 'textbox' | 'dropdown' | 'textarea' | 'richtext' | 'datepicker' | 'datetimepicker' | 'timepicker' | 'stepper' | 'checkbox' | 'toggle';

// Internal representation for UI editing
export interface EditorField {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'time' | 'object' | 'array';
  format?: string;
  displayType?: DisplayType;
  label?: string;
  required?: boolean;
  defaultValue?: string | number | boolean;
  allowedValues?: string[];
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  minimum?: number;
  maximum?: number;
  children?: EditorField[];
  expanded?: boolean;
  isEditingValues?: boolean;
  isEditingDefault?: boolean;
  isEditingValidators?: boolean;
}

@Component({
  selector: 'field-item',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatTooltipModule,
    MatMenuModule,
    DragDropModule,
    FieldItemComponent,
  ],
  templateUrl: './field-item.component.html',
  styleUrls: ['./field-item.component.scss'],
})
export class FieldItemComponent implements OnInit, OnChanges {
  cdr = inject(ChangeDetectorRef);
  appRef = inject(ApplicationRef);

  // Local expanded state to bypass change detection issues - using signal for better reactivity
  localExpanded = signal(false);

  @Input() field!: EditorField;
  @Input() parentList!: EditorField[];
  @Input() level = 0;
  @Input() showDisplayType = false;

  @Output() fieldChange = new EventEmitter<void>();
  @Output() delete = new EventEmitter<EditorField>();
  @Output() duplicate = new EventEmitter<EditorField>();
  @Output() outdent = new EventEmitter<EditorField>();

  fieldTypes: Array<{ value: string; label: string; icon: string }> = [
    { value: 'string', label: 'String', icon: 'text_fields' },
    { value: 'number', label: 'Number', icon: 'pin' },
    { value: 'boolean', label: 'Boolean', icon: 'toggle_on' },
    { value: 'date', label: 'Date', icon: 'calendar_today' },
    { value: 'time', label: 'Time', icon: 'schedule' },
    { value: 'object', label: 'Object', icon: 'data_object' },
    { value: 'array', label: 'Array', icon: 'data_array' },
  ];

  stringDisplayTypes: Array<{ value: DisplayType; label: string; icon: string }> = [
    { value: 'textbox', label: 'Textbox', icon: 'edit' },
    { value: 'dropdown', label: 'Dropdown', icon: 'arrow_drop_down_circle' },
    { value: 'textarea', label: 'Textarea', icon: 'notes' },
    { value: 'richtext', label: 'Rich Text', icon: 'format_color_text' },
  ];

  dateDisplayTypes: Array<{ value: DisplayType; label: string; icon: string }> = [
    { value: 'datepicker', label: 'Date Picker', icon: 'calendar_today' },
    { value: 'datetimepicker', label: 'DateTime Picker', icon: 'schedule' },
    { value: 'textbox', label: 'Textbox', icon: 'edit' },
  ];

  timeDisplayTypes: Array<{ value: DisplayType; label: string; icon: string }> = [
    { value: 'timepicker', label: 'Time Picker', icon: 'schedule' },
    { value: 'textbox', label: 'Textbox', icon: 'edit' },
  ];

  numberDisplayTypes: Array<{ value: DisplayType; label: string; icon: string }> = [
    { value: 'textbox', label: 'Textbox', icon: 'edit' },
    { value: 'stepper', label: 'Stepper', icon: 'unfold_more' },
  ];

  booleanDisplayTypes: Array<{ value: DisplayType; label: string; icon: string }> = [
    { value: 'checkbox', label: 'Checkbox', icon: 'check_box' },
    { value: 'toggle', label: 'Toggle', icon: 'toggle_on' },
  ];

  stringFormats: Array<{ value: string; label: string }> = [
    { value: '', label: '(none)' },
    { value: 'email', label: 'Email' },
    { value: 'uri', label: 'URI (URL)' },
    { value: 'uuid', label: 'UUID' },
  ];

  getDisplayTypes(fieldType: string): Array<{ value: DisplayType; label: string; icon: string }> {
    if (fieldType === 'date') return this.dateDisplayTypes;
    if (fieldType === 'time') return this.timeDisplayTypes;
    if (fieldType === 'number') return this.numberDisplayTypes;
    if (fieldType === 'boolean') return this.booleanDisplayTypes;
    return this.stringDisplayTypes;
  }

  getTypeIcon(type: string): string {
    return this.fieldTypes.find(t => t.value === type)?.icon || 'help_outline';
  }

  ngOnInit(): void {
    // Initialize localExpanded from field.expanded if it exists
    if (this.field?.expanded !== undefined) {
      this.localExpanded.set(this.field.expanded);
    }
    // Initialize children array for object/array types if needed
    if ((this.field?.type === 'object' || this.field?.type === 'array') && !this.field.children) {
      this.field.children = [];
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // When field input changes, sync localExpanded with field.expanded
    // But PRESERVE localExpanded if field.expanded is false/undefined and we have a true value
    if (changes['field']) {
      if (this.field) {
        // If field.expanded is explicitly true, use it (we just set it)
        if (this.field.expanded === true) {
          this.localExpanded.set(true);
        }
        // If field.expanded is explicitly false, use it (user collapsed)
        else if (this.field.expanded === false) {
          this.localExpanded.set(false);
        }
        // If field.expanded is undefined, preserve current localExpanded state
        // This happens when parent updates and field object is new but doesn't have expanded set yet
        else {
          // Preserve current localExpanded, and sync field.expanded to match
          if (this.field.expanded !== this.localExpanded()) {
            this.field.expanded = this.localExpanded();
          }
        }
        
        // Initialize children array for object/array types if needed
        if ((this.field.type === 'object' || this.field.type === 'array') && !this.field.children) {
          this.field.children = [];
        }
      }
    }
  }

  private generateId(): string {
    return `field-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  toggleExpand(): void {
    this.handleExpandClick();
  }

  handleExpandClick(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    
    // Ensure children array exists
    if (!this.field.children) {
      this.field.children = [];
    }
    
    // Toggle local expanded state (using signal)
    const newExpandedState = !this.localExpanded();
    this.localExpanded.set(newExpandedState);
    // Sync to field.expanded (mutation persists because field object reference stays the same)
    this.field.expanded = newExpandedState;
    
    // Force immediate change detection - this should trigger template re-render
    this.cdr.markForCheck();
    this.cdr.detectChanges();
    
    // Don't emit fieldChange - expand/collapse is local UI state only
    // We only emit when actual field data changes (name, type, children, etc.)
  }

  onFieldNameChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const sanitized = input.value.replace(/[^a-zA-Z0-9_$]/g, '');
    this.field.name = sanitized;
    if (input.value !== sanitized) {
      input.value = sanitized;
    }
  }

  onFieldNameBlur(): void {
    if (!this.field.name.trim()) {
      this.field.name = 'unnamed';
    }
    this.fieldChange.emit();
  }

  onFieldTypeChange(type: string): void {
    this.field.type = type as EditorField['type'];
    if ((type === 'object' || type === 'array') && !this.field.children) {
      this.field.children = [];
    }
    if (type === 'string') this.field.displayType = 'textbox';
    else if (type === 'number') this.field.displayType = 'textbox';
    else if (type === 'boolean') this.field.displayType = 'checkbox';
    else if (type === 'date') this.field.displayType = 'datepicker';
    else if (type === 'time') this.field.displayType = 'timepicker';
    else this.field.displayType = undefined;
    this.fieldChange.emit();
  }

  onDisplayTypeChange(displayType: string): void {
    this.field.displayType = displayType as DisplayType;
    this.fieldChange.emit();
  }

  toggleRequired(): void {
    this.field.required = !this.field.required;
    this.fieldChange.emit();
  }

  onLabelChange(label: string): void {
    this.field.label = label;
  }

  onLabelBlur(): void {
    this.fieldChange.emit();
  }

  addChildField(): void {
    if (!this.field.children) {
      this.field.children = [];
    }
    const newField: EditorField = {
      id: this.generateId(),
      name: '',
      type: 'string',
      displayType: 'textbox',
    };
    this.field.children.push(newField);
    this.localExpanded.set(true);
    this.field.expanded = true;
    this.cdr.detectChanges();
    this.fieldChange.emit();
  }

  deleteField(): void {
    this.delete.emit(this.field);
  }

  duplicateField(): void {
    this.duplicate.emit(this.field);
  }

  onChildFieldChange(): void {
    // Just propagate the change up - don't force detectChanges as it can reset expanded state
    this.fieldChange.emit();
  }

  onChildDelete(child: EditorField): void {
    if (this.field.children) {
      const index = this.field.children.indexOf(child);
      if (index > -1) {
        this.field.children.splice(index, 1);
        this.cdr.detectChanges();
        this.fieldChange.emit();
      }
    }
  }

  onChildDuplicate(child: EditorField): void {
    if (this.field.children) {
      const index = this.field.children.indexOf(child);
      if (index > -1) {
        const clone: EditorField = {
          ...child,
          id: this.generateId(),
          name: child.name + '_copy',
          children: child.children ? this.cloneFields(child.children) : undefined,
        };
        this.field.children.splice(index + 1, 0, clone);
        this.cdr.detectChanges();
        this.fieldChange.emit();
      }
    }
  }

  private cloneFields(fields: EditorField[]): EditorField[] {
    return fields.map(f => ({
      ...f,
      id: this.generateId(),
      children: f.children ? this.cloneFields(f.children) : undefined,
    }));
  }

  onFieldDrop(event: CdkDragDrop<EditorField[]>): void {
    if (event.previousIndex !== event.currentIndex && this.field.children) {
      moveItemInArray(this.field.children, event.previousIndex, event.currentIndex);
      // Don't emit fieldChange for reorder - array is mutated in place
      // and emitting causes parent re-render which resets expanded state
    }
  }

  canIndent(): boolean {
    const index = this.parentList.indexOf(this.field);
    if (index <= 0) return false;
    const prevSibling = this.parentList[index - 1];
    return prevSibling.type === 'object' || prevSibling.type === 'array';
  }

  indentField(): void {
    const index = this.parentList.indexOf(this.field);
    if (index <= 0) return;
    const prevSibling = this.parentList[index - 1];
    if (prevSibling.type !== 'object' && prevSibling.type !== 'array') return;

    this.parentList.splice(index, 1);
    if (!prevSibling.children) prevSibling.children = [];
    prevSibling.children.push(this.field);
    prevSibling.expanded = true;
    // Don't emit fieldChange - arrays are mutated in place
  }

  canOutdent(): boolean {
    return this.level > 0;
  }

  outdentField(): void {
    if (this.level <= 0) return;
    this.outdent.emit(this.field);
  }

  onChildOutdent(child: EditorField): void {
    if (!this.field.children) return;
    const childIndex = this.field.children.indexOf(child);
    if (childIndex === -1) return;

    // Remove child from this field's children
    this.field.children.splice(childIndex, 1);

    // Add to parent list after this field
    const myIndex = this.parentList.indexOf(this.field);
    this.parentList.splice(myIndex + 1, 0, child);

    // Don't emit fieldChange - arrays are mutated in place
  }

  toggleValuesEditor(): void {
    this.field.isEditingValues = !this.field.isEditingValues;
    if (this.field.isEditingValues) {
      this.field.isEditingDefault = false;
      this.field.isEditingValidators = false;
      if (!this.field.allowedValues) this.field.allowedValues = [];
    }
    this.fieldChange.emit();
  }

  addAllowedValue(input: HTMLInputElement | Event): void {
    let inputEl: HTMLInputElement | null = null;
    if (input instanceof HTMLInputElement) {
      inputEl = input;
    } else {
      const target = input.target as HTMLElement;
      const header = target.closest('.values-header');
      inputEl = header?.querySelector('.value-input') as HTMLInputElement;
    }
    if (!inputEl) return;

    const value = inputEl.value.trim();
    if (value && !this.field.allowedValues?.includes(value)) {
      if (!this.field.allowedValues) this.field.allowedValues = [];
      this.field.allowedValues.push(value);
      inputEl.value = '';
      this.fieldChange.emit();
    }
  }

  removeAllowedValue(index: number): void {
    if (this.field.allowedValues) {
      this.field.allowedValues.splice(index, 1);
      if (this.field.allowedValues.length === 0) this.field.allowedValues = undefined;
      this.fieldChange.emit();
    }
  }

  onAllowedValueKeydown(event: KeyboardEvent, input: HTMLInputElement): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.addAllowedValue(input);
    }
  }

  toggleDefaultEditor(): void {
    this.field.isEditingDefault = !this.field.isEditingDefault;
    if (this.field.isEditingDefault) {
      this.field.isEditingValues = false;
      this.field.isEditingValidators = false;
    }
    this.fieldChange.emit();
  }

  onDefaultValueChange(value: string): void {
    if (value === '') {
      this.field.defaultValue = undefined;
    } else if (this.field.type === 'number') {
      const num = parseFloat(value);
      this.field.defaultValue = isNaN(num) ? undefined : num;
    } else if (this.field.type === 'boolean') {
      this.field.defaultValue = value === 'true';
    } else {
      this.field.defaultValue = value;
    }
    this.fieldChange.emit();
  }

  clearDefaultValue(): void {
    this.field.defaultValue = undefined;
    this.field.isEditingDefault = false;
    this.fieldChange.emit();
  }

  onDefaultValueKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === 'Escape') {
      this.field.isEditingDefault = false;
      this.fieldChange.emit();
    }
  }

  toggleValidatorsEditor(): void {
    this.field.isEditingValidators = !this.field.isEditingValidators;
    if (this.field.isEditingValidators) {
      this.field.isEditingValues = false;
      this.field.isEditingDefault = false;
    }
    this.fieldChange.emit();
  }

  hasValidators(): boolean {
    if (this.field.type === 'string') {
      return !!(this.field.minLength || this.field.maxLength || this.field.pattern || this.field.format);
    }
    if (this.field.type === 'number') {
      return this.field.minimum !== undefined || this.field.maximum !== undefined;
    }
    return false;
  }

  onFormatChange(format: string): void {
    this.field.format = format || undefined;
    if (format) this.field.pattern = undefined;
    this.fieldChange.emit();
  }

  onMinLengthChange(value: string): void {
    this.field.minLength = value ? parseInt(value, 10) : undefined;
    this.fieldChange.emit();
  }

  onMaxLengthChange(value: string): void {
    this.field.maxLength = value ? parseInt(value, 10) : undefined;
    this.fieldChange.emit();
  }

  onPatternChange(value: string): void {
    this.field.pattern = value || undefined;
    this.fieldChange.emit();
  }

  onMinimumChange(value: string): void {
    this.field.minimum = value ? parseFloat(value) : undefined;
    this.fieldChange.emit();
  }

  onMaximumChange(value: string): void {
    this.field.maximum = value ? parseFloat(value) : undefined;
    this.fieldChange.emit();
  }

  canAddChildToArray(): boolean {
    return this.field.type === 'array' && (!this.field.children || this.field.children.length === 0);
  }

  getEmptyMessage(): string {
    return this.field.type === 'array' ? 'No item schema defined' : 'No child fields';
  }

  getAddButtonLabel(): string {
    return this.field.type === 'array' ? 'Define item schema' : 'Add field';
  }

  shouldShowNestedFields(): boolean {
    return (this.field.type === 'object' || this.field.type === 'array') && this.localExpanded();
  }
}
