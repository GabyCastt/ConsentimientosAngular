export interface Empresa {
  id: number;
  nombre: string;
  ruc?: string;
  email?: string;
  telefono?: string;
  slogan?: string;
  logo?: string;
  created_at?: string;
  updated_at?: string;
  total_usuarios?: number;
  total_clientes?: number;
  total_formularios?: number;
  total_consentimientos?: number;
}

export interface EmpresaPerfil {
  empresa: Empresa;
}

export interface EmpresasListResponse {
  empresas: Empresa[];
  total: number;
}

export interface EmpresaResponse {
  message?: string;
  empresa: Empresa;
}

export interface CreateEmpresaDto {
  nombre: string;
  ruc?: string;
  email?: string;
  telefono?: string;
  slogan?: string;
  logo?: File;
}

export interface UpdateEmpresaDto {
  nombre?: string;
  ruc?: string;
  email?: string;
  telefono?: string;
  slogan?: string;
  logo?: File;
}
