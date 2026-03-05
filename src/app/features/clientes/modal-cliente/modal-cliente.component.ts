import { Component, EventEmitter, Output, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClientesService } from '../clientes.service';
import { Cliente, CreateClienteDto } from '../../../core/models/cliente.model';
import { ConfigService } from '../../../core/services/config.service';
import { AuthService } from '../../../core/services/auth.service';
import { ApiService } from '../../../core/services/api.service';
import { AlertService } from '../../../shared/services/alert.service';
import { ToastService } from '../../../shared/services/toast.service';

interface Empresa {
  id: number;
  nombre: string;
  total_usuarios?: number;
  total_clientes?: number;
}

@Component({
  selector: 'app-modal-cliente',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-cliente.component.html',
  styleUrls: ['./modal-cliente.component.scss']
})
export class ModalClienteComponent implements OnInit {
  @Output() clienteSaved = new EventEmitter<void>();

  isOpen = signal(false);
  isEditMode = signal(false);
  loading = signal(false);
  loadingEmpresas = signal(false);
  clienteId = signal<number | null>(null);

  // Form fields - usando variables normales para ngModel
  formData = {
    cedula: '',
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    empresa_id: null as number | null
  };

  // Lista de empresas para el selector
  empresas = signal<Empresa[]>([]);

  // Validations
  errors = signal<Record<string, string>>({});
  
  // Computed para verificar si es admin o distribuidor
  isAdmin = computed(() => this.auth.currentUser()?.rol === 'admin');
  isDistribuidor = computed(() => this.auth.currentUser()?.rol === 'distribuidor');
  requiereEmpresaSelector = computed(() => this.isAdmin() || this.isDistribuidor());

  constructor(
    private clientesService: ClientesService,
    private config: ConfigService,
    private auth: AuthService,
    private api: ApiService,
    private alertService: AlertService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    // Cargar empresas si es admin o distribuidor
    if (this.requiereEmpresaSelector()) {
      this.cargarEmpresas();
    }
  }

  cargarEmpresas(): void {
    this.loadingEmpresas.set(true);
    
    // Admin: obtiene todas las empresas
    // Distribuidor: obtiene solo sus empresas asignadas
    const endpoint = this.isDistribuidor() 
      ? '/api/distribuidores/mis-empresas'
      : this.config.endpoints.empresas;
    
    console.log('🔍 [DEBUG] Cargando empresas desde:', endpoint);
    
    this.api.get<any>(endpoint).subscribe({
      next: (response) => {
        console.log('[INFO] Empresas recibidas:', response);
        const empresas = response.empresas || response || [];
        this.empresas.set(empresas);
        this.loadingEmpresas.set(false);
        
        // Si es distribuidor y no hay empresa seleccionada, preseleccionar la primera
        if (this.isDistribuidor() && empresas.length > 0 && !this.formData.empresa_id) {
          this.formData.empresa_id = empresas[0].id;
          console.log('🔍 [DEBUG] Empresa preseleccionada:', this.formData.empresa_id);
        }
      },
      error: (error) => {
        console.error('[ERROR] Error cargando empresas:', error);
        this.empresas.set([]);
        this.loadingEmpresas.set(false);
      }
    });
  }

  open(cliente?: Cliente): void {
    // Cargar empresas si es admin o distribuidor y aún no se han cargado
    if (this.requiereEmpresaSelector() && this.empresas().length === 0) {
      this.cargarEmpresas();
    }

    if (cliente) {
      this.isEditMode.set(true);
      this.clienteId.set(cliente.id);
      this.formData = {
        cedula: cliente.cedula,
        nombre: cliente.nombre,
        apellido: cliente.apellido || '',
        email: cliente.email || '',
        telefono: cliente.telefono || '',
        empresa_id: cliente.empresa_id
      };
    } else {
      this.isEditMode.set(false);
      this.reset();
      
      // Si es distribuidor, preseleccionar la primera empresa
      if (this.isDistribuidor() && this.empresas().length > 0) {
        this.formData.empresa_id = this.empresas()[0].id;
      }
    }
    
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
    this.reset();
  }

  private reset(): void {
    this.clienteId.set(null);
    this.formData = {
      cedula: '',
      nombre: '',
      apellido: '',
      email: '',
      telefono: '',
      empresa_id: null
    };
    this.errors.set({});
  }

