import { Component, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClientesService } from '../clientes.service';
import { ClienteDetalle } from '../../../core/models/cliente.model';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { ToastService } from '../../../shared/services/toast.service';
import { AlertService } from '../../../shared/services/alert.service';
import { ConfigService } from '../../../core/services/config.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-modal-detalle-cliente',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingComponent],
  templateUrl: './modal-detalle-cliente.component.html',
  styleUrl: './modal-detalle-cliente.component.scss'
})
export class ModalDetalleClienteComponent {
  isOpen = signal(false);
  loading = signal(false);
  cliente = signal<ClienteDetalle | null>(null);
  clienteId = signal<number | null>(null);
  editandoContacto = signal(false);
  emailEdit = signal('');
  telefonoEdit = signal('');

  closed = output<void>();

  constructor(
    private clientesService: ClientesService,
    private toastService: ToastService,
    private alertService: AlertService,
    private config: ConfigService,
    private authService: AuthService
  ) {}

  open(clienteId: number): void {
    this.clienteId.set(clienteId);
    this.isOpen.set(true);
    this.loadClienteDetalle(clienteId);
  }

  close(): void {
    this.isOpen.set(false);
    this.cliente.set(null);
    this.clienteId.set(null);
    this.closed.emit();
  }

  loadClienteDetalle(id: number): void {
    this.loading.set(true);
    
    this.clientesService.getClienteDetalle(id).subscribe({
      next: (response) => {
        console.log('Detalle del cliente recibido:', response);
        this.cliente.set(response);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error cargando detalle del cliente:', error);
        this.toastService.error('Error al cargar detalle del cliente');
        this.loading.set(false);
        this.close();
      }
    });
  }

