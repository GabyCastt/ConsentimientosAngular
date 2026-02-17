import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white border-bottom p-3 mb-4">
      <div class="d-flex justify-content-between align-items-center">
        <h2 class="mb-0">{{ pageTitle() }}</h2>
        
        <div class="user-info">
          <span class="text-muted">Bienvenido, </span>
          <strong>{{ userName() }}</strong>
          <span class="badge bg-primary ms-2">{{ userRole() }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .user-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .badge {
      text-transform: uppercase;
      font-size: 0.75rem;
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
    return 'Dashboard';
  });
}