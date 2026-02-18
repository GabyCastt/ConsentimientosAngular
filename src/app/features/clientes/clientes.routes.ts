import { Routes } from '@angular/router';

export const CLIENTES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./lista-clientes/lista-clientes.component')
      .then(m => m.ListaClientesComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./detalle-cliente/detalle-cliente.component')
      .then(m => m.DetalleClienteComponent)
  }
];