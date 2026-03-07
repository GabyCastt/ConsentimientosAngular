import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';

export const DISTRIBUIDORES_ROUTES: Routes = [
  {
    path: 'lista',
    loadComponent: () => import('./lista-distribuidores/lista-distribuidores.component')
      .then(m => m.ListaDistribuidoresComponent),
    canActivate: [roleGuard(['admin'])],
    title: 'Gestión de Distribuidores'
  },
  {
    path: 'crear',
    loadComponent: () => import('./crear-distribuidor/crear-distribuidor.component')
      .then(m => m.CrearDistribuidorComponent),
    canActivate: [roleGuard(['admin'])],
    title: 'Crear Distribuidor'
  },
  {
    path: 'editar/:id',
    loadComponent: () => import('./editar-distribuidor/editar-distribuidor.component')
      .then(m => m.EditarDistribuidorComponent),
    canActivate: [roleGuard(['admin'])],
    title: 'Editar Distribuidor'
  },
  {
    path: 'detalle/:id',
    loadComponent: () => import('./detalle-distribuidor/detalle-distribuidor.component')
      .then(m => m.DetalleDistribuidorComponent),
    canActivate: [roleGuard(['admin'])],
    title: 'Detalle de Distribuidor'
  },
  {
    path: 'planes/:id',
    loadComponent: () => import('./planes-distribuidor/planes-distribuidor.component')
      .then(m => m.PlanesDistribuidorComponent),
    canActivate: [roleGuard(['admin'])],
    title: 'Planes del Distribuidor'
  },
  {
    path: '',
    redirectTo: 'lista',
    pathMatch: 'full'
  }
];
