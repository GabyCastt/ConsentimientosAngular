# Módulo de Gestión de Usuarios

Este módulo implementa la gestión de usuarios de empresa según los roles ADMIN y EMPRESA.

## Estructura

```
usuarios/
├── mis-usuarios/              # Componente para rol EMPRESA
│   ├── mis-usuarios.component.ts
│   ├── mis-usuarios.component.html
│   ├── mis-usuarios.component.scss
│   └── mis-usuarios.component.spec.ts
├── usuarios-empresa/          # Componente para rol ADMIN
│   ├── usuarios-empresa.component.ts
│   ├── usuarios-empresa.component.html
│   ├── usuarios-empresa.component.scss
│   └── usuarios-empresa.component.spec.ts
├── usuarios.routes.ts         # Rutas del módulo
└── README.md
```

## Rutas

### Para EMPRESA
- `/usuarios/mis-usuarios` - Gestionar usuarios de su propia empresa

### Para ADMIN
- `/usuarios/empresa/:empresaId` - Gestionar usuarios de cualquier empresa

## Funcionalidades

### Rol EMPRESA
Los usuarios con rol 'empresa' pueden:
- ✅ Listar todos los usuarios de su empresa
- ✅ Crear nuevos usuarios en su empresa
- ✅ Editar usuarios de su empresa (nombre, email, estado activo/inactivo)
- ✅ Cambiar contraseñas de usuarios de su empresa
- ✅ Eliminar usuarios de su empresa (excepto a sí mismo)
- ❌ NO pueden ver usuarios de otras empresas
- ❌ NO pueden cambiar roles de usuarios

### Rol ADMIN
Los administradores pueden:
- ✅ Gestionar usuarios de cualquier empresa
- ✅ Acceder desde el detalle de empresa con el botón "Gestión Completa"
- ✅ Crear, editar, eliminar y cambiar contraseñas de usuarios
- ✅ Ver estadísticas de usuarios por empresa

## Servicios

### UsuariosService
Ubicación: `src/app/core/services/usuarios.service.ts`

Métodos disponibles:

#### Para ADMIN
- `listarUsuariosEmpresaAdmin(empresaId)`
- `crearUsuarioEmpresaAdmin(empresaId, data)`
- `actualizarUsuarioEmpresaAdmin(empresaId, usuarioId, data)`
- `eliminarUsuarioEmpresaAdmin(empresaId, usuarioId)`
- `cambiarPasswordUsuarioAdmin(empresaId, usuarioId, data)`

#### Para DISTRIBUIDOR
- `listarUsuariosEmpresaDistribuidor(empresaId)`
- `crearUsuarioEmpresaDistribuidor(empresaId, data)`
- `actualizarUsuarioEmpresaDistribuidor(empresaId, usuarioId, data)`
- `eliminarUsuarioEmpresaDistribuidor(empresaId, usuarioId)`

#### Para EMPRESA
- `listarMisUsuarios()`
- `crearMiUsuario(data)`
- `actualizarMiUsuario(usuarioId, data)`
- `eliminarMiUsuario(usuarioId)`
- `cambiarPasswordMiUsuario(usuarioId, data)`

## Modelos

### UsuarioEmpresa
```typescript
interface UsuarioEmpresa {
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
```

### CrearUsuarioRequest
```typescript
interface CrearUsuarioRequest {
  email: string;
  password: string;
  nombre: string;
}
```

### ActualizarUsuarioRequest
```typescript
interface ActualizarUsuarioRequest {
  nombre?: string;
  email?: string;
  activo?: number | boolean;
}
```

## Validaciones

- Email debe ser único en todo el sistema
- Contraseña debe tener mínimo 6 caracteres
- Nombre es obligatorio
- Un usuario no puede eliminarse a sí mismo
- Solo se pueden gestionar usuarios con rol 'empresa'

## Integración con Backend

El módulo consume las siguientes rutas del backend:

### ADMIN
```
GET    /api/admin/empresas/:empresaId/usuarios
POST   /api/admin/empresas/:empresaId/usuarios
PUT    /api/admin/empresas/:empresaId/usuarios/:usuarioId
DELETE /api/admin/empresas/:empresaId/usuarios/:usuarioId
PUT    /api/admin/empresas/:empresaId/usuarios/:usuarioId/password
```

### DISTRIBUIDOR
```
GET    /api/distribuidores/empresas/:empresaId/usuarios
POST   /api/distribuidores/empresas/:empresaId/usuarios
PUT    /api/distribuidores/empresas/:empresaId/usuarios/:usuarioId
DELETE /api/distribuidores/empresas/:empresaId/usuarios/:usuarioId
```

### EMPRESA
```
GET    /api/empresas/mis-usuarios
POST   /api/empresas/mis-usuarios
PUT    /api/empresas/mis-usuarios/:usuarioId
DELETE /api/empresas/mis-usuarios/:usuarioId
PUT    /api/empresas/mis-usuarios/:usuarioId/password
```

## Uso

### Acceso para EMPRESA
1. Iniciar sesión con usuario tipo 'empresa'
2. Navegar a "Usuarios" en el menú
3. Gestionar usuarios de su empresa

### Acceso para ADMIN
1. Iniciar sesión con usuario admin
2. Ir a "Empresas" → "Lista de Empresas"
3. Seleccionar una empresa
4. Click en "Gestión Completa" en la sección de usuarios
5. O navegar directamente a `/usuarios/empresa/:empresaId`

## Características de UI

- Tabla responsive con lista de usuarios
- Modales para crear/editar usuarios
- Modal separado para cambiar contraseñas
- Badges de estado (Activo/Inactivo)
- Mensajes de éxito y error
- Confirmación antes de eliminar
- Loading states durante operaciones
- Validación de formularios
