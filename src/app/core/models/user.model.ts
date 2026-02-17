export interface User {
  id: number;
  nombre: string;
  email: string;
  rol: 'admin' | 'empresa' | 'usuario';
  empresa_id?: number;
}