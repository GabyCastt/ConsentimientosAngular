# Módulo de Gestión de Empresas

Este módulo maneja toda la funcionalidad relacionada con la gestión de empresas en el sistema.

## Estructura

```
empresas/
├── empresas.service.ts          # Servicio principal con todas las APIs
├── empresas.routes.ts           # Rutas del módulo
├── lista-empresas/              # Componente de listado y gestión (Admin)
│   ├── lista-empresas.component.ts
│   ├── lista-empresas.component.html
│   └── lista-empresas.component.scss
└── perfil-empresa/              # Componente de perfil (Distribuidor)
    ├── perfil-empresa.component.ts
    ├── perfil-empresa.component.html
    └── perfil-empresa.component.scss
```

## APIs Implementadas

### 1. Obtener Perfil de Empresa (Distribuidor)
**Endpoint:** `GET /api/empresas/perfil`  
**Descripción:** Obtiene el perfil de la empresa del distribuidor autenticado.

**Respuesta:**
```typescript
{
  empresa: {
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
}
```

**Uso:**
```typescript
this.empresasService.getPerfil().subscribe({
  next: (response) => console.log(response.empresa),
  error: (error) => console.error(error)
});
```

---

### 2. Actualizar Perfil de Empresa (Distribuidor)
**Endpoint:** `PUT /api/empresas/perfil`  
**Descripción:** Actualiza el perfil de la empresa del distribuidor autenticado.

**Parámetros:**
```typescript
{
  nombre?: string;
  ruc?: string;
  email?: string;
  telefono?: string;
  slogan?: string;
  logo?: File;
}
```

**Respuesta:**
```typescript
{
  message: string;
  empresa: Empresa;
}
```

**Uso:**
```typescript
this.empresasService.updatePerfil({
  nombre: 'BeGroup',
  ruc: '1710034065001',
  email: 'info@begroup.com',
  telefono: '+593 98 659 1764',
  slogan: 'Innovación y Tecnología',
  logo: logoFile
}).subscribe({
  next: (response) => console.log(response),
  error: (error) => console.error(error)
});
```

---

### 3. Listar Todas las Empresas (Admin)
**Endpoint:** `GET /api/empresas`  
**Descripción:** Obtiene lista de todas las empresas con estadísticas. Solo para administradores.

**Respuesta:**
```typescript
{
  empresas: Empresa[];
  total: number;
}
```

**Uso:**
```typescript
this.empresasService.getEmpresas().subscribe({
  next: (response) => {
    console.log('Total:', response.total);
    console.log('Empresas:', response.empresas);
  },
  error: (error) => console.error(error)
});
```

---

### 4. Obtener Empresa por ID (Admin)
**Endpoint:** `GET /api/empresas/{id}`  
**Descripción:** Obtiene los detalles de una empresa específica. Solo para administradores.

**Respuesta:**
```typescript
{
  empresa: Empresa;
}
```

**Uso:**
```typescript
this.empresasService.getEmpresa(1).subscribe({
  next: (response) => console.log(response.empresa),
  error: (error) => console.error(error)
});
```

---

### 5. Crear Nueva Empresa (Admin)
**Endpoint:** `POST /api/empresas`  
**Descripción:** Crea una nueva empresa. Solo para administradores.

**Parámetros:**
```typescript
{
  nombre: string;        // Requerido
  ruc?: string;
  email?: string;
  telefono?: string;
  slogan?: string;
  logo?: File;
}
```

**Respuesta:**
```typescript
{
  message: string;
  empresa: Empresa;
}
```

**Uso:**
```typescript
this.empresasService.createEmpresa({
  nombre: 'Nueva Empresa',
  ruc: '1234567890001',
  email: 'contacto@empresa.com',
  telefono: '+593 99 999 9999',
  slogan: 'Nuestro slogan',
  logo: logoFile
}).subscribe({
  next: (response) => console.log(response),
  error: (error) => console.error(error)
});
```

---

### 6. Actualizar Empresa (Admin)
**Endpoint:** `PUT /api/empresas/{id}`  
**Descripción:** Actualiza los datos de una empresa. Solo para administradores.

**Parámetros:**
```typescript
{
  nombre?: string;
  ruc?: string;
  email?: string;
  telefono?: string;
  slogan?: string;
  logo?: File;
}
```

**Respuesta:**
```typescript
{
  message: string;
  empresa: Empresa;
}
```

**Uso:**
```typescript
this.empresasService.updateEmpresa(1, {
  nombre: 'Empresa Actualizada',
  slogan: 'Nuevo slogan'
}).subscribe({
  next: (response) => console.log(response),
  error: (error) => console.error(error)
});
```

---

