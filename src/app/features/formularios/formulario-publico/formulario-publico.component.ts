import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { FormulariosService } from '../formularios.service';
import { DiditService } from '../../verificacion/didit/didit.service';
import { ConfigService } from '../../../core/services/config.service';
import { 
  FormularioPublico, 
  DatosUsuario 
} from '../../../core/models/formulario.model';
import { Cliente } from '../../../core/models/cliente.model';

type Seccion = 'busqueda' | 'datos' | 'consentimientos' | 'verificacion' | 'completado';
type TipoVerificacion = 'sms_email' | 'biometria_free' | 'biometria_premium' | 'sms_didit';

interface Estado {
  paso: string;
  cedula: string;
  clienteEncontrado: boolean;
  datosCliente: any;
  datosPersonalesCompletos: boolean;
  consentimientosSeleccionados: boolean;
  tokenVerificacion: string;
  codigoEnviado: boolean;
  codigoVerificado: boolean;
  consentimientosCompletados: boolean;
  documentosDisponibles: any[];
  yaCompletado: boolean;
  tipoValidacion: TipoVerificacion;
  sesionDidit: any;
  verificacionBiometrica: boolean;
}

@Component({
  selector: 'app-formulario-publico',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './formulario-publico.component.html',
  styleUrls: ['./formulario-publico.component.scss']
})
export class FormularioPublicoComponent implements OnInit, OnDestroy {
  // Signals principales
  token = signal<string>('');
  formulario = signal<FormularioPublico | null>(null);
  loading = signal(false);
  
  // Estado del formulario
  estado = signal<Estado>({
    paso: 'inicial',
    cedula: '',
    clienteEncontrado: false,
    datosCliente: {},
    datosPersonalesCompletos: false,
    consentimientosSeleccionados: false,
    tokenVerificacion: '',
    codigoEnviado: false,
    codigoVerificado: false,
    consentimientosCompletados: false,
    documentosDisponibles: [],
    yaCompletado: false,
    tipoValidacion: 'sms_email',
    sesionDidit: null,
    verificacionBiometrica: false
  });
  
  // Datos del formulario
  cedula = signal('');
  nombre = signal('');
  apellido = signal('');
  email = signal('');
  telefono = signal('');
  clienteEncontrado = signal<Cliente | null>(null);
  consentimientosSeleccionados = signal<string[]>([]);
  
  // Verificación
  codigoVerificacion = signal('');
  mensajeVerificacion = signal('');
  tipoMensaje = signal<'success' | 'error' | 'info'>('info');
  mostrarPassword = signal(false);
  
  // DIDIT y SMS
  sessionId = signal<string | null>(null);
  pollingInterval: any = null;
  pollingAttempts = 0;
  maxPollingAttempts = 60;
  
  // SMS DIDIT
  smsAttempts = signal(0);
  smsMaxAttempts = signal(3);
  smsPasoActual = signal<'telefono' | 'codigo' | 'exitoso'>('telefono');
  
  // Protección contra recarga
  private formularioTieneDatos = false;
  private beforeUnloadHandler: any;

  constructor(
    private route: ActivatedRoute,
    private formulariosService: FormulariosService,
    private diditService: DiditService,
    public config: ConfigService
  ) {}

  ngOnInit(): void {
    this.token.set(this.route.snapshot.params['token']);
    this.loadFormulario();
    this.checkDiditCallback();
    this.configurarProteccionRecarga();
  }

  ngOnDestroy(): void {
    this.stopPolling();
    this.removerProteccionRecarga();
  }

  // ==================== CARGA INICIAL ====================
  
  loadFormulario(): void {
    this.loading.set(true);
    
    this.formulariosService.getFormularioPublico(this.token()).subscribe({
      next: (data) => {
        this.formulario.set(data);
        const estadoActual = this.estado();
        estadoActual.tipoValidacion = (data.tipo_validacion as TipoVerificacion) || 'sms_email';
        this.estado.set(estadoActual);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error cargando formulario:', error);
        this.mostrarMensaje('Error al cargar el formulario', 'error');
        this.loading.set(false);
      }
    });
  }

