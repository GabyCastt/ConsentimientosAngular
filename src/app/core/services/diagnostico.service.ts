import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ConfigService } from './config.service';
import { AuthService } from './auth.service';
import { firstValueFrom } from 'rxjs';

interface DiagnosticoResult {
  test: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  data?: any;
}

@Injectable({
  providedIn: 'root'
})
export class DiagnosticoService {
  constructor(
    private http: HttpClient,
    private config: ConfigService,
    private auth: AuthService
  ) {}

  /**
   * Ejecuta diagnóstico completo del sistema
   */
  async ejecutarDiagnosticoCompleto(): Promise<DiagnosticoResult[]> {
    const resultados: DiagnosticoResult[] = [];

    console.log('🔍 Iniciando diagnóstico del sistema...');
    console.log('='.repeat(60));

    // 1. Verificar configuración del entorno
    resultados.push(this.verificarEntorno());

    // 2. Verificar autenticación
    resultados.push(this.verificarAutenticacion());

    // 3. Verificar conexión con backend
    const backendTest = await this.verificarBackend();
    resultados.push(backendTest);

    // 4. Verificar endpoint de clientes
    if (backendTest.status === 'success') {
      const clientesTest = await this.verificarEndpointClientes();
      resultados.push(clientesTest);
    }

    // 5. Verificar endpoint de estadísticas
    if (backendTest.status === 'success') {
      const statsTest = await this.verificarEndpointEstadisticas();
      resultados.push(statsTest);
    }

    // Mostrar resumen
    this.mostrarResumen(resultados);

    return resultados;
  }

  /**
   * Verifica configuración del entorno
   */
  private verificarEntorno(): DiagnosticoResult {
    const env = this.config.getEnvironmentInfo();
    
    console.log('🌍 Verificando entorno...');
    console.log('  - Hostname:', env['hostname']);
    console.log('  - Desarrollo:', env['development']);
    console.log('  - Producción:', env['production']);
    console.log('  - API URL:', env['apiUrl']);

    return {
      test: 'Configuración de Entorno',
      status: 'success',
      message: `Entorno: ${env['development'] ? 'Desarrollo' : 'Producción'}`,
      data: env
    };
  }

  /**
   * Verifica estado de autenticación
   */
  private verificarAutenticacion(): DiagnosticoResult {
    const token = this.auth.getToken();
    const user = this.auth.currentUser();

    console.log('🔐 Verificando autenticación...');
    console.log('  - Token presente:', !!token);
    console.log('  - Usuario:', user?.nombre || 'No autenticado');
    console.log('  - Rol:', user?.rol || 'N/A');

    if (!token || !user) {
      return {
        test: 'Autenticación',
        status: 'error',
        message: 'No hay sesión activa. Inicia sesión primero.'
      };
    }

    return {
      test: 'Autenticación',
      status: 'success',
      message: `Usuario: ${user.nombre} (${user.rol})`,
      data: { usuario: user.nombre, rol: user.rol }
    };
  }

  /**
   * Verifica conexión con el backend
   */
  private async verificarBackend(): Promise<DiagnosticoResult> {
    console.log('📡 Verificando conexión con backend...');
    
    try {
      const url = this.config.getApiUrl('/api/health');
      console.log('  - URL:', url);

      const response = await firstValueFrom(
        this.http.get<any>(url, { 
          headers: this.getHeaders() 
        })
      );

      console.log('  - Respuesta:', response);

      return {
        test: 'Conexión Backend',
        status: 'success',
        message: 'Backend respondiendo correctamente',
        data: response
      };
    } catch (error: any) {
      console.error('  - Error:', error);

      return {
        test: 'Conexión Backend',
        status: 'error',
        message: `Error de conexión: ${error.message || 'Desconocido'}`,
        data: error
      };
    }
  }

  /**
   * Verifica endpoint de clientes
   */
  private async verificarEndpointClientes(): Promise<DiagnosticoResult> {
    console.log('👥 Verificando endpoint de clientes...');
    
    try {
      const url = this.config.getApiUrl(this.config.endpoints.clientes);
      console.log('  - URL:', url);

      const response = await firstValueFrom(
        this.http.get<any>(url, { 
          headers: this.getHeaders() 
        })
      );

      const clientes = Array.isArray(response) ? response : (response.clientes || []);
      console.log('  - Total clientes:', clientes.length);
      console.log('  - Estructura:', {
        esArray: Array.isArray(response),
        tienePropiedad: !!response.clientes,
        primerCliente: clientes[0] || null
      });

      return {
        test: 'Endpoint Clientes',
        status: 'success',
        message: `${clientes.length} clientes encontrados`,
        data: {
          total: clientes.length,
          estructura: Array.isArray(response) ? 'array' : 'objeto',
          ejemplo: clientes[0] || null
        }
      };
    } catch (error: any) {
      console.error('  - Error:', error);

      return {
        test: 'Endpoint Clientes',
        status: 'error',
        message: `Error: ${error.message || 'Desconocido'}`,
        data: error
      };
    }
  }

