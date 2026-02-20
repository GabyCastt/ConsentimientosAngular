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
}