import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormulariosService } from '../formularios.service';
import { DiditService } from '../../verificacion/didit/didit.service';
import { ConfigService } from '../../../core/services/config.service';
import { ClientesService } from '../../clientes/clientes.service';
import { 
  FormularioPublico, 
  DatosUsuario 
} from '../../../core/models/formulario.model';
import { Cliente } from '../../../core/models/cliente.model';
import { SmsDiditService } from '../../verificacion/sms-didit/sms-didit.service';

type Seccion = 'busqueda' | 'datos' | 'consentimientos' | 'verificacion' | 'completado';
type TipoVerificacion = 'sms_email' | 'biometria_free' | 'biometria_premium' | 'sms_didit';

interface Estado {
  paso: string;
  cedula: string;
  clienteEncontrado: boolean;
  clienteExisteEnBD?: boolean; // Indica si el cliente ya existe en la BD
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
    
    console.log('[INFO] Formateando consentimientos...');
    console.log('[INFO] Formulario completo:', form);
    
    // Si ya vienen consentimientos formateados, usarlos
    if (form.consentimientos && form.consentimientos.length > 0) {
      console.log('[OK] Usando consentimientos pre-formateados:', form.consentimientos);
      return form.consentimientos;
    }
    
    // Si no, construirlos desde tipos_consentimientos y archivos_disponibles
    if (form.tipos_consentimientos && form.archivos_disponibles) {
      console.log('[BUILD] Construyendo consentimientos desde tipos y archivos');
      console.log('[NOTE] Tipos:', form.tipos_consentimientos);
      console.log('[FOLDER] Archivos disponibles:', form.archivos_disponibles);
      
      return form.tipos_consentimientos.map((tipoKey, index) => {
        const archivos = form.archivos_disponibles?.[tipoKey] || [];
        
        console.log(`[FILE] Tipo "${tipoKey}" tiene ${archivos.length} archivos:`, archivos);
        
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
          id: tipoKey, // CORREGIDO: Usar el tipo como ID (datos_personales, imagen, etc)
          tipo: nombresTipos[tipoKey] || tipoKey,
          descripcion: descripcionesTipos[tipoKey] || '',
          archivos: archivos
        };
      });
    }
    
    console.log('WARNING: No hay consentimientos disponibles');
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
    private smsDiditService: SmsDiditService,
    private clientesService: ClientesService,
    public config: ConfigService
  ) {}

  ngOnInit(): void {
    // Leer token desde query params (?token=xxx) o route params (/formulario/:token)
    const tokenFromQuery = this.route.snapshot.queryParams['token'];
    const tokenFromRoute = this.route.snapshot.params['token'];
    
    const tokenValue = tokenFromQuery || tokenFromRoute;
    
    console.log('[TOKEN] Token desde query params:', tokenFromQuery);
    console.log('[TOKEN] Token desde route params:', tokenFromRoute);
    console.log('[TOKEN] Token final:', tokenValue);
    
    if (!tokenValue) {
      console.error('[ERROR] No se encontró token en la URL');
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
      console.error('[ERROR] No hay token para cargar el formulario');
      this.mostrarMensaje('Error: No se encontró el token del formulario', 'error');
      this.loading.set(false);
      return;
    }
    
    console.log(' Cargando formulario con token:', tokenValue);
    this.loading.set(true);
    
    this.formulariosService.getFormularioPublico(tokenValue).subscribe({
      next: (response: any) => {
        console.log(' Formulario cargado exitosamente:', response);
        
        // El backend devuelve { formulario: {...} }
        const data = response.formulario || response;
        
        console.log(' Datos del formulario:', data);
        console.log(' Tipos de consentimientos:', data.tipos_consentimientos);
        console.log(' Archivos disponibles:', data.archivos_disponibles);
        
        this.formulario.set(data);
        
        // Actualizar estado con tipo de validación
        this.estado.set({
          ...this.estado(),
          tipoValidacion: (data.tipo_validacion as TipoVerificacion) || 'sms_email'
        });
        
        this.loading.set(false);
      },
      error: (error) => {
        console.error(' Error cargando formulario:', error);
        console.error(' Status:', error.status);
        console.error(' Error completo:', error.error);
        
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
    
    // Validar longitud
    if (!cedulaValue || cedulaValue.length !== 10) {
      this.mostrarMensaje('Cédula debe tener exactamente 10 dígitos', 'error');
      return;
    }

    // Validar que solo contenga números
    if (!/^\d{10}$/.test(cedulaValue)) {
      this.mostrarMensaje('Cédula debe contener solo números', 'error');
      return;
    }

    // Validar formato completo (pero permitir continuar si falla)
    if (!this.config.isValidCedula(cedulaValue)) {
      console.log('[INFO] Cédula no pasa validación completa, pero continuando...');
      this.mostrarMensaje('Advertencia: La cédula ingresada podría no ser válida', 'info');
      // Continuar de todas formas
    }

    this.limpiarDatosFormulario();
    this.loading.set(true);
    
    // Primero verificar si el cliente ya completó este formulario
    this.formulariosService.buscarClientePorCedula(this.token(), cedulaValue).subscribe({
      next: (response: any) => {
        console.log('[OK] Respuesta buscar cliente en formulario:', response);
        
        // Verificar ambas variantes del campo (con guion bajo y camelCase)
        const yaCompleto = response.ya_completado || response.yaCompletado || response.ya_completo;
        
        if (response.cliente_encontrado && yaCompleto) {
          // Cliente ya completó este formulario - BLOQUEAR COMPLETAMENTE
          console.log('[ERROR] Cliente ya completó este formulario - BLOQUEANDO FLUJO');
          
          this.loading.set(false);
          
          // Mostrar mensaje de error principal
          this.mostrarMensaje(
            response.mensaje || 'Ya has completado este formulario anteriormente. No puedes registrar respuestas duplicadas.',
            'error'
          );
          
          // Opcional: Mostrar información adicional después de 3 segundos
          if (response.fecha_registro) {
            setTimeout(() => {
              this.mostrarMensaje(
                `Registro anterior: ${new Date(response.fecha_registro).toLocaleString('es-ES')}`,
                'info'
              );
            }, 3000);
          }
          
          // IMPORTANTE: Marcar el estado como ya completado para bloquear la UI
          const estadoActual = this.estado();
          estadoActual.yaCompletado = true;
          estadoActual.cedula = cedulaValue;
          estadoActual.paso = 'ya_completado'; // Estado especial para bloquear
          this.estado.set(estadoActual);
          
          // NO continuar con el flujo
          return;
        }
        
        // Cliente no ha completado el formulario, continuar con la búsqueda normal
        console.log('[INFO] Cliente no ha completado el formulario, continuando...');
        this.buscarClienteEnBD(cedulaValue);
      },
      error: (error) => {
        console.error('[ERROR] Error verificando cliente en formulario:', error);
        // Si falla la verificación, continuar con el flujo normal
        this.buscarClienteEnBD(cedulaValue);
      }
    });
  }

  private buscarClienteEnBD(cedula: string): void {
    // Buscar en la base de datos local
    this.clientesService.consultarCedula(cedula).subscribe({
      next: (response: any) => {
        console.log('[OK] Respuesta consulta cédula BD local:', response);
        const estadoActual = this.estado();
        
        if (response.encontrado && response.nombre) {
          // Cliente encontrado en BD local
          console.log('[OK] Cliente encontrado en BD local');
          
          this.nombre.set(response.nombre || '');
          this.apellido.set(response.apellido || '');
          this.email.set(response.email || '');
          this.telefono.set(response.telefono || '');
          
          estadoActual.clienteEncontrado = true;
          estadoActual.clienteExisteEnBD = true;
          estadoActual.datosCliente = response;
          this.mostrarMensaje('¡Bienvenido de nuevo! Tus datos han sido cargados', 'success');
          
          setTimeout(() => {
            this.validarDatosPersonales();
          }, 100);
        } else {
          // No encontrado en BD local, buscar en API externa (Registro Civil)
          console.log('[INFO] Cliente no encontrado en BD, consultando Registro Civil...');
          this.consultarRegistroCivil(cedula);
          return;
        }
        
        estadoActual.cedula = cedula;
        estadoActual.paso = 'datos_encontrados';
        this.estado.set(estadoActual);
        this.loading.set(false);
        
        setTimeout(() => {
          const seccionDatos = document.getElementById('seccion-datos');
          if (seccionDatos) {
            seccionDatos.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 300);
      },
      error: (error) => {
        // 404 es normal cuando el cliente no existe
        if (error.status === 404) {
          console.log('[INFO] Cliente no encontrado en BD (404), consultando Registro Civil...');
        } else {
          console.error('[ERROR] Error consultando BD local:', error);
        }
        // Intentar con Registro Civil
        this.consultarRegistroCivil(cedula);
      }
    });
  }

  private consultarRegistroCivil(cedula: string): void {
    const empresaId = this.formulario()?.empresa_id;
    this.formulariosService.consultarCedulaExterna(cedula, empresaId).subscribe({
      next: (response: any) => {
        console.log('[OK] Respuesta Registro Civil:', response);
        const estadoActual = this.estado();
        
        if (response.encontrado && response.nombre) {
          // Datos encontrados en Registro Civil
          console.log('[OK] Datos encontrados en Registro Civil');
          
          this.nombre.set(response.nombre || '');
          this.apellido.set(response.apellido || '');
          
          estadoActual.clienteEncontrado = true;
          estadoActual.clienteExisteEnBD = false; // No existe en BD, se creará después
          estadoActual.datosCliente = response;
          this.mostrarMensaje('¡Bienvenido! Hemos encontrado tus datos', 'success');
          
          setTimeout(() => {
            this.validarDatosPersonales();
          }, 100);
        } else {
          console.log('[INFO] Datos no encontrados en Registro Civil');
          estadoActual.clienteEncontrado = false;
          estadoActual.clienteExisteEnBD = false;
          this.mostrarMensaje('¡Bienvenido! Por favor completa tus datos para continuar', 'info');
        }
        
        estadoActual.cedula = cedula;
        estadoActual.paso = 'datos_encontrados';
        this.estado.set(estadoActual);
        this.loading.set(false);
        
        setTimeout(() => {
          const seccionDatos = document.getElementById('seccion-datos');
          if (seccionDatos) {
            seccionDatos.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 300);
      },
      error: (error) => {
        // 404 es normal cuando no existe en Registro Civil
        if (error.status === 404) {
          console.log('[INFO] Cliente no encontrado en Registro Civil (404), permitiendo ingreso manual');
        } else {
          console.error('[ERROR] Error consultando Registro Civil:', error);
        }
        
        // Permitir ingreso manual con mensaje amigable
        this.mostrarMensaje('¡Bienvenido! Por favor completa tus datos para continuar', 'info');
        
        const estadoActual = this.estado();
        estadoActual.cedula = cedula;
        estadoActual.clienteEncontrado = false;
        estadoActual.clienteExisteEnBD = false;
        estadoActual.paso = 'datos_encontrados';
        this.estado.set(estadoActual);
        this.loading.set(false);
        
        setTimeout(() => {
          const seccionDatos = document.getElementById('seccion-datos');
          if (seccionDatos) {
            seccionDatos.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 300);
      }
    });
  }

  limpiarDatosFormulario(): void {
    console.log('[CLEAN] Limpiando datos del formulario anterior');
    
    // Limpiar datos personales
    this.nombre.set('');
    this.apellido.set('');
    this.email.set('');
    this.telefono.set('');
    this.clienteEncontrado.set(null);
    
    // Limpiar consentimientos
    this.consentimientosSeleccionados.set([]);
    
    // Limpiar verificación
    this.codigoVerificacion.set('');
    this.mensajeVerificacion.set('');
    this.sessionId.set(null);
    this.smsAttempts.set(0);
    this.smsPasoActual.set('telefono');
    
    // Resetear estado
    this.estado.set({
      paso: 'inicial',
      cedula: this.cedula(), // Mantener la cédula actual
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
      tipoValidacion: this.estado().tipoValidacion, // Mantener tipo de validación
      sesionDidit: null,
      verificacionBiometrica: false
    });
    
    // Detener polling si existe
    this.stopPolling();
  }

  buscarOtraCedula(): void {
    console.log('[RELOAD] Iniciando búsqueda de otra cédula');
    
    // Limpiar completamente incluyendo la cédula
    this.cedula.set('');
    this.limpiarDatosFormulario();
    
    // Hacer scroll a la sección de búsqueda
    setTimeout(() => {
      const seccionBusqueda = document.getElementById('seccion-busqueda');
      if (seccionBusqueda) {
        seccionBusqueda.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      
      // Enfocar el input de cédula
      const inputCedula = document.querySelector('.cedula-input') as HTMLInputElement;
      if (inputCedula) {
        inputCedula.focus();
      }
    }, 300);
  }

  // ==================== VALIDACIÓN DE DATOS ====================
  
  onTelefonoInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    // Permitir solo números
    let value = input.value.replace(/\D/g, '');
    this.telefono.set(value);
    input.value = value;
    this.validarDatosPersonales();
  }

  onEmailInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.email.set(input.value.trim());
    this.validarDatosPersonales();
  }

  validarEmail(email: string): boolean {
    if (!email) return false;
    // Validar formato: debe tener @ y al menos un punto después del @
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  validarTelefono(telefono: string): boolean {
    if (!telefono) return false;
    // Validar que solo contenga números y tenga al menos 7 dígitos
    return /^\d{7,}$/.test(telefono);
  }

  validarDatosPersonales(): boolean {
    const nombreVal = this.nombre();
    const apellidoVal = this.apellido();
    const emailVal = this.email();
    const telefonoVal = this.telefono();
    const tipoVerif = this.estado().tipoValidacion;
    
    console.log(' Validando datos personales:');
    console.log('- Nombre:', nombreVal);
    console.log('- Apellido:', apellidoVal);
    console.log('- Email:', emailVal);
    console.log('- Teléfono:', telefonoVal);
    console.log('- Tipo verificación:', tipoVerif);
    
    let datosCompletos = false;
    
    if (tipoVerif === 'biometria_free' || tipoVerif === 'biometria_premium') {
      // Para biometría: nombre + apellido + email VÁLIDO
      const emailValido = this.validarEmail(emailVal);
      datosCompletos = !!nombreVal && !!apellidoVal && emailValido;
      console.log('- Email válido:', emailValido);
      console.log('- Validación biometría:', datosCompletos);
    } else if (tipoVerif === 'sms_didit') {
      // Para SMS: nombre + apellido + teléfono VÁLIDO
      const telefonoValido = this.validarTelefono(telefonoVal);
      datosCompletos = !!nombreVal && !!apellidoVal && telefonoValido;
      console.log('- Teléfono válido:', telefonoValido);
      console.log('- Validación SMS DIDIT:', datosCompletos);
    } else {
      // Para verificación tradicional: nombre + apellido + (email VÁLIDO O teléfono VÁLIDO)
      const emailValido = this.validarEmail(emailVal);
      const telefonoValido = this.validarTelefono(telefonoVal);
      datosCompletos = !!nombreVal && !!apellidoVal && (emailValido || telefonoValido);
      console.log('- Email válido:', emailValido);
      console.log('- Teléfono válido:', telefonoValido);
      console.log('- Validación tradicional:', datosCompletos);
    }
    
    console.log(' Datos completos:', datosCompletos);
    
    // IMPORTANTE: Crear un nuevo objeto para que Angular detecte el cambio
    const estadoActual = this.estado();
    const datosCompletosAntes = estadoActual.datosPersonalesCompletos;
    
    // Crear nuevo objeto de estado para forzar detección de cambios
    this.estado.set({
      ...estadoActual,
      datosPersonalesCompletos: datosCompletos
    });
    
    console.log(' Estado anterior datosPersonalesCompletos:', datosCompletosAntes);
    console.log(' Estado nuevo datosPersonalesCompletos:', datosCompletos);
    console.log(' Estado completo actualizado:', this.estado());
    
    // Si los datos acaban de completarse, mostrar consentimientos
    if (datosCompletos && !datosCompletosAntes) {
      console.log(' Datos personales completos, mostrando consentimientos...');
      setTimeout(() => {
        this.displayConsentimientos();
        // Scroll a consentimientos
        const seccionConsentimientos = document.getElementById('seccion-consentimientos');
        if (seccionConsentimientos) {
          console.log(' Haciendo scroll a consentimientos');
          seccionConsentimientos.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          console.error(' No se encontró la sección de consentimientos en el DOM');
          console.log(' Elementos disponibles:', document.querySelectorAll('[id^="seccion-"]'));
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
    console.log(' Mostrando consentimientos del formulario');
    console.log(' Consentimientos formateados:', this.consentimientosFormateados());
    console.log(' Estado actual:', this.estado());
    console.log(' datosPersonalesCompletos:', this.estado().datosPersonalesCompletos);
    
    // Verificar si el elemento existe en el DOM
    setTimeout(() => {
      const seccionConsentimientos = document.getElementById('seccion-consentimientos');
      console.log(' Elemento seccion-consentimientos encontrado:', seccionConsentimientos);
      
      if (!seccionConsentimientos) {
        console.error(' No se encontró la sección de consentimientos en el DOM');
        console.log(' Elementos disponibles:', Array.from(document.querySelectorAll('[id^="seccion-"]')).map(el => el.id));
        console.log(' Todos los elementos con clase seccion:', document.querySelectorAll('.seccion'));
      }
    }, 100);
    
    // La sección de consentimientos se muestra automáticamente cuando datosPersonalesCompletos es true
    // Los consentimientos ya están en consentimientosFormateados()
  }
  
  toggleConsentimiento(tipo: string): void {
    const selected = this.consentimientosSeleccionados();
    const index = selected.indexOf(tipo);
    
    console.log('[RELOAD] Toggle consentimiento:', tipo, 'Seleccionados actuales:', selected);
    
    if (index > -1) {
      this.consentimientosSeleccionados.set(
        selected.filter(t => t !== tipo)
      );
    } else {
      this.consentimientosSeleccionados.set([...selected, tipo]);
    }
    
    console.log('[OK] Consentimientos después del toggle:', this.consentimientosSeleccionados());
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

    const estadoActual = this.estado();

    // Preparar datos para el registro
    // El backend automáticamente crea/actualiza el cliente
    const datos: DatosUsuario = {
      cedula: this.cedula(),
      nombre: this.nombre(),
      apellido: this.apellido(),
      email: this.email() || undefined,
      telefono: this.telefono() || undefined,
      consentimientos_seleccionados: this.consentimientosSeleccionados().map(id => parseInt(id))
    };

    console.log('[SEND] Solicitando código/registro:', datos);
    console.log('[TYPE] Tipo de validación:', estadoActual.tipoValidacion);

    this.formulariosService.registrarRespuesta(
      this.token(),
      datos as any
    ).subscribe({
      next: (response: any) => {
        console.log('[RECEIVE] Respuesta registro completa:', response);
        console.log('[SEARCH] Tipo de verificación:', response.tipo_verificacion);
        console.log('[TOKEN] Token de verificación recibido:', response.token_verificacion);
        
        const estadoActual = this.estado();
        
        // IMPORTANTE: Guardar token de verificación SIEMPRE
        const nuevoEstado = {
          ...estadoActual,
          tokenVerificacion: response.token_verificacion || estadoActual.tokenVerificacion
        };
        
        // Manejar según el tipo de verificación
        if (response.tipo_verificacion === 'biometria' || 
            estadoActual.tipoValidacion === 'biometria_free' || 
            estadoActual.tipoValidacion === 'biometria_premium') {
          
          console.log('[VERIFY] Iniciando flujo de verificación biométrica');
          console.log('[LINK] verification_url:', response.verification_url);
          console.log('[ID] session_id:', response.session_id);
          
          // Verificación biométrica
          nuevoEstado.verificacionBiometrica = true;
          this.estado.set(nuevoEstado);
          
          this.mostrarMensaje(
            'Email enviado con enlace de verificación biométrica. Revisa tu correo.',
            'success'
          );
          
          // Iniciar verificación biométrica si hay URL
          if (response.verification_url && response.session_id) {
            console.log('[OK] Datos completos para DIDIT, iniciando redirección...');
            this.sessionId.set(response.session_id);
            this.startPolling();
            
            setTimeout(() => {
              console.log('[START] Redirigiendo a DIDIT:', response.verification_url);
              window.location.href = response.verification_url;
            }, 2000);
          } else {
            console.error('[ERROR] Faltan datos para iniciar DIDIT');
            console.error('   verification_url:', response.verification_url);
            console.error('   session_id:', response.session_id);
            this.mostrarMensaje('Error: No se pudo iniciar verificación biométrica', 'error');
          }
        } else if (response.requiere_envio_manual || estadoActual.tipoValidacion === 'sms_didit') {
          // SMS DIDIT - Enviar automáticamente
          console.log('[SMS] Flujo SMS DIDIT - Enviando código automáticamente');
          console.log('[SMS] Token guardado:', nuevoEstado.tokenVerificacion);
          this.estado.set(nuevoEstado);
          
          // Enviar código SMS automáticamente
          this.enviarCodigoSms();
        } else {
          // Verificación tradicional (WhatsApp/Email)
          console.log('[EMAIL] Flujo tradicional WhatsApp/Email');
          console.log('[EMAIL] Token guardado:', nuevoEstado.tokenVerificacion);
          
          nuevoEstado.codigoEnviado = true;
          nuevoEstado.paso = 'codigo_enviado';
          this.estado.set(nuevoEstado);
          
          let mensaje = 'Código enviado';
          if (response.email?.success) mensaje += ' por Email';
          if (response.whatsapp?.success) mensaje += ' y WhatsApp';
          
          this.mostrarMensaje(mensaje, 'success');
        }
        
        this.loading.set(false);
      },
      error: (error: any) => {
        console.error('[ERROR] Error registrando:', error);
        console.error('[DATA] Status:', error.status);
        console.error('[NOTE] Error completo:', error.error);
        this.mostrarMensaje(error.error?.message || 'Error al registrar', 'error');
        this.loading.set(false);
      }
    });
  }

  verificarCodigo(): void {
    const estadoActual = this.estado();
    
    // Si es SMS DIDIT, usar el método específico
    if (estadoActual.tipoValidacion === 'sms_didit') {
      console.log('[SMS] Detectado tipo SMS DIDIT, usando verificación específica');
      this.verificarCodigoSms();
      return;
    }
    
    // Para otros tipos de verificación (email/whatsapp)
    const codigo = this.codigoVerificacion();
    
    if (codigo.length !== 6) {
      this.mostrarMensaje('Código debe tener 6 dígitos', 'error');
      return;
    }

    const tokenVerificacion = estadoActual.tokenVerificacion;
    
    console.log('[SEARCH] Verificando código:', {
      token_verificacion: tokenVerificacion,
      codigo: codigo
    });

    if (!tokenVerificacion) {
      this.mostrarMensaje('Token de verificación no encontrado. Solicita el código primero.', 'error');
      return;
    }

    this.loading.set(true);
    
    // PASO 1: Verificar código (igual que la maqueta)
    this.formulariosService.verificarCodigo({
      token_verificacion: tokenVerificacion,
      codigo: codigo
    }).subscribe({
      next: (response) => {
        console.log('[OK] Código verificado correctamente:', response);
        
        // CORREGIDO: El backend responde con message, no con success
        if (response.message || response.respuesta) {
          // Actualizar estado
          this.estado.set({
            ...estadoActual,
            codigoVerificado: true
          });
          
          this.mostrarMensaje('Código verificado correctamente', 'success');
          
          // PASO 2: Completar consentimientos inmediatamente (igual que la maqueta)
          console.log('[OK] Completando consentimientos automáticamente...');
          setTimeout(() => {
            this.completarConsentimientos();
          }, 300);
        } else {
          this.mostrarMensaje('Código inválido', 'error');
          this.loading.set(false);
        }
      },
      error: (error) => {
        console.error('[ERROR] Error verificando código:', error);
        
        let mensaje = 'Código inválido';
        
        if (error.error?.error) {
          const errorMsg = error.error.error;
          
          // Si el código ya fue verificado, completar el proceso
          if (errorMsg.includes('ya ha sido verificado') || errorMsg.includes('ya fue verificado')) {
            console.log('[INFO] Código ya verificado anteriormente, completando proceso...');
            
            this.estado.set({
              ...estadoActual,
              codigoVerificado: true
            });
            
            this.mostrarMensaje('Código ya verificado, completando proceso...', 'success');
            
            setTimeout(() => {
              this.completarConsentimientos();
            }, 300);
            return;
          } else if (errorMsg.includes('expirado')) {
            mensaje = 'El código ha expirado. Solicita un nuevo código.';
            this.codigoVerificacion.set('');
          } else if (errorMsg.includes('inválido') || errorMsg.includes('incorrecto')) {
            mensaje = 'Código incorrecto. Verifica e intenta nuevamente.';
          } else {
            mensaje = errorMsg;
          }
        } else if (error.error?.message) {
          mensaje = error.error.message;
        }
        
        this.mostrarMensaje(mensaje, 'error');
        this.loading.set(false);
      }
    });
  }

  reenviarCodigoSms(): void {
    if (this.smsAttempts() >= this.smsMaxAttempts()) {
      this.mostrarMensaje('Has alcanzado el máximo de intentos', 'error');
      return;
    }

    const estadoActual = this.estado();
    
    if (!estadoActual.tokenVerificacion) {
      this.mostrarMensaje('Error: No hay token de verificación', 'error');
      return;
    }
    
    if (!this.telefono()) {
      this.mostrarMensaje('Ingresa tu número de teléfono', 'error');
      return;
    }

    this.loading.set(true);
    this.smsAttempts.set(this.smsAttempts() + 1);

    const datos = {
      telefono: this.telefono(),
      token_verificacion: estadoActual.tokenVerificacion,
      nombre: this.nombre(),
      apellido: this.apellido(),
      cedula: this.cedula()
    };

    console.log('[SMS] Reenviando código SMS:', datos);

    this.smsDiditService.enviarCodigo(datos).subscribe({
      next: (response) => {
        if (response.success) {
          this.mostrarMensaje('Código reenviado exitosamente', 'success');
          this.codigoVerificacion.set('');
        } else {
          this.mostrarMensaje(response.message || 'Error al reenviar código', 'error');
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
    
    console.log('[OK] Completando consentimientos con token:', estadoActual.tokenVerificacion);
    
    if (!estadoActual.tokenVerificacion) {
      console.error('[ERROR] No hay token de verificación');
      this.mostrarMensaje('Error: No hay token de verificación', 'error');
      this.loading.set(false);
      return;
    }
    
    // Obtener tipos de consentimientos seleccionados (igual que la maqueta)
    const tiposAceptados = this.consentimientosSeleccionados();
    
    if (tiposAceptados.length === 0) {
      console.error('[ERROR] No hay consentimientos seleccionados');
      this.mostrarMensaje('Error: Debes seleccionar al menos un consentimiento', 'error');
      this.loading.set(false);
      return;
    }
    
    // Preparar datos igual que la maqueta
    const datosCompletar = {
      token_verificacion: estadoActual.tokenVerificacion,
      tipos_aceptados: tiposAceptados
    };
    
    console.log('[SEND] Enviando solicitud de completar consentimientos:', datosCompletar);
    
    this.formulariosService.completarConsentimientos(datosCompletar).subscribe({
      next: (response: any) => {
        console.log('[OK] Respuesta completar consentimientos:', response);
        
        // CORREGIDO: El backend responde con message y pdf_url, no con success
        if (response.message && response.pdf_url) {
          // Actualizar estado
          this.estado.set({
            ...estadoActual,
            consentimientosCompletados: true,
            paso: 'finalizado',
            documentosDisponibles: response.documentos || []
          });
          
          this.mostrarMensaje('¡Consentimientos autorizados exitosamente!', 'success');
          this.loading.set(false);
          
          // Scroll a finalización
          setTimeout(() => {
            const seccionFinal = document.getElementById('seccion-finalizacion');
            if (seccionFinal) {
              seccionFinal.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
              console.error('[ERROR] No se encontró seccion-finalizacion');
            }
          }, 500);
        } else {
          console.error('[ERROR] Respuesta sin datos esperados:', response);
          this.mostrarMensaje(response.message || 'Error al completar consentimientos', 'error');
          this.loading.set(false);
        }
      },
      error: (error: any) => {
        console.error('[ERROR] Error completando consentimientos:', error);
        console.error('[DATA] Status:', error.status);
        console.error('[NOTE] Error completo:', error.error);
        
        let mensaje = 'Error al completar consentimientos';
        if (error.error?.message) {
          mensaje = error.error.message;
        } else if (error.error?.error) {
          mensaje = error.error.error;
        }
        
        this.mostrarMensaje(mensaje, 'error');
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
    console.log('[SEARCH] Verificando callback de DIDIT');
    console.log('[ENDPOINT] URL actual:', window.location.href);
    
    const urlParams = new URLSearchParams(window.location.search);
    
    // [OK] CORREGIDO: Buscar parámetros correctos
    const token = urlParams.get('token');
    const from = urlParams.get('from');
    
    console.log('[INFO] Parámetros detectados:', { token, from });
    
    if (from === 'didit' && token) {
      console.log('[OK] Callback de DIDIT detectado, procesando...');
      this.manejarRegresoDeDidit(token);
    } else {
      console.log('INFO: No es un callback de DIDIT');
    }
  }

  manejarRegresoDeDidit(token: string): void {
    console.log('[TARGET] Procesando regreso de DIDIT con token:', token);
    
    this.loading.set(true);
    
    // Verificar estado en el backend
    const endpoint = this.config.buildEndpoint(
      this.config.endpoints.didit.status,
      { token }
    );
    
    this.diditService['api'].get(endpoint).subscribe({
      next: (response: any) => {
        console.log('[DATA] Estado de verificación:', response);
        
        if (response.verificado || response.verified) {
          console.log('[OK] Verificación biométrica exitosa');
          
          const estadoActual = this.estado();
          estadoActual.tokenVerificacion = token;
          estadoActual.verificacionBiometrica = true;
          estadoActual.codigoVerificado = true;
          this.estado.set(estadoActual);
          
          this.mostrarMensaje('Verificación biométrica completada exitosamente', 'success');
          
          // Completar consentimientos automáticamente
          setTimeout(() => {
            this.completarConsentimientos();
          }, 1000);
        } else {
          console.error('[ERROR] Verificación biométrica fallida');
          this.mostrarMensaje('Verificación biométrica fallida. Por favor, intenta nuevamente.', 'error');
          this.loading.set(false);
        }
      },
      error: (error) => {
        console.error('[ERROR] Error verificando estado DIDIT:', error);
        this.mostrarMensaje('Error al verificar estado. Por favor, intenta nuevamente.', 'error');
        this.loading.set(false);
      }
    });
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
  enviarCodigoSms(): void {
  const estadoActual = this.estado();
  
  if (!estadoActual.tokenVerificacion) {
    this.mostrarMensaje('Error: No hay token de verificación', 'error');
    return;
  }
  
  if (!this.telefono()) {
    this.mostrarMensaje('Ingresa tu número de teléfono', 'error');
    return;
  }
  
  this.loading.set(true);
  
  const datos = {
    telefono: this.telefono(),
    token_verificacion: estadoActual.tokenVerificacion,
    nombre: this.nombre(),
    apellido: this.apellido(),
    cedula: this.cedula()
  };
  
  console.log('[SMS] Enviando código SMS:', datos);
  
  this.smsDiditService.enviarCodigo(datos).subscribe({
    next: (response) => {
      console.log('[OK] Código SMS enviado:', response);
      
      if (response.success) {
        this.smsPasoActual.set('codigo');
        this.mostrarMensaje(response.message || 'Código enviado por SMS', 'success');
      } else {
        this.mostrarMensaje(response.message || 'Error al enviar código', 'error');
      }
      
      this.loading.set(false);
    },
    error: (error) => {
      console.error('[ERROR] Error enviando código SMS:', error);
      this.mostrarMensaje(error.error?.message || 'Error al enviar código SMS', 'error');
      this.loading.set(false);
    }
  });
  }
  verificarCodigoSms(): void {
  const codigo = this.codigoVerificacion();
  const estadoActual = this.estado();
  
  if (codigo.length !== 6) {
    this.mostrarMensaje('Código debe tener 6 dígitos', 'error');
    return;
  }
  
  if (!estadoActual.tokenVerificacion) {
    this.mostrarMensaje('Error: No hay token de verificación', 'error');
    return;
  }
  
  this.loading.set(true);
  
  const datos = {
    telefono: this.telefono(),
    codigo: codigo,
    token_verificacion: estadoActual.tokenVerificacion
  };
  
  console.log('[SEARCH] Verificando código SMS:', datos);
  
  this.smsDiditService.verificarCodigo(datos).subscribe({
    next: (response) => {
      console.log('[OK] Respuesta verificación SMS:', response);
      
      if (response.success) {
        this.smsPasoActual.set('exitoso');
        this.estado.set({
          ...estadoActual,
          codigoVerificado: true
        });
        
        this.mostrarMensaje('Código verificado exitosamente', 'success');
        
        // Completar consentimientos automáticamente
        setTimeout(() => {
          this.completarConsentimientos();
        }, 1000);
      } else {
        this.mostrarMensaje(response.message || 'Código inválido', 'error');
        this.loading.set(false);
      }
    },
    error: (error) => {
      console.error('[ERROR] Error verificando código SMS:', error);
      this.mostrarMensaje(error.error?.message || 'Código inválido', 'error');
      this.loading.set(false);
    }
  });
  }
}
