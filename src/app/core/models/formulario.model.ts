export interface Formulario {
  id: number;
  nombre: string;
  descripcion?: string;
  empresa_id: number;
  estado: 'activo' | 'inactivo';
  token: string;
  tipo_verificacion: 'email_whatsapp' | 'biometrics' | 'sms_didit';
  created_at: string;
}

export interface FormularioPublico {
  id: number;
  nombre: string;
  descripcion?: string;
  empresa?: {
    id: number;
    nombre: string;
    logo?: string;
    slogan?: string;
  };
  empresa_nombre?: string;
  empresa_logo?: string;
  empresa_slogan?: string;
  tipos_consentimientos?: string[];
  archivos_disponibles?: {
    [key: string]: ArchivoConsentimiento[];
  };
  consentimientos?: Consentimiento[];
  tipo_validacion: 'sms_email' | 'biometria_free' | 'biometria_premium' | 'sms_didit';
  token_publico?: string;
}

export interface Consentimiento {
  id: number;
  tipo: string;
  descripcion: string;
  archivos?: ArchivoConsentimiento[];
}

export interface ArchivoConsentimiento {
  id?: number;
  nombre: string;
  ruta?: string;
  url?: string;
  tipo?: string;
  descripcion?: string;
  obligatorio?: boolean;
}

export interface DatosUsuario {
  cedula: string;
  nombre: string;
  apellido: string;
  email?: string;
  telefono?: string;
  consentimientos_seleccionados: number[];
}

export interface RespuestaVerificacion {
  success: boolean;
  message: string;
  tipo_verificacion: string;
  verification_url?: string;
  session_id?: string;
}