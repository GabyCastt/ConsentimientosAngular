import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { ConfigService } from '../../core/services/config.service';
import { 
  FormularioPublico, 
  DatosUsuario, 
  RespuestaVerificacion 
} from '../../core/models/formulario.model';
import { Cliente } from '../../core/models/cliente.model';

@Injectable({
  providedIn: 'root'
})
export class FormulariosService {
  constructor(
    private api: ApiService,
    private config: ConfigService
  ) {}

  getFormularioPublico(token: string): Observable<FormularioPublico> {
    return this.api.get<FormularioPublico>(
      `${this.config.endpoints.formulariosPublico}/${token}`
    );
  }

  buscarClientePorCedula(token: string, cedula: string): Observable<Cliente | null> {
    const endpoint = this.config.buildEndpoint(
      this.config.endpoints.buscarCliente,
      { token, cedula }
    );
    return this.api.get<Cliente | null>(endpoint);
  }


  registrarConsentimientos(
    token: string, 
    datos: DatosUsuario
  ): Observable<RespuestaVerificacion> {
    return this.api.post<RespuestaVerificacion>(
      `${this.config.endpoints.formulariosPublico}/${token}/registrar`,
      datos
    );
  }

  verificarCodigo(
    token: string,
    codigo: string
  ): Observable<{ success: boolean; message: string }> {
    return this.api.post(
      this.config.endpoints.verificarCodigo,
      { token, codigo }
    );
  }

  solicitarCodigo(
    token: string
  ): Observable<{ success: boolean; message: string }> {
    return this.api.post(
      `${this.config.endpoints.formulariosPublico}/${token}/solicitar-codigo`,
      {}
    );
  }

  // Métodos para gestión interna de formularios
  getFormularios(): Observable<any> {
    return this.api.get(this.config.endpoints.formularios);
  }

  toggleEstado(id: number, activo: boolean): Observable<any> {
    const endpoint = this.config.buildEndpoint(
      this.config.endpoints.formulariosEstado,
      { id }
    );
    return this.api.put(endpoint, { activo });
  }
}