  validate(): boolean {
    const errors: Record<string, string> = {};

    // Validar cédula - exactamente 10 dígitos numéricos
    const cedulaTrimmed = this.formData.cedula.trim();
    if (!/^\d{10}$/.test(cedulaTrimmed)) {
      errors['cedula'] = 'La cédula debe tener exactamente 10 dígitos numéricos';
    } else if (!this.config.isValidCedula(cedulaTrimmed)) {
      // Validación adicional del algoritmo de cédula ecuatoriana
      errors['cedula'] = 'La cédula ingresada no es válida';
    }

    // Validar nombre - mínimo 2 caracteres
    if (this.formData.nombre.trim().length < 2) {
      errors['nombre'] = 'El nombre debe tener al menos 2 caracteres';
    }

    // Validar email si está presente
    if (this.formData.email && !this.config.isValidEmail(this.formData.email)) {
      errors['email'] = 'Formato de email inválido';
    }

    // Validar teléfono si está presente
    if (this.formData.telefono && !this.config.isValidPhone(this.formData.telefono)) {
      errors['telefono'] = 'El teléfono debe tener entre 7 y 15 dígitos';
    }

    // Validar que tenga al menos email o teléfono
    if (!this.formData.email && !this.formData.telefono) {
      errors['contacto'] = 'Debes proporcionar al menos un email válido o un teléfono válido';
    }

    // Validar empresa si es admin o distribuidor
    if (this.requiereEmpresaSelector() && !this.formData.empresa_id) {
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

    // Obtener empresa_id según el rol
    let empresaId = this.formData.empresa_id;
    
    // Solo usuarios tipo 'empresa' usan su empresa_id automáticamente
    // Admin y distribuidor deben especificar empresa_id
    if (!this.requiereEmpresaSelector()) {
      empresaId = this.auth.currentUser()?.empresa_id || null;
    }

    const clienteData: CreateClienteDto = {
      cedula: this.formData.cedula.trim(),
      nombre: this.formData.nombre.trim(),
      apellido: this.formData.apellido?.trim() || undefined,
      email: this.formData.email?.trim() || undefined,
      telefono: this.formData.telefono?.trim() || undefined,
      empresa_id: empresaId || undefined
    };

    console.log(' Guardando cliente:', clienteData);

    const request = this.isEditMode()
      ? this.clientesService.updateCliente(this.clienteId()!, clienteData)
      : this.clientesService.createCliente(clienteData);

    request.subscribe({
      next: (response: any) => {
        console.log(' Cliente guardado exitosamente:', response);
        
        // La respuesta puede venir en diferentes formatos
        const clienteData = response.cliente || response;
        
        // Construir mensaje de éxito
        const accion = this.isEditMode() ? 'actualizado' : 'creado';
        let mensaje = `Cliente ${accion} exitosamente\n\n`;
        mensaje += `Nombre: ${clienteData.nombre}\n`;
        mensaje += `Cédula: ${clienteData.cedula}\n`;
        if (clienteData.email) mensaje += `Email: ${clienteData.email}\n`;
        if (clienteData.telefono) mensaje += `Teléfono: ${clienteData.telefono}\n`;
        if (clienteData.empresa_nombre) mensaje += `Empresa: ${clienteData.empresa_nombre}`;
        
        this.toastService.success(`Cliente ${accion} correctamente`);
        this.alertService.success(
          `✓ Cliente ${accion}`,
          mensaje
        );
        
        this.clienteSaved.emit();
        this.close();
        this.loading.set(false);
      },
      error: (error) => {
        console.error(' Error guardando cliente:', error);
        let errorMsg = 'Error al guardar cliente';
        
        // Manejar errores específicos
        if (error.error?.error) {
          errorMsg = error.error.error;
          
          // Mensajes específicos según el error
          if (errorMsg.includes('Ya existe un cliente con esta cédula')) {
            errorMsg = 'Ya existe un cliente con esta cédula en esta empresa';
          } else if (errorMsg.includes('No tienes acceso a esta empresa')) {
            errorMsg = 'No tienes acceso a esta empresa';
          } else if (errorMsg.includes('Debe especificar una empresa')) {
            errorMsg = 'Debes especificar una empresa';
          }
        } else if (error.error?.message) {
          errorMsg = error.error.message;
        }
        
        this.toastService.error(errorMsg);
        this.alertService.error('Error al guardar', errorMsg);
        this.errors.set({ general: errorMsg });
        this.loading.set(false);
      }
    });
  }

  // Validación en tiempo real para cédula
  onCedulaInput(): void {
    // Solo permitir números y limitar a 10 caracteres
    this.formData.cedula = this.formData.cedula.replace(/\D/g, '').substring(0, 10);
  }
}