import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';

export const USUARIOS_ROUTES: Routes = [
  // Rutas para EMPRESA - gestionar sus propios usuarios
  {
    path: 'mis-usuarios',
    loadComponent: () => import('./mis-usuarios/mis-usuarios.component')
      .then(m => m.MisUsuariosComponent),
    canActivate: [roleGuard(['empresa'])],
    title: 'Mis Usuarios'
  },
  
  // Rutas para ADMIN - gestionar usuarios de cualquier empresa
  {
    path: 'empresa/:empresaId',
    loadComponent: () => import('./usuarios-empresa/usuarios-empresa.component')
      .then(m => m.UsuariosEmpresaComponent),
    canActivate: [roleGuard(['admin'])],
    title: 'Usuarios de Empresa'
  },

  {
    path: '',
    redirectTo: 'mis-usuarios',
    pathMatch: 'full'
  }
];
