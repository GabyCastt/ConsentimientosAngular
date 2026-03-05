/**
 * Constantes de roles y permisos del sistema
 */

export enum UserRole {
  ADMIN = 'admin',
  DISTRIBUIDOR = 'distribuidor',
  EMPRESA = 'empresa'
}

export interface RoleConfig {
  name: UserRole;
  displayName: string;
  description: string;
  permissions: string[];
}

export const ROLES: Record<UserRole, RoleConfig> = {
  [UserRole.ADMIN]: {
    name: UserRole.ADMIN,
    displayName: 'Administrador',
    description: 'Acceso total, gestiona todo el sistema',
    permissions: [
      'ver_todas_empresas',
      'crear_empresas',
      'editar_cualquier_empresa',
      'eliminar_empresas',
      'asignar_empresas_distribuidores',
      'limpiar_empresas_huerfanas',
      'ver_todos_clientes',
      'gestionar_distribuidores',
      'ver_estadisticas_globales',
      'acceso_total'
    ]
  },
  [UserRole.DISTRIBUIDOR]: {
    name: UserRole.DISTRIBUIDOR,
    displayName: 'Distribuidor',
    description: 'Crea y gestiona sus propias empresas',
    permissions: [
      'crear_empresas',              // Puede crear empresas (se le asignan automáticamente)
      'ver_sus_empresas',            // Ve solo sus empresas asignadas
      'editar_sus_empresas',         // Edita solo sus empresas asignadas
      'crear_usuarios_empresa',      // Crea usuarios tipo 'empresa' para sus empresas
      'gestionar_usuarios_empresa',  // Gestiona usuarios de sus empresas
      'ver_estadisticas_empresas',   // Ve estadísticas de sus empresas
      'ver_clientes_empresas'        // Ve clientes de sus empresas
    ]
  },
  [UserRole.EMPRESA]: {
    name: UserRole.EMPRESA,
    displayName: 'Empresa',
    description: 'Gestiona su propia empresa',
    permissions: [
      'ver_perfil_empresa',          // Ve el perfil de su empresa
      'editar_perfil_empresa',       // Edita el perfil de su empresa
      'crear_formularios',           // Crea formularios
      'gestionar_formularios',       // Gestiona sus formularios
      'crear_clientes',              // Crea clientes
      'gestionar_clientes',          // Gestiona sus clientes
      'ver_estadisticas_propias',    // Ve estadísticas de su empresa
      'generar_enlaces',             // Genera enlaces de consentimiento
      'ver_consentimientos'          // Ve consentimientos procesados
    ]
  }
};

/**
 * Verifica si un rol tiene un permiso específico
 */
export function hasPermission(role: UserRole, permission: string): boolean {
  return ROLES[role]?.permissions.includes(permission) || false;
}

/**
 * Verifica si un rol tiene alguno de los permisos especificados
 */
export function hasAnyPermission(role: UserRole, permissions: string[]): boolean {
  const rolePermissions = ROLES[role]?.permissions || [];
  return permissions.some(permission => rolePermissions.includes(permission));
}

/**
 * Verifica si un rol tiene todos los permisos especificados
 */
export function hasAllPermissions(role: UserRole, permissions: string[]): boolean {
  const rolePermissions = ROLES[role]?.permissions || [];
  return permissions.every(permission => rolePermissions.includes(permission));
}

/**
 * Obtiene el nombre para mostrar de un rol
 */
export function getRoleDisplayName(role: UserRole): string {
  return ROLES[role]?.displayName || role;
}

/**
 * Obtiene la descripción de un rol
 */
export function getRoleDescription(role: UserRole): string {
  return ROLES[role]?.description || '';
}

/**
 * Verifica si un usuario puede gestionar empresas
 */
export function canManageEmpresas(role: UserRole): boolean {
  return role === UserRole.ADMIN || role === UserRole.DISTRIBUIDOR;
}

/**
 * Verifica si un usuario puede crear empresas
 */
export function canCreateEmpresas(role: UserRole): boolean {
  return role === UserRole.ADMIN || role === UserRole.DISTRIBUIDOR;
}

/**
 * Verifica si un usuario puede eliminar empresas
 */
export function canDeleteEmpresas(role: UserRole): boolean {
  return role === UserRole.ADMIN;
}

/**
 * Verifica si un usuario puede ver todas las empresas
 */
export function canViewAllEmpresas(role: UserRole): boolean {
  return role === UserRole.ADMIN;
}
