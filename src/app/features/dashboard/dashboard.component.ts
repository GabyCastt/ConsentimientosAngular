import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService, DashboardStats } from './dashboard.service';
import { LoadingComponent } from '../../shared/components/loading/loading.component';
import { ClientesDiditPendientesComponent } from './clientes-didit-pendientes/clientes-didit-pendientes.component';

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

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.loading.set(true);
    
    this.dashboardService.getStats().subscribe({
      next: (response: any) => {
        console.log('Dashboard stats received:', response);
        // Backend returns { success: true, data: {...} }
        const rawData = response.data || response;
        console.log('Raw data:', rawData);
        
        // Handle both nested and flat structures
        const data: DashboardStats = {
          clientes: rawData.clientes || {
            total: rawData.total_clientes || 0,
            con_email: rawData.clientes_con_email || 0,
            con_telefono: rawData.clientes_con_telefono || 0
          },
          consentimientos: rawData.consentimientos || {
            total: rawData.total_consentimientos || 0,
            verificados: rawData.total_verificados || 0,
            pendientes: rawData.total_pendientes || 0
          },
          formularios: rawData.formularios || {
            total: rawData.total_formularios || 0,
            activos: rawData.formularios_activos || 0
          },
          actividad_reciente: rawData.actividad_reciente
        };
        
        console.log('Processed data:', data);
        this.stats.set(data);
        this.updateStatCards(data);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error cargando estadísticas:', error);
        // Set default values on error
        const defaultStats: DashboardStats = {
          clientes: { total: 0, con_email: 0, con_telefono: 0 },
          consentimientos: { total: 0, verificados: 0, pendientes: 0 },
          formularios: { total: 0, activos: 0 }
        };
        this.stats.set(defaultStats);
        this.updateStatCards(defaultStats);
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