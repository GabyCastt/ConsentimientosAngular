export interface Cliente {
  id: number;
  cedula: string;
  nombre: string;
  apellido?: string;
  email?: string;
  telefono?: string;
  empresa_id: number;
  created_at: string;
  updated_at?: string;
  
  // Campos adicionales del backend
  consentimientos?: string[]; // Array de tipos de consentimientos consolidados
  total_formularios?: number;
  tiene_autorizaciones?: boolean;
}

export interface ClienteDetalle extends Cliente {
  formularios_autorizados?: FormularioCliente[];
  consentimientos_consolidados?: string[];
  estadisticas?: {
    total_formularios: number;
    total_consentimientos_manuales: number;
    total_consentimientos_unicos: number;
    formularios_con_pdf: number;
  };
}

export interface FormularioCliente {
  id: number;
  formulario_id: number;
  formulario_nombre: string;
  respuesta_id: number;
  fecha_completado: string;
  tipos_aceptados: string[];
  tipos_aceptados_formateados: string[];
  tiene_pdf: boolean;
  verificado: boolean;
}

export interface ConsentimientoCliente {
  id: number;
  tipo: string;
  estado: 'aceptado' | 'rechazado' | 'pendiente';
  fecha: string;
}

export interface CreateClienteDto {
  cedula: string;
  nombre: string;
  apellido?: string;
  email?: string;
  telefono?: string;
  empresa_id?: number;
}