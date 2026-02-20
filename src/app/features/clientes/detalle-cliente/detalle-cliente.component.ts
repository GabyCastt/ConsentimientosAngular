import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ClientesService } from '../clientes.service';
import { ClienteDetalle } from '../../../core/models/cliente.model';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { ToastService } from '../../../shared/services/toast.service';
import { ConfigService } from '../../../core/services/config.service';

@Component({
  selector: 'app-detalle-cliente',
  standalone: true,
  imports: [CommonModule, LoadingComponent],
  templateUrl: './detalle-cliente.component.html',
  styleUrl: './detalle-cliente.component.scss'
})
export class DetalleClienteComponent implements OnInit {
  loading = signal(true);
  cliente = signal<ClienteDetalle | null>(null);
  clienteId = signal<number | null>(null);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private clientesService: ClientesService,
    private toastService: ToastService,
    private config: ConfigService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = parseInt(params['id']);
      if (id) {
        this.clienteId.set(id);
        this.loadClienteDetalle(id);
      }
    });
  }

  loadClienteDetalle(id: number): void {
    this.loading.set(true);
    
    this.clientesService.getClienteDetalle(id).subscribe({
      next: (response) => {
        console.log('📋 Detalle del cliente recibido:', response);
        this.cliente.set(response);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('❌ Error cargando detalle del cliente:', error);
        this.toastService.error('Error al cargar detalle del cliente');
        this.loading.set(false);
        this.router.navigate(['/clientes']);
      }
    });
  }

  volver(): void {
    this.router.navigate(['/clientes']);
  }

  descargarDocumento(respuestaId: number): void {
    const clienteId = this.clienteId();
    if (!clienteId) return;

    console.log(`📥 Descargando documento del cliente ${clienteId}, respuesta ${respuestaId}...`);
    
    const url = this.config.getApiUrlWithParams(
      this.config.endpoints.clientesDocumento,
      { clienteId, respuestaId }
    );

    // Abrir en nueva pestaña para descargar
    window.open(url, '_blank');
    this.toastService.success('Descargando documento...');
  }

  reenviarCertificado(respuestaId: number): void {
    const clienteId = this.clienteId();
    if (!clienteId) return;

    if (!confirm('¿Estás seguro de reenviar el certificado a este cliente?\n\nSe enviará por email y WhatsApp.')) {
      return;
    }

    console.log(`📧 Reenviando certificado del cliente ${clienteId}, respuesta ${respuestaId}...`);
    
    this.loading.set(true);

    const url = this.config.buildEndpoint(
      this.config.endpoints.clientesReenviar,
      { clienteId, respuestaId }
    );

    this.clientesService['api'].post(url, {}).subscribe({
      next: (response: any) => {
        console.log('✅ Certificado reenviado:', response);
        
        if (response.detalles) {
          const detalles = response.detalles;
          let mensaje = 'Certificado reenviado:\n\n';
          mensaje += `📧 Email: ${detalles.email_enviado ? 'Enviado ✓' : 'Error ✗'}\n`;
          mensaje += `📱 WhatsApp: ${detalles.sms_enviado ? 'Enviado ✓' : 'Error ✗'}\n`;
          mensaje += `📎 Archivos: ${detalles.archivos_adjuntos || 0}\n`;
          mensaje += `📄 Certificado: ${detalles.certificado_generado ? 'Generado ✓' : 'Error ✗'}`;
          
          if (detalles.email_enviado) {
            this.toastService.success('Certificado reenviado exitosamente');
            alert(mensaje);
          } else {
            this.toastService.warning('Certificado procesado pero no se pudo enviar');
            alert(mensaje);
          }
        } else {
          this.toastService.success(response.message || 'Certificado reenviado exitosamente');
        }
        
        this.loading.set(false);
      },
      error: (error) => {
        console.error('❌ Error reenviando certificado:', error);
        this.toastService.error('Error reenviando certificado: ' + error.message);
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
