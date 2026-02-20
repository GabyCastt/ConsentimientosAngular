import { Component, EventEmitter, Output, signal, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Respuesta {
  id: number;
  cliente_nombre: string;
  cliente_cedula: string;
  cliente_email?: string;
  cliente_telefono?: string;
  verificado: boolean;
  consentimientos_completados: boolean;
  tipos_aceptados: string[];
  fecha_procesado: string;
  created_at?: string;
  pdf_url?: string;
}

interface Formulario {
  id: number;
  nombre: string;
  activo: boolean;
}

@Component({
  selector: 'app-modal-respuestas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal-respuestas.component.html',
  styleUrls: ['./modal-respuestas.component.scss']
})
export class ModalRespuestasComponent {
  @Output() closed = new EventEmitter<void>();

  isOpen = signal(false);
  formulario = signal<Formulario | null>(null);
  respuestas = signal<Respuesta[]>([]);

  open(formulario: Formulario, respuestas: Respuesta[]): void {
    this.formulario.set(formulario);
    this.respuestas.set(respuestas);
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
    this.formulario.set(null);
    this.respuestas.set([]);
    this.closed.emit();
  }

  getTipoConsentimientoIcon(tipo: string): string {
    const iconos: Record<string, string> = {
      'datos_personales': 'fa-shield-alt text-primary',
      'imagen': 'fa-image text-info',
      'marketing': 'fa-bullhorn text-warning'
    };
    return iconos[tipo] || 'fa-check text-secondary';
  }

  getTipoConsentimientoLabel(tipo: string): string {
    const labels: Record<string, string> = {
      'datos_personales': 'Datos Personales',
      'imagen': 'Uso de Imagen',
      'marketing': 'Marketing'
    };
    return labels[tipo] || tipo;
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return 'N/A';
    
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  descargarPDF(pdfUrl: string): void {
    if (!pdfUrl) {
      alert('PDF no disponible');
      return;
    }
    
    // Abrir en nueva pestaña
    window.open(pdfUrl, '_blank');
  }
}