  // ==================== BÚSQUEDA POR CÉDULA ====================
  
  buscarPorCedula(): void {
    const cedulaValue = this.cedula();
    
    if (!this.config.isValidCedula(cedulaValue)) {
      this.mostrarMensaje('Cédula debe tener 10 dígitos', 'error');
      return;
    }

    this.loading.set(true);
    
    this.formulariosService.buscarClientePorCedula(
      this.token(), 
      cedulaValue
    ).subscribe({
      next: (cliente) => {
        const estadoActual = this.estado();
        
        if (cliente) {
          this.clienteEncontrado.set(cliente);
          this.nombre.set(cliente.nombre);
          this.apellido.set(cliente.apellido || '');
          this.email.set(cliente.email || '');
          this.telefono.set(cliente.telefono || '');
          
          estadoActual.clienteEncontrado = true;
          estadoActual.datosCliente = cliente;
          this.mostrarMensaje('Cliente encontrado', 'success');
        } else {
          this.clienteEncontrado.set(null);
          estadoActual.clienteEncontrado = false;
          this.mostrarMensaje('Cliente no encontrado. Ingresa tus datos.', 'info');
        }
        
        estadoActual.cedula = cedulaValue;
        estadoActual.paso = 'datos_encontrados';
        this.estado.set(estadoActual);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error buscando cliente:', error);
        this.mostrarMensaje('Error al buscar cliente', 'error');
        this.loading.set(false);
      }
    });
  }

  // ==================== VALIDACIÓN DE DATOS ====================
  
  validarDatosPersonales(): boolean {
    const nombreVal = this.nombre();
    const apellidoVal = this.apellido();
    const emailVal = this.email();
    const telefonoVal = this.telefono();
    const tipoVerif = this.estado().tipoValidacion;
    
    let datosCompletos = false;
    
    if (tipoVerif === 'biometria_free' || tipoVerif === 'biometria_premium') {
      const emailValido = !!(emailVal && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal));
      datosCompletos = !!nombreVal && !!apellidoVal && emailValido;
    } else if (tipoVerif === 'sms_didit') {
      datosCompletos = !!nombreVal && !!apellidoVal && !!telefonoVal;
    } else {
      datosCompletos = !!nombreVal && !!apellidoVal && (!!emailVal || !!telefonoVal);
    }
    
    const estadoActual = this.estado();
    estadoActual.datosPersonalesCompletos = datosCompletos;
    this.estado.set(estadoActual);
    
