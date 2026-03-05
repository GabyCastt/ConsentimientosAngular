import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { EmpresaService } from '../../../core/services/empresa.service';
import { DistribuidorService } from '../../../core/services/distribuidor.service';
import { Empresa } from '../../../core/models/empresa.model';
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
  isDistribuidor = signal(false);
  
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
  
  // Campos para usuario tipo 'empresa' (al crear)
  formUsuarioEmail = signal('');
  formUsuarioPassword = signal('');
  formUsuarioNombre = signal('');

  constructor(
    private empresaService: EmpresaService,
    private distribuidorService: DistribuidorService,
    private toastService: ToastService,
    private authService: AuthService,
    private router: Router,
    public config: ConfigService
  ) {}

  ngOnInit(): void {
    const currentUser = this.authService.currentUser();
    this.isAdmin.set(currentUser?.rol === 'admin');
    this.isDistribuidor.set(currentUser?.rol === 'distribuidor');
    
    this.loadEmpresas();
  }

  loadEmpresas(): void {
    this.loading.set(true);
    
    // Admin y Distribuidor usan el mismo endpoint /api/empresas
    // El backend filtra según el rol
    this.empresaService.listarEmpresas().subscribe({
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

  abrirModalCrear(): void {
    this.empresaEditando.set(null);
    this.limpiarFormulario();
    this.mostrarModal.set(true);
  }

  editarEmpresa(empresa: Empresa): void {
    this.router.navigate(['/empresas/editar', empresa.id]);
  }

  verDetalle(empresa: Empresa): void {
    this.router.navigate(['/empresas/detalle', empresa.id]);
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
    this.formUsuarioEmail.set('');
    this.formUsuarioPassword.set('');
    this.formUsuarioNombre.set('');
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

    // Validar campos de usuario tipo 'empresa'
    if (!this.formUsuarioEmail().trim()) {
      this.toastService.error('El email del usuario es requerido');
      return;
    }
    
    if (!this.formUsuarioPassword().trim() || this.formUsuarioPassword().length < 6) {
      this.toastService.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    
    if (!this.formUsuarioNombre().trim()) {
      this.toastService.error('El nombre del usuario es requerido');
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
        this.cerrarModal();
        this.loadEmpresas();
        this.guardando.set(false);
      },
      error: (error) => {
        console.error('[ERROR] Error creando empresa:', error);
        this.toastService.error(error.error?.error || 'Error al crear empresa');
        this.guardando.set(false);
      }
    });
  }

  deleteEmpresa(empresa: Empresa): void {
    if (!this.isAdmin()) {
      this.toastService.error('Solo los administradores pueden eliminar empresas');
      return;
    }

    if (!confirm(`¿Estás seguro de eliminar la empresa ${empresa.nombre}?`)) {
      return;
    }

    this.empresaService.eliminarEmpresa(empresa.id).subscribe({
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
    if (!this.isAdmin()) {
      this.toastService.error('Solo los administradores pueden limpiar empresas huérfanas');
      return;
    }

    if (!confirm('¿Deseas limpiar empresas sin usuarios, clientes ni formularios?')) {
      return;
    }

    this.empresaService.limpiarEmpresasHuerfanas().subscribe({
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

  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'N/A';
    return this.config.formatearTiempoRelativo(dateString);
  }
}
