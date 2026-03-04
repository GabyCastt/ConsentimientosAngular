import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard para verificar roles de usuario
 * Uso en rutas:
 * {
 *   path: 'admin',
 *   canActivate: [roleGuard(['admin'])]
 * }
 */
export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // Verificar si está autenticado
    if (!authService.isAuthenticated()) {
      router.navigate(['/login'], {
        queryParams: { returnUrl: state.url }
      });
      return false;
    }

    // Verificar si tiene el rol permitido
    if (authService.hasRole(...allowedRoles)) {
      return true;
    }

    // Si no tiene el rol, redirigir al dashboard
    console.warn(`Acceso denegado. Roles permitidos: ${allowedRoles.join(', ')}`);
    router.navigate(['/dashboard']);
    return false;
  };
};
