import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      console.error(' HTTP Error:', error);

      // Manejar errores específicos
      switch (error.status) {
        case 401:
          // Token expirado o inválido
          console.error(' Error 401: No autorizado');
          
          // CORREGIDO: No redirigir al login si estamos en una ruta pública
          const currentUrl = router.url;
          const isPublicRoute = currentUrl.includes('/formulario') || 
                               currentUrl.includes('/login');
          
          if (!isPublicRoute) {
            // Solo redirigir al login si NO estamos en una ruta pública
            authService.logout();
            router.navigate(['/login'], {
              queryParams: { returnUrl: currentUrl, reason: 'session_expired' }
            });
          } else {
            console.warn('WARNING: Error 401 en ruta pública - No se redirige al login');
          }
          break;

        case 403:
          // Sin permisos
          console.error(' Error 403: Acceso denegado');
          alert('No tienes permisos para realizar esta acción');
          break;

        case 404:
          // Recurso no encontrado
          console.error(' Error 404: Recurso no encontrado');
          console.error('URL:', error.url);
          break;

        case 500:
          // Error del servidor
          console.error(' Error 500: Error interno del servidor');
          alert('Error del servidor. Por favor, intenta más tarde.');
          break;

        case 0:
          // Error de red
          console.error(' Error de red: No se puede conectar al servidor');
          alert('Error de conexión. Verifica tu conexión a internet.');
          break;

        default:
          console.error(` Error ${error.status}:`, error.message);
      }

      return throwError(() => error);
    })
  );
};