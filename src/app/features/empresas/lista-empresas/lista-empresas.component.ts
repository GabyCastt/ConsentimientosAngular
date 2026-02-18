import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-lista-empresas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lista-empresas.component.html',
  styleUrls: ['./lista-empresas.component.scss']
})
export class ListaEmpresasComponent implements OnInit {
  constructor(private toastService: ToastService) {}

  ngOnInit(): void {
    // TODO: Implementar carga de empresas
  }
}
