import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { PlanesService } from '../../../core/services/planes.service';
import { TipoVerificacion, Plan } from '../../../core/models/plan.model';

@Component({
  selector: 'app-editar-plan',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './editar-plan.component.html',
  styleUrls: ['./editar-plan.component.scss']
})
export class EditarPlanComponent implements OnInit {
  planForm: FormGroup;
  loading = false;
  error: string | null = null;
  planId: number | null = null;

  tiposVerificacion: { value: TipoVerificacion; label: string }[] = [
    { value: 'sms_email', label: 'SMS/Email' },
    { value: 'biometria_free', label: 'Biometría Free' },
    { value: 'biometria_premium', label: 'Biometría Premium' },
    { value: 'sms_didit', label: 'SMS Didit' }
  ];

  constructor(
    private fb: FormBuilder,
    private planesService: PlanesService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.planForm = this.fb.group({
      plan_codigo: ['', [Validators.required, Validators.maxLength(50)]],
      plan_nombre: ['', [Validators.required, Validators.maxLength(100)]],
      plan_descripcion: ['', Validators.maxLength(500)],
      plan_cantidad_formularios: [0, [Validators.required, Validators.min(0)]],
      plan_ilimitado: [0],
      plan_duracion_meses: [12, [Validators.required, Validators.min(1)]],
      plan_precio: [0, [Validators.required, Validators.min(0)]],
      plan_activo: [1],
      plan_orden: [1, [Validators.required, Validators.min(1)]],
      tipos_verificacion: [[]]
    });

    this.planForm.get('plan_ilimitado')?.valueChanges.subscribe(ilimitado => {
      const cantidadControl = this.planForm.get('plan_cantidad_formularios');
      if (ilimitado) {
        cantidadControl?.setValue(0);
        cantidadControl?.disable();
      } else {
        cantidadControl?.enable();
      }
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.planId = parseInt(id, 10);
      this.cargarPlan();
    }
  }

  cargarPlan(): void {
    if (!this.planId) return;

    this.loading = true;
    this.planesService.getCatalogoPlanes(true).subscribe({
      next: (response) => {
        console.log('=== EDITAR PLAN - CARGAR DATOS ===');
        console.log('Response completo:', response);
        console.log('Buscando plan con ID:', this.planId);
        const plan = response.planes.find(p => p.plan_id === this.planId);
        console.log('Plan encontrado:', plan);
        console.log('===================================');
        if (plan) {
          this.planForm.patchValue({
            ...plan,
            tipos_verificacion: plan.tipos_verificacion_permitidos
          });
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('=== ERROR AL CARGAR PLAN PARA EDITAR ===', err);
        this.error = 'Error al cargar el plan';
        this.loading = false;
      }
    });
  }

  onTipoVerificacionChange(tipo: TipoVerificacion, event: any): void {
    const tipos = this.planForm.get('tipos_verificacion')?.value || [];
    if (event.target.checked) {
      if (!tipos.includes(tipo)) {
        tipos.push(tipo);
      }
    } else {
      const index = tipos.indexOf(tipo);
      if (index > -1) {
        tipos.splice(index, 1);
      }
    }
    this.planForm.patchValue({ tipos_verificacion: tipos });
  }

  isTipoSelected(tipo: TipoVerificacion): boolean {
    const tipos = this.planForm.get('tipos_verificacion')?.value || [];
    return tipos.includes(tipo);
  }

  onSubmit(): void {
    if (this.planForm.invalid || !this.planId) {
      Object.keys(this.planForm.controls).forEach(key => {
        this.planForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.loading = true;
    this.error = null;

    const formValue = this.planForm.getRawValue();
    const planData = {
      ...formValue,
      tipos_verificacion_permitidos: formValue.tipos_verificacion
    };
    delete planData.tipos_verificacion;

    this.planesService.actualizarPlanCatalogo(this.planId, planData).subscribe({
      next: (response) => {
        console.log('=== ACTUALIZAR PLAN - RESPUESTA DEL BACKEND ===');
        console.log('Response completo:', response);
        console.log('Plan actualizado:', response);
        console.log('===============================================');
        this.router.navigate(['/planes/catalogo']);
      },
      error: (err) => {
        console.error('=== ERROR AL ACTUALIZAR PLAN ===', err);
        this.error = err.error?.message || 'Error al actualizar el plan';
        this.loading = false;
      }
    });
  }

  cancelar(): void {
    this.router.navigate(['/planes/catalogo']);
  }
}
