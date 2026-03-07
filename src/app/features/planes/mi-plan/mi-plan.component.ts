import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PlanesService } from '../../../core/services/planes.service';
import { AuthService } from '../../../core/services/auth.service';
import { PlanActivo } from '../../../core/models/plan.model';

@Component({
  selector: 'app-mi-plan',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './mi-plan.component.html',
  styleUrls: ['./mi-plan.component.scss']
})
export class MiPlanComponent implements OnInit {
  planActivo: PlanActivo | null = null;
  loading = false;
  error: string | null = null;

  constructor(
    private planesService: PlanesService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.cargarPlan();
  }

  cargarPlan(): void {
    const user = this.authService.currentUser();
    if (!user?.empresa_id) {
      this.error = 'No se pudo obtener la información de la empresa';
      return;
    }

    this.loading = true;
    this.error = null;

    this.planesService.getMiPlanActivo(user.empresa_id).subscribe({
      next: (response) => {
        console.log('=== MI PLAN ACTIVO - DATOS DEL BACKEND ===');
        console.log('Response completo:', response);
        console.log('Plan:', response.plan);
        console.log('Estadísticas:', response.estadisticas);
        console.log('==========================================');
        this.planActivo = response;
        this.loading = false;
      },
      error: (err) => {
        console.error('=== ERROR AL CARGAR MI PLAN ===', err);
        this.error = err.error?.message || 'Error al cargar el plan';
        this.loading = false;
      }
    });
  }

  getTiposVerificacionTexto(tipos: string[]): string {
    const nombres: Record<string, string> = {
      'sms_email': 'SMS/Email',
      'biometria_free': 'Biometría Free',
      'biometria_premium': 'Biometría Premium',
      'sms_didit': 'SMS Didit'
    };
    return tipos.map(t => nombres[t] || t).join(', ');
  }

  getEstadoColor(): string {
    if (!this.planActivo?.plan) return 'secondary';
    
    const estado = this.planActivo.plan.planempresa_estado;
    switch (estado) {
      case 'activo': return 'success';
      case 'vencido': return 'danger';
      case 'cancelado': return 'secondary';
      default: return 'secondary';
    }
  }

  getDisponiblesColor(): string {
    if (!this.planActivo?.estadisticas) return '';
    
    const { disponibles, ilimitado } = this.planActivo.estadisticas;
    if (ilimitado) return 'text-success';
    
    if (typeof disponibles === 'number') {
      if (disponibles === 0) return 'text-danger';
      if (disponibles < 10) return 'text-warning';
      return 'text-success';
    }
    
    return '';
  }

  getDiasRestantesColor(): string {
    if (!this.planActivo?.estadisticas) return '';
    
    const dias = this.planActivo.estadisticas.dias_restantes;
    if (!dias) return '';
    
    if (dias < 7) return 'text-danger';
    if (dias < 30) return 'text-warning';
    return 'text-success';
  }

  // Métodos auxiliares para validaciones en el template
  shouldShowWarningAlert(): boolean {
    if (!this.planActivo?.estadisticas) return false;
    const { ilimitado, disponibles } = this.planActivo.estadisticas;
    if (ilimitado) return false;
    if (typeof disponibles !== 'number') return false;
    return disponibles < 10 && disponibles > 0;
  }

  shouldShowDangerAlert(): boolean {
    if (!this.planActivo?.estadisticas) return false;
    const { ilimitado, disponibles } = this.planActivo.estadisticas;
    if (ilimitado) return false;
    return disponibles === 0;
  }

  shouldShowExpirationAlert(): boolean {
    if (!this.planActivo?.estadisticas) return false;
    const { dias_restantes } = this.planActivo.estadisticas;
    if (!dias_restantes) return false;
    return dias_restantes < 30;
  }

  getProgressClass(disponibles: number | string | undefined): string {
    if (typeof disponibles !== 'number') return '';
    if (disponibles === 0) return 'progress-danger';
    if (disponibles < 10) return 'progress-warning';
    return 'progress-success';
  }

  getProgressWidth(): number {
    if (!this.planActivo?.estadisticas) return 0;
    const { utilizados, cantidad_total } = this.planActivo.estadisticas;
    if (!cantidad_total || cantidad_total === 0) return 0;
    return (utilizados / cantidad_total) * 100;
  }
}
