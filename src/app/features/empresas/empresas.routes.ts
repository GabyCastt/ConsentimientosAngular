import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';

export const EMPRESAS_ROUTES: Routes = [
  // Perfil de empresa - Solo para usuarios tipo 'empresa'
  {
    path: 'perfil',
    loadComponent: () => import('./perfil-empresa/perfil-empresa.component')
      .then(m => m.PerfilEmpresaComponent),
    canActivate: [roleGuard(['empresa'])],
    title: 'Perfil de Empresa'
  },
  // Lista de empresas - Para admin y distribuidor
  {
    path: 'lista',
    loadComponent: () => import('./lista-empresas/lista-empresas.component')
      .then(m => m.ListaEmpresasComponent),
    canActivate: [roleGuard(['admin', 'distribuidor'])],
    title: 'Gestión de Empresas'
  },
  // Crear empresa - Para admin y distribuidor
  {
    path: 'crear',
    loadComponent: () => import('./crear-empresa/crear-empresa.component')
      .then(m => m.CrearEmpresaComponent),
    canActivate: [roleGuard(['admin', 'distribuidor'])],
    title: 'Crear Empresa'
  },
  // Editar empresa - Para admin y distribuidor
  {
    path: 'editar/:id',
    loadComponent: () => import('./editar-empresa/editar-empresa.component')
      .then(m => m.EditarEmpresaComponent),
    canActivate: [roleGuard(['admin', 'distribuidor'])],
    title: 'Editar Empresa'
  },
  // Detalle de empresa - Para admin y distribuidor
  {
    path: 'detalle/:id',
    loadComponent: () => import('./detalle-empresa/detalle-empresa.component')
      .then(m => m.DetalleEmpresaComponent),
    canActivate: [roleGuard(['admin', 'distribuidor'])],
    title: 'Detalle de Empresa'
  },
  {
    path: '',
    redirectTo: 'lista',
    pathMatch: 'full'
  }
];
