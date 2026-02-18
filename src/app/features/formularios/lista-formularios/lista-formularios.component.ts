import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormulariosService } from '../formularios.service';
import { DiditService } from '../../verificacion/didit/didit.service';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { ToastService } from '../../../shared/services/toast.service';

interface Formulario {
  id: number;
  nombre: string;
  descripcion: string;
  tipos_consentimientos: string[];
  tipo_validacion: string;
  activo: boolean;
  token: string;
  respuestas_count: number;
  created_at: string;
  clientes_didit_pendientes?: number;
}

interface ClienteDiditPendiente {
  id: number;
  nombre: string;
  apellido: string;
  cedula: string;
  email?: string;
  telefono?: string;
  token_verificacion: string;
  fecha_verificacion: string;
  formulario_id: number;
}

@Component({
  selector: 'app-lista-formularios',
  standalone: true,
  imports: [CommonModule, LoadingComponent],
  templateUrl: './lista-formularios.component.html',
  styleUrls: ['./lista-formularios.component.scss']
})
export class ListaFormulariosComponent implements OnInit, OnDestroy {
  formularios = signal<Formulario[]>([]);
  loading = signal(true);
  mostrarInactivos = signal(false);
  
  // DIDIT
  clientesDidit = signal<ClienteDiditPendiente[]>([]);
  formularioSeleccionado = signal<Formulario | null>(null);
  mostrarModalDidit = signal(false);
  procesandoDidit = signal(false);
  
  private refreshInterval: any = null;

  constructor(
    private formulariosService: FormulariosService,
    private diditService: DiditService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadFormularios();
    this.loadClientesDidit();
    
    // Actualizar cada 60 segundos
    this.refreshInterval = setInterval(() => {
      this.loadClientesDidit();
    }, 60000);
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  loadFormularios(): void {
    this.loading.set(true);
    
    this.formulariosService.getFormularios().subscribe({
      next: (response: any) => {
        console.log('Formularios response:', response);
        const formularios = response.formularios || response || [];
        this.formularios.set(formularios);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error cargando formularios:', error);
        this.toastService.error('Error al cargar formularios');
        this.formularios.set([]);
        this.loading.set(false);
      }
    });
  }

  loadClientesDidit(): void {
    this.diditService.getPendingClients().subscribe({
      next: (response: any) => {
        const clientes = response.clientes || response.data?.clientes || [];
        this.clientesDidit.set(clientes);
        this.actualizarContadoresDidit();
      },
      error: (error) => {
        // Silently fail for 404 - endpoint might not be implemented yet
        if (error.status !== 404) {
          console.error('Error cargando clientes DIDIT:', error);
        }
        this.clientesDidit.set([]);
        this.actualizarContadoresDidit();
      }
    });
  }

  actualizarContadoresDidit(): void {
    const clientes = this.clientesDidit();
    const formulariosActualizados = this.formularios().map(form => ({
      ...form,
      clientes_didit_pendientes: clientes.filter(c => c.formulario_id === form.id).length
    }));
    this.formularios.set(formulariosActualizados);
  }

  formulariosFiltrados() {
    if (this.mostrarInactivos()) {
      return this.formularios();
    }
    return this.formularios().filter(f => f.activo);
  }

  toggleInactivos(): void {
    this.mostrarInactivos.update(v => !v);
  }

  copiarUrl(token: string): void {
    const url = `${window.location.origin}/formulario/${token}`;
    navigator.clipboard.writeText(url);
    this.toastService.success('URL copiada al portapapeles');
  }

  toggleEstado(formulario: Formulario): void {
    const nuevoEstado = !formulario.activo;
    
    this.formulariosService.toggleEstado(formulario.id, nuevoEstado).subscribe({
      next: () => {
        formulario.activo = nuevoEstado;
        this.toastService.success(
          nuevoEstado ? 'Formulario activado' : 'Formulario desactivado'
        );
      },
      error: (error) => {
        console.error('Error cambiando estado:', error);
        this.toastService.error('Error al cambiar estado del formulario');
      }
    });
  }

  getTipoValidacionLabel(tipo: string): string {
    const labels: Record<string, string> = {
      'sms_email': 'WhatsApp/Email',
      'biometria_free': 'Biometría Gratuita',
      'biometria_premium': 'Biometría Premium',
      'sms_didit': 'SMS DIDIT'
    };
    return labels[tipo] || tipo;
  }

  // ==================== FUNCIONES DIDIT ====================

  abrirModalDidit(formulario: Formulario): void {
    this.formularioSeleccionado.set(formulario);
    this.mostrarModalDidit.set(true);
  }

  cerrarModalDidit(): void {
    this.mostrarModalDidit.set(false);
    this.formularioSeleccionado.set(null);
  }

  getClientesDiditFormulario(formularioId: number): ClienteDiditPendiente[] {
    return this.clientesDidit().filter(c => c.formulario_id === formularioId);
  }

  formatearTiempoRelativo(fechaISO: string): string {
    const fecha = new Date(fechaISO);
    const ahora = new Date();
    const diffMs = ahora.getTime() - fecha.getTime();
    const diffMinutos = Math.floor(diffMs / (1000 * 60));
    const diffHoras = Math.floor(diffMinutos / 60);
    const diffDias = Math.floor(diffHoras / 24);

    if (diffMinutos < 1) return 'hace un momento';
    if (diffMinutos < 60) return `hace ${diffMinutos} min`;
    if (diffHoras < 24) return `hace ${diffHoras}h`;
    if (diffDias < 7) return `hace ${diffDias}d`;
    
    return fecha.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit'
    });
  }

  async culminarProceso(cliente: ClienteDiditPendiente): Promise<void> {
    const confirmar = confirm(
      `¿Culminar proceso para ${cliente.nombre} ${cliente.apellido}?\n\n` +
      `• Se completarán los consentimientos\n` +
      `• Se enviarán los documentos por email y SMS\n` +
      `• El cliente desaparecerá de la lista\n\n` +
      `Esta acción no se puede deshacer.`
    );

    if (!confirmar) return;

    this.procesandoDidit.set(true);

    this.diditService.completeProcess(cliente.token_verificacion).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.toastService.success(
            `✅ Proceso completado para ${cliente.nombre} ${cliente.apellido}\n\n` +
            `📧 Email: ${response.documentos?.email_enviado ? 'Enviado' : 'Error'}\n` +
            `📱 SMS: ${response.documentos?.sms_enviado ? 'Enviado' : 'Error'}`
          );
          
          // Recargar datos
          setTimeout(() => {
            this.loadClientesDidit();
            this.procesandoDidit.set(false);
          }, 1000);
        } else {
          throw new Error(response.error || 'Error desconocido');
        }
      },
      error: (error) => {
        console.error('Error culminando proceso:', error);
        this.toastService.error(`❌ Error: ${error.error?.message || error.message || 'Error desconocido'}`);
        this.procesandoDidit.set(false);
      }
    });
  }

  actualizarManual(): void {
    this.loadClientesDidit();
    this.toastService.success('Datos actualizados');
  }
}
