import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DiditService } from '../../verificacion/didit/didit.service';

interface ClientePendiente {
  id: number;
  nombre: string;
  apellido: string;
  cedula: string;
  email?: string;
  telefono?: string;
  token_verificacion: string;
  fecha_verificacion: string;
  estado: string;
}

@Component({
  selector: 'app-clientes-didit-pendientes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './clientes-didit-pendientes.component.html',
  styleUrls: ['./clientes-didit-pendientes.component.scss']
})
export class ClientesDiditPendientesComponent implements OnInit, OnDestroy {
  clientes = signal<ClientePendiente[]>([]);
  loading = signal(false);
  error = signal(false);
  
  private refreshInterval: any = null;
  private readonly MAX_CLIENTES_MOSTRAR = 3;

  constructor(
    private diditService: DiditService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarClientes();
    // Actualizar cada 60 segundos
    this.refreshInterval = setInterval(() => {
      this.cargarClientes();
    }, 60000);
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  cargarClientes(): void {
    this.loading.set(true);
    this.error.set(false);

    this.diditService.getPendingClients().subscribe({
      next: (response: any) => {
        const clientes = response.clientes || response.data?.clientes || [];
        this.clientes.set(clientes);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error cargando clientes DIDIT:', error);
        // Don't show error for 404 - endpoint might not be implemented yet
        if (error.status !== 404) {
          this.error.set(true);
        }
        this.clientes.set([]);
        this.loading.set(false);
      }
    });
  }

  getClientesMostrar(): ClientePendiente[] {
    return this.clientes().slice(0, this.MAX_CLIENTES_MOSTRAR);
  }

  getCantidadPendientes(): number {
    return this.clientes().length;
  }

  hayMasClientes(): boolean {
    return this.clientes().length > this.MAX_CLIENTES_MOSTRAR;
  }

  getIniciales(nombre: string, apellido: string): string {
    return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase();
  }

  formatearTiempoRelativo(fechaISO: string): string {
    const fecha = new Date(fechaISO);
    const ahora = new Date();
    const diffMs = ahora.getTime() - fecha.getTime();
    const diffMinutos = Math.floor(diffMs / (1000 * 60));
    const diffHoras = Math.floor(diffMinutos / 60);
    const diffDias = Math.floor(diffHoras / 24);

    if (diffMinutos < 1) return 'Hace un momento';
    if (diffMinutos < 60) return `Hace ${diffMinutos} min`;
    if (diffHoras < 24) return `Hace ${diffHoras}h`;
    if (diffDias < 7) return `Hace ${diffDias}d`;
    
    return fecha.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit'
    });
  }

  async culminarProceso(cliente: ClientePendiente): Promise<void> {
    const confirmar = confirm(
      `¿Culminar proceso para ${cliente.nombre} ${cliente.apellido}?\n\n` +
      `• Se completarán los consentimientos\n` +
      `• Se enviarán los documentos por email y SMS\n` +
      `• El cliente desaparecerá de la lista`
    );

    if (!confirmar) return;

    this.loading.set(true);

    this.diditService.completeProcess(cliente.token_verificacion).subscribe({
      next: (response: any) => {
        if (response.success) {
          alert(
            `✅ Proceso completado para ${cliente.nombre} ${cliente.apellido}\n\n` +
            `📧 Email: ${response.documentos?.email_enviado ? 'Enviado' : 'Error'}\n` +
            `📱 SMS: ${response.documentos?.sms_enviado ? 'Enviado' : 'Error'}`
          );
          
          // Recargar lista después de 1 segundo
          setTimeout(() => {
            this.cargarClientes();
          }, 1000);
        } else {
          throw new Error(response.error || 'Error desconocido');
        }
      },
      error: (error) => {
        console.error('Error culminando proceso:', error);
        alert(`❌ Error: ${error.error?.message || error.message || 'Error desconocido'}`);
        this.loading.set(false);
      }
    });
  }

  verPanelCompleto(): void {
    this.router.navigate(['/didit/admin']);
  }

  actualizarManual(): void {
    this.cargarClientes();
  }
}
