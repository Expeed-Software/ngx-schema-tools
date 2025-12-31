import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { SchemaField, DefaultValue } from '../../models/schema.model';

@Component({
  selector: 'default-value-popover',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSelectModule,
    MatSlideToggleModule,
  ],
  templateUrl: './default-value-popover.component.html',
  styleUrl: './default-value-popover.component.scss',
})
export class DefaultValuePopoverComponent implements OnInit {
  @Input() field!: SchemaField;
  @Input() existingValue?: DefaultValue;
  @Input() position!: { x: number; y: number };

  @Output() save = new EventEmitter<string | number | boolean | Date | null>();
  @Output() delete = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  stringValue = '';
  numberValue: number | null = null;
  booleanValue = false;
  dateValue: Date | null = null;

  ngOnInit(): void {
    if (this.existingValue) {
      switch (this.existingValue.valueType) {
        case 'string':
          this.stringValue = this.existingValue.value as string || '';
          break;
        case 'number':
          this.numberValue = this.existingValue.value as number;
          break;
        case 'boolean':
          this.booleanValue = this.existingValue.value as boolean;
          break;
        case 'date':
          this.dateValue = this.existingValue.value ? new Date(this.existingValue.value as string) : null;
          break;
      }
    }
  }

  get fieldType(): string {
    if (this.field.type === 'date' || this.field.name.toLowerCase().includes('date')) {
      return 'date';
    }
    return this.field.type;
  }

  onSave(): void {
    let value: string | number | boolean | Date | null;

    switch (this.fieldType) {
      case 'number':
        value = this.numberValue;
        break;
      case 'boolean':
        value = this.booleanValue;
        break;
      case 'date':
        value = this.dateValue;
        break;
      default:
        value = this.stringValue || null;
    }

    this.save.emit(value);
  }

  onDelete(): void {
    this.delete.emit();
  }

  onClose(): void {
    this.close.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('popover-backdrop')) {
      this.onClose();
    }
  }
}
