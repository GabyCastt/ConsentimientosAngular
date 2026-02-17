import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { ConfigService } from '../../core/services/config.service';

export interface DashboardStats {
  total_clientes: number;
  total_consentimientos: number;
  total_verificados: number;
  total_pendientes: number;
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