  /**
   * Verifica endpoint de estadísticas
   */
  private async verificarEndpointEstadisticas(): Promise<DiagnosticoResult> {
    console.log('📊 Verificando endpoint de estadísticas...');
    
    try {
      const url = this.config.getApiUrl(this.config.endpoints.estadisticasDashboard);
      console.log('  - URL:', url);

      const response = await firstValueFrom(
        this.http.get<any>(url, { 
          headers: this.getHeaders() 
        })
      );

      const data = response.success ? response.data : response;
      console.log('  - Estructura:', {
        tieneSuccess: !!response.success,
        tieneData: !!response.data,
        clientes: data.clientes || data.total_clientes,
        consentimientos: data.consentimientos || data.consentimientos_procesados
      });

      return {
        test: 'Endpoint Estadísticas',
        status: 'success',
        message: 'Estadísticas cargadas correctamente',
        data: {
          estructura: response.success ? 'anidada' : 'plana',
          clientes: data.clientes?.total || data.total_clientes || 0,
          consentimientos: data.consentimientos?.total || data.total_consentimientos || 0
        }
      };
    } catch (error: any) {
      console.error('  - Error:', error);

      return {
        test: 'Endpoint Estadísticas',
        status: 'error',
        message: `Error: ${error.message || 'Desconocido'}`,
        data: error
      };
    }
  }

  /**
   * Muestra resumen del diagnóstico
   */
  private mostrarResumen(resultados: DiagnosticoResult[]): void {
    console.log('='.repeat(60));
    console.log('📋 RESUMEN DEL DIAGNÓSTICO');
    console.log('='.repeat(60));

    const exitosos = resultados.filter(r => r.status === 'success').length;
    const errores = resultados.filter(r => r.status === 'error').length;
    const advertencias = resultados.filter(r => r.status === 'warning').length;

    resultados.forEach(resultado => {
      const icon = resultado.status === 'success' ? '✅' : 
                   resultado.status === 'error' ? '❌' : '⚠️';
      console.log(`${icon} ${resultado.test}: ${resultado.message}`);
    });

    console.log('='.repeat(60));
    console.log(`Total: ${resultados.length} pruebas`);
    console.log(`✅ Exitosas: ${exitosos}`);
    console.log(`❌ Errores: ${errores}`);
    console.log(`⚠️ Advertencias: ${advertencias}`);
    console.log('='.repeat(60));

    if (errores > 0) {
      console.log('');
      console.log('💡 RECOMENDACIONES:');
      resultados
        .filter(r => r.status === 'error')
        .forEach(r => {
          console.log(`  - ${r.test}: ${r.message}`);
        });
    }
  }

  /**
   * Obtiene headers para las peticiones
   */
  private getHeaders(): { [key: string]: string } {
    const headers: { [key: string]: string } = {
      'Content-Type': 'application/json'
    };

    const token = this.auth.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * Ejecuta diagnóstico rápido (solo logs)
   */
  diagnosticoRapido(): void {
    console.log('🔍 DIAGNÓSTICO RÁPIDO');
    console.log('='.repeat(60));
    
    // Entorno
    const env = this.config.getEnvironmentInfo();
    console.log('🌍 Entorno:', env['development'] ? 'Desarrollo' : 'Producción');
    console.log('📡 API URL:', env['apiUrl'] || '(usando proxy)');
    console.log('🌐 Hostname:', env['hostname']);
    
    // Autenticación
    const user = this.auth.currentUser();
    console.log('👤 Usuario:', user?.nombre || 'No autenticado');
    console.log('🔑 Token:', this.auth.getToken() ? 'Presente' : 'Ausente');
    
    // Endpoints
    console.log('📍 Endpoints:');
    console.log('  - Clientes:', this.config.endpoints.clientes);
    console.log('  - Dashboard:', this.config.endpoints.estadisticasDashboard);
    
    console.log('='.repeat(60));
  }
}
