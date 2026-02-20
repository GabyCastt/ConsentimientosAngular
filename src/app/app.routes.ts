
import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Rutas públicas
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component')
      .then(m => m.LoginComponent)
  },
  {
    // Ruta con query parameter: /formulario?token=xxx (como en la maqueta original)
    path: 'formulario',
    loadComponent: () => import('./features/formularios/formulario-publico/formulario-publico.component')
      .then(m => m.FormularioPublicoComponent)
  },
  {
    // Ruta con route parameter: /formulario/:token (alternativa)
    path: 'formulario/:token',
    loadComponent: () => import('./features/formularios/formulario-publico/formulario-publico.component')
      .then(m => m.FormularioPublicoComponent)
  },
  
  // Rutas protegidas
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/admin-layout/admin-layout.component')
      .then(m => m.AdminLayoutComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component')
          .then(m => m.DashboardComponent)
      },
      {
        path: 'clientes',
        loadChildren: () => import('./features/clientes/clientes.routes')
          .then(m => m.CLIENTES_ROUTES)
      },
      {
        path: 'formularios',
        loadComponent: () => import('./features/formularios/lista-formularios/lista-formularios.component')
          .then(m => m.ListaFormulariosComponent)
      },
      {
        path: 'documentos',
        loadComponent: () => import('./features/documentos/lista-documentos/lista-documentos.component')
          .then(m => m.ListaDocumentosComponent)
      },
      {
        path: 'empresas',
        loadComponent: () => import('./features/empresas/lista-empresas/lista-empresas.component')
          .then(m => m.ListaEmpresasComponent)
      },
      {
        path: 'didit/admin',
        loadComponent: () => import('./features/verificacion/didit/panel-admin/panel-admin.component')
          .then(m => m.PanelAdminComponent)
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },
  
  // Redirect por defecto
  {
    path: '**',
    redirectTo: 'login'
  }
];