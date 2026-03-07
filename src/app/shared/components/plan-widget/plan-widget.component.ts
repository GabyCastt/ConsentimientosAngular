import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PlanActivo } from '../../../core/models/plan.model';

@Component({
  selector: 'app-plan-widget',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './plan-widget.component.html',
  styleUrls: ['./plan-widget.component.scss']
})
export class PlanWidgetComponent {
  @Input() planActivo: PlanActivo | null = null;
  @Input() loading = false;

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

  getProgressPercentage(): number {
    if (!this.planActivo?.estadisticas || this.planActivo.estadisticas.ilimitado) {
      return 0;
    }
    
    const { utilizados, cantidad_total } = this.planActivo.estadisticas;
    if (!cantidad_total || cantidad_total === 0) return 0;
    return (utilizados / cantidad_total) * 100;
  }

  getProgressClass(): string {
    const percentage = this.getProgressPercentage();
    if (percentage >= 90) return 'progress-danger';
    if (percentage >= 70) return 'progress-warning';
    return 'progress-success';
  }
}
