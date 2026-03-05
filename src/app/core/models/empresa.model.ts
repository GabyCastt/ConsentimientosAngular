export interface Empresa {
  id: number;
  nombre: string;
  ruc?: string;
  email?: string;
  telefono?: string;
  slogan?: string;
  logo?: string;
  activo?: boolean;
  created_at?: string;
  updated_at?: string;
  total_usuarios?: number;
  total_clientes?: number;
  total_formularios?: number;
  total_consentimientos?: number;
  asignado_en?: string; // Para distribuidores
}

export interface EmpresaEstadisticas {
  total_usuarios: number;
  total_clientes: number;
  total_formularios: number;
  total_consentimientos: number;
  consentimientos_firmados: number;
  consentimientos_revocados: number;
  consentimientos_pendientes: number;
  respuestas_formularios?: {
    total: number;
    verificados: number;
    completados: number;
    pendientes: number;
  };
  metodo_mas_usado?: string | null;
  metodo_mas_usado_total?: number;
}

export interface EmpresaConEstadisticas extends Empresa {
  estadisticas?: EmpresaEstadisticas;
}

export interface EmpresaPerfil {
  empresa: EmpresaConEstadisticas;
}

export interface EmpresasListResponse {
  empresas: Empresa[];
  total: number;
}

export interface EmpresaResponse {
  message?: string;
  empresa: Empresa;
  usuario?: {
    id: number;
    email: string;
    nombre: string;
    rol: string;
    empresa_id: number;
  };
  asignada_a_distribuidor?: boolean;
}

export interface CreateEmpresaDto {
  nombre: string;
  ruc?: string;
  email?: string;
  telefono?: string;
  slogan?: string;
  logo?: File;
  // Para crear usuario tipo 'empresa' al mismo tiempo
  usuario_email?: string;
  usuario_password?: string;
  usuario_nombre?: string;
}

export interface UpdateEmpresaDto {
  nombre?: string;
  ruc?: string;
  email?: string;
  telefono?: string;
  slogan?: string;
  logo?: File;
}
