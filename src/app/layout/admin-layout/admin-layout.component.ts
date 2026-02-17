import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './sidebar/sidebar.component';
import { HeaderComponent } from './header/header.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, HeaderComponent],
  template: `
    <div class="container-fluid">
      <div class="row">
        <!-- Sidebar -->
        <app-sidebar class="col-md-3 col-lg-2 p-0"></app-sidebar>
        
        <!-- Main Content -->
        <div class="col-md-9 col-lg-10 main-content">
          <app-header></app-header>
          
          <!-- Router Outlet para contenido dinámico -->
          <div class="content-wrapper p-4">
            <router-outlet></router-outlet>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .main-content {
      background-color: #f8f9fa;
      min-height: 100vh;
    }
    
    .content-wrapper {
      padding: 2rem;
    }
  `]
})
export class AdminLayoutComponent {}