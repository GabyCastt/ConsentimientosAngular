// Modelo para gestión de usuarios de empresa
export interface UsuarioEmpresa {
  id: number;
  email: string;
  nombre: string;
  rol: 'empresa';
  empresa_id: number;
  empresa_nombre?: string;
  activo: number | boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CrearUsuarioRequest {
  email: string;
  password: string;
  nombre: string;
}

export interface ActualizarUsuarioRequest {
  nombre?: string;
  email?: string;
  activo?: number | boolean;
}

export interface CambiarPasswordUsuarioRequest {
  password: string;
}

export interface ListaUsuariosResponse {
  usuarios: UsuarioEmpresa[];
  total: number;
}

export interface UsuarioResponse {
  message: string;
  usuario: UsuarioEmpresa;
}
