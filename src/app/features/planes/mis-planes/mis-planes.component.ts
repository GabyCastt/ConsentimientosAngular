import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlanesService } from '../../../core/services/planes.service';
import { Plan } from '../../../core/models/plan.model';

@Component({
  selector: 'app-mis-planes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mis-planes.component.html',
  styleUrls: ['./mis-planes.component.scss']
})
export class MisPlanesComponent implements OnInit {
  planes: Plan[] = [];
  loading = false;
  error: string | null = null;

  constructor(private planesService: PlanesService) {}

  ngOnInit(): void {
    this.cargarPlanes();
  }

  cargarPlanes(): void {
    this.loading = true;
    this.planesService.getMisPlanes().subscribe({
      next: (response) => {
        console.log('=== MIS PLANES (DISTRIBUIDOR) - DATOS DEL BACKEND ===');
        console.log('Response completo:', response);
        console.log('Planes:', response.planes);
        console.log('Total de planes:', response.planes.length);
        console.log('======================================================');
        this.planes = response.planes.sort((a, b) => a.plan_orden - b.plan_orden);
        this.loading = false;
      },
      error: (err) => {
        console.error('=== ERROR AL CARGAR MIS PLANES ===', err);
        this.error = 'Error al cargar los planes';
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
}
