import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { ConfigService } from '../../core/services/config.service';
import { Cliente, ClienteDetalle, CreateClienteDto } from '../../core/models/cliente.model';

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ClientesService {
  constructor(
    private api: ApiService,
    private config: ConfigService
  ) {}

  // paginación y filtros
  getClientes(
    page: number = 1,
    limit: number = 10,
    search?: string,
    empresaId?: number
  ): Observable<PaginatedResponse<Cliente>> {
    let url = `${this.config.endpoints.clientes}?page=${page}&limit=${limit}`;
    
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    
    if (empresaId) {
      url += `&empresa_id=${empresaId}`;
    }
    
    return this.api.get<PaginatedResponse<Cliente>>(url);
  }

  getClienteDetalle(id: number): Observable<ClienteDetalle> {
    const endpoint = this.config.buildEndpoint(
      this.config.endpoints.clientesDetalle,
      { id }
    );
    return this.api.get<ClienteDetalle>(endpoint);
  }

  createCliente(cliente: CreateClienteDto): Observable<Cliente> {
    return this.api.post<Cliente>(
      this.config.endpoints.clientes,
      cliente
    );
  }

  updateCliente(id: number, cliente: Partial<CreateClienteDto>): Observable<Cliente> {
    return this.api.put<Cliente>(
      `${this.config.endpoints.clientes}/${id}`,
      cliente
    );
  }

  deleteCliente(id: number): Observable<void> {
    return this.api.delete<void>(
      `${this.config.endpoints.clientes}/${id}`
    );
  }

  consultarCedula(cedula: string): Observable<any> {
    const endpoint = this.config.buildEndpoint(
      this.config.endpoints.clientesConsultarCedula,
      { cedula }
    );
    return this.api.get<any>(endpoint);
  }
}