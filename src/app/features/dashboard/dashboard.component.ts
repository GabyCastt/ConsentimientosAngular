import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardService, DashboardStats, EstadisticasGlobales } from './dashboard.service';
import { LoadingComponent } from '../../shared/components/loading/loading.component';
import { ApiService } from '../../core/services/api.service';
import { ConfigService } from '../../core/services/config.service';
import { DiagnosticoService } from '../../core/services/diagnostico.service';
import { EmpresaService } from '../../core/services/empresa.service';
import { DistribuidorService } from '../../core/services/distribuidor.service';
import { EmpresaEstadisticas } from '../../core/models/empresa.model';
import { AuthService } from '../../core/services/auth.service';

interface StatCard {
  title: string;
  value: number;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, LoadingComponent, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  loading = signal(true);
  stats = signal<DashboardStats | null>(null);
  estadisticasGlobales = signal<EstadisticasGlobales | null>(null);
  empresaStats = signal<EmpresaEstadisticas | null>(null);
  distribuidorEmpresas = signal<any[]>([]);
  isDistribuidor = signal(false);
  isAdmin = signal(false);
  
  statCards = signal<StatCard[]>([]);

  constructor(
    private dashboardService: DashboardService,
    private empresaService: EmpresaService,
    private distribuidorService: DistribuidorService,
    private authService: AuthService,
    private api: ApiService,
    public config: ConfigService,
    private diagnostico: DiagnosticoService
  ) {
    // Hacer disponible el diagnóstico en la consola del navegador
    (window as any).diagnostico = {
      rapido: () => this.diagnostico.diagnosticoRapido(),
      completo: () => this.diagnostico.ejecutarDiagnosticoCompleto()
    };
  }

  ngOnInit(): void {
    console.log('[START] Dashboard inicializado');
    console.log('[ENDPOINT] Environment:', {
      apiUrl: this.config.apiUrl,
      isDevelopment: this.config.isDevelopment(),
      hostname: window.location.hostname
    });
    
    const currentUser = this.authService.currentUser();
    const userRole = currentUser?.rol;
    
    console.log('[INFO] Usuario actual:', { rol: userRole, empresa_id: currentUser?.empresa_id });
    
    this.isAdmin.set(userRole === 'admin');
    this.isDistribuidor.set(userRole === 'distribuidor');
    
    // Cargar datos según el rol
    if (userRole === 'admin') {
      this.loadEstadisticasGlobales();
    } else if (userRole === 'distribuidor') {
      this.loadDistribuidorStats();
    } else if (userRole === 'empresa') {
      this.loadEmpresaStats();
    } else {
      this.loadStats();
    }
  }

  /**
   * Cargar estadísticas para usuario tipo 'empresa'
   * Usa: GET /api/empresas/perfil
   */
  loadEmpresaStats(): void {
    this.loading.set(true);
    
    console.log('[INFO] Cargando perfil de empresa...');
    this.empresaService.obtenerPerfil().subscribe({
      next: (response: any) => {
        console.log('[OK] Estadísticas de empresa:', response);
        if (response.empresa.estadisticas) {
          this.empresaStats.set(response.empresa.estadisticas);
        }
        this.loading.set(false);
      },
      error: (error: any) => {
        console.error('[ERROR] Error cargando estadísticas de empresa:', error);
        this.loading.set(false);
      }
    });
  }

  /**
   * Cargar estadísticas para distribuidor
   * Usa: GET /api/distribuidores/mis-empresas
   */
  loadDistribuidorStats(): void {
    this.loading.set(true);
    
    console.log('[INFO] Cargando empresas del distribuidor...');
    this.distribuidorService.getMisEmpresas().subscribe({
      next: (response: any) => {
        console.log('[OK] Empresas del distribuidor:', response);
        this.distribuidorEmpresas.set(response.empresas || []);
        
        // Calcular estadísticas agregadas
        const totalClientes = response.empresas.reduce((sum: number, emp: any) => sum + (emp.total_clientes || 0), 0);
        const totalFormularios = response.empresas.reduce((sum: number, emp: any) => sum + (emp.total_formularios || 0), 0);
        const totalConsentimientos = response.empresas.reduce((sum: number, emp: any) => sum + (emp.total_consentimientos || 0), 0);
        
        // Actualizar stat cards
        this.statCards.set([
          {
            title: 'Mis Empresas',
            value: response.total || 0,
            icon: 'fas fa-building',
            color: 'primary'
          },
          {
            title: 'Total Clientes',
            value: totalClientes,
            icon: 'fas fa-users',
            color: 'success'
          },
          {
            title: 'Formularios',
            value: totalFormularios,
            icon: 'fas fa-file-alt',
            color: 'info'
          },
          {
            title: 'Consentimientos',
            value: totalConsentimientos,
            icon: 'fas fa-file-contract',
            color: 'warning'
          }
        ]);
        
        this.loading.set(false);
      },
      error: (error: any) => {
        console.error('[ERROR] Error cargando empresas del distribuidor:', error);
        this.loading.set(false);
      }
    });
  }

  loadEstadisticasGlobales(): void {
    this.loading.set(true);
    
    this.dashboardService.getEstadisticasGlobales().subscribe({
      next: (response) => {
        console.log('[OK] Estadísticas globales:', response);
        this.estadisticasGlobales.set(response.data);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('[ERROR] Error cargando estadísticas globales:', error);
        this.loading.set(false);
      }
    });
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

  formatMetodoNombre(metodo: string): string {
    const nombres: { [key: string]: string } = {
      'sms_email': 'SMS/Email',
      'sms_didit': 'SMS DIDIT',
      'biometria_free': 'Biometría Free',
      'biometria_premium': 'Biometría Premium'
    };
    return nombres[metodo] || metodo;
  }

  getFormulariosCount(empresa: any): number {
    // Intentar diferentes nombres de campos que el backend podría enviar
    return empresa.total_formularios ?? 
           empresa.formularios ?? 
           empresa.total_forms ?? 
           empresa.num_formularios ?? 
           0;
  }
}