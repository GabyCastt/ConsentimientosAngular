import { Routes } from '@angular/router';

export const EMPRESAS_ROUTES: Routes = [
  {
    path: 'perfil',
    loadComponent: () => import('./perfil-empresa/perfil-empresa.component')
      .then(m => m.PerfilEmpresaComponent),
    title: 'Perfil de Empresa'
  },
  {
    path: 'lista',
    loadComponent: () => import('./lista-empresas/lista-empresas.component')
      .then(m => m.ListaEmpresasComponent),
    title: 'Gestión de Empresas'
  },
  {
    path: '',
    redirectTo: 'perfil',
    pathMatch: 'full'
  }
];
