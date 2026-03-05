import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmpresaService } from '../../../core/services/empresa.service';
import { EmpresaConEstadisticas } from '../../../core/models/empresa.model';
import { ConfigService } from '../../../core/services/config.service';

@Component({
  selector: 'app-perfil-empresa',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './perfil-empresa.component.html',
  styleUrls: ['./perfil-empresa.component.scss']
})
export class PerfilEmpresaComponent implements OnInit {
  empresa = signal<EmpresaConEstadisticas | null>(null);
  loading = signal(false);
  editando = signal(false);
  
  // Formulario
  nombre = signal('');
  slogan = signal('');
  logoFile: File | null = null;
  logoPreview = signal<string | null>(null);
  
  // Mensajes
  mensaje = signal('');
  tipoMensaje = signal<'success' | 'error' | 'info'>('info');

  constructor(
    private empresaService: EmpresaService,
    public config: ConfigService
  ) {}

  ngOnInit(): void {
    this.cargarPerfil();
  }

  cargarPerfil(): void {
    this.loading.set(true);
    
    this.empresaService.obtenerPerfil().subscribe({
      next: (response) => {
        console.log('[OK] Perfil cargado:', response);
        this.empresa.set(response.empresa);
        this.nombre.set(response.empresa.nombre);
        this.slogan.set(response.empresa.slogan || '');
        this.loading.set(false);
      },
      error: (error) => {
        console.error('[ERROR] Error cargando perfil:', error);
        this.mostrarMensaje('Error al cargar perfil de empresa', 'error');
        this.loading.set(false);
      }
    });
  }

  toggleEdicion(): void {
    if (this.editando()) {
      // Cancelar edición
      const emp = this.empresa();
      if (emp) {
        this.nombre.set(emp.nombre);
        this.slogan.set(emp.slogan || '');
        this.logoFile = null;
        this.logoPreview.set(null);
      }
    }
    this.editando.set(!this.editando());
  }

  onLogoChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      // Validar tipo
      if (!file.type.startsWith('image/')) {
        this.mostrarMensaje('Solo se permiten archivos de imagen', 'error');
        return;
      }
      
      // Validar tamaño (5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.mostrarMensaje('El archivo no debe superar 5MB', 'error');
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

  guardarCambios(): void {
    if (!this.nombre().trim()) {
      this.mostrarMensaje('El nombre es requerido', 'error');
      return;
    }
    
    this.loading.set(true);
    
    this.empresaService.actualizarPerfil({
      nombre: this.nombre(),
      slogan: this.slogan() || undefined,
      logo: this.logoFile || undefined
    }).subscribe({
      next: (response) => {
        this.mostrarMensaje('Perfil actualizado exitosamente', 'success');
        this.editando.set(false);
        this.logoFile = null;
        this.logoPreview.set(null);
        this.cargarPerfil();
      },
      error: (error) => {
        console.error('[ERROR] Error actualizando perfil:', error);
        this.mostrarMensaje(error.error?.error || 'Error al actualizar perfil', 'error');
        this.loading.set(false);
      }
    });
  }

  getLogoUrl(): string | null {
    const preview = this.logoPreview();
    if (preview) return preview;
    
    const emp = this.empresa();
    return emp?.logo ? this.config.getLogoUrl(emp.logo) : null;
  }

  mostrarMensaje(mensaje: string, tipo: 'success' | 'error' | 'info'): void {
    this.mensaje.set(mensaje);
    this.tipoMensaje.set(tipo);
    
    setTimeout(() => {
      this.mensaje.set('');
    }, 5000);
  }

  formatMetodoNombre(metodo: string): string {
    const nombres: { [key: string]: string } = {
      'sms_email': 'SMS/Email',
      'sms_didit': 'SMS DIDIT',
      'biometria_free': 'Biometría Free',
      'biometria_premium': 'Biometría Premium'
    };
    return nombres[metodo] || metodo;
  }
}
