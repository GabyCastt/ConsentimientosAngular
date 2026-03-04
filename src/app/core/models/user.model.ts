export interface User {
  id: number;
  nombre: string;
  email: string;
  rol: 'admin' | 'distribuidor' | 'empresa';
  empresa_id?: number;
  email_verificado?: boolean;
  telefono?: string;
  telefono_verificado?: boolean;
  activo?: boolean;
  created_at?: string;
  updated_at?: string;
}