    return datosCompletos;
  }

  continuarConDatos(): void {
    if (!this.validarDatosPersonales()) {
      this.mostrarMensaje('Completa todos los campos requeridos', 'error');
      return;
    }
    
    const estadoActual = this.estado();
    estadoActual.paso = 'datos_completados';
    this.estado.set(estadoActual);
  }

  // ==================== CONSENTIMIENTOS ====================
  
  toggleConsentimiento(tipo: string): void {
    const selected = this.consentimientosSeleccionados();
    const index = selected.indexOf(tipo);
    
    if (index > -1) {
      this.consentimientosSeleccionados.set(
        selected.filter(t => t !== tipo)
      );
    } else {
      this.consentimientosSeleccionados.set([...selected, tipo]);
    }
  }

  isConsentimientoSeleccionado(tipo: string): boolean {
    return this.consentimientosSeleccionados().includes(tipo);
  }

  continuarConConsentimientos(): void {
    if (this.consentimientosSeleccionados().length === 0) {
      this.mostrarMensaje('Debes seleccionar al menos un consentimiento', 'error');
      return;
    }

    const estadoActual = this.estado();
    estadoActual.consentimientosSeleccionados = true;
    estadoActual.paso = 'consentimientos_seleccionados';
    this.estado.set(estadoActual);
  }

  // ==================== REGISTRO Y VERIFICACIÓN ====================
  
  async solicitarCodigo(): Promise<void> {
    this.loading.set(true);

    const datos: DatosUsuario = {
      cedula: this.cedula(),
      nombre: this.nombre(),
      apellido: this.apellido(),
      email: this.email() || undefined,
      telefono: this.telefono() || undefined,
      consentimientos_seleccionados: this.consentimientosSeleccionados().map(Number)
    };

    this.formulariosService.registrarConsentimientos(
      this.token(),
      datos
    ).subscribe({
      next: (response: any) => {
        const estadoActual = this.estado();
        estadoActual.tokenVerificacion = response.token_verificacion;
        
        if (response.tipo_verificacion === 'biometria') {
          estadoActual.verificacionBiometrica = true;
          this.iniciarVerificacionBiometrica(response);
        } else if (response.requiere_envio_manual) {
          // SMS DIDIT
          this.mostrarMensaje('Haz clic en "Enviar código SMS"', 'info');
        } else {
          // Verificación tradicional
          estadoActual.codigoEnviado = true;
          this.mostrarMensaje('Código enviado por Email y WhatsApp', 'success');
        }
        
        estadoActual.paso = 'codigo_enviado';
        this.estado.set(estadoActual);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error registrando:', error);
        this.mostrarMensaje(error.error?.message || 'Error al registrar', 'error');
        this.loading.set(false);
      }
    });
  }

  verificarCodigo(): void {
    const codigo = this.codigoVerificacion();
    
    if (codigo.length !== 6) {
      this.mostrarMensaje('Código debe tener 6 dígitos', 'error');
      return;
    }

    this.loading.set(true);
    
    this.formulariosService.verificarCodigo(
      this.token(),
      codigo
    ).subscribe({
      next: (response) => {
        if (response.success) {
          const estadoActual = this.estado();
          if (estadoActual.tipoValidacion === 'sms_didit') {
            this.smsPasoActual.set('exitoso');
          }
          this.completarConsentimientos();
        } else {
          this.mostrarMensaje(response.message, 'error');
          this.loading.set(false);
        }
      },
      error: (error) => {
        this.mostrarMensaje(error.error?.message || 'Código inválido', 'error');
        this.loading.set(false);
      }
    });
  }

  reenviarCodigoSms(): void {
    if (this.smsAttempts() >= this.smsMaxAttempts()) {
      this.mostrarMensaje('Has alcanzado el máximo de intentos', 'error');
      return;
    }

    this.loading.set(true);
    this.smsAttempts.set(this.smsAttempts() + 1);

    this.formulariosService.solicitarCodigo(this.token()).subscribe({
      next: (response) => {
        if (response.success) {
          this.mostrarMensaje('Código reenviado exitosamente', 'success');
          this.codigoVerificacion.set('');
        } else {
          this.mostrarMensaje(response.message, 'error');
        }
        this.loading.set(false);
      },
      error: (error) => {
        this.mostrarMensaje(error.error?.message || 'Error al reenviar código', 'error');
        this.loading.set(false);
      }
    });
  }

  completarConsentimientos(): void {
    const estadoActual = this.estado();
    
    this.formulariosService.registrarConsentimientos(
      this.token(),
      {
        cedula: this.cedula(),
        nombre: this.nombre(),
        apellido: this.apellido(),
        email: this.email() || undefined,
        telefono: this.telefono() || undefined,
        consentimientos_seleccionados: this.consentimientosSeleccionados().map(Number)
      }
    ).subscribe({
      next: (response: any) => {
        estadoActual.consentimientosCompletados = true;
        estadoActual.paso = 'finalizado';
        estadoActual.documentosDisponibles = response.documentos || [];
        this.estado.set(estadoActual);
        
        this.deshabilitarProteccionRecarga();
        this.mostrarMensaje('Consentimientos autorizados exitosamente', 'success');
        this.loading.set(false);
      },
      error: (error) => {
        this.mostrarMensaje(error.error?.message || 'Error al completar', 'error');
        this.loading.set(false);
      }
    });
  }

  // ==================== VERIFICACIÓN BIOMÉTRICA DIDIT ====================
  
  iniciarVerificacionBiometrica(response: any): void {
    if (response.verification_url && response.session_id) {
      this.sessionId.set(response.session_id);
      this.startPolling();
      this.mostrarMensaje('Redirigiendo a verificación biométrica...', 'info');
      
      setTimeout(() => {
        window.location.href = response.verification_url;
      }, 1500);
    } else {
      this.mostrarMensaje('Error iniciando verificación biométrica', 'error');
    }
  }

  checkDiditCallback(): void {
    const urlParams = new URLSearchParams(window.location.search);
    const diditReturn = urlParams.get('didit_return');
    const verificationToken = urlParams.get('verification_token');
    const status = urlParams.get('status');
    const verified = urlParams.get('verified');
    
    if (diditReturn === 'true' && verificationToken) {
      this.manejarRegresoDeDidit(verificationToken, status, verified);
    }
  }

  manejarRegresoDeDidit(verificationToken: string | null, status: string | null, verified: string | null): void {
    // Implementar lógica de regreso de DIDIT
    const estadoActual = this.estado();
    estadoActual.tokenVerificacion = verificationToken || '';
    
    const esExitoso = (status === 'success' || status === 'approved') && verified === 'true';
    
    if (esExitoso) {
      estadoActual.verificacionBiometrica = true;
      estadoActual.codigoVerificado = true;
      this.mostrarMensaje('Verificación biométrica completada', 'success');
      this.completarConsentimientos();
    } else {
      this.mostrarMensaje('Verificación biométrica fallida', 'error');
    }
    
    this.estado.set(estadoActual);
  }

  startPolling(): void {
    this.stopPolling();
    this.pollingAttempts = 0;
    
    this.pollingInterval = setInterval(() => {
      this.pollingAttempts++;
      
      if (this.pollingAttempts >= this.maxPollingAttempts) {
        this.stopPolling();
        this.mostrarMensaje('Tiempo de espera agotado', 'error');
        return;
      }
      
      this.verificarEstadoDidit();
    }, 5000);
  }

  stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  verificarEstadoDidit(): void {
    const sessionId = this.sessionId();
    if (!sessionId) return;

    this.diditService.getSessionStatus(sessionId).subscribe({
      next: (status) => {
        if (status.status === 'completed' && status.verified) {
          this.stopPolling();
          this.completarConsentimientos();
        } else if (status.status === 'failed') {
          this.stopPolling();
          this.mostrarMensaje('Verificación fallida', 'error');
        }
      },
      error: (error) => {
        console.error('Error verificando estado:', error);
      }
    });
  }

  // ==================== PROTECCIÓN CONTRA RECARGA ====================
  
  configurarProteccionRecarga(): void {
    this.beforeUnloadHandler = (e: BeforeUnloadEvent) => {
      if (this.verificarDatosFormulario()) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
      return undefined;
    };
    
    window.addEventListener('beforeunload', this.beforeUnloadHandler);
  }

  removerProteccionRecarga(): void {
    if (this.beforeUnloadHandler) {
      window.removeEventListener('beforeunload', this.beforeUnloadHandler);
    }
  }

  deshabilitarProteccionRecarga(): void {
    this.formularioTieneDatos = false;
    this.removerProteccionRecarga();
  }

  verificarDatosFormulario(): boolean {
    const estadoActual = this.estado();
    return !!(
      this.cedula() ||
      this.nombre() ||
      this.email() ||
      estadoActual.consentimientosSeleccionados ||
      estadoActual.codigoEnviado
    );
  }

  // ==================== UTILIDADES ====================

  mostrarMensaje(mensaje: string, tipo: 'success' | 'error' | 'info'): void {
    this.mensajeVerificacion.set(mensaje);
    this.tipoMensaje.set(tipo);
    
    setTimeout(() => {
      this.mensajeVerificacion.set('');
    }, 5000);
  }

  getLogoUrl(logoPath?: string): string | null {
    return this.config.getLogoUrl(logoPath || null);
  }

  getPdfUrl(pdfPath: string): string | null {
    return this.config.getPdfUrl(pdfPath);
  }

  getCertificadoUrl(): string {
    const token = this.estado().tokenVerificacion;
    return `${this.config.apiUrl}/api/certificados/descargar/${token}`;
  }

  getTerminosUrl(): string {
    const token = this.estado().tokenVerificacion;
    return `${this.config.apiUrl}/api/certificados/terminos-autorizados/${token}`;
  }

  getCurrentYear(): number {
    return new Date().getFullYear();
  }
}
