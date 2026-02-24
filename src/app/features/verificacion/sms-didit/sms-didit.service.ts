import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { ConfigService } from '../../../core/services/config.service';

export interface EnviarCodigoRequest {
  telefono: string;
  token_verificacion: string;
  nombre: string;
  apellido: string;
  cedula: string;
}

export interface VerificarCodigoRequest {
  telefono: string;
  codigo: string;
  token_verificacion: string;
}

export interface RespuestaSms {
  success: boolean;
  message: string;
  intentos_restantes?: number;
  codigo_enviado?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SmsDiditService {
  constructor(
    private api: ApiService,
    private config: ConfigService
  ) {}

  enviarCodigo(datos: EnviarCodigoRequest): Observable<RespuestaSms> {
    return this.api.post<RespuestaSms>(
      this.config.endpoints.smsDidit.enviarCodigo,
      datos
    );
  }

  verificarCodigo(datos: VerificarCodigoRequest): Observable<RespuestaSms> {
    return this.api.post<RespuestaSms>(
      this.config.endpoints.smsDidit.verificarCodigo,
      datos
    );
  }

  consultarEstado(token: string): Observable<any> {
    const endpoint = this.config.buildEndpoint(
      this.config.endpoints.smsDidit.consultarEstado,
      { token }
    );
    return this.api.get(endpoint);
  }

  obtenerConfiguracion(): Observable<any> {
    return this.api.get(this.config.endpoints.smsDidit.configuracion);
  }

  obtenerEstadisticas(): Observable<any> {
    return this.api.get(this.config.endpoints.smsDidit.estadisticas);
  }
}