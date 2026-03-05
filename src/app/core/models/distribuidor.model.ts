export interface Distribuidor {
  id: number;
  nombre: string;
  email: string;
  rol: 'distribuidor';
  activo: boolean | number; // Puede venir como 0/1 del backend
  created_at: string;
  updated_at?: string;
  empresas?: DistribuidorEmpresaSimple[];
  total_empresas?: number;
}

export interface DistribuidorEmpresaSimple {
  id: number;
  nombre: string;
  logo?: string;
  slogan?: string;
}

export interface DistribuidorEmpresa {
  id: number;
  nombre: string;
  logo?: string;
  slogan?: string;
  asignado_en: string;
}

export interface CrearDistribuidorRequest {
  email: string;
  password: string;
  nombre: string;
}

export interface ActualizarDistribuidorRequest {
  email?: string;
  nombre?: string;
  activo?: boolean;
}

export interface CambiarPasswordRequest {
  password: string;
}
