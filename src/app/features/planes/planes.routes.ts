import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';

export const PLANES_ROUTES: Routes = [
  // Admin: Gestión de catálogo de planes
  {
    path: 'catalogo',
    canActivate: [roleGuard],
    data: { roles: ['admin'] },
    loadComponent: () => import('./catalogo-planes/catalogo-planes.component')
      .then(m => m.CatalogoPlanesComponent)
  },
  {
    path: 'catalogo/crear',
    canActivate: [roleGuard],
    data: { roles: ['admin'] },
    loadComponent: () => import('./crear-plan/crear-plan.component')
      .then(m => m.CrearPlanComponent)
  },
  {
    path: 'catalogo/editar/:id',
    canActivate: [roleGuard],
    data: { roles: ['admin'] },
    loadComponent: () => import('./editar-plan/editar-plan.component')
      .then(m => m.EditarPlanComponent)
  },
  
  // Admin: Ver todas las suscripciones
  {
    path: 'suscripciones',
    canActivate: [roleGuard],
    data: { roles: ['admin'] },
    loadComponent: () => import('./lista-suscripciones/lista-suscripciones.component')
      .then(m => m.ListaSuscripcionesComponent)
  },
  
  // Admin/Distribuidor: Asignar plan a empresa
  {
    path: 'asignar/:empresaId',
    canActivate: [roleGuard],
    data: { roles: ['admin', 'distribuidor'] },
    loadComponent: () => import('./asignar-plan-empresa/asignar-plan-empresa.component')
      .then(m => m.AsignarPlanEmpresaComponent)
  },
  
  // Distribuidor: Mis planes disponibles
  {
    path: 'mis-planes',
    canActivate: [roleGuard],
    data: { roles: ['distribuidor'] },
    loadComponent: () => import('./mis-planes/mis-planes.component')
      .then(m => m.MisPlanesComponent)
  },
  
  // Empresa: Ver mi plan
  {
    path: 'mi-plan',
    canActivate: [roleGuard],
    data: { roles: ['empresa'] },
    loadComponent: () => import('./mi-plan/mi-plan.component')
      .then(m => m.MiPlanComponent)
  },
  
  // Empresa: Ver catálogo (solo lectura)
  {
    path: 'ver-planes',
    canActivate: [roleGuard],
    data: { roles: ['empresa'] },
    loadComponent: () => import('./ver-planes/ver-planes.component')
      .then(m => m.VerPlanesComponent)
  }
];
