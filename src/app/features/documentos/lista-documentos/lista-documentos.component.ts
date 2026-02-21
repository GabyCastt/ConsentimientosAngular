import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfigService } from '../../../core/services/config.service';

interface Documento {
  titulo: string;
  descripcion: string;
  icono: string;
  color: string;
  url: string;
}

@Component({
  selector: 'app-lista-documentos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lista-documentos.component.html',
  styleUrls: ['./lista-documentos.component.scss']
})
export class ListaDocumentosComponent implements OnInit {
  documentos: Documento[] = [];

  constructor(private config: ConfigService) {}

  ngOnInit(): void {
    this.documentos = [
      {
        titulo: 'Términos y Condiciones',
        descripcion: 'Documento principal de términos y condiciones',
        icono: 'fas fa-shield-alt',
        color: 'primary',
        url: `${this.config.apiUrl}/api-consentimientos/archivos/Terminos_Y_Condiciones.pdf`
      },
      {
        titulo: 'Términos BeContactos',
        descripcion: 'Términos específicos para BeContactos',
        icono: 'fas fa-image',
        color: 'info',
        url: `${this.config.apiUrl}/api-consentimientos/archivos/TerminosYCondiciones_BeContactos.pdf`
      },
      {
        titulo: 'Ejemplo Contrato Final',
        descripcion: 'Plantilla del contrato que reciben los clientes',
        icono: 'fas fa-file-contract',
        color: 'success',
        url: `${this.config.apiUrl}/api-consentimientos/archivos/ejemplo_contratoFinal.pdf`
      }
    ];
  }

  abrirDocumento(url: string): void {
    if (url && url !== '#') {
      window.open(url, '_blank');
    }
  }
}
