import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { ConfigService } from '../../../core/services/config.service';

export interface DiditSession {
  session_id: string;
  verification_url: string;
  token_verificacion: string;
}

export interface DiditSessionStatus {
  status: 'pending' | 'completed' | 'failed';
  verified: boolean;
  data?: any;
}

@Injectable({
  providedIn: 'root'
})
export class DiditService {
  constructor(
    private api: ApiService,
    private config: ConfigService
  ) {}

  createSession(tokenVerificacion: string, isPremium: boolean = false): Observable<DiditSession> {
    return this.api.post<DiditSession>(
      this.config.endpoints.didit.createSession,
      {
        token_verificacion: tokenVerificacion,
        is_premium: isPremium
      }
    );
  }

  getSessionStatus(sessionId: string): Observable<DiditSessionStatus> {
    return this.api.get<DiditSessionStatus>(
      `${this.config.endpoints.didit.sessionStatus}/${sessionId}`
    );
  }

  verificarConfig(): Observable<any> {
    return this.api.get(this.config.endpoints.didit.config);
  }

  reenviarDocumentos(token: string): Observable<any> {
    return this.api.post(
      `${this.config.endpoints.didit.resendDocuments}/${token}`,
      {}
    );
  }

  completarProceso(token: string): Observable<any> {
    return this.api.post(
      `${this.config.endpoints.didit.completeProcess}/${token}`,
      {}
    );
  }

  obtenerClientesPendientes(): Observable<any> {
    return this.api.get(this.config.endpoints.didit.pendingClients);
  }

  // Alias para mantener compatibilidad
  getPendingClients(): Observable<any> {
    return this.obtenerClientesPendientes();
  }

  completeProcess(token: string): Observable<any> {
    return this.completarProceso(token);
  }
}