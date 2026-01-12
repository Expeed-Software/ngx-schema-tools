import { Routes } from '@angular/router';
import { AppLayoutComponent } from './layout/app-layout.component';

export const routes: Routes = [
  {
    path: '',
    component: AppLayoutComponent,
    children: [
      {
        path: '',
        redirectTo: 'schemas',
        pathMatch: 'full',
      },
      {
        path: 'schemas',
        loadComponent: () =>
          import('./pages/schema-editor-page/schema-editor-page.component').then(
            (m) => m.SchemaEditorPageComponent
          ),
      },
      {
        path: 'schemas/:id',
        loadComponent: () =>
          import('./pages/schema-editor-page/schema-editor-page.component').then(
            (m) => m.SchemaEditorPageComponent
          ),
      },
      {
        path: 'mappings',
        loadComponent: () =>
          import('./pages/mappings-page/mappings-page.component').then(
            (m) => m.MappingsPageComponent
          ),
      },
      {
        path: 'schema-creator',
        loadComponent: () =>
          import('./pages/schema-creator-page/schema-creator-page.component').then(
            (m) => m.SchemaCreatorPageComponent
          ),
      },
      {
        path: 'dyna-form',
        loadComponent: () =>
          import('./pages/dyna-form-page/dyna-form-page.component').then(
            (m) => m.DynaFormPageComponent
          ),
      },
      {
        path: 'form-layout',
        loadComponent: () =>
          import('./pages/form-layout-page/form-layout-page.component').then(
            (m) => m.FormLayoutPageComponent
          ),
      },
      {
        path: 'quill-test',
        loadComponent: () =>
          import('./pages/quill-test-page/quill-test-page.component').then(
            (m) => m.QuillTestPageComponent
          ),
      },
      {
        path: 'mapper/:id',
        loadComponent: () =>
          import('./pages/mapper-page/mapper-page.component').then(
            (m) => m.MapperPageComponent
          ),
      },
    ],
  },
  // Legacy route redirect
  {
    path: 'mapper',
    redirectTo: 'mappings',
    pathMatch: 'full',
  },
  {
    path: 'schema',
    redirectTo: 'schemas',
    pathMatch: 'full',
  },
];