### 7. Eliminar Empresa (Admin)
**Endpoint:** `DELETE /api/empresas/{id}`  
**Descripción:** Elimina una empresa del sistema. Solo para administradores.

**Respuesta:**
```typescript
{
  message: string;
}
```

**Uso:**
```typescript
this.empresasService.deleteEmpresa(1).subscribe({
  next: (response) => console.log(response.message),
  error: (error) => console.error(error)
});
```

---

### 8. Limpiar Empresas Huérfanas (Admin)
**Endpoint:** `POST /api/empresas/limpiar-huerfanas`  
**Descripción:** Elimina empresas sin usuarios, clientes ni formularios. Solo para administradores.

**Respuesta:**
```typescript
{
  message: string;
  empresas_eliminadas: number;
}
```

**Uso:**
```typescript
this.empresasService.limpiarEmpresasHuerfanas().subscribe({
  next: (response) => {
    console.log(response.message);
    console.log('Eliminadas:', response.empresas_eliminadas);
  },
  error: (error) => console.error(error)
});
```

---

## Modelos de Datos

### Empresa
```typescript
interface Empresa {
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
```

### CreateEmpresaDto
```typescript
interface CreateEmpresaDto {
  nombre: string;
  ruc?: string;
  email?: string;
  telefono?: string;
  slogan?: string;
  logo?: File;
}
```

### UpdateEmpresaDto
```typescript
interface UpdateEmpresaDto {
  nombre?: string;
  ruc?: string;
  email?: string;
  telefono?: string;
  slogan?: string;
  logo?: File;
}
```

---

## Componentes

### ListaEmpresasComponent
Componente principal para la gestión de empresas. Muestra diferentes vistas según el rol:

- **Admin:** Lista completa de empresas con opciones de crear, editar y eliminar
- **Distribuidor:** Solo muestra su propia empresa

**Características:**
- Grid responsivo de tarjetas de empresas
- Modal para crear/editar empresas
- Validación de formularios
- Preview de logos antes de subir
- Estadísticas por empresa
- Limpieza de empresas huérfanas

### PerfilEmpresaComponent
Componente para que los distribuidores gestionen su perfil de empresa.

**Características:**
- Vista de perfil con logo
- Edición inline
- Estadísticas de la empresa
- Validación de archivos (tipo y tamaño)

---

## Validaciones

### Logo
- Tipos permitidos: JPG, PNG, GIF, SVG
- Tamaño máximo: 5MB
- Preview antes de subir

### Campos
- **Nombre:** Requerido, no vacío
- **RUC:** Opcional, máximo 13 caracteres
- **Email:** Opcional, formato válido
- **Teléfono:** Opcional
- **Slogan:** Opcional

---

## Permisos

### Rutas de Admin
- `GET /api/empresas` - Listar todas
- `GET /api/empresas/{id}` - Ver detalle
- `POST /api/empresas` - Crear
- `PUT /api/empresas/{id}` - Actualizar
- `DELETE /api/empresas/{id}` - Eliminar
- `POST /api/empresas/limpiar-huerfanas` - Limpiar

### Rutas de Distribuidor
- `GET /api/empresas/perfil` - Ver su perfil
- `PUT /api/empresas/perfil` - Actualizar su perfil

---

## Notas Técnicas

1. **FormData:** Todos los endpoints que aceptan archivos usan FormData automáticamente
2. **Headers:** El ApiService maneja automáticamente los headers según el tipo de datos
3. **Autenticación:** Todas las peticiones incluyen el token JWT automáticamente
4. **Manejo de Errores:** Los errores se propagan con mensajes descriptivos
5. **Logos:** Se usa ConfigService.getLogoUrl() para construir URLs completas

---

## Ejemplo Completo

```typescript
import { Component, OnInit } from '@angular/core';
import { EmpresasService } from './empresas.service';

@Component({
  selector: 'app-mi-componente',
  template: `...`
})
export class MiComponente implements OnInit {
  constructor(private empresasService: EmpresasService) {}

  ngOnInit() {
    // Listar empresas
    this.empresasService.getEmpresas().subscribe({
      next: (response) => {
        console.log('Empresas:', response.empresas);
      }
    });

    // Crear empresa
    this.empresasService.createEmpresa({
      nombre: 'Mi Empresa',
      ruc: '1234567890001',
      email: 'info@miempresa.com'
    }).subscribe({
      next: (response) => {
        console.log('Empresa creada:', response.empresa);
      }
    });

    // Actualizar empresa
    this.empresasService.updateEmpresa(1, {
      slogan: 'Nuevo slogan'
    }).subscribe({
      next: (response) => {
        console.log('Empresa actualizada:', response.empresa);
      }
    });
  }
}
```
