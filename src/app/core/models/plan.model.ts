export type TipoVerificacion = 
  | 'sms_email' 
  | 'biometria_free' 
  | 'biometria_premium' 
  | 'sms_didit';

export interface Plan {
  plan_id: number;
  plan_codigo: string;
  plan_nombre: string;
  plan_descripcion: string;
  plan_cantidad_formularios: number;
  plan_ilimitado: 0 | 1;
  plan_duracion_meses: number;
  plan_precio: number;
  tipos_verificacion_permitidos: TipoVerificacion[];
  plan_activo: 0 | 1;
  plan_orden: number;
}

export interface PlanEmpresa {
  planempresa_id: number;
  emp_codigo: number;
  empresa_nombre?: string;
  plan_id: number;
  plan_nombre: string;
  plan_codigo: string;
  planempresa_cantidad: number;
  planempresa_ilimitado: 0 | 1;
  planempresa_fecha_inicio: string;
  planempresa_caduca: string;
  planempresa_utilizados: number;
  planempresa_valor: string;
  tipos_verificacion_permitidos: TipoVerificacion[];
  planempresa_estado: 'activo' | 'vencido' | 'cancelado';
  planempresa_comentario?: string;
  planempresa_nrcomprobante?: string;
  planempresa_banco?: number;
}

export interface EstadisticasPlan {
  tiene_plan: boolean;
  ilimitado: boolean;
  cantidad_total: number;
  utilizados: number;
  disponibles: number | 'Ilimitado';
  caduca: string;
  dias_restantes: number;
  valor: string;
}

export interface PlanActivo {
  plan: PlanEmpresa;
  estadisticas: EstadisticasPlan;
}

export interface VerificarPlanResponse {
  success: boolean;
  puede: boolean;
  razon?: string;
  plan?: PlanEmpresa;
}

export interface AsignarPlanRequest {
  emp_codigo: number;
  plan_id: number;
  planempresa_valor?: number;
  planempresa_fecha_inicio?: string;
  planempresa_caduca?: string;
  planempresa_nrcomprobante?: string;
  planempresa_banco?: number;
  planempresa_comentario?: string;
}

export interface CrearPlanRequest {
  plan_codigo: string;
  plan_nombre: string;
  plan_descripcion: string;
  plan_cantidad_formularios: number;
  plan_ilimitado: 0 | 1;
  plan_duracion_meses: number;
  plan_precio: number;
  tipos_verificacion_permitidos: TipoVerificacion[];
  plan_activo: 0 | 1;
  plan_orden: number;
}
