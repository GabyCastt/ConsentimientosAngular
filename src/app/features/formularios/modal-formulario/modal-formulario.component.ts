import { Component, EventEmitter, Output, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { ConfigService } from '../../../core/services/config.service';
import { AuthService } from '../../../core/services/auth.service';

interface Empresa {
  id: number;
  nombre: string;
  total_usuarios?: number;
  total_clientes?: number;
}

interface TipoConsentimiento {
  value: string;
  label: string;
  icon: string;
  color: string;
}

interface TipoValidacion {
  value: string;
  label: string;
  descripcion: string;
  icon: string;
  color: string;
  costo: boolean;
}

@Component({
  selector: 'app-modal-formulario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-formulario.component.html',
  styleUrls: ['./modal-formulario.component.scss']
})
export class ModalFormularioComponent implements OnInit {
  @Output() formularioSaved = new EventEmitter<void>();

  isOpen = signal(false);
  isEditMode = signal(false);
  loading = signal(false);
  loadingEmpresas = signal(false);
  formularioId = signal<number | null>(null);

  // Form data
  formData = {
    nombre: '',
    descripcion: '',
    tipos_consentimientos: [] as string[],
    tipo_validacion: 'sms_email',
    empresa_id: null as number | null
  };

  // Lista de empresas
  empresas = signal<Empresa[]>([]);

  // Validations
  errors = signal<Record<string, string>>({});

  // Computed
  isAdmin = computed(() => this.auth.currentUser()?.rol === 'admin');

  // Tipos de consentimiento disponibles
  tiposConsentimiento: TipoConsentimiento[] = [
    { value: 'datos_personales', label: 'Datos Personales', icon: 'fa-shield-alt', color: 'primary' },
    { value: 'imagen', label: 'Uso de Imagen', icon: 'fa-image', color: 'info' },
    { value: 'marketing', label: 'Marketing', icon: 'fa-bullhorn', color: 'warning' }
  ];

  // Tipos de validación disponibles
  tiposValidacion: TipoValidacion[] = [
    {
      value: 'sms_email',
      label: 'WhatsApp/Email Gratuita',
      descripcion: 'Verificación tradicional por WhatsApp o Email sin costo adicional',
      icon: 'fa-envelope',
      color: 'secondary',
      costo: false
    },
    {
      value: 'biometria_free',
      label: 'Biometría DIDIT Gratuita',
      descripcion: 'Verificación biométrica con foto de cédula y selfie. Incluye logo de DIDIT.',
      icon: 'fa-fingerprint',
      color: 'info',
      costo: false
    },
    {
      value: 'biometria_premium',
      label: 'Biometría DIDIT Premium',
      descripcion: 'Verificación biométrica con branding personalizado sin logo de DIDIT.',
      icon: 'fa-crown',
      color: 'warning',
      costo: true
    },
    {
      value: 'sms_didit',
      label: 'SMS DIDIT Pago',
      descripcion: 'Verificación por SMS con costo. Máximo 3 intentos por persona.',
      icon: 'fa-sms',
      color: 'danger',
      costo: true
    }
  ];

  constructor(
    private api: ApiService,
    private config: ConfigService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    if (this.isAdmin()) {
      this.cargarEmpresas();
    }
  }

  cargarEmpresas(): void {
    this.loadingEmpresas.set(true);
    
    this.api.get<any>(this.config.endpoints.empresas).subscribe({
      next: (response) => {
        const empresas = response.empresas || response || [];
        this.empresas.set(empresas);
        this.loadingEmpresas.set(false);
      },
      error: (error) => {
        console.error('❌ Error cargando empresas:', error);
        this.empresas.set([]);
        this.loadingEmpresas.set(false);
      }
    });
  }

  open(formulario?: any): void {
    if (this.isAdmin() && this.empresas().length === 0) {
      this.cargarEmpresas();
    }

    if (formulario) {
      this.isEditMode.set(true);
      this.formularioId.set(formulario.id);
      this.formData = {
        nombre: formulario.nombre,
        descripcion: formulario.descripcion || '',
        tipos_consentimientos: [...formulario.tipos_consentimientos],
        tipo_validacion: formulario.tipo_validacion || 'sms_email',
        empresa_id: formulario.empresa_id
      };
    } else {
      this.isEditMode.set(false);
      this.reset();
    }

    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
    this.reset();
  }

  private reset(): void {
    this.formularioId.set(null);
    this.formData = {
      nombre: '',
      descripcion: '',
      tipos_consentimientos: [],
      tipo_validacion: 'sms_email',
      empresa_id: null
    };
    this.errors.set({});
  }

  toggleTipoConsentimiento(tipo: string): void {
    const index = this.formData.tipos_consentimientos.indexOf(tipo);
    if (index > -1) {
      this.formData.tipos_consentimientos.splice(index, 1);
    } else {
      this.formData.tipos_consentimientos.push(tipo);
    }
  }

  isTipoConsentimientoSelected(tipo: string): boolean {
    return this.formData.tipos_consentimientos.includes(tipo);
  }

  getTipoValidacionSeleccionado(): TipoValidacion | undefined {
    return this.tiposValidacion.find(t => t.value === this.formData.tipo_validacion);
  }

  validate(): boolean {
    const errors: Record<string, string> = {};

    // Validar nombre
    if (!this.formData.nombre || this.formData.nombre.length < 3) {
      errors['nombre'] = 'El nombre debe tener al menos 3 caracteres';
    }

    // Validar tipos de consentimiento
    if (this.formData.tipos_consentimientos.length === 0) {
      errors['tipos'] = 'Debes seleccionar al menos un tipo de consentimiento';
    }

    // Validar tipo de validación
    if (!this.formData.tipo_validacion) {
      errors['validacion'] = 'Debes seleccionar un tipo de verificación';
    }

    // Validar empresa si es admin
    if (this.isAdmin() && !this.formData.empresa_id) {
      errors['empresa'] = 'Debes seleccionar una empresa';
    }

    this.errors.set(errors);
    return Object.keys(errors).length === 0;
  }

  save(): void {
    if (!this.validate()) {
      return;
    }

    this.loading.set(true);

    const formularioData = {
      nombre: this.formData.nombre,
      descripcion: this.formData.descripcion || undefined,
      tipos_consentimientos: this.formData.tipos_consentimientos,
      tipo_validacion: this.formData.tipo_validacion,
      empresa_id: this.formData.empresa_id || undefined
    };

    console.log('💾 Guardando formulario:', formularioData);

    const request = this.isEditMode()
      ? this.api.put(`${this.config.endpoints.formularios}/${this.formularioId()}`, formularioData)
      : this.api.post(this.config.endpoints.formularios, formularioData);

    request.subscribe({
      next: (response: any) => {
        console.log('✅ Formulario guardado:', response);
        
        // Mostrar URL generada si es nuevo
        if (!this.isEditMode() && response.formulario) {
          const urlPublica = this.config.isDevelopment()
            ? `${window.location.origin}/formulario/${response.formulario.token_publico}`
            : `https://begroupec.com/demo-apps/Plataforma-consentimientos/frontend-cpanel/formulario.html?token=${response.formulario.token_publico}`;
          
          const tipoTexto = this.getTipoValidacionSeleccionado()?.label || 'Desconocido';
          
          setTimeout(() => {
            alert(
              `¡Formulario creado exitosamente!\n\n` +
              `Tipo de verificación: ${tipoTexto}\n\n` +
              `URL Pública:\n${urlPublica}\n\n` +
              `Comparte esta URL con las personas que quieres que llenen el formulario.`
            );
            
            // Copiar URL al portapapeles
            if (navigator.clipboard) {
              navigator.clipboard.writeText(urlPublica);
            }
          }, 500);
        }

        this.formularioSaved.emit();
        this.close();
        this.loading.set(false);
      },
      error: (error) => {
        console.error('❌ Error guardando formulario:', error);
        const errorMsg = error.error?.error || error.error?.message || 'Error al guardar formulario';
        this.errors.set({ general: errorMsg });
        this.loading.set(false);
      }
    });
  }
}
