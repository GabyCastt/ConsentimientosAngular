import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { ConfigService } from '../../core/services/config.service';

export interface EmpresaEstadisticas {
  total_usuarios: number;
  total_clientes: number;
  total_formularios: number;
  total_consentimientos: number;
  consentimientos_firmados: number;
  consentimientos_revocados: number;
  consentimientos_pendientes: number;
  respuestas_formularios: {
    total: number;
    verificados: number;
    completados: number;
    pendientes: number;
  };
  metodo_mas_usado: string;
  metodo_mas_usado_total: number;
}

export interface Empresa {
  id: number;
  nombre: string;
  ruc?: string;
  email?: string;
  telefono?: string;
  slogan?: string;
  logo?: string;
  created_at?: string;
  updated_at?: string;
  // Estadísticas básicas (para lista)
  total_usuarios?: number;
  total_clientes?: number;
  total_formularios?: number;
  total_consentimientos?: number;
  // Estadísticas detalladas (para perfil)
  estadisticas?: EmpresaEstadisticas;
}

export interface EmpresaPerfil {
  empresa: Empresa;
}

export interface EmpresasListResponse {
  empresas: Empresa[];
  total: number;
}

export interface EmpresaResponse {
  message?: string;
  empresa: Empresa;
}

export interface CreateEmpresaDto {
  nombre: string;
  ruc?: string;
  email?: string;
  telefono?: string;
  slogan?: string;
  logo?: File;
}

export interface CreateEmpresaConDistribuidorDto {
  nombre: string;
  slogan?: string;
  logo?: File;
  usuario_email: string;
  usuario_password: string;
  usuario_nombre: string;
}

export interface CreateEmpresaConDistribuidorResponse {
  message: string;
  empresa: Empresa;
  usuario: {
    id: number;
    email: string;
    nombre: string;
    rol: string;
    empresa_id: number;
  };
}

export interface UpdateEmpresaDto {
  nombre?: string;
  ruc?: string;
  email?: string;
  telefono?: string;
  slogan?: string;
  logo?: File;
}

@Injectable({
  providedIn: 'root'
})
export class EmpresasService {
  constructor(
    private api: ApiService,
    private config: ConfigService
  ) {}

  // Obtener perfil de empresa (para distribuidores)
  getPerfil(): Observable<EmpresaPerfil> {
    return this.api.get<EmpresaPerfil>(this.config.endpoints.empresasPerfil);
  }

  // Actualizar perfil de empresa (para distribuidores)
  updatePerfil(data: UpdateEmpresaDto): Observable<EmpresaResponse> {
    const formData = new FormData();
    
    // Solo enviar los campos permitidos por el API de perfil
    if (data.nombre) formData.append('nombre', data.nombre);
    if (data.slogan) formData.append('slogan', data.slogan);
    if (data.logo) formData.append('logo', data.logo);

    return this.api.put<EmpresaResponse>(this.config.endpoints.empresasPerfil, formData);
  }

  // Listar todas las empresas (solo admin)
  getEmpresas(): Observable<EmpresasListResponse> {
    return this.api.get<EmpresasListResponse>(this.config.endpoints.empresas);
  }

  // Obtener empresa por ID (solo admin)
  getEmpresa(id: number): Observable<EmpresaResponse> {
    return this.api.get<EmpresaResponse>(`${this.config.endpoints.empresas}/${id}`);
  }

  // Crear empresa (solo admin)
  createEmpresa(data: CreateEmpresaDto): Observable<EmpresaResponse> {
    const formData = new FormData();
    formData.append('nombre', data.nombre);
    
    if (data.ruc) formData.append('ruc', data.ruc);
    if (data.email) formData.append('email', data.email);
    if (data.telefono) formData.append('telefono', data.telefono);
    if (data.slogan) formData.append('slogan', data.slogan);
    if (data.logo) formData.append('logo', data.logo);

    return this.api.post<EmpresaResponse>(this.config.endpoints.empresas, formData);
  }

  // Crear empresa con usuario distribuidor (solo admin)
  createEmpresaConDistribuidor(data: CreateEmpresaConDistribuidorDto): Observable<CreateEmpresaConDistribuidorResponse> {
    const formData = new FormData();
    formData.append('nombre', data.nombre);
    formData.append('usuario_email', data.usuario_email);
    formData.append('usuario_password', data.usuario_password);
    formData.append('usuario_nombre', data.usuario_nombre);
    
    if (data.slogan) formData.append('slogan', data.slogan);
    if (data.logo) formData.append('logo', data.logo);

    return this.api.post<CreateEmpresaConDistribuidorResponse>(this.config.endpoints.empresas, formData);
  }

  // Actualizar empresa (solo admin)
  updateEmpresa(id: number, data: UpdateEmpresaDto): Observable<EmpresaResponse> {
    const formData = new FormData();
    
    if (data.nombre) formData.append('nombre', data.nombre);
    if (data.ruc) formData.append('ruc', data.ruc);
    if (data.email) formData.append('email', data.email);
    if (data.telefono) formData.append('telefono', data.telefono);
    if (data.slogan) formData.append('slogan', data.slogan);
    if (data.logo) formData.append('logo', data.logo);

    return this.api.put<EmpresaResponse>(`${this.config.endpoints.empresas}/${id}`, formData);
  }

  // Eliminar empresa (solo admin)
  deleteEmpresa(id: number): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>(`${this.config.endpoints.empresas}/${id}`);
  }

  // Limpiar empresas huérfanas (solo admin)
  limpiarEmpresasHuerfanas(): Observable<{ message: string; empresas_eliminadas: number }> {
    return this.api.post<{ message: string; empresas_eliminadas: number }>(
      `${this.config.endpoints.empresas}/limpiar-huerfanas`, 
      {}
    );
  }
}
