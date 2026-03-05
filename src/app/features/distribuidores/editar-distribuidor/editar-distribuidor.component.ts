import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { Distribuidor } from '../../../core/models/distribuidor.model';

@Component({
  selector: 'app-editar-distribuidor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './editar-distribuidor.component.html',
  styleUrls: ['./editar-distribuidor.component.scss']
})
export class EditarDistribuidorComponent implements OnInit {
  form: FormGroup;
  distribuidor: Distribuidor | null = null;
  loading = false;
  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private adminService: AdminService
  ) {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      activo: [true]
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
        this.form.patchValue({
          nombre: this.distribuidor.nombre,
          email: this.distribuidor.email,
          activo: this.distribuidor.activo
        });
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.error || 'Error al cargar distribuidor';
        this.loading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid || !this.distribuidor) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = null;

    this.adminService.actualizarDistribuidor(this.distribuidor.id, this.form.value).subscribe({
      next: () => {
        alert('Distribuidor actualizado exitosamente');
        this.router.navigate(['/distribuidores/detalle', this.distribuidor!.id]);
      },
      error: (err) => {
        this.error = err.error?.error || 'Error al actualizar distribuidor';
        this.loading = false;
      }
    });
  }

  getErrorMessage(field: string): string {
    const control = this.form.get(field);
    if (!control || !control.errors || !control.touched) return '';

    if (control.errors['required']) return 'Este campo es requerido';
    if (control.errors['email']) return 'Email inválido';
    if (control.errors['minlength']) {
      const minLength = control.errors['minlength'].requiredLength;
      return `Mínimo ${minLength} caracteres`;
    }
    return '';
  }
}
