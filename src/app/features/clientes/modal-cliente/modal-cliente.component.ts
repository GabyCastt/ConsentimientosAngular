import { Component, EventEmitter, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClientesService } from '../clientes.service';
import { Cliente, CreateClienteDto } from '../../../core/models/cliente.model';
import { ConfigService } from '../../../core/services/config.service';

@Component({
  selector: 'app-modal-cliente',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-cliente.component.html',
  styleUrls: ['./modal-cliente.component.scss']
})
export class ModalClienteComponent {
  @Output() clienteSaved = new EventEmitter<void>();

  isOpen = signal(false);
  isEditMode = signal(false);
  loading = signal(false);
  clienteId = signal<number | null>(null);

  // Form fields
  cedula = signal('');
  nombre = signal('');
  apellido = signal('');
  email = signal('');
  telefono = signal('');

  // Validations
  errors = signal<Record<string, string>>({});

  constructor(
    private clientesService: ClientesService,
    private config: ConfigService
  ) {}

  open(cliente?: Cliente): void {
    if (cliente) {
      this.isEditMode.set(true);
      this.clienteId.set(cliente.id);
      this.cedula.set(cliente.cedula);
      this.nombre.set(cliente.nombre);
      this.apellido.set(cliente.apellido || '');
      this.email.set(cliente.email || '');
      this.telefono.set(cliente.telefono || '');
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
    this.cedula.set('');
    this.nombre.set('');
    this.apellido.set('');
    this.email.set('');
    this.telefono.set('');
    this.errors.set({});
  }

  validate(): boolean {
    const errors: Record<string, string> = {};

    // Validar cédula
    if (!this.config.isValidCedula(this.cedula())) {
      errors['cedula'] = 'Cédula debe tener 10 dígitos';
    }

    // Validar nombre
    if (this.nombre().length < 2) {
      errors['nombre'] = 'Nombre debe tener al menos 2 caracteres';
    }

    // Validar email si está presente
    if (this.email() && !this.config.isValidEmail(this.email())) {
      errors['email'] = 'Email inválido';
    }

    // Validar teléfono si está presente
    if (this.telefono() && !this.config.isValidPhone(this.telefono())) {
      errors['telefono'] = 'Teléfono inválido';
    }

    // Validar que tenga al menos email o teléfono
    if (!this.email() && !this.telefono()) {
      errors['contacto'] = 'Debe proporcionar al menos email o teléfono';
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
      cedula: this.cedula(),
      nombre: this.nombre(),
      apellido: this.apellido() || undefined,
      email: this.email() || undefined,
      telefono: this.telefono() || undefined
    };

    const request = this.isEditMode()
      ? this.clientesService.updateCliente(this.clienteId()!, clienteData)
      : this.clientesService.createCliente(clienteData);

    request.subscribe({
      next: () => {
        this.clienteSaved.emit();
        this.close();
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error guardando cliente:', error);
        this.errors.set({ general: error.error?.message || 'Error al guardar cliente' });
        this.loading.set(false);
      }
    });
  }
}