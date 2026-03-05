import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { 
  Empresa, 
  EmpresaConEstadisticas,
  EmpresasListResponse, 
  EmpresaResponse,
  EmpresaPerfil,
  CreateEmpresaDto,
  UpdateEmpresaDto
} from '../models/empresa.model';

@Injectable({
  providedIn: 'root'
})
export class EmpresaService {
  constructor(private api: ApiService) {}

  // ==========================================
  // ENDPOINTS PARA ADMIN Y DISTRIBUIDOR
  // ==========================================

  /**
   * Listar empresas
   * - Admin: Ve todas las empresas del sistema
   * - Distribuidor: Ve solo sus empresas asignadas
   */
  listarEmpresas(): Observable<EmpresasListResponse> {
    return this.api.get<EmpresasListResponse>('/api/empresas');
  }

  /**
   * Crear nueva empresa con usuario tipo 'empresa'
   * - Admin: Puede crear empresas para cualquier distribuidor
   * - Distribuidor: Crea empresas que se le asignan automáticamente
   */
  crearEmpresa(data: CreateEmpresaDto): Observable<EmpresaResponse> {
    const formData = this.buildFormData(data);
    return this.api.post<EmpresaResponse>('/api/empresas', formData);
  }

  /**
   * Obtener empresa por ID (Solo Admin)
   */
  obtenerEmpresa(id: number): Observable<{ empresa: EmpresaConEstadisticas }> {
    return this.api.get<{ empresa: EmpresaConEstadisticas }>(`/api/empresas/${id}`);
  }

  /**
   * Actualizar empresa
   * - Admin: Puede actualizar cualquier empresa
   * - Distribuidor: Solo puede actualizar sus empresas asignadas
   */
  actualizarEmpresa(id: number, data: UpdateEmpresaDto): Observable<EmpresaResponse> {
    const formData = this.buildFormData(data);
    return this.api.put<EmpresaResponse>(`/api/empresas/${id}`, formData);
  }

  /**
   * Eliminar empresa (Solo Admin)
   * No se puede eliminar si tiene usuarios o clientes asociados
   */
  eliminarEmpresa(id: number): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>(`/api/empresas/${id}`);
  }

  /**
   * Limpiar empresas huérfanas (Solo Admin)
   * Elimina empresas sin usuarios, clientes ni formularios
   */
  limpiarEmpresasHuerfanas(): Observable<{
    message: string;
    empresas_eliminadas: number;
    empresas_huerfanas_encontradas: number;
    errores?: string[];
    nota: string;
  }> {
    return this.api.post<any>('/api/empresas/limpiar-huerfanas', {});
  }

  // ==========================================
  // ENDPOINTS PARA USUARIO TIPO 'EMPRESA'
  // ==========================================

  /**
   * Obtener perfil de la empresa del usuario actual (Usuario Empresa)
   * Incluye estadísticas detalladas
   */
  obtenerPerfil(): Observable<EmpresaPerfil> {
    return this.api.get<EmpresaPerfil>('/api/empresas/perfil');
  }

  /**
   * Actualizar perfil de la empresa del usuario actual (Usuario Empresa)
   */
  actualizarPerfil(data: UpdateEmpresaDto): Observable<EmpresaResponse> {
    const formData = this.buildFormData(data);
    return this.api.put<EmpresaResponse>('/api/empresas/perfil', formData);
  }

  // ==========================================
  // MÉTODOS AUXILIARES
  // ==========================================

  /**
   * Construye FormData para envío de datos con archivos
   */
  private buildFormData(data: CreateEmpresaDto | UpdateEmpresaDto): FormData {
    const formData = new FormData();

    Object.keys(data).forEach(key => {
      const value = (data as any)[key];
      
      if (value !== undefined && value !== null) {
        if (value instanceof File) {
          formData.append(key, value);
        } else {
          formData.append(key, String(value));
        }
      }
    });

    return formData;
  }
}
