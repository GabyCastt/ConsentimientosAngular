import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  imports: [CommonModule],
  templateUrl: './formulario-publico.component.html',
  styleUrls: ['./formulario-publico.component.scss']
})
export class FormularioPublicoComponent implements OnInit, OnDestroy {
  // Signals principales
  token = signal<string>('');
  formulario = signal<FormularioPublico | null>(null);
  loading = signal(false);
  
  // Computed para consentimientos formateados
  consentimientosFormateados = computed(() => {
    const form = this.formulario();
    if (!form) return [];
    
    // Si ya vienen consentimientos formateados, usarlos
    if (form.consentimientos && form.consentimientos.length > 0) {
      return form.consentimientos;
    }
    
    // Si no, construirlos desde tipos_consentimientos y archivos_disponibles
    if (form.tipos_consentimientos && form.archivos_disponibles) {
      return form.tipos_consentimientos.map((tipo, index) => {
        const archivos = form.archivos_disponibles?.[tipo] || [];
        
        // Mapear nombres de tipos a descripciones legibles
        const nombresTipos: { [key: string]: string } = {
          'datos_personales': 'Tratamiento de Datos Personales',
          'imagen': 'Uso de Imagen',
          'marketing': 'Comunicaciones de Marketing',
          'terceros': 'Compartir con Terceros'
        };
        
        const descripcionesTipos: { [key: string]: string } = {
          'datos_personales': 'Autorizo el tratamiento de mis datos personales para los fines establecidos en la política de privacidad.',
          'imagen': 'Autorizo el uso de mi imagen en materiales promocionales y de comunicación.',
          'marketing': 'Acepto recibir comunicaciones comerciales y promocionales.',
          'terceros': 'Autorizo compartir mis datos con empresas asociadas.'
        };
        
        return {
          id: index + 1,
          tipo: nombresTipos[tipo] || tipo,
          descripcion: descripcionesTipos[tipo] || '',
          archivos: archivos
        };
      });
    }
    
    return [];
  });
  
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
    // Leer token desde query params (?token=xxx) o route params (/formulario/:token)
    const tokenFromQuery = this.route.snapshot.queryParams['token'];
    const tokenFromRoute = this.route.snapshot.params['token'];
    
    const tokenValue = tokenFromQuery || tokenFromRoute;
    
    console.log('🔑 Token desde query params:', tokenFromQuery);
    console.log('🔑 Token desde route params:', tokenFromRoute);
    console.log('🔑 Token final:', tokenValue);
    
    if (!tokenValue) {
      console.error('❌ No se encontró token en la URL');
      this.mostrarMensaje('Token no encontrado en la URL', 'error');
      return;
    }
    
    this.token.set(tokenValue);
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
    const tokenValue = this.token();
    
    if (!tokenValue) {
      console.error('❌ No hay token para cargar el formulario');
      this.mostrarMensaje('Error: No se encontró el token del formulario', 'error');
      this.loading.set(false);
      return;
    }
    
    console.log('📡 Cargando formulario con token:', tokenValue);
    this.loading.set(true);
    
