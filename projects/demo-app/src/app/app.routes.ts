import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'mapper',
    pathMatch: 'full',
  },
  {
    path: 'mapper',
    loadComponent: () =>
      import('./pages/mapper-page/mapper-page.component').then(
        (m) => m.MapperPageComponent
      ),
  },
  {
    path: 'schema',
    loadComponent: () =>
      import('./pages/schema-editor-page/schema-editor-page.component').then(
        (m) => m.SchemaEditorPageComponent
      ),
  },
  {
    path: 'schema/:id',
    loadComponent: () =>
      import('./pages/schema-editor-page/schema-editor-page.component').then(
        (m) => m.SchemaEditorPageComponent
      ),
  },
];
