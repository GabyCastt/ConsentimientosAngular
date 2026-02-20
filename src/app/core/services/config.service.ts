import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  // URL base del API
  readonly apiUrl = environment.apiUrl;
  
  // Información de la aplicación
  readonly appName = 'ConsentPro';
  readonly version = '1.0.0';
  
  // Información de la empresa administradora
  readonly adminCompany = {
    name: 'BEGROUP',
    email: 'gerencia@begroupec.com',
    phone: '+593 98 659 1764',
    whatsapp: 'https://api.whatsapp.com/send?phone=+0986591764&text=Hola!%20Vengo%20de%20la%20p%C3%A1gina%20web%20de%20Be%20Group!%20Quiero%20conocer%20m%C3%A1s%20de%20la%20empresa',
    social: {
      youtube: 'https://www.youtube.com/@BeGroupSAS',
      linkedin: 'https://www.linkedin.com/company/begroup-ec/',
      instagram: 'https://www.instagram.com/begroupec/',
      tiktok: 'https://www.tiktok.com/@begroupecu?is_from_webapp=1&sender_device=pc',
      facebook: 'https://www.facebook.com/begroupec'
    }
  };
  
  // Configuración de autenticación
  readonly tokenStorageKey = 'authToken';
  readonly userStorageKey = 'currentUser';
  readonly maxLoginAttempts = 5;
  
  // Endpoints del API
  readonly endpoints = {
    // Autenticación
    login: '/api/login',
    
    // Clientes
    clientes: '/api/clientes',
    clientesImport: '/api/clientes/import',
    clientesDetalle: '/api/clientes/{id}/detalle',
    clientesDocumento: '/api/clientes/{clienteId}/documento/{respuestaId}',
    clientesReenviar: '/api/clientes/{clienteId}/reenviar-certificado/{respuestaId}',
    
    // Formularios
    formularios: '/api/formularios',
    formulariosPublico: '/api/formularios/publico',
    formulariosEstado: '/api/formularios/{id}/estado',
    buscarCliente: '/api/formularios/publico/{token}/buscar-cliente/{cedula}',
    verificarCodigo: '/api/formularios/publico/verificar-codigo',
    completarConsentimientos: '/api/formularios/publico/completar-consentimientos',
    
    // Consentimientos
    consentimientos: '/api/consentimientos-procesados',
    generarEnlace: '/api/generar-enlace',
    
    // Estadísticas
    estadisticasDashboard: '/api/estadisticas/dashboard',
    estadisticasFormularios: '/api/estadisticas/formularios',
    estadisticasConsentimientos: '/api/estadisticas/consentimientos',
    estadisticasPeriodo: '/api/estadisticas/periodo',
    
    // Empresas
    empresas: '/api/empresas',
    empresasPerfil: '/api/empresas/perfil',
    
    // Certificados
    certificadosEnviar: '/api/certificados/enviar-confirmacion',
    certificadosDescargar: '/api/certificados/descargar',
    certificadosTerminos: '/api/certificados/terminos-autorizados',
    certificadosCliente: '/api/certificados/cliente',
    
    // Verificación de autorización
    verificarAutorizacion: '/api/verificar-autorizacion',
    verificarCedula: '/api/verificar-cedula',
    estadisticasVerificacion: '/api/estadisticas-verificacion',
    
    // DIDIT - Verificación Biométrica
    didit: {
      createSession: '/api/didit/create-session',
      sessionStatus: '/api/didit/session-status',
      status: '/api/didit/status',
      config: '/api/didit/config',
      callback: '/api/didit/callback',
      webhook: '/api/didit/webhook',
      formInfo: '/api/didit/form-info',
      resendDocuments: '/api/didit/resend-documents',
      completeProcess: '/api/didit/complete-process',
      pendingClients: '/api/didit/pending-clients'
    },
    
    // Health check
    health: '/api/health'
  };

  constructor() {
    this.logEnvironmentInfo();
  }

  /**
   * Construye la URL completa del API
   */
  getApiUrl(endpoint: string): string {
    return `${this.apiUrl}${endpoint}`;
  }

  /**
   * Construye endpoint con parámetros dinámicos
   * Ejemplo: buildEndpoint('/api/clientes/{id}/detalle', { id: 123 })
   */
  buildEndpoint(endpointTemplate: string, params: Record<string, any> = {}): string {
    let endpoint = endpointTemplate;
    
    Object.keys(params).forEach(key => {
      const placeholder = `{${key}}`;
      endpoint = endpoint.replace(placeholder, String(params[key]));
    });
    
    return endpoint;
  }

  /**
   * Obtiene URL completa con parámetros
   */
  getApiUrlWithParams(endpointTemplate: string, params: Record<string, any> = {}): string {
    const endpoint = this.buildEndpoint(endpointTemplate, params);
    return this.getApiUrl(endpoint);
  }

  /**
   * Construye URL completa para logos
   */
  getLogoUrl(logoPath: string | null): string | null {
    if (!logoPath) return null;
    
    console.log('🖼️ getLogoUrl input:', logoPath);
    
    // Si ya es una URL completa
    if (logoPath.startsWith('http://') || logoPath.startsWith('https://')) {
      // CORRECCIÓN: Remover /api-consentimientos si existe (problema del backend)
      let cleanUrl = logoPath.replace('/api-consentimientos', '');
      console.log('🖼️ URL limpia:', cleanUrl);
      return cleanUrl;
    }
    
    // Si empieza con /, es una ruta absoluta desde el servidor
    if (logoPath.startsWith('/')) {
      // Remover /api-consentimientos si existe
      const cleanPath = logoPath.replace('/api-consentimientos', '');
      return `${this.apiUrl}${cleanPath}`;
    }
    
    // Si ya contiene 'uploads/logos/', solo agregar el dominio
    if (logoPath.includes('uploads/logos/')) {
      // Remover /api-consentimientos si existe
      const cleanPath = logoPath.replace('/api-consentimientos/', '');
      return `${this.apiUrl}/${cleanPath}`;
    }
    
    // Si no, es solo el nombre del archivo
    return `${this.apiUrl}/uploads/logos/${logoPath}`;
  }

  /**
   * Construye URL completa para PDFs
   */
  getPdfUrl(pdfPath: string | null): string | null {
    if (!pdfPath) return null;
    
    console.log('📄 getPdfUrl input:', pdfPath);
    
    // Si ya es una URL completa
    if (pdfPath.startsWith('http')) {
      // CORRECCIÓN: Remover /api-consentimientos si existe (problema del backend)
      let cleanUrl = pdfPath.replace('/api-consentimientos', '');
      console.log('📄 URL limpia:', cleanUrl);
      return cleanUrl;
    }
    
    // Si ya contiene 'uploads/'
    if (pdfPath.includes('uploads/')) {
      // Remover /api-consentimientos si existe
      const cleanPath = pdfPath.replace('/api-consentimientos/', '');
      return `${this.apiUrl}/${cleanPath}`;
    }
    
    // Si no, agregar ruta completa
    return `${this.apiUrl}/uploads/pdfs/${pdfPath}`;
  }

  /**
   * Verifica si estamos en modo desarrollo
   */
  isDevelopment(): boolean {
    return !environment.production;
  }

  /**
   * Verifica si estamos en modo producción
   */
  isProduction(): boolean {
    return environment.production;
  }

  /**
   * Log de información del entorno (solo en desarrollo)
   */
  private logEnvironmentInfo(): void {
    if (this.isDevelopment()) {
      console.log('🌍 Entorno:', environment.production ? 'PRODUCCIÓN' : 'DESARROLLO');
      console.log('📡 API Base URL:', this.apiUrl);
      console.log('📦 App Version:', this.version);
    }
  }

  /**
   * Obtiene headers comunes para peticiones HTTP
   * (Nota: En Angular esto se maneja mejor con interceptors)
   */
  getCommonHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest'
    };
  }

  /**
   * Formatea tiempo relativo (hace X minutos/horas/días)
   */
  formatearTiempoRelativo(fechaISO: string): string {
    const fecha = new Date(fechaISO);
    const ahora = new Date();
    const diffMs = ahora.getTime() - fecha.getTime();
    const diffMinutos = Math.floor(diffMs / (1000 * 60));
    const diffHoras = Math.floor(diffMinutos / 60);
    const diffDias = Math.floor(diffHoras / 24);

    if (diffMinutos < 1) return 'Hace un momento';
    if (diffMinutos < 60) return `Hace ${diffMinutos} minuto${diffMinutos > 1 ? 's' : ''}`;
    if (diffHoras < 24) return `Hace ${diffHoras} hora${diffHoras > 1 ? 's' : ''}`;
    if (diffDias < 7) return `Hace ${diffDias} día${diffDias > 1 ? 's' : ''}`;
    
    return fecha.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Valida formato de email
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 100;
  }

  /**
   * Valida formato de cédula ecuatoriana (10 dígitos)
   */
  isValidCedula(cedula: string): boolean {
    return /^\d{10}$/.test(cedula);
  }

  /**
   * Valida formato de teléfono
   */
  isValidPhone(phone: string): boolean {
    const digits = phone.replace(/\D/g, '');
    return digits.length >= 7 && digits.length <= 15;
  }

  /**
   * Sanitiza input para prevenir XSS
   */
  sanitizeInput(input: string): string {
    return input.replace(/[<>"']/g, '');
  }

  /**
   * Verifica la configuración del entorno
   */
  private verificarConfiguracion(): void {
    if (this.isDevelopment()) {
      console.log('🔧 Modo desarrollo activado');
      console.log('📡 Usando proxy para evitar CORS');
      console.log('🌐 Backend esperado en: http://localhost:3811');
    } else {
      console.log('🚀 Modo producción activado');
      console.log('📡 API URL:', this.apiUrl);
    }
  }

  /**
   * Obtiene información del entorno actual
   */
  getEnvironmentInfo(): Record<string, any> {
    return {
      production: this.isProduction(),
      development: this.isDevelopment(),
      apiUrl: this.apiUrl,
      hostname: window.location.hostname,
      version: this.version,
      appName: this.appName
    };
  }
}
