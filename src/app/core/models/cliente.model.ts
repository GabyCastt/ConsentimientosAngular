export interface Cliente {
  id: number;
  cedula: string;
  nombre: string;
  apellido: string;
  email?: string;
  telefono?: string;
  empresa_id: number;
  created_at: string;
}