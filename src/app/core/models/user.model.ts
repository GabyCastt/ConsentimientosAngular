export interface User {
  id: number;
  nombre: string;
  email: string;
  rol: 'admin' | 'empresa' | 'usuario';
  empresa_id?: number;
  email_verificado?: boolean;
  telefono?: string;
  telefono_verificado?: boolean;
}