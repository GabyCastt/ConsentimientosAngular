import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EmpresaService } from '../../../core/services/empresa.service';
import { ToastService } from '../../../shared/services/toast.service';
import { AuthService } from '../../../core/services/auth.service';
import { ConfigService } from '../../../core/services/config.service';

@Component({
  selector: 'app-editar-empresa',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './editar-empresa.component.html',
  styleUrls: ['./editar-empresa.component.scss']
})
export class EditarEmpresaComponent implements OnInit {
  empresaId = signal<number>(0);
  loading = signal(true);
  guardando = signal(false);
  isAdmin = signal(false);
  
  // Formulario
  formNombre = signal('');
  formRuc = signal('');
  formEmail = signal('');
  formTelefono = signal('');
  formSlogan = signal('');
  logoFile: File | null = null;
  logoPreview = signal<string | null>(null);
  logoActual = signal<string | null>(null);

  constructor(
    private empresaService: EmpresaService,
    private toastService: ToastService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    public config: ConfigService
  ) {
    this.isAdmin.set(this.authService.isAdmin());
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.empresaId.set(parseInt(id));
      this.cargarEmpresa();
    }
  }

  cargarEmpresa(): void {
    this.loading.set(true);
    
    this.empresaService.obtenerEmpresa(this.empresaId()).subscribe({
      next: (response) => {
        const empresa = response.empresa;
        this.formNombre.set(empresa.nombre);
        this.formRuc.set(empresa.ruc || '');
        this.formEmail.set(empresa.email || '');
        this.formTelefono.set(empresa.telefono || '');
        this.formSlogan.set(empresa.slogan || '');
        this.logoActual.set(empresa.logo || null);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('[ERROR] Error cargando empresa:', error);
        this.toastService.error('Error al cargar empresa');
        this.router.navigate(['/empresas/lista']);
      }
    });
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
    if (!this.formNombre().trim()) {
      this.toastService.error('El nombre es requerido');
      return;
    }

    this.guardando.set(true);

    const data = {
      nombre: this.formNombre(),
      ruc: this.formRuc() || undefined,
      email: this.formEmail() || undefined,
      telefono: this.formTelefono() || undefined,
      slogan: this.formSlogan() || undefined,
      logo: this.logoFile || undefined
    };

    this.empresaService.actualizarEmpresa(this.empresaId(), data).subscribe({
      next: (response) => {
        this.toastService.success('Empresa actualizada correctamente');
        this.router.navigate(['/empresas/lista']);
      },
      error: (error) => {
        console.error('[ERROR] Error actualizando empresa:', error);
        this.toastService.error(error.error?.error || 'Error al actualizar empresa');
        this.guardando.set(false);
      }
    });
  }

  cancelar(): void {
    this.router.navigate(['/empresas/lista']);
  }

  getLogoUrl(): string | null {
    if (this.logoPreview()) return this.logoPreview();
    return this.config.getLogoUrl(this.logoActual());
  }
}
