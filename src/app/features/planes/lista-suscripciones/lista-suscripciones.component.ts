import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlanesService } from '../../../core/services/planes.service';
import { PlanEmpresa } from '../../../core/models/plan.model';

@Component({
  selector: 'app-lista-suscripciones',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lista-suscripciones.component.html',
  styleUrls: ['./lista-suscripciones.component.scss']
})
export class ListaSuscripcionesComponent implements OnInit {
  suscripciones: PlanEmpresa[] = [];
  loading = false;
  error: string | null = null;

  constructor(private planesService: PlanesService) {}

  ngOnInit(): void {
    this.cargarSuscripciones();
  }

  cargarSuscripciones(): void {
    this.loading = true;
    this.planesService.verTodasSuscripciones().subscribe({
      next: (response) => {
        console.log('=== LISTA DE SUSCRIPCIONES - DATOS DEL BACKEND ===');
        console.log('Response completo:', response);
        console.log('Suscripciones:', response.planes);
        console.log('Total de suscripciones:', response.planes.length);
        console.log('Suscripciones por estado:');
        console.log('  - Activas:', response.planes.filter((p: PlanEmpresa) => p.planempresa_estado === 'activo').length);
        console.log('  - Vencidas:', response.planes.filter((p: PlanEmpresa) => p.planempresa_estado === 'vencido').length);
        console.log('  - Canceladas:', response.planes.filter((p: PlanEmpresa) => p.planempresa_estado === 'cancelado').length);
        console.log('===================================================');
        this.suscripciones = response.planes;
        this.loading = false;
      },
      error: (err) => {
        console.error('=== ERROR AL CARGAR SUSCRIPCIONES ===', err);
        this.error = 'Error al cargar las suscripciones';
        this.loading = false;
      }
    });
  }

  getEstadoClass(estado: string): string {
    switch (estado) {
      case 'activo': return 'badge-success';
      case 'vencido': return 'badge-danger';
      case 'cancelado': return 'badge-secondary';
      default: return 'badge-secondary';
    }
  }

  getDisponibles(plan: PlanEmpresa): string {
    if (plan.planempresa_ilimitado) return 'Ilimitado';
    return `${plan.planempresa_cantidad - plan.planempresa_utilizados} de ${plan.planempresa_cantidad}`;
  }
}
