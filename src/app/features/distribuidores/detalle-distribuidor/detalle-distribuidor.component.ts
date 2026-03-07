import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { EmpresaService } from '../../../core/services/empresa.service';
import { Distribuidor } from '../../../core/models/distribuidor.model';
import { Empresa } from '../../../core/models/empresa.model';

@Component({
  selector: 'app-detalle-distribuidor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './detalle-distribuidor.component.html',
  styleUrls: ['./detalle-distribuidor.component.scss']
})
export class DetalleDistribuidorComponent implements OnInit {
  distribuidor: Distribuidor | null = null;
  empresasDisponibles: Empresa[] = [];
  loading = false;
  error: string | null = null;
  
  showPasswordForm = false;
  passwordForm: FormGroup;
  showPassword = false;
  
  showAsignarForm = false;
  asignarForm: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private adminService: AdminService,
    private empresaService: EmpresaService
  ) {
    this.passwordForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    this.asignarForm = this.fb.group({
      empresaId: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.cargarDistribuidor(+id);
    }
  }

  cargarDistribuidor(id: number): void {
    this.loading = true;
    this.error = null;

    this.adminService.getDistribuidor(id).subscribe({
      next: (response) => {
        this.distribuidor = response.distribuidor;
        // Las empresas vienen en response.empresas, no en response.distribuidor.empresas
        if (response.empresas) {
          this.distribuidor.empresas = response.empresas;
        }
        console.log('Distribuidor cargado:', this.distribuidor);
        console.log('Empresas del distribuidor:', this.distribuidor.empresas);
        console.log('Total empresas:', this.distribuidor.total_empresas);
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.error || 'Error al cargar distribuidor';
        this.loading = false;
      }
    });
  }

  cargarEmpresasDisponibles(): void {
    this.empresaService.listarEmpresas().subscribe({
      next: (response) => {
        const empresasAsignadas = this.distribuidor?.empresas?.map(e => e.id) || [];
        this.empresasDisponibles = response.empresas.filter(
          e => !empresasAsignadas.includes(e.id)
        );
      },
      error: (err) => {
        alert(err.error?.error || 'Error al cargar empresas');
      }
    });
  }

  togglePasswordForm(): void {
    this.showPasswordForm = !this.showPasswordForm;
    if (this.showPasswordForm) {
      this.passwordForm.reset();
    }
  }

  toggleAsignarForm(): void {
    this.showAsignarForm = !this.showAsignarForm;
    if (this.showAsignarForm) {
      this.asignarForm.reset();
      this.cargarEmpresasDisponibles();
    }
  }

  cambiarPassword(): void {
    if (this.passwordForm.invalid || !this.distribuidor) return;

    this.adminService.cambiarPassword(this.distribuidor.id, this.passwordForm.value).subscribe({
      next: () => {
        alert('Contraseña actualizada exitosamente');
        this.togglePasswordForm();
      },
      error: (err) => {
        alert(err.error?.error || 'Error al cambiar contraseña');
      }
    });
  }

  asignarEmpresa(): void {
    if (this.asignarForm.invalid || !this.distribuidor) return;

    const empresaId = +this.asignarForm.value.empresaId;
    
    this.adminService.asignarEmpresa(this.distribuidor.id, empresaId).subscribe({
      next: () => {
        alert('Empresa asignada exitosamente');
        this.toggleAsignarForm();
        this.cargarDistribuidor(this.distribuidor!.id);
      },
      error: (err) => {
        // Manejar error 409 cuando la empresa ya tiene distribuidor
        if (err.status === 409 && err.error?.distribuidor_actual) {
          const distActual = err.error.distribuidor_actual;
          const mensaje = `Esta empresa ya está asignada a:\n\n` +
                         `Distribuidor: ${distActual.nombre}\n` +
                         `Email: ${distActual.email}\n` +
                         `Asignada desde: ${new Date(distActual.asignado_en).toLocaleDateString()}\n\n` +
                         `¿Deseas reasignarla a este distribuidor?`;
          
          if (confirm(mensaje)) {
            // Primero desasignar del distribuidor actual
            this.adminService.desasignarEmpresa(distActual.id, empresaId).subscribe({
              next: () => {
                // Luego asignar al nuevo distribuidor
                this.adminService.asignarEmpresa(this.distribuidor!.id, empresaId).subscribe({
                  next: () => {
                    alert('Empresa reasignada exitosamente');
                    this.toggleAsignarForm();
                    this.cargarDistribuidor(this.distribuidor!.id);
                  },
                  error: (err2) => {
                    alert(err2.error?.error || 'Error al reasignar empresa');
                  }
                });
              },
              error: (err2) => {
                alert(err2.error?.error || 'Error al desasignar empresa del distribuidor anterior');
              }
            });
          }
        } else {
          alert(err.error?.error || 'Error al asignar empresa');
        }
      }
    });
  }

  desasignarEmpresa(empresaId: number, empresaNombre: string): void {
    if (!this.distribuidor) return;
    
    if (!confirm(`¿Desasignar empresa "${empresaNombre}"?`)) return;

    this.adminService.desasignarEmpresa(this.distribuidor.id, empresaId).subscribe({
      next: () => {
        alert('Empresa desasignada exitosamente');
        this.cargarDistribuidor(this.distribuidor!.id);
      },
      error: (err) => {
        alert(err.error?.error || 'Error al desasignar empresa');
      }
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  editarDistribuidor(): void {
    if (this.distribuidor) {
      this.router.navigate(['/distribuidores/editar', this.distribuidor.id]);
    }
  }

  gestionarPlanes(): void {
    if (this.distribuidor) {
      this.router.navigate(['/distribuidores/planes', this.distribuidor.id]);
    }
  }
}
