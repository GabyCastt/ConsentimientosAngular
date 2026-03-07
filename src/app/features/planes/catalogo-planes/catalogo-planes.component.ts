import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { PlanesService } from '../../../core/services/planes.service';
import { Plan } from '../../../core/models/plan.model';

@Component({
  selector: 'app-catalogo-planes',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './catalogo-planes.component.html',
  styleUrls: ['./catalogo-planes.component.scss']
})
export class CatalogoPlanesComponent implements OnInit {
  planes: Plan[] = [];
  loading = false;
  error: string | null = null;
  mostrarInactivos = false; // Toggle para mostrar planes inactivos

  constructor(
    private planesService: PlanesService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarPlanes();
  }

  cargarPlanes(): void {
    this.loading = true;
    this.error = null;
    
    console.log('🔵 Cargando planes con mostrarInactivos:', this.mostrarInactivos);
    
    this.planesService.getCatalogoPlanes(this.mostrarInactivos).subscribe({
      next: (response) => {
        console.log('=== CATÁLOGO DE PLANES - DATOS DEL BACKEND ===');
        console.log('Response completo:', response);
        console.log('Planes:', response.planes);
        console.log('Total de planes:', response.planes.length);
        console.log('Planes activos (plan_activo === 1):', response.planes.filter(p => p.plan_activo === 1).length);
        console.log('Planes inactivos (plan_activo === 0):', response.planes.filter(p => p.plan_activo === 0).length);
        console.log('===============================================');
        this.planes = response.planes.sort((a, b) => a.plan_orden - b.plan_orden);
        this.loading = false;
      },
      error: (err) => {
        console.error('=== ERROR AL CARGAR CATÁLOGO DE PLANES ===', err);
        this.error = 'Error al cargar los planes';
        this.loading = false;
      }
    });
  }

  onMostrarInactivosChange(): void {
    console.log('🔵 Checkbox cambió a:', this.mostrarInactivos);
    this.cargarPlanes();
  }

  crearPlan(): void {
    this.router.navigate(['/planes/catalogo/crear']);
  }

  editarPlan(planId: number): void {
    this.router.navigate(['/planes/catalogo/editar', planId]);
  }

  desactivarPlan(plan: Plan): void {
    if (!confirm(`¿Está seguro de desactivar el plan "${plan.plan_nombre}"?`)) {
      return;
    }

    this.planesService.desactivarPlanCatalogo(plan.plan_id).subscribe({
      next: () => {
        this.cargarPlanes();
      },
      error: (err) => {
        alert('Error al desactivar el plan');
        console.error(err);
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
}
