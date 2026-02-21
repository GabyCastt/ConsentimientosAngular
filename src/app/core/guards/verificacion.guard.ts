import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const verificacionGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  const user = authService.currentUser();
  
  // Verificar si el usuario tiene correo o teléfono verificado
  if (user && (user.email_verificado || user.telefono_verificado)) {
    return true;
  }
  
  // Si no está verificado, redirigir al dashboard con mensaje
  router.navigate(['/dashboard'], {
    queryParams: { verificacionRequerida: true }
  });
  return false;
};
