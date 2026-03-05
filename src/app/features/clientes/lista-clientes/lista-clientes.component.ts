import { Component, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClientesService, PaginatedResponse } from '../clientes.service';
import { Cliente } from '../../../core/models/cliente.model';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { ToastService } from '../../../shared/services/toast.service';
import { ModalClienteComponent } from '../modal-cliente/modal-cliente.component';
import { ModalDetalleClienteComponent } from '../modal-detalle-cliente/modal-detalle-cliente.component';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-lista-clientes',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingComponent, ModalClienteComponent, ModalDetalleClienteComponent],
  templateUrl: './lista-clientes.component.html',
  styleUrls: ['./lista-clientes.component.scss']
})
export class ListaClientesComponent implements OnInit {
  @ViewChild(ModalClienteComponent) modalCliente!: ModalClienteComponent;
  @ViewChild(ModalDetalleClienteComponent) modalDetalle!: ModalDetalleClienteComponent;

  clientes = signal<Cliente[]>([]);
  clientesFiltrados = signal<Cliente[]>([]);
  loading = signal(true);
  searchTerm = '';
  
  // Paginación
  currentPage = signal(1);
  pageSize = signal(20);
  totalItems = signal(0);
  totalPages = signal(0);
  hasNextPage = signal(false);
  hasPrevPage = signal(false);

  // Verificar si es admin o distribuidor
  get isAdmin(): boolean {
    return this.authService.currentUser()?.rol === 'admin';
  }

  get isDistribuidor(): boolean {
    return this.authService.currentUser()?.rol === 'distribuidor';
  }

  get shouldShowEmpresaColumn(): boolean {
    return this.isAdmin || this.isDistribuidor;
  }

  constructor(
    private clientesService: ClientesService,
    private toastService: ToastService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const currentUser = this.authService.currentUser();
    console.log('[USERS] Lista de clientes inicializada');
    console.log('[INFO] Usuario actual:', currentUser);
    console.log('[COMPANY] Empresa ID:', currentUser?.empresa_id);
    console.log('[TYPE] Rol:', currentUser?.rol);
    console.log('[ENDPOINT] Endpoint:', this.clientesService['config'].endpoints.clientes);
    console.log('[TOKEN] Token presente:', !!this.authService.getToken());
    
    this.loadClientes();
  }

  loadClientes(): void {
    this.loading.set(true);
    
    const currentUser = this.authService.currentUser();
    console.log('[RELOAD] Cargando clientes página:', this.currentPage(), 'Tamaño:', this.pageSize());
    
    // Admin y Distribuidor ven todos los clientes con filtro opcional
    const empresaId = (currentUser?.rol === 'admin' || currentUser?.rol === 'distribuidor') ? undefined : currentUser?.empresa_id;
    
    this.clientesService.getClientes(
      this.currentPage(),
      this.pageSize(),
      this.searchTerm || undefined,
      empresaId
    ).subscribe({
      next: (response: PaginatedResponse<Cliente>) => {
        console.log('[OK] Respuesta paginada recibida:', response);
        
        if (response.success && response.data) {
          const clientes = response.data;
          
          console.log(`[INFO] Total de clientes en esta página: ${clientes.length}`);
          console.log(`[INFO] Total de clientes en BD: ${response.pagination.total}`);
          console.log('[INFO] Paginación:', response.pagination);
          
          this.clientes.set(clientes);
          this.clientesFiltrados.set(clientes);
          
          // Actualizar información de paginación
          this.totalItems.set(response.pagination.total);
          this.totalPages.set(response.pagination.totalPages);
          this.hasNextPage.set(response.pagination.hasNext);
          this.hasPrevPage.set(response.pagination.hasPrev);
          
          if (clientes.length === 0 && currentUser?.rol !== 'admin') {
            console.warn('[INFO] No hay clientes para esta empresa. Verifica que:');
            console.warn('   1. La empresa_id del usuario es correcta:', currentUser?.empresa_id);
            console.warn('   2. Existen clientes asociados a esta empresa en la BD');
            console.warn('   3. El backend está filtrando correctamente por empresa_id');
          }
        } else {
          console.error('[ERROR] Respuesta sin datos válidos:', response);
          this.clientes.set([]);
          this.clientesFiltrados.set([]);
        }
        
        this.loading.set(false);
      },
      error: (error) => {
        console.error('[ERROR] Error cargando clientes:', error);
        console.error('[DATA] Status:', error.status);
        console.error('[NOTE] Mensaje:', error.message);
        console.error('[NOTE] Error completo:', error);
        this.toastService.error('Error al cargar clientes');
        this.clientes.set([]);
        this.clientesFiltrados.set([]);
        this.loading.set(false);
      }
    });
  }

  onSearch(): void {
    // Resetear a la primera página cuando se busca
    this.currentPage.set(1);
    this.loadClientes();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.loadClientes();
  }

  nextPage(): void {
    if (this.hasNextPage()) {
      this.goToPage(this.currentPage() + 1);
    }
  }

  prevPage(): void {
    if (this.hasPrevPage()) {
      this.goToPage(this.currentPage() - 1);
    }
  }

  changePageSize(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(1); // Resetear a primera página
    this.loadClientes();
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
    this.modalDetalle.open(cliente.id);
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