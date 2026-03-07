import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

interface MenuItem {
  label: string;
  icon: string;
  route: string;
  roles?: string[];
  disabled?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <div class="sidebar text-white">
      <div class="sidebar-header">
        <div class="logo-container">
          <i class="fas fa-shield-alt logo-icon"></i>
          <h3 class="logo-text">ConsentPro</h3>
        </div>
        <p class="logo-subtitle">Sistema de Gestión</p>
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
        
        <a class="nav-link text-white logout-link" (click)="logout()">
          <i class="fas fa-sign-out-alt"></i> Cerrar Sesión
        </a>
      </nav>
    </div>
  `,
  styles: [`
    .sidebar {
      min-height: 100vh;
      background: linear-gradient(180deg, #042396 0%, #0d47a1 100%);
      position: sticky;
      top: 0;
      box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
    }

    .sidebar-header {
      padding: 2rem 1.5rem;
      text-align: center;
      border-bottom: 1px solid rgba(255, 255, 255, 0.2);
      background: rgba(255, 255, 255, 0.05);
    }

    .logo-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.5rem;
    }

    .logo-icon {
      font-size: 3rem;
      color: white;
      filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
      animation: pulse 2s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% {
        transform: scale(1);
      }
      50% {
        transform: scale(1.05);
      }
    }

    .logo-text {
      font-size: 1.75rem;
      font-weight: 700;
      margin: 0;
      color: white;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
      letter-spacing: 0.5px;
    }

    .logo-subtitle {
      font-size: 0.8rem;
      color: rgba(255, 255, 255, 0.85);
      margin: 0;
      font-weight: 500;
    }
    
    .nav-link {
      padding: 0.875rem 1rem;
      border-radius: 8px;
      margin-bottom: 0.5rem;
      transition: all 0.3s ease;
      font-weight: 500;
      font-size: 0.95rem;
    }
    
    .nav-link:hover {
      background: rgba(255, 255, 255, 0.15);
      transform: translateX(5px);
    }
    
    .nav-link.active {
      background: rgba(255, 255, 255, 0.25);
      font-weight: 600;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }
    
    .nav-link.disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .logout-link {
      cursor: pointer;
      color: rgba(255, 255, 255, 0.9) !important;
    }

    .logout-link:hover {
      background: rgba(255, 0, 0, 0.2) !important;
    }
    
    .nav-link i {
      margin-right: 0.75rem;
      width: 20px;
      text-align: center;
    }
    
    .nav-divider {
      height: 1px;
      background: rgba(255, 255, 255, 0.2);
      margin: 1rem 0;
    }

    @media (max-width: 768px) {
      .logo-icon {
        font-size: 2.5rem;
      }

      .logo-text {
        font-size: 1.5rem;
      }

      .sidebar-header {
        padding: 1.5rem 1rem;
      }
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
      label: 'Mi Empresa', 
      icon: 'fas fa-building', 
      route: '/empresas/perfil',
      roles: ['empresa']
    },
    { 
      label: 'Mis Usuarios', 
      icon: 'fas fa-user-friends', 
      route: '/usuarios/mis-usuarios',
      roles: ['empresa']
    },
    { 
      label: 'Mi Plan', 
      icon: 'fas fa-star', 
      route: '/planes/mi-plan',
      roles: ['empresa']
    },
    { 
      label: 'Mis Empresas', 
      icon: 'fas fa-building', 
      route: '/empresas/lista',
      roles: ['distribuidor']
    },
    { 
      label: 'Mis Planes', 
      icon: 'fas fa-box', 
      route: '/planes/mis-planes',
      roles: ['distribuidor']
    },
    { 
      label: 'Gestión Empresas', 
      icon: 'fas fa-building', 
      route: '/empresas/lista',
      roles: ['admin']
    },
    { 
      label: 'Distribuidores', 
      icon: 'fas fa-user-tie', 
      route: '/distribuidores/lista',
      roles: ['admin']
    },
    { 
      label: 'Catálogo de Planes', 
      icon: 'fas fa-tags', 
      route: '/planes/catalogo',
      roles: ['admin']
    },
    { 
      label: 'Suscripciones', 
      icon: 'fas fa-list-alt', 
      route: '/planes/suscripciones',
      roles: ['admin']
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