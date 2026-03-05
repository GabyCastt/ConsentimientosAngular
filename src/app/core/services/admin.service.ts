import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { 
  Distribuidor,
  DistribuidorEmpresaSimple,
  CrearDistribuidorRequest, 
  ActualizarDistribuidorRequest,
  CambiarPasswordRequest 
} from '../models/distribuidor.model';

export interface ListaDistribuidoresResponse {
  distribuidores: Distribuidor[];
  total: number;
}

export interface DistribuidorResponse {
  distribuidor: Distribuidor;
  empresas?: DistribuidorEmpresaSimple[];
}

export interface CrearDistribuidorResponse {
  message: string;
  distribuidor: Distribuidor;
}

export interface ActualizarDistribuidorResponse {
  message: string;
  distribuidor: Distribuidor;
}

export interface AsignarEmpresaResponse {
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  constructor(private api: ApiService) {}

  // Gestión de distribuidores
  getDistribuidores(): Observable<ListaDistribuidoresResponse> {
    return this.api.get<ListaDistribuidoresResponse>('/api/admin/distribuidores');
  }

  getDistribuidor(id: number): Observable<DistribuidorResponse> {
    return this.api.get<DistribuidorResponse>(`/api/admin/distribuidores/${id}`);
  }

  crearDistribuidor(data: CrearDistribuidorRequest): Observable<CrearDistribuidorResponse> {
    return this.api.post<CrearDistribuidorResponse>('/api/admin/distribuidores', data);
  }

  actualizarDistribuidor(id: number, data: ActualizarDistribuidorRequest): Observable<ActualizarDistribuidorResponse> {
    return this.api.put<ActualizarDistribuidorResponse>(`/api/admin/distribuidores/${id}`, data);
  }

  eliminarDistribuidor(id: number): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>(`/api/admin/distribuidores/${id}`);
  }

  asignarEmpresa(distribuidorId: number, empresaId: number): Observable<AsignarEmpresaResponse> {
    return this.api.post<AsignarEmpresaResponse>(
      `/api/admin/distribuidores/${distribuidorId}/empresas/${empresaId}`,
      {}
    );
  }

  desasignarEmpresa(distribuidorId: number, empresaId: number): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>(
      `/api/admin/distribuidores/${distribuidorId}/empresas/${empresaId}`
    );
  }

  cambiarPassword(id: number, data: CambiarPasswordRequest): Observable<{ message: string }> {
    return this.api.put<{ message: string }>(`/api/admin/distribuidores/${id}/password`, data);
  }

  // Obtener distribuidor de una empresa
  getDistribuidorDeEmpresa(empresaId: number): Observable<{
    tiene_distribuidor: boolean;
    empresa_id: number;
    distribuidor?: {
      id: number;
      nombre: string;
      email: string;
      asignado_en: string;
    };
    message?: string;
  }> {
    return this.api.get(`/api/admin/empresas/${empresaId}/distribuidor`);
  }
}
