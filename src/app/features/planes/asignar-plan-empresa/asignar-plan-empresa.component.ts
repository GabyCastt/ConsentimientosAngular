import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PlanesService } from '../../../core/services/planes.service';
import { EmpresaService } from '../../../core/services/empresa.service';
import { AuthService } from '../../../core/services/auth.service';
import { Plan } from '../../../core/models/plan.model';

@Component({
  selector: 'app-asignar-plan-empresa',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './asignar-plan-empresa.component.html',
  styleUrl: './asignar-plan-empresa.component.scss'
})
export class AsignarPlanEmpresaComponent implements OnInit {
  empresaId!: number;
  empresaNombre = '';
  planesDisponibles: Plan[] = [];
  planForm: FormGroup;
  loading = false;
  error = '';
  successMessage = '';
  isAdmin = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private planesService: PlanesService,
    private empresaService: EmpresaService,
    private authService: AuthService
  ) {
    const user = this.authService.currentUser();
    this.isAdmin = user?.rol === 'admin';

    const today = new Date().toISOString().split('T')[0];
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    const nextYearStr = nextYear.toISOString().split('T')[0];

    this.planForm = this.fb.group({
      plan_id: ['', Validators.required],
      planempresa_fecha_inicio: [today, Validators.required],
      planempresa_caduca: [nextYearStr, Validators.required],
      planempresa_valor: [0, [Validators.required, Validators.min(0)]],
      planempresa_comentario: [''],
      planempresa_nrcomprobante: [''],
      planempresa_banco: ['']
    });
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.empresaId = +params['empresaId'];
      if (this.empresaId) {
        this.cargarDatos();
      }
    });
  }

  cargarDatos(): void {
    this.loading = true;
    this.error = '';

    // Cargar información de la empresa
    this.empresaService.obtenerEmpresa(this.empresaId).subscribe({
      next: (response) => {
        this.empresaNombre = response.empresa.nombre;
        this.cargarPlanesDisponibles();
      },
      error: (err) => {
        console.error('Error al cargar empresa:', err);
        this.error = 'Error al cargar información de la empresa';
        this.loading = false;
      }
    });
  }

  cargarPlanesDisponibles(): void {
    // Si es admin, carga todos los planes del catálogo
    // Si es distribuidor, carga solo sus planes asignados
    const observable = this.isAdmin 
      ? this.planesService.getCatalogoPlanes(false)
      : this.planesService.getMisPlanes();

    observable.subscribe({
      next: (response) => {
        console.log('=== PLANES DISPONIBLES PARA ASIGNAR ===', response);
        this.planesDisponibles = response.planes.filter(p => p.plan_activo === 1);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar planes:', err);
        this.error = 'Error al cargar planes disponibles';
        this.loading = false;
      }
    });
  }

  onPlanChange(): void {
    const planId = this.planForm.get('plan_id')?.value;
    if (planId) {
      const plan = this.planesDisponibles.find(p => p.plan_id === +planId);
      if (plan) {
        // Auto-completar el valor con el precio del plan
        this.planForm.patchValue({
          planempresa_valor: plan.plan_precio
        });
      }
    }
  }

  asignarPlan(): void {
    if (this.planForm.invalid) {
      Object.keys(this.planForm.controls).forEach(key => {
        this.planForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.loading = true;
    this.error = '';
    this.successMessage = '';

    const formValue = this.planForm.value;
    const data = {
      emp_codigo: this.empresaId,
      plan_id: +formValue.plan_id,
      planempresa_fecha_inicio: formValue.planempresa_fecha_inicio,
      planempresa_caduca: formValue.planempresa_caduca,
      planempresa_valor: +formValue.planempresa_valor,
      planempresa_comentario: formValue.planempresa_comentario || '',
      planempresa_nrcomprobante: formValue.planempresa_nrcomprobante || '',
      planempresa_banco: formValue.planempresa_banco || ''
    };

    console.log('=== ASIGNANDO PLAN A EMPRESA ===', data);

    this.planesService.asignarPlanAEmpresa(data).subscribe({
      next: (response) => {
        console.log('Plan asignado exitosamente:', response);
        this.successMessage = 'Plan asignado exitosamente';
        setTimeout(() => {
          this.volver();
        }, 2000);
      },
      error: (err) => {
        console.error('Error al asignar plan:', err);
        this.error = err.error?.message || 'Error al asignar plan';
        this.loading = false;
      }
    });
  }

  volver(): void {
    if (this.isAdmin) {
      this.router.navigate(['/empresas/lista']);
    } else {
      this.router.navigate(['/empresas/lista']);
    }
  }

  getPlanInfo(planId: number): Plan | undefined {
    return this.planesDisponibles.find(p => p.plan_id === planId);
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
