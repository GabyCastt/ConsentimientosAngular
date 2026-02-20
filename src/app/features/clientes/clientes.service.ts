import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { ConfigService } from '../../core/services/config.service';
import { Cliente, ClienteDetalle, CreateClienteDto } from '../../core/models/cliente.model';

@Injectable({
  providedIn: 'root'
})
export class ClientesService {
  constructor(
    private api: ApiService,
    private config: ConfigService
  ) {}

  getClientes(): Observable<any> {
    return this.api.get<any>(
      this.config.endpoints.clientes
    );
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

  buscarPorCedula(cedula: string): Observable<Cliente | null> {
    return this.api.get<Cliente | null>(
      `${this.config.endpoints.clientes}/buscar/${cedula}`
    );
  }
}