import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { 
  Plan, 
  PlanEmpresa, 
  PlanActivo, 
  VerificarPlanResponse,
  AsignarPlanRequest,
  CrearPlanRequest
} from '../models/plan.model';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

@Injectable({
  providedIn: 'root'
})
export class PlanesService {
  constructor(private api: ApiService) {}

  // ==================== ADMIN ====================
  
  // Gestionar Catálogo de Planes
  getCatalogoPlanes(incluirInactivos: boolean = false): Observable<{ success: boolean; planes: Plan[] }> {
    const params = incluirInactivos ? '?incluir_inactivos=true' : '';
    const url = `/api/catalogo-planes${params}`;
    console.log('🔵 [PlanesService] Llamando a GET', url);
    console.log('Incluir inactivos:', incluirInactivos);
    return this.api.get<{ success: boolean; planes: Plan[] }>(url);
  }

  crearPlanCatalogo(plan: CrearPlanRequest): Observable<ApiResponse<{ planId: number }>> {
    console.log('🔵 [PlanesService] Llamando a POST /api/catalogo-planes');
    console.log('Datos enviados:', plan);
    return this.api.post<ApiResponse<{ planId: number }>>('/api/catalogo-planes', plan);
  }

  actualizarPlanCatalogo(planId: number, plan: Partial<CrearPlanRequest>): Observable<ApiResponse<any>> {
    console.log(`🔵 [PlanesService] Llamando a PUT /api/catalogo-planes/${planId}`);
    console.log('Datos enviados:', plan);
    return this.api.put<ApiResponse<any>>(`/api/catalogo-planes/${planId}`, plan);
  }

  desactivarPlanCatalogo(planId: number): Observable<ApiResponse<any>> {
    console.log(`🔵 [PlanesService] Llamando a PATCH /api/catalogo-planes/${planId}/desactivar`);
    return this.api.patch<ApiResponse<any>>(`/api/catalogo-planes/${planId}/desactivar`, {});
  }

  // Gestionar Planes de Distribuidores
  getPlanesDistribuidor(distribuidorId: number): Observable<{
    success: boolean;
    distribuidor: any;
    planes: Plan[];
  }> {
    console.log(`🔵 [PlanesService] Llamando a GET /api/distribuidores/${distribuidorId}/planes`);
    return this.api.get<any>(`/api/distribuidores/${distribuidorId}/planes`);
  }

  asignarPlanADistribuidor(distribuidorId: number, planId: number): Observable<ApiResponse<any>> {
    console.log(`🔵 [PlanesService] Llamando a POST /api/distribuidores/${distribuidorId}/planes/${planId}`);
    return this.api.post<ApiResponse<any>>(`/api/distribuidores/${distribuidorId}/planes/${planId}`, {});
  }

  removerPlanDeDistribuidor(distribuidorId: number, planId: number): Observable<ApiResponse<any>> {
    console.log(`🔵 [PlanesService] Llamando a DELETE /api/distribuidores/${distribuidorId}/planes/${planId}`);
    return this.api.delete<ApiResponse<any>>(`/api/distribuidores/${distribuidorId}/planes/${planId}`);
  }

  actualizarPlanesDistribuidor(distribuidorId: number, planesIds: number[]): Observable<ApiResponse<any>> {
    console.log(`🔵 [PlanesService] Llamando a PUT /api/distribuidores/${distribuidorId}/planes`);
    console.log('Planes IDs enviados:', planesIds);
    return this.api.put<ApiResponse<any>>(`/api/distribuidores/${distribuidorId}/planes`, { planes_ids: planesIds });
  }

  // Asignar Planes a Empresas (Admin)
  asignarPlanAEmpresa(request: AsignarPlanRequest): Observable<ApiResponse<{ planEmpresaId: number }>> {
    console.log('🔵 [PlanesService] Llamando a POST /api/planes');
    console.log('Datos de asignación:', request);
    return this.api.post<ApiResponse<{ planEmpresaId: number }>>('/api/planes', request);
  }

  verTodasSuscripciones(): Observable<{ success: boolean; planes: PlanEmpresa[] }> {
    console.log('🔵 [PlanesService] Llamando a GET /api/planes/todos');
    return this.api.get<{ success: boolean; planes: PlanEmpresa[] }>('/api/planes/todos');
  }

  // ==================== DISTRIBUIDOR ====================
  
  // Ver Mis Planes Disponibles
  getMisPlanes(): Observable<{ success: boolean; planes: Plan[] }> {
    console.log('🔵 [PlanesService] Llamando a GET /api/distribuidores/mis-planes');
    return this.api.get<{ success: boolean; planes: Plan[] }>('/api/distribuidores/mis-planes');
  }

  // Ver Planes de Mis Empresas
  getPlanesEmpresa(empresaId: number): Observable<{ success: boolean; planes: PlanEmpresa[] }> {
    console.log(`🔵 [PlanesService] Llamando a GET /api/planes/empresa/${empresaId}`);
    return this.api.get<{ success: boolean; planes: PlanEmpresa[] }>(`/api/planes/empresa/${empresaId}`);
  }

  // Ver Plan Activo de Empresa
  getPlanActivoEmpresa(empresaId: number): Observable<PlanActivo> {
    console.log(`🔵 [PlanesService] Llamando a GET /api/planes/empresa/${empresaId}/activo`);
    return this.api.get<PlanActivo>(`/api/planes/empresa/${empresaId}/activo`);
  }

  // Verificar si Empresa Puede Crear Formularios
  verificarPlanEmpresa(empresaId: number): Observable<VerificarPlanResponse> {
    console.log(`🔵 [PlanesService] Llamando a GET /api/planes/empresa/${empresaId}/verificar`);
    return this.api.get<VerificarPlanResponse>(`/api/planes/empresa/${empresaId}/verificar`);
  }

  // ==================== EMPRESA ====================
  
  // Ver Mi Plan Activo (usa el mismo endpoint que distribuidor)
  getMiPlanActivo(empresaId: number): Observable<PlanActivo> {
    return this.getPlanActivoEmpresa(empresaId);
  }

  // Verificar si Puedo Crear Formularios (usa el mismo endpoint)
  verificarMiPlan(empresaId: number): Observable<VerificarPlanResponse> {
    return this.verificarPlanEmpresa(empresaId);
  }
}
