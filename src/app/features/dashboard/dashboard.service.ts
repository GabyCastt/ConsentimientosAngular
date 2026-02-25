import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { ConfigService } from '../../core/services/config.service';

export interface DashboardStats {
  clientes?: {
    total: number;
    con_email: number;
    con_telefono: number;
  };
  consentimientos?: {
    total: number;
    verificados: number;
    pendientes: number;
    completadas?: number;
  };
  consentimientos_procesados?: {
    total: number;
    completadas: number;
    pendientes: number;
  };
  formularios?: {
    total: number;
    activos: number;
  };
  actividad_reciente?: {
    ultimos_7_dias: number;
    ultimos_30_dias: number;
  };
  // Fallback for flat structure
  total_clientes?: number;
  total_consentimientos?: number;
  total_verificados?: number;
  total_pendientes?: number;
  total_formularios?: number;
  formularios_activos?: number;
  clientes_con_email?: number;
  clientes_con_telefono?: number;
  completadas?: number;
}

export interface EstadisticasGlobales {
  resumen_general: {
    total_empresas: number;
    total_usuarios: number;
    total_clientes: number;
    total_formularios: number;
    total_consentimientos_completados: number;
    total_verificados: number;
    tasa_conversion: number;
  };
  empresa_destacada: {
    mas_clientes: {
      id: number;
      nombre: string;
      total_clientes: number;
    };
    mas_formularios_completados: {
      id: number;
      nombre: string;
      total_completados: number;
    };
  };
  verificacion: {
    tipo_mas_utilizado: {
      tipo: string;
      total: number;
    };
    distribucion: Array<{
      tipo: string;
      total: number;
    }>;
  };
  consentimientos: {
    tipos_mas_aceptados: Array<{
      tipo: string;
      total: number;
    }>;
  };
  usuarios: {
    distribucion_por_rol: Array<{
      rol: string;
      total: number;
    }>;
  };
  top_empresas: Array<{
    id: number;
    nombre: string;
    total_clientes: number;
    total_formularios: number;
    total_consentimientos: number;
  }>;
  actividad_reciente_30_dias: {
    clientes_nuevos: number;
    formularios_nuevos: number;
    consentimientos_nuevos: number;
  };
  fecha_generacion: string;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  constructor(
    private api: ApiService,
    private config: ConfigService
  ) {}

  getStats(): Observable<DashboardStats> {
    return this.api.get<DashboardStats>(
      this.config.endpoints.estadisticasDashboard
    );
  }

  getEstadisticasGlobales(): Observable<{ success: boolean; data: EstadisticasGlobales }> {
    return this.api.get<{ success: boolean; data: EstadisticasGlobales }>(
      this.config.endpoints.estadisticasGlobal
    );
  }
}