  descargarDocumento(respuestaId: number): void {
    const clienteId = this.clienteId();
    if (!clienteId) return;

    const url = this.config.getApiUrlWithParams(
      this.config.endpoints.clientesDocumento,
      { clienteId, respuestaId }
    );

    // Obtener el token del AuthService
    const token = this.authService.getToken();
    
    if (!token) {
      this.toastService.error('No se encontró token de autenticación');
      return;
    }

    // Crear un enlace temporal con el token en el header mediante fetch
    fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => response.blob())
    .then(blob => {
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `documento-${clienteId}-${respuestaId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
      this.toastService.success('Documento descargado correctamente');
    })
    .catch(error => {
      console.error('Error descargando documento:', error);
      this.toastService.error('Error al descargar el documento');
    });
  }

  reenviarCertificado(respuestaId: number): void {
    const clienteId = this.clienteId();
    if (!clienteId) return;

    if (!confirm('¿Estás seguro de reenviar el certificado a este cliente?\n\nSe enviará por email y WhatsApp.')) {
      return;
    }

    this.loading.set(true);

    const url = this.config.buildEndpoint(
      this.config.endpoints.clientesReenviar,
      { clienteId, respuestaId }
    );

    this.clientesService['api'].post(url, {}).subscribe({
      next: (response: any) => {
        console.log('Certificado reenviado:', response);
        
        // Construir mensaje detallado
        let mensaje = 'Certificado reenviado exitosamente\n\n';
        mensaje += `Email: ${response.email_enviado ? '✓ Enviado correctamente' : '✗ No enviado'}\n`;
        mensaje += `WhatsApp: ${response.whatsapp_enviado ? '✓ Enviado correctamente' : '✗ No enviado'}\n`;
        mensaje += `Archivos adjuntos: ${response.archivos_adjuntos || 0}`;
        
        if (response.detalles) {
          const detalles = response.detalles;
          mensaje = 'Certificado reenviado exitosamente\n\n';
          mensaje += `Email: ${detalles.email_enviado ? '✓ Enviado correctamente' : '✗ No enviado'}\n`;
          mensaje += `WhatsApp: ${detalles.sms_enviado ? '✓ Enviado correctamente' : '✗ No enviado'}\n`;
          mensaje += `Archivos adjuntos: ${detalles.archivos_adjuntos || 0}\n`;
          mensaje += `Certificado: ${detalles.certificado_generado ? '✓ Generado correctamente' : '✗ No generado'}`;
        }
        
        this.toastService.success('Certificado reenviado exitosamente');
        this.alertService.success('📧 Certificado reenviado', mensaje);
        
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error reenviando certificado:', error);
        const errorMsg = error.error?.message || 'Error al reenviar certificado';
        this.toastService.error(errorMsg);
        this.alertService.error('✗ Error al reenviar', errorMsg);
        this.loading.set(false);
      }
    });
  }

  getTipoConsentimientoIcono(tipo: string): string {
    const iconos: Record<string, string> = {
      'Datos Personales': 'fa-shield-alt text-primary',
      'datos_personales': 'fa-shield-alt text-primary',
      'Imagen': 'fa-image text-info',
      'imagen': 'fa-image text-info',
      'Marketing': 'fa-bullhorn text-warning',
      'marketing': 'fa-bullhorn text-warning'
    };
    return iconos[tipo] || 'fa-check text-secondary';
  }

  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  iniciarEdicionContacto(): void {
    const clienteActual = this.cliente();
    if (!clienteActual) return;
    
    this.emailEdit.set(clienteActual.cliente.email || '');
    this.telefonoEdit.set(clienteActual.cliente.telefono || '');
    this.editandoContacto.set(true);
  }

  cancelarEdicionContacto(): void {
    this.editandoContacto.set(false);
    this.emailEdit.set('');
    this.telefonoEdit.set('');
  }

  guardarContacto(): void {
    const clienteId = this.clienteId();
    if (!clienteId) return;

    const email = this.emailEdit().trim();
    const telefono = this.telefonoEdit().trim();

    // Validar que al menos uno esté presente
    if (!email && !telefono) {
      this.toastService.error('Debe proporcionar al menos email o teléfono');
      return;
    }

    // Validar formato de email si está presente
    if (email && !this.validarEmail(email)) {
      this.toastService.error('El formato del email no es válido');
      return;
    }

    // Validar teléfono si está presente (exactamente 10 dígitos)
    if (telefono && !this.validarTelefono(telefono)) {
      this.toastService.error('El teléfono debe tener exactamente 10 dígitos');
      return;
    }

    const contacto: { email?: string; telefono?: string } = {};
    if (email) contacto.email = email;
    if (telefono) contacto.telefono = telefono;

    this.loading.set(true);

    this.clientesService.updateContacto(clienteId, contacto).subscribe({
      next: (response) => {
        console.log('Contacto actualizado:', response);
        
        // Mostrar mensaje detallado
        let mensaje = 'Contacto actualizado exitosamente\n\n';
        if (response.cliente) {
          if (response.cliente.email) mensaje += `Email: ${response.cliente.email}\n`;
          if (response.cliente.telefono) mensaje += `Teléfono: ${response.cliente.telefono}`;
        }
        
        this.toastService.success('Contacto actualizado correctamente');
        this.alertService.success('✓ Contacto actualizado', mensaje);
        
        this.editandoContacto.set(false);
        // Recargar los datos del cliente
        this.loadClienteDetalle(clienteId);
      },
      error: (error) => {
        console.error('Error actualizando contacto:', error);
        const errorMsg = error.error?.message || 'Error al actualizar contacto';
        this.toastService.error(errorMsg);
        this.alertService.error('✗ Error al actualizar', errorMsg);
        this.loading.set(false);
      }
    });
  }

  onTelefonoInput(): void {
    // Solo permitir números y limitar a 10 caracteres
    const telefono = this.telefonoEdit();
    this.telefonoEdit.set(telefono.replace(/\D/g, '').substring(0, 10));
  }

  onTelefonoKeypress(event: KeyboardEvent): boolean {
    // Solo permitir números (0-9)
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
      return false;
    }
    
    // Verificar que no exceda 10 dígitos
    const currentValue = this.telefonoEdit();
    if (currentValue.length >= 10) {
      event.preventDefault();
      return false;
    }
    
    return true;
  }

  private validarEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private validarTelefono(telefono: string): boolean {
    // Validar que tenga exactamente 10 dígitos
    return /^\d{10}$/.test(telefono);
  }
}
