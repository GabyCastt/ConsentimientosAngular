import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PlanesService } from '../../../core/services/planes.service';
import { Plan } from '../../../core/models/plan.model';

@Component({
  selector: 'app-planes-distribuidor',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './planes-distribuidor.component.html',
  styleUrl: './planes-distribuidor.component.scss'
})
export class PlanesDistribuidorComponent implements OnInit {
  distribuidorId!: number;
  distribuidorNombre = '';
  distribuidorEmail = '';
  
  planesDisponibles: Plan[] = []; // Todos los planes del catálogo
  planesAsignados: Plan[] = []; // Planes asignados al distribuidor
  
  loading = false;
  error = '';
  successMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private planesService: PlanesService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.distribuidorId = +params['id'];
      if (this.distribuidorId) {
        this.cargarDatos();
      }
    });
  }

  cargarDatos(): void {
    this.loading = true;
    this.error = '';

    // Cargar planes del distribuidor
    this.planesService.getPlanesDistribuidor(this.distribuidorId).subscribe({
      next: (response) => {
        console.log('=== PLANES DEL DISTRIBUIDOR ===', response);
        this.distribuidorNombre = response.distribuidor.nombre;
        this.distribuidorEmail = response.distribuidor.email;
        this.planesAsignados = response.planes;
        
        // Cargar catálogo completo
        this.cargarCatalogo();
      },
      error: (err) => {
        console.error('Error al cargar planes del distribuidor:', err);
        this.error = err.error?.message || 'Error al cargar planes del distribuidor';
        this.loading = false;
      }
    });
  }

  cargarCatalogo(): void {
    this.planesService.getCatalogoPlanes(false).subscribe({
      next: (response) => {
        console.log('=== CATÁLOGO DE PLANES ===', response);
        this.planesDisponibles = response.planes;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar catálogo:', err);
        this.error = 'Error al cargar catálogo de planes';
        this.loading = false;
      }
    });
  }

  isPlanAsignado(planId: number): boolean {
    return this.planesAsignados.some(p => p.plan_id === planId);
  }

  togglePlan(plan: Plan): void {
    if (this.isPlanAsignado(plan.plan_id)) {
      this.removerPlan(plan);
    } else {
      this.asignarPlan(plan);
    }
  }

  asignarPlan(plan: Plan): void {
    this.loading = true;
    this.error = '';
    this.successMessage = '';

    this.planesService.asignarPlanADistribuidor(this.distribuidorId, plan.plan_id).subscribe({
      next: (response) => {
        console.log('Plan asignado:', response);
        this.successMessage = `Plan "${plan.plan_nombre}" asignado exitosamente`;
        this.cargarDatos();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        console.error('Error al asignar plan:', err);
        this.error = err.error?.message || 'Error al asignar plan';
        this.loading = false;
      }
    });
  }

  removerPlan(plan: Plan): void {
    if (!confirm(`¿Está seguro de remover el plan "${plan.plan_nombre}"?`)) {
      return;
    }

    this.loading = true;
    this.error = '';
    this.successMessage = '';

    this.planesService.removerPlanDeDistribuidor(this.distribuidorId, plan.plan_id).subscribe({
      next: (response) => {
        console.log('Plan removido:', response);
        this.successMessage = `Plan "${plan.plan_nombre}" removido exitosamente`;
        this.cargarDatos();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        console.error('Error al remover plan:', err);
        this.error = err.error?.message || 'Error al remover plan';
        this.loading = false;
      }
    });
  }

  guardarTodos(): void {
    const planesIds = this.planesDisponibles
      .filter(p => this.isPlanAsignado(p.plan_id))
      .map(p => p.plan_id);

    if (planesIds.length === 0) {
      this.error = 'Debe seleccionar al menos un plan';
      return;
    }

    this.loading = true;
    this.error = '';
    this.successMessage = '';

    this.planesService.actualizarPlanesDistribuidor(this.distribuidorId, planesIds).subscribe({
      next: (response) => {
        console.log('Planes actualizados:', response);
        this.successMessage = 'Planes actualizados exitosamente';
        this.cargarDatos();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        console.error('Error al actualizar planes:', err);
        this.error = err.error?.message || 'Error al actualizar planes';
        this.loading = false;
      }
    });
  }

  volver(): void {
    this.router.navigate(['/distribuidores/lista']);
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
}
