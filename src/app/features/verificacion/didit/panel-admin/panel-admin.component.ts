import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DiditService } from '../didit.service';
import { LoadingComponent } from '../../../../shared/components/loading/loading.component';
import { ToastService } from '../../../../shared/services/toast.service';

interface ClientePendiente {
  id: number;
  token_verificacion: string;
  nombre: string;
  apellido: string;
  cedula: string;
  email: string;
  telefono: string;
  fecha_verificacion: string;
}

interface Estadisticas {
  completados_hoy: number;
  total_verificados: number;
  tasa_exito: number;
}

@Component({
  selector: 'app-panel-admin',
  standalone: true,
  imports: [CommonModule, LoadingComponent],
  templateUrl: './panel-admin.component.html',
  styleUrls: ['./panel-admin.component.scss']
})
export class PanelAdminComponent implements OnInit, OnDestroy {
  clientes = signal<ClientePendiente[]>([]);
  estadisticas = signal<Estadisticas>({
    completados_hoy: 0,
    total_verificados: 0,
    tasa_exito: 0
  });
  
  loading = signal(true);
  procesando = signal(false);
  clienteProcesando = signal<string | null>(null);
  
  private refreshInterval: any;

  constructor(
    private diditService: DiditService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.cargarClientesPendientes();
    
    // Actualizar cada 30 segundos
    this.refreshInterval = setInterval(() => {
      this.cargarClientesPendientes();
    }, 30000);
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  cargarClientesPendientes(): void {
    this.loading.set(true);
    
    this.diditService.getPendingClients().subscribe({
      next: (response: any) => {
        this.clientes.set(response.clientes || []);
        this.estadisticas.set(response.estadisticas || {
          completados_hoy: 0,
          total_verificados: 0,
          tasa_exito: 0
        });
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error cargando clientes:', error);
        this.toastService.error('Error al cargar clientes pendientes');
        this.loading.set(false);
      }
    });
  }

  culminarProceso(cliente: ClientePendiente): void {
    const confirmar = confirm(
      `¿Estás seguro de culminar el proceso para ${cliente.nombre} ${cliente.apellido}?\n\n` +
      `Esto hará lo siguiente:\n` +
      `• Marcará los consentimientos como completados\n` +
      `• Generará y enviará el certificado por email\n` +
      `• Enviará notificación por SMS\n` +
      `• El cliente desaparecerá de esta lista\n\n` +
      `Esta acción no se puede deshacer.`
    );

    if (!confirmar) return;

    this.procesando.set(true);
    this.clienteProcesando.set(cliente.token_verificacion);

    this.diditService.completeProcess(cliente.token_verificacion).subscribe({
      next: (resultado: any) => {
        if (resultado.success) {
          const mensaje = 
            `✅ Proceso completado para ${cliente.nombre} ${cliente.apellido}\n` +
            `📧 Email: ${resultado.documentos?.email_enviado ? 'Enviado' : 'Error'}\n` +
            `📱 SMS: ${resultado.documentos?.sms_enviado ? 'Enviado' : 'Error'}\n` +
            `📎 Archivos: ${resultado.documentos?.archivos_adjuntos || 0}`;
          
          this.toastService.success(mensaje);
          
          // Recargar lista después de 1 segundo
          setTimeout(() => {
            this.cargarClientesPendientes();
          }, 1000);
        } else {
          let mensajeError = resultado.error || 'Error desconocido';
          if (resultado.ya_completado) {
            mensajeError = `El proceso de ${cliente.nombre} ${cliente.apellido} ya fue completado anteriormente.`;
          }
          this.toastService.error(mensajeError);
        }
        
        this.procesando.set(false);
        this.clienteProcesando.set(null);
      },
      error: (error) => {
        console.error('Error culminando proceso:', error);
        this.toastService.error(
          `❌ Error de conexión al culminar proceso de ${cliente.nombre} ${cliente.apellido}`
        );
        this.procesando.set(false);
        this.clienteProcesando.set(null);
      }
    });
  }

  formatearFecha(fechaISO: string): string {
    const fecha = new Date(fechaISO);
    const ahora = new Date();
    const diffMs = ahora.getTime() - fecha.getTime();
    const diffHoras = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDias = Math.floor(diffHoras / 24);

    if (diffHoras < 1) return 'Hace menos de 1 hora';
    if (diffHoras < 24) return `Hace ${diffHoras} hora${diffHoras > 1 ? 's' : ''}`;
    if (diffDias < 7) return `Hace ${diffDias} día${diffDias > 1 ? 's' : ''}`;

    return fecha.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  isClienteProcesando(token: string): boolean {
    return this.clienteProcesando() === token;
  }
}
