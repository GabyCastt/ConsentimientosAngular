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
}

export interface ClienteDetalle extends Cliente {
  formularios?: FormularioCliente[];
  consentimientos?: ConsentimientoCliente[];
  total_formularios?: number;
  total_consentimientos?: number;
}

export interface FormularioCliente {
  id: number;
  nombre: string;
  estado: 'activo' | 'inactivo';
  fecha_respuesta?: string;
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
}