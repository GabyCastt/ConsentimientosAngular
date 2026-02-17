import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

interface MenuItem {
  label: string;
  icon: string;
  route: string;
  roles?: string[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <div class="sidebar text-white">
      <div class="p-3">
        <h4>
          <i class="fas fa-shield-alt"></i> ConsentPro
        </h4>
      </div>
      
      <nav class="nav flex-column p-3">
        @for (item of visibleMenuItems(); track item.route) {
          <a 
            class="nav-link text-white" 
            [routerLink]="item.route"
            routerLinkActive="active">
            <i [class]="item.icon"></i> {{ item.label }}
          </a>
        }
        
        <div class="nav-divider"></div>
        
        <a class="nav-link text-white" (click)="logout()" style="cursor: pointer;">
          <i class="fas fa-sign-out-alt"></i> Cerrar Sesión
        </a>
      </nav>
    </div>
  `,
  styles: [`
    .sidebar {
      min-height: 100vh;
      background: linear-gradient(135deg, #042396 100%);
      position: sticky;
      top: 0;
    }
    
    .nav-link {
      padding: 0.75rem 1rem;
      border-radius: 8px;
      margin-bottom: 0.5rem;
      transition: all 0.3s ease;
    }
    
    .nav-link:hover {
      background: rgba(255, 255, 255, 0.1);
    }
    
    .nav-link.active {
      background: rgba(255, 255, 255, 0.2);
      font-weight: 600;
    }
    
    .nav-link i {
      margin-right: 0.5rem;
      width: 20px;
    }
    
    .nav-divider {
      height: 1px;
      background: rgba(255, 255, 255, 0.2);
      margin: 1rem 0;
    }
  `]
})
export class SidebarComponent {
  private menuItems: MenuItem[] = [
    { label: 'Dashboard', icon: 'fas fa-tachometer-alt', route: '/dashboard' },
    { label: 'Clientes', icon: 'fas fa-users', route: '/clientes' },
    { label: 'Formularios', icon: 'fas fa-clipboard-list', route: '/formularios' },
    { label: 'Documentos', icon: 'fas fa-file-pdf', route: '/documentos' },
    { 
      label: 'Empresas', 
      icon: 'fas fa-building', 
      route: '/empresas',
      roles: ['admin', 'super_admin']
    }
  ];

  constructor(private authService: AuthService) {}

  // Computed signal para filtrar menú según rol
  visibleMenuItems = computed(() => {
    const user = this.authService.currentUser();
    if (!user) return [];

    return this.menuItems.filter(item => {
      if (!item.roles) return true;
      return item.roles.includes(user.rol);
    });
  });

  logout(): void {
    this.authService.logout();
  }
}