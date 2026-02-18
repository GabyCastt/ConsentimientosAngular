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
  empresa: {
    id: number;
    nombre: string;
    logo?: string;
    slogan?: string;
  };
  consentimientos: Consentimiento[];
  tipo_validacion: 'sms_email' | 'biometria_free' | 'biometria_premium' | 'sms_didit';
}

export interface Consentimiento {
  id: number;
  tipo: string;
  descripcion: string;
  archivos?: ArchivoConsentimiento[];
}

export interface ArchivoConsentimiento {
  id: number;
  nombre: string;
  ruta: string;
  tipo: string;
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