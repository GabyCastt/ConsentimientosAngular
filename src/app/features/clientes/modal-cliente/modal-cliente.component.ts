import { Component, EventEmitter, Output, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClientesService } from '../clientes.service';
import { Cliente, CreateClienteDto } from '../../../core/models/cliente.model';
import { ConfigService } from '../../../core/services/config.service';
import { AuthService } from '../../../core/services/auth.service';
import { ApiService } from '../../../core/services/api.service';

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
  
  // Computed para verificar si es admin
  isAdmin = computed(() => this.auth.currentUser()?.rol === 'admin');

  constructor(
    private clientesService: ClientesService,
    private config: ConfigService,
    private auth: AuthService,
    private api: ApiService
  ) {}

  ngOnInit(): void {
    // Cargar empresas si es admin
    if (this.isAdmin()) {
      this.cargarEmpresas();
    }
  }

  cargarEmpresas(): void {
    this.loadingEmpresas.set(true);
    
    this.api.get<any>(this.config.endpoints.empresas).subscribe({
      next: (response) => {
        console.log('[INFO] Empresas recibidas:', response);
        const empresas = response.empresas || response || [];
        this.empresas.set(empresas);
        this.loadingEmpresas.set(false);
      },
      error: (error) => {
        console.error('[ERROR] Error cargando empresas:', error);
        this.empresas.set([]);
        this.loadingEmpresas.set(false);
      }
    });
  }

  open(cliente?: Cliente): void {
    // Cargar empresas si es admin y aún no se han cargado
    if (this.isAdmin() && this.empresas().length === 0) {
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

    // Validar cédula - exactamente 10 dígitos
    if (!this.config.isValidCedula(this.formData.cedula)) {
      errors['cedula'] = 'La cédula debe tener exactamente 10 dígitos';
    }

    // Validar nombre - mínimo 2 caracteres
    if (this.formData.nombre.length < 2) {
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

    const clienteData: CreateClienteDto = {
      cedula: this.formData.cedula,
      nombre: this.formData.nombre,
      apellido: this.formData.apellido || undefined,
      email: this.formData.email || undefined,
      telefono: this.formData.telefono || undefined,
      empresa_id: this.formData.empresa_id || undefined
    };

    console.log(' Guardando cliente:', clienteData);

    const request = this.isEditMode()
      ? this.clientesService.updateCliente(this.clienteId()!, clienteData)
      : this.clientesService.createCliente(clienteData);

    request.subscribe({
      next: () => {
        console.log(' Cliente guardado exitosamente');
        this.clienteSaved.emit();
        this.close();
        this.loading.set(false);
      },
      error: (error) => {
        console.error(' Error guardando cliente:', error);
        const errorMsg = error.error?.error || error.error?.message || 'Error al guardar cliente';
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