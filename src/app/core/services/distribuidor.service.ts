import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface DistribuidorEmpresa {
  id: number;
  nombre: string;
  ruc?: string;
  email?: string;
  telefono?: string;
  logo?: string;
  activo: boolean;
}

export interface UsuarioEmpresa {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  empresa_id: number;
  activo: boolean;
  created_at: string;
}

export interface EstadisticasEmpresa {
  total_formularios: number;
  total_clientes: number;
  total_respuestas: number;
  formularios_activos: number;
  clientes_recientes: number;
}

@Injectable({
  providedIn: 'root'
})
export class DistribuidorService {
  constructor(private api: ApiService) {}

  /**
   * Obtener empresas asignadas al distribuidor
   */
  getMisEmpresas(): Observable<DistribuidorEmpresa[]> {
    return this.api.get<DistribuidorEmpresa[]>('/api/distribuidores/mis-empresas');
  }

  /**
   * Crear usuario tipo 'empresa' para una empresa específica
   */
  crearUsuarioEmpresa(empresaId: number, data: {
    email: string;
    password: string;
    nombre: string;
  }): Observable<any> {
    return this.api.post(`/api/distribuidores/empresas/${empresaId}/usuarios`, data);
  }

  /**
   * Obtener usuarios de una empresa
   */
  getUsuariosEmpresa(empresaId: number): Observable<UsuarioEmpresa[]> {
    return this.api.get<UsuarioEmpresa[]>(`/api/distribuidores/empresas/${empresaId}/usuarios`);
  }

  /**
   * Actualizar usuario de empresa
   */
  actualizarUsuarioEmpresa(empresaId: number, userId: number, data: {
    nombre?: string;
    email?: string;
    password?: string;
    activo?: boolean;
  }): Observable<any> {
    return this.api.put(`/api/distribuidores/empresas/${empresaId}/usuarios/${userId}`, data);
  }

  /**
   * Eliminar usuario de empresa
   */
  eliminarUsuarioEmpresa(empresaId: number, userId: number): Observable<any> {
    return this.api.delete(`/api/distribuidores/empresas/${empresaId}/usuarios/${userId}`);
  }

  /**
   * Obtener estadísticas de una empresa
   */
  getEstadisticasEmpresa(empresaId: number): Observable<EstadisticasEmpresa> {
    return this.api.get<EstadisticasEmpresa>(`/api/distribuidores/empresas/${empresaId}/estadisticas`);
  }
}
