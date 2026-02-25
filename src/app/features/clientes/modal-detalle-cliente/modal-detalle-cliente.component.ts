import { Component, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClientesService } from '../clientes.service';
import { ClienteDetalle } from '../../../core/models/cliente.model';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { ToastService } from '../../../shared/services/toast.service';
import { ConfigService } from '../../../core/services/config.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-modal-detalle-cliente',
  standalone: true,
  imports: [CommonModule, LoadingComponent],
  templateUrl: './modal-detalle-cliente.component.html',
  styleUrl: './modal-detalle-cliente.component.scss'
})
export class ModalDetalleClienteComponent {
  isOpen = signal(false);
  loading = signal(false);
  cliente = signal<ClienteDetalle | null>(null);
  clienteId = signal<number | null>(null);

  closed = output<void>();

  constructor(
    private clientesService: ClientesService,
    private toastService: ToastService,
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
        
        if (response.detalles) {
          const detalles = response.detalles;
          let mensaje = 'Certificado reenviado exitosamente:\n\n';
          mensaje += `✓ Email: ${detalles.email_enviado ? 'Enviado' : 'Error'}\n`;
          mensaje += `✓ WhatsApp: ${detalles.sms_enviado ? 'Enviado' : 'Error'}\n`;
          mensaje += `✓ Archivos adjuntos: ${detalles.archivos_adjuntos || 0}\n`;
          mensaje += `✓ Certificado: ${detalles.certificado_generado ? 'Generado' : 'Error'}`;
          
          this.toastService.success('Certificado reenviado exitosamente');
          alert(mensaje);
        } else {
          this.toastService.success(response.message || 'Certificado reenviado exitosamente');
        }
        
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error reenviando certificado:', error);
        this.toastService.error('Error al reenviar certificado');
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
}
