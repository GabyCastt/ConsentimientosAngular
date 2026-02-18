import { Component, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClientesService } from '../clientes.service';
import { Cliente } from '../../../core/models/cliente.model';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { ToastService } from '../../../shared/services/toast.service';
import { ModalClienteComponent } from '../modal-cliente/modal-cliente.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-lista-clientes',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingComponent, ModalClienteComponent],
  templateUrl: './lista-clientes.component.html',
  styleUrls: ['./lista-clientes.component.scss']
})
export class ListaClientesComponent implements OnInit {
  @ViewChild(ModalClienteComponent) modalCliente!: ModalClienteComponent;

  clientes = signal<Cliente[]>([]);
  clientesFiltrados = signal<Cliente[]>([]);
  loading = signal(true);
  searchTerm = '';

  constructor(
    private clientesService: ClientesService,
    private toastService: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadClientes();
  }

  loadClientes(): void {
    this.loading.set(true);
    
    this.clientesService.getClientes().subscribe({
      next: (response) => {
        const clientes = response.clientes || [];
        this.clientes.set(clientes);
        this.clientesFiltrados.set(clientes);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error cargando clientes:', error);
        this.toastService.error('Error al cargar clientes');
        this.clientes.set([]);
        this.clientesFiltrados.set([]);
        this.loading.set(false);
      }
    });
  }

  onSearch(): void {
    const term = this.searchTerm.toLowerCase();
    
    if (!term) {
      this.clientesFiltrados.set(this.clientes());
      return;
    }

    const filtered = this.clientes().filter(cliente =>
      cliente.cedula.includes(term) ||
      cliente.nombre.toLowerCase().includes(term) ||
      cliente.email?.toLowerCase().includes(term) ||
      cliente.telefono?.includes(term)
    );

    this.clientesFiltrados.set(filtered);
  }

  openCreateModal(): void {
    this.modalCliente.open();
  }

  openEditModal(cliente: Cliente): void {
    this.modalCliente.open(cliente);
  }

  onClienteSaved(): void {
    this.loadClientes();
    this.toastService.success('Cliente guardado correctamente');
  }

  verDetalle(cliente: Cliente): void {
    this.router.navigate(['/clientes', cliente.id]);
  }

  deleteCliente(cliente: Cliente): void {
    if (!confirm(`¿Estás seguro de eliminar a ${cliente.nombre}?`)) {
      return;
    }

    this.clientesService.deleteCliente(cliente.id).subscribe({
      next: () => {
        this.toastService.success('Cliente eliminado correctamente');
        this.loadClientes();
      },
      error: (error) => {
        console.error('Error eliminando cliente:', error);
        this.toastService.error('Error al eliminar cliente');
      }
    });
  }
}