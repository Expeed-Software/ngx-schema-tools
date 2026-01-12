import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { QuillModule } from 'ngx-quill';

@Component({
  selector: 'quill-test-page',
  standalone: true,
  imports: [QuillModule, ReactiveFormsModule],
  template: `
    <div class="page">
      <h1>Quill Test Page</h1>
      <p>Type in the editor below:</p>
      <quill-editor [formControl]="control"></quill-editor>
    </div>
  `,
  styles: [`
    .page {
      padding: 24px;
    }
    h1 {
      margin: 0 0 8px;
    }
    p {
      margin: 0 0 16px;
      color: #666;
    }
  `],
})
export class QuillTestPageComponent {
  control = new FormControl('');
}
