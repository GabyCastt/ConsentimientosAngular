import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService, DashboardStats } from './dashboard.service';
import { LoadingComponent } from '../../shared/components/loading/loading.component';
import { ClientesDiditPendientesComponent } from './clientes-didit-pendientes/clientes-didit-pendientes.component';
import { ApiService } from '../../core/services/api.service';
import { ConfigService } from '../../core/services/config.service';
import { DiagnosticoService } from '../../core/services/diagnostico.service';

interface StatCard {
  title: string;
  value: number;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, LoadingComponent, ClientesDiditPendientesComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  loading = signal(true);
  stats = signal<DashboardStats | null>(null);
  
  statCards = signal<StatCard[]>([]);

  constructor(
    private dashboardService: DashboardService,
    private api: ApiService,
    private config: ConfigService,
    private diagnostico: DiagnosticoService
  ) {
    // Hacer disponible el diagnóstico en la consola del navegador
    (window as any).diagnostico = {
      rapido: () => this.diagnostico.diagnosticoRapido(),
      completo: () => this.diagnostico.ejecutarDiagnosticoCompleto()
    };
  }

  ngOnInit(): void {
    console.log('🚀 Dashboard inicializado');
    console.log('📍 Environment:', {
      apiUrl: this.config.apiUrl,
      isDevelopment: this.config.isDevelopment(),
      hostname: window.location.hostname
    });
    
    this.loadStats();
  }

  loadStats(): void {
    this.loading.set(true);
    
    this.dashboardService.getStats().subscribe({
      next: (response: any) => {
        console.log(' Dashboard stats received:', response);
        
        // El backend puede devolver { success: true, data: {...} } o directamente los datos
        const rawData = response.success ? response.data : response;
        console.log('Raw data:', rawData);
        
        // Manejar estructura anidada y plana
        const data: DashboardStats = {
          clientes: rawData.clientes || {
            total: rawData.total_clientes || 0,
            con_email: rawData.clientes_con_email || 0,
            con_telefono: rawData.clientes_con_telefono || 0
          },
          consentimientos: rawData.consentimientos_procesados || rawData.consentimientos || {
            total: rawData.total_consentimientos || 0,
            verificados: rawData.total_verificados || 0,
            pendientes: rawData.total_pendientes || 0,
            completadas: rawData.completadas || 0
          },
          formularios: rawData.formularios || {
            total: rawData.total_formularios || 0,
            activos: rawData.formularios_activos || 0
          },
          actividad_reciente: rawData.actividad_reciente
        };
        
        console.log(' Processed data:', data);
        this.stats.set(data);
        this.updateStatCards(data);
        this.loading.set(false);
      },
      error: (error) => {
        console.error(' Error cargando estadísticas:', error);
        
        // Intentar cargar datos básicos como fallback
        this.loadFallbackStats();
      }
    });
  }

  private loadFallbackStats(): void {
    console.log(' Intentando cargar datos básicos como fallback...');
    
    // Cargar clientes directamente para obtener al menos el conteo
    this.api.get<any>(this.config.endpoints.clientes).subscribe({
      next: (response) => {
        const clientes = response.clientes || response || [];
        const clientesCount = Array.isArray(clientes) ? clientes.length : 0;
        
        const fallbackStats: DashboardStats = {
          clientes: { 
            total: clientesCount, 
            con_email: 0, 
            con_telefono: 0 
          },
          consentimientos: { 
            total: 0, 
            verificados: 0, 
            pendientes: 0 
          },
          formularios: { 
            total: 0, 
            activos: 0 
          }
        };
        
        console.log(' Fallback stats loaded:', fallbackStats);
        this.stats.set(fallbackStats);
        this.updateStatCards(fallbackStats);
        this.loading.set(false);
      },
      error: (error) => {
        console.error(' Error en fallback:', error);
        
        // Último recurso: mostrar ceros
        const emptyStats: DashboardStats = {
          clientes: { total: 0, con_email: 0, con_telefono: 0 },
          consentimientos: { total: 0, verificados: 0, pendientes: 0 },
          formularios: { total: 0, activos: 0 }
        };
        
        this.stats.set(emptyStats);
        this.updateStatCards(emptyStats);
        this.loading.set(false);
      }
    });
  }

  private updateStatCards(data: DashboardStats): void {
    this.statCards.set([
      {
        title: 'Total Clientes',
        value: data.clientes?.total || data.total_clientes || 0,
        icon: 'fas fa-users',
        color: 'primary'
      },
      {
        title: 'Consentimientos',
        value: data.consentimientos?.total || data.total_consentimientos || 0,
        icon: 'fas fa-file-contract',
        color: 'success'
      },
      {
        title: 'Verificados',
        value: data.consentimientos?.verificados || data.total_verificados || 0,
        icon: 'fas fa-check-circle',
        color: 'info'
      },
      {
        title: 'Pendientes',
        value: data.consentimientos?.pendientes || data.total_pendientes || 0,
        icon: 'fas fa-clock',
        color: 'warning'
      }
    ]);
  }
}