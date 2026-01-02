import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    RouterOutlet,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatToolbarModule,
    MatButtonModule,
    MatTooltipModule,
  ],
  template: `
    <div class="app-layout">
      <header class="app-header">
        <div class="header-left">
          <button
            mat-icon-button
            class="menu-toggle"
            (click)="toggleSidebar()"
            [matTooltip]="collapsed() ? 'Expand menu' : 'Collapse menu'"
          >
            <mat-icon>{{ collapsed() ? 'menu' : 'menu_open' }}</mat-icon>
          </button>
          <div class="logo">
            <div class="logo-icon">
              <mat-icon>hub</mat-icon>
            </div>
            <div class="logo-text" [class.hidden]="collapsed()">
              <span class="logo-title">DataMapper</span>
              <span class="logo-badge">Studio</span>
            </div>
          </div>
        </div>
      </header>

      <div class="app-body">
        <nav class="sidebar" [class.collapsed]="collapsed()">
          <div class="nav-section">
            <span class="nav-label" [class.hidden]="collapsed()">WORKSPACE</span>
            <a
              class="nav-item"
              routerLink="/schemas"
              routerLinkActive="active"
              [matTooltip]="collapsed() ? 'Schemas' : ''"
              matTooltipPosition="right"
            >
              <mat-icon>data_object</mat-icon>
              <span [class.hidden]="collapsed()">Schemas</span>
            </a>
            <a
              class="nav-item"
              routerLink="/mappings"
              routerLinkActive="active"
              [matTooltip]="collapsed() ? 'Mappings' : ''"
              matTooltipPosition="right"
            >
              <mat-icon>swap_horiz</mat-icon>
              <span [class.hidden]="collapsed()">Mappings</span>
            </a>
          </div>
        </nav>

        <main class="main-content">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .app-layout {
      display: flex;
      flex-direction: column;
      height: 100vh;
      background: #0f172a;
    }

    .app-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 16px;
      height: 56px;
      background: #0f172a;
      border-bottom: 1px solid #1e293b;
      flex-shrink: 0;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .menu-toggle {
      color: #64748b;
      width: 36px;
      height: 36px;

      &:hover {
        color: #94a3b8;
        background: #1e293b;
      }

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .logo-icon {
      width: 32px;
      height: 32px;
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;

      mat-icon {
        color: white;
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    }

    .logo-text {
      display: flex;
      align-items: baseline;
      gap: 6px;
      transition: opacity 0.15s ease, width 0.15s ease;

      &.hidden {
        opacity: 0;
        width: 0;
        overflow: hidden;
      }
    }

    .logo-title {
      font-size: 16px;
      font-weight: 600;
      color: white;
      letter-spacing: -0.3px;
    }

    .logo-badge {
      font-size: 10px;
      font-weight: 500;
      color: #6366f1;
      background: rgba(99, 102, 241, 0.15);
      padding: 2px 5px;
      border-radius: 3px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .app-body {
      display: flex;
      flex: 1;
      min-height: 0;
    }

    .sidebar {
      width: 200px;
      background: #0f172a;
      border-right: 1px solid #1e293b;
      padding: 16px 10px;
      flex-shrink: 0;
      transition: width 0.15s ease;

      &.collapsed {
        width: 56px;
        padding: 16px 8px;
      }
    }

    .nav-section {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .nav-label {
      font-size: 10px;
      font-weight: 600;
      color: #475569;
      letter-spacing: 0.5px;
      padding: 6px 10px;
      margin-bottom: 4px;
      transition: opacity 0.15s ease;

      &.hidden {
        opacity: 0;
        height: 0;
        padding: 0;
        margin: 0;
        overflow: hidden;
      }
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 9px 10px;
      border-radius: 6px;
      color: #94a3b8;
      text-decoration: none;
      font-size: 13px;
      font-weight: 500;
      transition: all 0.12s ease;
      white-space: nowrap;

      &:hover {
        background: #1e293b;
        color: #e2e8f0;
      }

      &.active {
        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
        color: white;
        box-shadow: 0 2px 8px rgba(99, 102, 241, 0.25);
      }

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
        flex-shrink: 0;
      }

      span {
        transition: opacity 0.15s ease;

        &.hidden {
          opacity: 0;
          width: 0;
          overflow: hidden;
        }
      }
    }

    .main-content {
      flex: 1;
      min-width: 0;
      background: #f8fafc;
      overflow: hidden;
    }

    .hidden {
      opacity: 0;
      width: 0;
      overflow: hidden;
    }
  `],
})
export class AppLayoutComponent {
  collapsed = signal(false);

  toggleSidebar(): void {
    this.collapsed.update(v => !v);
  }
}
