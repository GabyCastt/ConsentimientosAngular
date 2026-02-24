import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmpresasService, Empresa } from '../empresas.service';
import { ToastService } from '../../../shared/services/toast.service';
import { AuthService } from '../../../core/services/auth.service';
import { ConfigService } from '../../../core/services/config.service';

@Component({
  selector: 'app-lista-empresas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lista-empresas.component.html',
  styleUrls: ['./lista-empresas.component.scss']
})
export class ListaEmpresasComponent implements OnInit {
  empresas = signal<Empresa[]>([]);
  loading = signal(true);
  isAdmin = signal(false);
  
  // Modal
  mostrarModal = signal(false);
  empresaEditando = signal<Empresa | null>(null);
  guardando = signal(false);
  
  // Formulario
  formNombre = signal('');
  formRuc = signal('');
  formEmail = signal('');
  formTelefono = signal('');
  formSlogan = signal('');
  logoFile: File | null = null;
  logoPreview = signal<string | null>(null);

  constructor(
    private empresasService: EmpresasService,
    private toastService: ToastService,
    private authService: AuthService,
    public config: ConfigService
  ) {}

  ngOnInit(): void {
    const currentUser = this.authService.currentUser();
    this.isAdmin.set(currentUser?.rol === 'admin');
    
    if (this.isAdmin()) {
      this.loadEmpresas();
    } else {
      this.loadPerfil();
    }
  }

  loadEmpresas(): void {
    this.loading.set(true);
    
    this.empresasService.getEmpresas().subscribe({
      next: (response) => {
        console.log('[OK] Empresas cargadas:', response);
        this.empresas.set(response.empresas);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('[ERROR] Error cargando empresas:', error);
        this.toastService.error('Error al cargar empresas');
        this.loading.set(false);
      }
    });
  }

  loadPerfil(): void {
    this.loading.set(true);
    
    this.empresasService.getPerfil().subscribe({
      next: (response) => {
        console.log('[OK] Perfil de empresa cargado:', response);
        this.empresas.set([response.empresa]);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('[ERROR] Error cargando perfil:', error);
        this.toastService.error('Error al cargar perfil de empresa');
        this.loading.set(false);
      }
    });
  }

  abrirModalCrear(): void {
    this.empresaEditando.set(null);
    this.limpiarFormulario();
    this.mostrarModal.set(true);
  }

  editarEmpresa(empresa: Empresa): void {
    this.empresaEditando.set(empresa);
    this.formNombre.set(empresa.nombre);
    this.formRuc.set(empresa.ruc || '');
    this.formEmail.set(empresa.email || '');
    this.formTelefono.set(empresa.telefono || '');
    this.formSlogan.set(empresa.slogan || '');
    this.logoFile = null;
    this.logoPreview.set(null);
    this.mostrarModal.set(true);
  }

  cerrarModal(): void {
    this.mostrarModal.set(false);
    this.empresaEditando.set(null);
    this.limpiarFormulario();
  }

  limpiarFormulario(): void {
    this.formNombre.set('');
    this.formRuc.set('');
    this.formEmail.set('');
    this.formTelefono.set('');
    this.formSlogan.set('');
    this.logoFile = null;
    this.logoPreview.set(null);
  }

  onLogoChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      // Validar tipo
      if (!file.type.startsWith('image/')) {
        this.toastService.error('Solo se permiten archivos de imagen');
        return;
      }
      
      // Validar tamaño (5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.toastService.error('El archivo no debe superar 5MB');
        return;
      }
      
      this.logoFile = file;
      
      // Preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.logoPreview.set(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  guardarEmpresa(): void {
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

    const request = this.empresaEditando()
      ? this.empresasService.updateEmpresa(this.empresaEditando()!.id, data)
      : this.empresasService.createEmpresa(data);

    request.subscribe({
      next: (response) => {
        this.toastService.success(
          this.empresaEditando() 
            ? 'Empresa actualizada correctamente' 
            : 'Empresa creada correctamente'
        );
        this.cerrarModal();
        this.loadEmpresas();
        this.guardando.set(false);
      },
      error: (error) => {
        console.error('Error guardando empresa:', error);
        this.toastService.error(error.error?.error || 'Error al guardar empresa');
        this.guardando.set(false);
      }
    });
  }

  deleteEmpresa(empresa: Empresa): void {
    if (!confirm(`¿Estás seguro de eliminar la empresa ${empresa.nombre}?`)) {
      return;
    }

    this.empresasService.deleteEmpresa(empresa.id).subscribe({
      next: () => {
        this.toastService.success('Empresa eliminada correctamente');
        this.loadEmpresas();
      },
      error: (error) => {
        console.error('Error eliminando empresa:', error);
        this.toastService.error(error.error?.error || 'Error al eliminar empresa');
      }
    });
  }

  limpiarHuerfanas(): void {
    if (!confirm('¿Deseas limpiar empresas sin usuarios, clientes ni formularios?')) {
      return;
    }

    this.empresasService.limpiarEmpresasHuerfanas().subscribe({
      next: (response) => {
        this.toastService.success(response.message);
        this.loadEmpresas();
      },
      error: (error) => {
        console.error('Error limpiando empresas:', error);
        this.toastService.error('Error al limpiar empresas');
      }
    });
  }

  getLogoUrl(logoPath: string | null | undefined): string | null {
    return this.config.getLogoUrl(logoPath || null);
  }

  onImageError(event: Event, empresa: Empresa): void {
    console.error('[ERROR] Error cargando logo:', {
      empresa: empresa.nombre,
      logoPath: empresa.logo,
      constructedUrl: this.getLogoUrl(empresa.logo),
      event
    });
    
    // Ocultar la imagen rota y mostrar placeholder
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
  }

  formatDate(dateString: string): string {
    return this.config.formatearTiempoRelativo(dateString);
  }
}
