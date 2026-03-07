import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { ConfigService } from '../../core/services/config.service';

export interface Formulario {
  id: number;
  nombre: string;
  descripcion?: string;
  tipos_consentimientos: string[];
  tipo_validacion: string;
  token_publico: string;
  activo: boolean;
  empresa_id: number;
  usuario_id: number;
  created_at?: string;
  updated_at?: string;
}

export interface FormularioPublicoResponse {
  formulario: Formulario;
  empresa: {
    nombre: string;
    logo: string;
  };
  archivos: Record<string, any>;
}

export interface RegistrarRespuestaRequest {
  cedula: string;
  nombre: string;
  apellido: string;
  email?: string;
  telefono?: string;
}

export interface VerificarCodigoRequest {
  token_verificacion: string;
  codigo: string;
}

export interface VerificarCodigoResponse {
  success?: boolean;
  message: string;
  respuesta?: any;
}

export interface GuardarConsentimientosRequest {
  token_verificacion: string;
  tipos_aceptados: string[];
}

export interface CompletarConsentimientosRequest {
  token_verificacion: string;
  tipos_aceptados: string[];
  firma_base64?: string;
}

export interface BuscarClienteResponse {
  encontrado: boolean;
  cliente?: any;
}

export interface AutoVerifyResponse {
  verificado: boolean;
  completado: boolean;
  mensaje: string;
}

export interface TiposVerificacionPermitidosResponse {
  tipos_permitidos: string[];
  plan_activo: boolean;
  plan_nombre?: string;
  plan_codigo?: string;
  mensaje?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FormulariosService {
  constructor(
    private api: ApiService,
    private config: ConfigService
  ) {}

  // ==================== GESTIÓN DE FORMULARIOS (Admin/Distribuidor) ====================
  
  // Listar formularios
  getFormularios(): Observable<{ formularios: Formulario[] }> {
    return this.api.get<{ formularios: Formulario[] }>(this.config.endpoints.formularios);
  }

  // Obtener tipos de verificación permitidos según el plan
  getTiposVerificacionPermitidos(empresaId?: number): Observable<TiposVerificacionPermitidosResponse> {
    const endpoint = empresaId 
      ? `${this.config.endpoints.formularios}/tipos-verificacion-permitidos?empresa_id=${empresaId}`
      : `${this.config.endpoints.formularios}/tipos-verificacion-permitidos`;
    return this.api.get<TiposVerificacionPermitidosResponse>(endpoint);
  }

  // Cambiar estado del formulario
  toggleEstado(id: number, activo: boolean): Observable<any> {
    const endpoint = this.config.buildEndpoint(
      this.config.endpoints.formulariosEstado,
      { id }
    );
    return this.api.put(endpoint, { activo });
  }

  // Obtener respuestas del formulario
  getRespuestasFormulario(id: number): Observable<any> {
    const endpoint = this.config.buildEndpoint(
      this.config.endpoints.formulariosRespuestas,
      { id }
    );
    return this.api.get(endpoint);
  }

  // ==================== FORMULARIOS PÚBLICOS ====================
  
  // 1. Obtener formulario público por token
  getFormularioPublico(token: string): Observable<FormularioPublicoResponse> {
    return this.api.get<FormularioPublicoResponse>(
      `${this.config.endpoints.formulariosPublico}/${token}`
    );
  }

  // 2. Registrar respuesta en formulario público
  registrarRespuesta(token: string, datos: RegistrarRespuestaRequest): Observable<any> {
    console.log('[SEND] Registrando respuesta:', datos);
    return this.api.post(
      `${this.config.endpoints.formulariosPublico}/${token}/registrar`,
      datos
    );
  }

  // 3. Verificar código de validación
  verificarCodigo(request: VerificarCodigoRequest): Observable<VerificarCodigoResponse> {
    console.log('[SEND] Verificando código:', request);
    console.log('[ENDPOINT] Endpoint:', this.config.endpoints.formulariosPublicoVerificarCodigo);
    
    return this.api.post<VerificarCodigoResponse>(
      this.config.endpoints.formulariosPublicoVerificarCodigo,
      request
    );
  }

  // 4. Guardar consentimientos seleccionados
  guardarConsentimientos(request: GuardarConsentimientosRequest): Observable<{ success: boolean; message: string }> {
    console.log('[SEND] Guardando consentimientos:', request);
    return this.api.post<{ success: boolean; message: string }>(
      this.config.endpoints.formulariosPublicoGuardarConsentimientos,
      request
    );
  }

  // 5. Completar proceso de consentimientos
  completarConsentimientos(request: CompletarConsentimientosRequest): Observable<{ success: boolean; message: string }> {
    console.log('[SEND] Completando consentimientos:', request);
    return this.api.post<{ success: boolean; message: string }>(
      this.config.endpoints.formulariosPublicoCompletarConsentimientos,
      request
    );
  }

  // 6. Buscar cliente por cédula en el contexto del formulario
  buscarClientePorCedula(token: string, cedula: string): Observable<BuscarClienteResponse> {
    const endpoint = this.config.buildEndpoint(
      this.config.endpoints.formulariosPublicoBuscarCliente,
      { token, cedula }
    );
    return this.api.get<BuscarClienteResponse>(endpoint);
  }

  // 7. Auto-verificación y completado (Polling)
  autoVerify(tokenVerificacion: string): Observable<AutoVerifyResponse> {
    return this.api.get<AutoVerifyResponse>(
      `${this.config.endpoints.formulariosPublico}/auto-verify/${tokenVerificacion}`
    );
  }

  // ==================== UTILIDADES ====================
  
  // Consultar cédula externa (Registro Civil)
  consultarCedulaExterna(cedula: string, empresaId?: number): Observable<any> {
    const endpoint = this.config.buildEndpoint(
      this.config.endpoints.clientesConsultarCedula,
      { cedula }
    );
    
    // Agregar empresa_id como query parameter si está disponible
    const url = empresaId ? `${endpoint}?empresa_id=${empresaId}` : endpoint;
    
    return this.api.get<any>(url);
  }
}