    this.formulariosService.getFormularioPublico(tokenValue).subscribe({
      next: (response: any) => {
        console.log('✅ Formulario cargado exitosamente:', response);
        
        // El backend devuelve { formulario: {...} }
        const data = response.formulario || response;
        
        console.log('📋 Datos del formulario:', data);
        console.log('📋 Tipos de consentimientos:', data.tipos_consentimientos);
        console.log('📋 Archivos disponibles:', data.archivos_disponibles);
        
        this.formulario.set(data);
        
        // Actualizar estado con tipo de validación
        this.estado.set({
          ...this.estado(),
          tipoValidacion: (data.tipo_validacion as TipoVerificacion) || 'sms_email'
        });
        
        this.loading.set(false);
      },
      error: (error) => {
        console.error('❌ Error cargando formulario:', error);
        console.error('❌ Status:', error.status);
        console.error('❌ Error completo:', error.error);
        
        let mensajeError = 'Error al cargar el formulario';
        if (error.status === 404) {
          mensajeError = 'Formulario no encontrado o inactivo';
        } else if (error.status === 0) {
          mensajeError = 'Error de conexión. Verifica que el backend esté corriendo';
        } else if (error.error?.error) {
          mensajeError = error.error.error;
        }
        
        this.mostrarMensaje(mensajeError, 'error');
        this.loading.set(false);
      }
    });
  }

  // ==================== BÚSQUEDA POR CÉDULA ====================
  
  onCedulaInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    // Permitir solo números y limitar a 10 dígitos
    let value = input.value.replace(/\D/g, '').substring(0, 10);
    this.cedula.set(value);
    
    // Actualizar el valor del input para reflejar el cambio
    input.value = value;
  }
  
  onCedulaKeypress(event: KeyboardEvent): void {
    // Permitir Enter para buscar
    if (event.key === 'Enter') {
      event.preventDefault();
      if (this.cedula().length === 10) {
        this.buscarPorCedula();
      }
      return;
    }
    
    // Permitir solo números
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      event.preventDefault();
    }
  }
  
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
      next: (response: any) => {
        console.log('📋 Respuesta búsqueda cliente:', response);
        const estadoActual = this.estado();
        
        // El backend devuelve { cliente_encontrado: boolean, cliente: {...}, mensaje: string }
        if (response.cliente_encontrado && response.cliente) {
          const cliente = response.cliente;
          console.log('✅ Cliente encontrado:', cliente);
          
          this.clienteEncontrado.set(cliente);
          this.nombre.set(cliente.nombre || '');
          this.apellido.set(cliente.apellido || '');
          this.email.set(cliente.email || '');
          this.telefono.set(cliente.telefono || '');
          
          estadoActual.clienteEncontrado = true;
          estadoActual.datosCliente = cliente;
          this.mostrarMensaje(response.mensaje || 'Cliente encontrado: ' + cliente.nombre, 'success');
          
          // Validar datos automáticamente después de cargarlos
          setTimeout(() => {
            this.validarDatosPersonales();
          }, 100);
        } else {
          console.log('ℹ️ Cliente no encontrado');
          this.clienteEncontrado.set(null);
          estadoActual.clienteEncontrado = false;
          this.mostrarMensaje(response.mensaje || 'Cliente no encontrado. Ingresa tus datos.', 'info');
        }
        
        estadoActual.cedula = cedulaValue;
        estadoActual.paso = 'datos_encontrados';
        this.estado.set(estadoActual);
        this.loading.set(false);
        
        // Hacer scroll a la sección de datos después de un momento
        setTimeout(() => {
          const seccionDatos = document.getElementById('seccion-datos');
          if (seccionDatos) {
            seccionDatos.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 300);
      },
      error: (error) => {
        console.error('❌ Error buscando cliente:', error);
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
    
    console.log('🔍 Validando datos personales:');
    console.log('- Nombre:', nombreVal);
    console.log('- Apellido:', apellidoVal);
    console.log('- Email:', emailVal);
    console.log('- Teléfono:', telefonoVal);
    console.log('- Tipo verificación:', tipoVerif);
    
    let datosCompletos = false;
    
    if (tipoVerif === 'biometria_free' || tipoVerif === 'biometria_premium') {
      const emailValido = !!(emailVal && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal));
      datosCompletos = !!nombreVal && !!apellidoVal && emailValido;
      console.log('- Validación biometría:', datosCompletos);
    } else if (tipoVerif === 'sms_didit') {
      datosCompletos = !!nombreVal && !!apellidoVal && !!telefonoVal;
      console.log('- Validación SMS DIDIT:', datosCompletos);
    } else {
      // Para verificación tradicional: nombre + apellido + (email O teléfono)
      datosCompletos = !!nombreVal && !!apellidoVal && (!!emailVal || !!telefonoVal);
      console.log('- Validación tradicional:', datosCompletos);
    }
    
    console.log('✅ Datos completos:', datosCompletos);
    
    // IMPORTANTE: Crear un nuevo objeto para que Angular detecte el cambio
    const estadoActual = this.estado();
    const datosCompletosAntes = estadoActual.datosPersonalesCompletos;
    
    // Crear nuevo objeto de estado para forzar detección de cambios
    this.estado.set({
      ...estadoActual,
      datosPersonalesCompletos: datosCompletos
    });
    
    console.log('📊 Estado anterior datosPersonalesCompletos:', datosCompletosAntes);
    console.log('📊 Estado nuevo datosPersonalesCompletos:', datosCompletos);
    console.log('📊 Estado completo actualizado:', this.estado());
    
    // Si los datos acaban de completarse, mostrar consentimientos
    if (datosCompletos && !datosCompletosAntes) {
      console.log('✅ Datos personales completos, mostrando consentimientos...');
      setTimeout(() => {
        this.displayConsentimientos();
        // Scroll a consentimientos
        const seccionConsentimientos = document.getElementById('seccion-consentimientos');
        if (seccionConsentimientos) {
          console.log('📜 Haciendo scroll a consentimientos');
          seccionConsentimientos.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          console.error('❌ No se encontró la sección de consentimientos en el DOM');
          console.log('📋 Elementos disponibles:', document.querySelectorAll('[id^="seccion-"]'));
        }
      }, 300);
    }
    
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
  
  displayConsentimientos(): void {
    console.log('📋 Mostrando consentimientos del formulario');
    console.log('📋 Consentimientos formateados:', this.consentimientosFormateados());
    console.log('📋 Estado actual:', this.estado());
    console.log('📋 datosPersonalesCompletos:', this.estado().datosPersonalesCompletos);
    
    // Verificar si el elemento existe en el DOM
    setTimeout(() => {
      const seccionConsentimientos = document.getElementById('seccion-consentimientos');
      console.log('🔍 Elemento seccion-consentimientos encontrado:', seccionConsentimientos);
      
      if (!seccionConsentimientos) {
        console.error('❌ No se encontró la sección de consentimientos en el DOM');
        console.log('📋 Elementos disponibles:', Array.from(document.querySelectorAll('[id^="seccion-"]')).map(el => el.id));
        console.log('📋 Todos los elementos con clase seccion:', document.querySelectorAll('.seccion'));
      }
    }, 100);
    
    // La sección de consentimientos se muestra automáticamente cuando datosPersonalesCompletos es true
    // Los consentimientos ya están en consentimientosFormateados()
  }
  
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
      consentimientos_seleccionados: this.consentimientosSeleccionados().map(id => parseInt(id))
    };

    console.log('📤 Solicitando código/registro:', datos);

    this.formulariosService.registrarConsentimientos(
      this.token(),
      datos
    ).subscribe({
      next: (response: any) => {
        console.log('✅ Respuesta registro:', response);
        
        const estadoActual = this.estado();
        
        // Guardar token de verificación
        if (response.token_verificacion) {
          this.estado.set({
            ...estadoActual,
            tokenVerificacion: response.token_verificacion
          });
        }
        
        // Manejar según el tipo de verificación
        if (response.tipo_verificacion === 'biometria' || 
            estadoActual.tipoValidacion === 'biometria_free' || 
            estadoActual.tipoValidacion === 'biometria_premium') {
          // Verificación biométrica
          this.estado.set({
            ...estadoActual,
            verificacionBiometrica: true,
            tokenVerificacion: response.token_verificacion
          });
          
          this.mostrarMensaje(
            'Email enviado con enlace de verificación biométrica. Revisa tu correo.',
            'success'
          );
          
          // Iniciar verificación biométrica si hay URL
          if (response.verification_url && response.session_id) {
            this.sessionId.set(response.session_id);
            this.startPolling();
            
            setTimeout(() => {
              window.location.href = response.verification_url;
            }, 2000);
          }
        } else if (response.requiere_envio_manual || estadoActual.tipoValidacion === 'sms_didit') {
          // SMS DIDIT
          this.smsPasoActual.set('codigo');
          this.mostrarMensaje('Haz clic en "Enviar código SMS"', 'info');
        } else {
          // Verificación tradicional (WhatsApp/Email)
          this.estado.set({
            ...estadoActual,
            codigoEnviado: true,
            paso: 'codigo_enviado'
          });
          
          let mensaje = 'Código enviado';
          if (response.email?.success) mensaje += ' por Email';
          if (response.whatsapp?.success) mensaje += ' y WhatsApp';
          
          this.mostrarMensaje(mensaje, 'success');
        }
        
        this.loading.set(false);
      },
      error: (error) => {
        console.error('❌ Error registrando:', error);
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
        console.log('📋 Respuesta verificación código:', response);
        
        if (response.success) {
          const estadoActual = this.estado();
          
          // Actualizar estado según el tipo de verificación
          if (estadoActual.tipoValidacion === 'sms_didit') {
            this.smsPasoActual.set('exitoso');
          }
          
          // Marcar como verificado
          this.estado.set({
            ...estadoActual,
            codigoVerificado: true
          });
          
          // Completar consentimientos automáticamente
          this.completarConsentimientos();
        } else {
          this.mostrarMensaje(response.message || 'Código inválido', 'error');
          this.loading.set(false);
        }
      },
      error: (error) => {
        console.error('❌ Error verificando código:', error);
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
    
    // Preparar datos para enviar
    const datosEnvio = {
      cedula: this.cedula(),
      nombre: this.nombre(),
      apellido: this.apellido(),
      email: this.email() || undefined,
      telefono: this.telefono() || undefined,
      consentimientos_seleccionados: this.consentimientosSeleccionados().map(id => parseInt(id))
    };
    
    console.log('📝 Completando consentimientos:', datosEnvio);
    
    this.formulariosService.registrarConsentimientos(
      this.token(),
      datosEnvio
    ).subscribe({
      next: (response: any) => {
        console.log('✅ Respuesta completar consentimientos:', response);
        
        // Actualizar estado
        this.estado.set({
          ...estadoActual,
          consentimientosCompletados: true,
          paso: 'finalizado',
          documentosDisponibles: response.documentos || [],
          tokenVerificacion: response.token_verificacion || estadoActual.tokenVerificacion
        });
        
        this.mostrarMensaje('Consentimientos autorizados exitosamente', 'success');
        this.loading.set(false);
        
        // Scroll a finalización
        setTimeout(() => {
          const seccionFinal = document.getElementById('seccion-finalizacion');
          if (seccionFinal) {
            seccionFinal.scrollIntoView({ behavior: 'smooth' });
          }
        }, 500);
      },
      error: (error) => {
        console.error('❌ Error completando consentimientos:', error);
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
