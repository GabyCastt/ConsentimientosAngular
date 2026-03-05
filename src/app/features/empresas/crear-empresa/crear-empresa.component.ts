import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { EmpresaService } from '../../../core/services/empresa.service';
import { ToastService } from '../../../shared/services/toast.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-crear-empresa',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './crear-empresa.component.html',
  styleUrls: ['./crear-empresa.component.scss']
})
export class CrearEmpresaComponent {
  guardando = signal(false);
  isAdmin = signal(false);
  
  // Formulario empresa
  formNombre = signal('');
  formRuc = signal('');
  formEmail = signal('');
  formTelefono = signal('');
  formSlogan = signal('');
  logoFile: File | null = null;
  logoPreview = signal<string | null>(null);
  
  // Formulario usuario tipo 'empresa'
  formUsuarioEmail = signal('');
  formUsuarioPassword = signal('');
  formUsuarioNombre = signal('');

  constructor(
    private empresaService: EmpresaService,
    private toastService: ToastService,
    private authService: AuthService,
    private router: Router
  ) {
    this.isAdmin.set(this.authService.isAdmin());
  }

  onLogoChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      if (!file.type.startsWith('image/')) {
        this.toastService.error('Solo se permiten archivos de imagen');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        this.toastService.error('El archivo no debe superar 5MB');
        return;
      }
      
      this.logoFile = file;
      
      const reader = new FileReader();
      reader.onload = (e) => {
        this.logoPreview.set(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  guardar(): void {
    if (!this.validarFormulario()) {
      return;
    }

    this.guardando.set(true);

    const data = {
      nombre: this.formNombre(),
      ruc: this.formRuc() || undefined,
      email: this.formEmail() || undefined,
      telefono: this.formTelefono() || undefined,
      slogan: this.formSlogan() || undefined,
      logo: this.logoFile || undefined,
      usuario_email: this.formUsuarioEmail(),
      usuario_password: this.formUsuarioPassword(),
      usuario_nombre: this.formUsuarioNombre()
    };

    this.empresaService.crearEmpresa(data).subscribe({
      next: (response) => {
        console.log('[OK] Empresa creada:', response);
        const mensaje = response.asignada_a_distribuidor 
          ? 'Empresa creada y asignada correctamente'
          : 'Empresa y usuario creados correctamente';
        this.toastService.success(mensaje);
        this.router.navigate(['/empresas/lista']);
      },
      error: (error) => {
        console.error('[ERROR] Error creando empresa:', error);
        this.toastService.error(error.error?.error || 'Error al crear empresa');
        this.guardando.set(false);
      }
    });
  }

  validarFormulario(): boolean {
    if (!this.formNombre().trim()) {
      this.toastService.error('El nombre de la empresa es requerido');
      return false;
    }

    if (!this.formUsuarioEmail().trim()) {
      this.toastService.error('El email del usuario es requerido');
      return false;
    }

    if (!this.formUsuarioPassword().trim() || this.formUsuarioPassword().length < 6) {
      this.toastService.error('La contraseña debe tener al menos 6 caracteres');
      return false;
    }

    if (!this.formUsuarioNombre().trim()) {
      this.toastService.error('El nombre del usuario es requerido');
      return false;
    }

    return true;
  }

  cancelar(): void {
    this.router.navigate(['/empresas/lista']);
  }
}
