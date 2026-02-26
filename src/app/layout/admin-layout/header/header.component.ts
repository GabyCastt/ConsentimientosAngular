import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="header-container bg-white border-bottom p-3 mb-4">
      <div class="d-flex justify-content-between align-items-center">
        <h2 class="mb-0 page-title">{{ pageTitle() }}</h2>
        
        <div class="user-info">
          <span class="text-muted me-1">Bienvenido,</span>
          <strong class="user-name">{{ userName() }}</strong>
          <span class="badge user-badge" [ngClass]="getBadgeClass()">{{ userRole() }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .header-container {
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    .page-title {
      font-size: 1.5rem;
      font-weight: 600;
      color: #1a1a1a;
    }

    .user-info {
      display: flex;
      align-items: center;
      padding: 0.5rem 1rem;
      background: #f8f9fa;
      border-radius: 20px;
      border: 1px solid #e9ecef;
    }

    .user-name {
      color: #042396;
      font-size: 1rem;
      font-weight: 600;
    }
    
    .user-badge {
      text-transform: uppercase;
      font-size: 0.7rem;
      font-weight: 600;
      padding: 0.35rem 0.75rem;
      margin-left: 0.5rem;
    }

    .badge-admin {
      background: #28a745 !important;
      color: white !important;
    }

    .badge-super-admin {
      background: #17a2b8 !important;
      color: white !important;
    }

    .badge-distribuidor {
      background: #042396 !important;
      color: white !important;
    }

    .badge-empresa {
      background: #6f42c1 !important;
      color: white !important;
    }

    .badge-usuario {
      background: #6c757d !important;
      color: white !important;
    }

    @media (max-width: 768px) {
      .page-title {
        font-size: 1.25rem;
      }

      .user-info {
        padding: 0.375rem 0.75rem;
      }

      .user-name {
        font-size: 0.9rem;
      }
    }
  `]
})
export class HeaderComponent {
  constructor(private authService: AuthService) {}

  userName = computed(() => {
    const user = this.authService.currentUser();
    return user?.nombre || 'Usuario';
  });

  userRole = computed(() => {
    const user = this.authService.currentUser();
    return user?.rol || 'usuario';
  });

  pageTitle = computed(() => {
    // Puedes hacer esto más dinámico con el Router
    return 'Gestión de formularios';
  });

  getBadgeClass(): string {
    const role = this.userRole();
    const roleMap: { [key: string]: string } = {
      'admin': 'badge-admin',
      'super_admin': 'badge-super-admin',
      'distribuidor': 'badge-distribuidor',
      'empresa': 'badge-empresa',
      'usuario': 'badge-usuario'
    };
    return roleMap[role] || 'badge-usuario';
  }
}