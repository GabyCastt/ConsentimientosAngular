import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Verificar si el usuario está autenticado (isAuthenticated es un signal)
  if (authService.isAuthenticated()) {
    return true;
  }

  // Si no está autenticado, redirigir al login
  router.navigate(['/login'], {
    queryParams: { returnUrl: state.url }
  });
  
  return false;
};
