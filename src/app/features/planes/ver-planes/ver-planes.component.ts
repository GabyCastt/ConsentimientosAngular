import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlanesService } from '../../../core/services/planes.service';
import { Plan } from '../../../core/models/plan.model';

@Component({
  selector: 'app-ver-planes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ver-planes.component.html',
  styleUrls: ['./ver-planes.component.scss']
})
export class VerPlanesComponent implements OnInit {
  planes: Plan[] = [];
  loading = false;

  constructor(private planesService: PlanesService) {}

  ngOnInit(): void {
    this.loading = true;
    this.planesService.getCatalogoPlanes().subscribe({
      next: (response) => {
        console.log('=== VER PLANES (PÚBLICO) - DATOS DEL BACKEND ===');
        console.log('Response completo:', response);
        console.log('Planes activos (plan_activo === 1):', response.planes.filter(p => p.plan_activo === 1));
        console.log('Total de planes activos:', response.planes.filter(p => p.plan_activo === 1).length);
        console.log('=================================================');
        this.planes = response.planes.filter(p => p.plan_activo === 1).sort((a, b) => a.plan_orden - b.plan_orden);
        this.loading = false;
      },
      error: (err) => {
        console.error('=== ERROR AL CARGAR VER PLANES ===', err);
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
