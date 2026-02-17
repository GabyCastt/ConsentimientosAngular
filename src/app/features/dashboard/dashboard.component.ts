import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService, DashboardStats } from './dashboard.service';
import { LoadingComponent } from '../../shared/components/loading/loading.component';

interface StatCard {
  title: string;
  value: number;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, LoadingComponent],
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
      next: (data) => {
        this.stats.set(data);
        this.updateStatCards(data);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error cargando estadísticas:', error);
        this.loading.set(false);
      }
    });
  }

  private updateStatCards(data: DashboardStats): void {
    this.statCards.set([
      {
        title: 'Total Clientes',
        value: data.total_clientes,
        icon: 'fas fa-users',
        color: 'primary'
      },
      {
        title: 'Consentimientos',
        value: data.total_consentimientos,
        icon: 'fas fa-file-contract',
        color: 'success'
      },
      {
        title: 'Verificados',
        value: data.total_verificados,
        icon: 'fas fa-check-circle',
        color: 'info'
      },
      {
        title: 'Pendientes',
        value: data.total_pendientes,
        icon: 'fas fa-clock',
        color: 'warning'
      }
    ]);
  }
}