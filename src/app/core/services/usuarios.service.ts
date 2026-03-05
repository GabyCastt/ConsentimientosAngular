import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  UsuarioEmpresa,
  CrearUsuarioRequest,
  ActualizarUsuarioRequest,
  CambiarPasswordUsuarioRequest,
  ListaUsuariosResponse,
  UsuarioResponse
} from '../models/usuario-empresa.model';

@Injectable({
  providedIn: 'root'
})
export class UsuariosService {
  constructor(private api: ApiService) {}

  // ==========================================
  // ENDPOINTS PARA ADMIN
  // ==========================================

  /**
   * Listar usuarios de una empresa (Admin)
   */
  listarUsuariosEmpresaAdmin(empresaId: number): Observable<ListaUsuariosResponse> {
    return this.api.get<ListaUsuariosResponse>(`/api/admin/empresas/${empresaId}/usuarios`);
  }

  /**
   * Crear usuario en una empresa (Admin)
   */
  crearUsuarioEmpresaAdmin(empresaId: number, data: CrearUsuarioRequest): Observable<UsuarioResponse> {
    return this.api.post<UsuarioResponse>(`/api/admin/empresas/${empresaId}/usuarios`, data);
  }

  /**
   * Actualizar usuario de una empresa (Admin)
   */
  actualizarUsuarioEmpresaAdmin(
    empresaId: number,
    usuarioId: number,
    data: ActualizarUsuarioRequest
  ): Observable<UsuarioResponse> {
    return this.api.put<UsuarioResponse>(
      `/api/admin/empresas/${empresaId}/usuarios/${usuarioId}`,
      data
    );
  }

  /**
   * Eliminar usuario de una empresa (Admin)
   */
  eliminarUsuarioEmpresaAdmin(empresaId: number, usuarioId: number): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>(
      `/api/admin/empresas/${empresaId}/usuarios/${usuarioId}`
    );
  }

  /**
   * Cambiar contraseña de usuario (Admin)
   */
  cambiarPasswordUsuarioAdmin(
    empresaId: number,
    usuarioId: number,
    data: CambiarPasswordUsuarioRequest
  ): Observable<{ message: string }> {
    return this.api.put<{ message: string }>(
      `/api/admin/empresas/${empresaId}/usuarios/${usuarioId}/password`,
      data
    );
  }

  // ==========================================
  // ENDPOINTS PARA DISTRIBUIDOR
  // ==========================================

  /**
   * Listar usuarios de una empresa asignada (Distribuidor)
   */
  listarUsuariosEmpresaDistribuidor(empresaId: number): Observable<ListaUsuariosResponse> {
    return this.api.get<ListaUsuariosResponse>(`/api/distribuidores/empresas/${empresaId}/usuarios`);
  }

  /**
   * Crear usuario en empresa asignada (Distribuidor)
   */
  crearUsuarioEmpresaDistribuidor(empresaId: number, data: CrearUsuarioRequest): Observable<UsuarioResponse> {
    return this.api.post<UsuarioResponse>(`/api/distribuidores/empresas/${empresaId}/usuarios`, data);
  }

  /**
   * Actualizar usuario de empresa asignada (Distribuidor)
   */
  actualizarUsuarioEmpresaDistribuidor(
    empresaId: number,
    usuarioId: number,
    data: ActualizarUsuarioRequest
  ): Observable<UsuarioResponse> {
    return this.api.put<UsuarioResponse>(
      `/api/distribuidores/empresas/${empresaId}/usuarios/${usuarioId}`,
      data
    );
  }

  /**
   * Eliminar usuario de empresa asignada (Distribuidor)
   */
  eliminarUsuarioEmpresaDistribuidor(empresaId: number, usuarioId: number): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>(
      `/api/distribuidores/empresas/${empresaId}/usuarios/${usuarioId}`
    );
  }

  // ==========================================
  // ENDPOINTS PARA EMPRESA
  // ==========================================

  /**
   * Listar usuarios de mi empresa (Usuario Empresa)
   */
  listarMisUsuarios(): Observable<ListaUsuariosResponse> {
    return this.api.get<ListaUsuariosResponse>('/api/empresas/mis-usuarios');
  }

  /**
   * Crear usuario en mi empresa (Usuario Empresa)
   */
  crearMiUsuario(data: CrearUsuarioRequest): Observable<UsuarioResponse> {
    return this.api.post<UsuarioResponse>('/api/empresas/mis-usuarios', data);
  }

  /**
   * Actualizar usuario de mi empresa (Usuario Empresa)
   */
  actualizarMiUsuario(usuarioId: number, data: ActualizarUsuarioRequest): Observable<UsuarioResponse> {
    return this.api.put<UsuarioResponse>(`/api/empresas/mis-usuarios/${usuarioId}`, data);
  }

  /**
   * Eliminar usuario de mi empresa (Usuario Empresa)
   */
  eliminarMiUsuario(usuarioId: number): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>(`/api/empresas/mis-usuarios/${usuarioId}`);
  }

  /**
   * Cambiar contraseña de usuario de mi empresa (Usuario Empresa)
   */
  cambiarPasswordMiUsuario(usuarioId: number, data: CambiarPasswordUsuarioRequest): Observable<{ message: string }> {
    return this.api.put<{ message: string }>(
      `/api/empresas/mis-usuarios/${usuarioId}/password`,
      data
    );
  }
}
