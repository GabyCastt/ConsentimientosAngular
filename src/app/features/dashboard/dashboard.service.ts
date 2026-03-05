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
    verificados: number;
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

  /**
   * Obtener estadísticas del dashboard
   * Endpoint: GET /api/estadisticas/dashboard
   */
  getStats(): Observable<DashboardStats> {
    return this.api.get<DashboardStats>(
      this.config.endpoints.estadisticasDashboard
    );
  }

  /**
   * Obtener estadísticas globales (Solo Admin)
   * Endpoint: GET /api/estadisticas/global
   */
  getEstadisticasGlobales(): Observable<{ success: boolean; data: EstadisticasGlobales }> {
    return this.api.get<{ success: boolean; data: EstadisticasGlobales }>(
      this.config.endpoints.estadisticasGlobal
    );
  }

  /**
   * Obtener estadísticas de formularios
   * Endpoint: GET /api/estadisticas/formularios
   */
  getEstadisticasFormularios(): Observable<{
    success: boolean;
    data: {
      formularios: Array<{
        id: number;
        nombre: string;
        empresa_nombre: string;
        activo: number;
        tipos_consentimientos: string[];
        estadisticas: {
          total_respuestas: number;
          completadas: number;
          pendientes: number;
          tasa_completado: number;
        };
        url_publica: string;
        created_at: string;
      }>;
      resumen: {
        total_formularios: number;
        formularios_activos: number;
        formularios_inactivos: number;
      };
    };
  }> {
    return this.api.get(this.config.endpoints.estadisticasFormularios);
  }

  /**
   * Obtener estadísticas por período
   * Endpoint: GET /api/estadisticas/periodo?periodo=30
   */
  getEstadisticasPeriodo(dias: number = 30): Observable<{
    success: boolean;
    data: {
      clientes: {
        total: number;
        con_email: number;
        con_telefono: number;
      };
      consentimientos_procesados: {
        total: number;
        verificados: number;
        completadas: number;
        pendientes: number;
      };
      periodo_dias: number;
    };
  }> {
    return this.api.get(`${this.config.endpoints.estadisticasPeriodo}?periodo=${dias}`);
  }
}