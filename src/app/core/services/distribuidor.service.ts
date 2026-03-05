import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Empresa, EmpresaEstadisticas } from '../models/empresa.model';

export interface DistribuidorEmpresa extends Empresa {
  asignado_en?: string;
}

export interface UsuarioEmpresa {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  empresa_id: number;
  activo: boolean;
  created_at: string;
  updated_at?: string;
}

export interface DistribuidorEmpresasResponse {
  empresas: DistribuidorEmpresa[];
  total: number;
}

export interface UsuariosEmpresaResponse {
  usuarios: UsuarioEmpresa[];
  total: number;
}

export interface CrearUsuarioEmpresaResponse {
  message: string;
  usuario: {
    id: number;
    email: string;
    rol: string;
    nombre: string;
    empresa_id: number;
    empresa_nombre: string;
  };
}

export interface EstadisticasEmpresaResponse {
  empresa: {
    id: number;
    nombre: string;
    logo?: string | null;
    slogan?: string | null;
  };
  estadisticas: EmpresaEstadisticas;
}

@Injectable({
  providedIn: 'root'
})
export class DistribuidorService {
  constructor(private api: ApiService) {}

  /**
   * Obtener empresas asignadas al distribuidor
   */
  getMisEmpresas(): Observable<DistribuidorEmpresasResponse> {
    return this.api.get<DistribuidorEmpresasResponse>('/api/distribuidores/mis-empresas');
  }

  /**
   * Crear usuario tipo 'empresa' para una empresa específica
   */
  crearUsuarioEmpresa(empresaId: number, data: {
    email: string;
    password: string;
    nombre: string;
  }): Observable<CrearUsuarioEmpresaResponse> {
    return this.api.post<CrearUsuarioEmpresaResponse>(
      `/api/distribuidores/empresas/${empresaId}/usuarios`, 
      data
    );
  }

  /**
   * Obtener usuarios de una empresa
   */
  getUsuariosEmpresa(empresaId: number): Observable<UsuariosEmpresaResponse> {
    return this.api.get<UsuariosEmpresaResponse>(
      `/api/distribuidores/empresas/${empresaId}/usuarios`
    );
  }

  /**
   * Actualizar usuario de empresa
   */
  actualizarUsuarioEmpresa(empresaId: number, userId: number, data: {
    nombre?: string;
    email?: string;
    activo?: boolean;
  }): Observable<{ message: string; usuario: UsuarioEmpresa }> {
    return this.api.put<{ message: string; usuario: UsuarioEmpresa }>(
      `/api/distribuidores/empresas/${empresaId}/usuarios/${userId}`, 
      data
    );
  }

  /**
   * Eliminar usuario de empresa
   */
  eliminarUsuarioEmpresa(empresaId: number, userId: number): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>(
      `/api/distribuidores/empresas/${empresaId}/usuarios/${userId}`
    );
  }

  /**
   * Obtener estadísticas de una empresa
   */
  getEstadisticasEmpresa(empresaId: number): Observable<EstadisticasEmpresaResponse> {
    return this.api.get<EstadisticasEmpresaResponse>(
      `/api/distribuidores/empresas/${empresaId}/estadisticas`
    );
  }
}
