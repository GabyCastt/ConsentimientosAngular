# Flujo de Callback de DIDIT Free/Premium

## 📋 Resumen del Flujo

Cuando un usuario completa el proceso de verificación biométrica con DIDIT, el sistema debe redirigirlo de vuelta al formulario público con información sobre el resultado.

## 🔄 Flujo Actual

### 1. Usuario solicita verificación biométrica
```typescript
// formulario-publico.component.ts - línea 538
this.formulariosService.registrarConsentimientos(token, datos)
```

### 2. Backend crea sesión DIDIT
El backend debe:
- Crear una sesión en DIDIT
- Configurar la URL de retorno (callback URL)
- Devolver `verification_url` y `session_id`

**Respuesta esperada del backend:**
```json
{
  "tipo_verificacion": "biometria",
  "verification_url": "https://didit.com/verify/SESSION_ID",
  "session_id": "SESSION_ID",
  "token_verificacion": "TOKEN_VERIFICACION"
}
```

### 3. Frontend redirige a DIDIT
```typescript
// formulario-publico.component.ts - línea 577
window.location.href = response.verification_url;
```

### 4. Usuario completa verificación en DIDIT
El usuario:
- Toma foto de su cédula
- Toma selfie
- DIDIT procesa y verifica

### 5. DIDIT redirige de vuelta al formulario
**URL de retorno esperada:**
```
https://tu-dominio.com/formulario/publico/TOKEN?didit_return=true&verification_token=XXX&status=success&verified=true
```

**Parámetros requeridos:**
- `didit_return=true` - Indica que es un retorno de DIDIT
- `verification_token=XXX` - Token de verificación del proceso
- `status=success|approved|failed` - Estado del proceso
- `verified=true|false` - Si la verificación fue exitosa

### 6. Frontend detecta el retorno
```typescript
// formulario-publico.component.ts - línea 747
checkDiditCallback(): void {
  const urlParams = new URLSearchParams(window.location.search);
  const diditReturn = urlParams.get('didit_return');
  const verificationToken = urlParams.get('verification_token');
  const status = urlParams.get('status');
  const verified = urlParams.get('verified');
  
  if (diditReturn === 'true' && verificationToken) {
    this.manejarRegresoDeDidit(verificationToken, status, verified);
  }
}
```

### 7. Frontend procesa el resultado
```typescript
// formulario-publico.component.ts - línea 759
manejarRegresoDeDidit(verificationToken, status, verified): void {
  const esExitoso = (status === 'success' || status === 'approved') && verified === 'true';
  
  if (esExitoso) {
    // Marcar como verificado
    estadoActual.verificacionBiometrica = true;
    estadoActual.codigoVerificado = true;
    
    // Completar consentimientos automáticamente
    this.completarConsentimientos();
  } else {
    this.mostrarMensaje('Verificación biométrica fallida', 'error');
  }
}
```

## ⚙️ Configuración del Backend

### Endpoint de creación de sesión DIDIT
```
POST /api/didit/create-session
```

**Body:**
```json
{
  "token_verificacion": "TOKEN_DEL_FORMULARIO",
  "is_premium": false
}
```

**Respuesta esperada:**
```json
{
  "session_id": "didit_session_123",
  "verification_url": "https://didit.com/verify/didit_session_123",
  "token_verificacion": "TOKEN_DEL_FORMULARIO"
}
```

### URL de Callback que debe configurar el backend

El backend debe configurar en DIDIT la siguiente URL de callback:

```
https://TU_DOMINIO/formulario/publico/{TOKEN}?didit_return=true&verification_token={VERIFICATION_TOKEN}&status={STATUS}&verified={VERIFIED}
```

**Variables a reemplazar:**
- `{TOKEN}` - Token del formulario público
- `{VERIFICATION_TOKEN}` - Token de verificación generado
- `{STATUS}` - Estado del proceso (success/failed)
- `{VERIFIED}` - true/false según resultado

## 🔍 Verificación del Problema

### Paso 1: Verificar que el backend devuelve verification_url
Revisa los logs del navegador cuando se solicita la verificación:
```javascript
console.log('Respuesta registro:', response);
```

Debe contener:
- `verification_url`
- `session_id`
- `token_verificacion`

### Paso 2: Verificar la URL de callback en DIDIT
El backend debe configurar correctamente la URL de callback en la API de DIDIT cuando crea la sesión.

### Paso 3: Verificar que DIDIT redirige correctamente
Después de completar la verificación en DIDIT, verifica que la URL contiene los parámetros:
```
?didit_return=true&verification_token=XXX&status=success&verified=true
```

## 🐛 Problemas Comunes

### 1. No redirige de vuelta al formulario
**Causa:** Backend no configuró la callback URL en DIDIT
**Solución:** Verificar configuración de DIDIT en el backend

### 2. Redirige pero sin parámetros
**Causa:** Callback URL mal configurada
**Solución:** Asegurar que la URL incluye todos los parámetros necesarios

### 3. Redirige pero no completa el proceso
**Causa:** Parámetros incorrectos o frontend no los detecta
**Solución:** Verificar que los nombres de parámetros coinciden exactamente

## 📝 Checklist de Verificación

- [ ] Backend devuelve `verification_url` al registrar consentimientos
- [ ] Backend devuelve `session_id` al registrar consentimientos
- [ ] Backend configura callback URL en DIDIT con todos los parámetros
- [ ] DIDIT redirige a la URL correcta después de verificación
- [ ] URL de retorno incluye `didit_return=true`
- [ ] URL de retorno incluye `verification_token`
- [ ] URL de retorno incluye `status` (success/approved/failed)
- [ ] URL de retorno incluye `verified` (true/false)
- [ ] Frontend detecta los parámetros correctamente
- [ ] Frontend completa los consentimientos automáticamente

## 🔧 Solución Recomendada

Si el proceso no está funcionando, necesitas verificar en el backend:

1. **Archivo de configuración de DIDIT** (probablemente en el backend)
2. **Endpoint de creación de sesión** (`/api/didit/create-session`)
3. **Configuración de callback URL** en la llamada a la API de DIDIT

La callback URL debe ser construida dinámicamente usando:
```javascript
const callbackUrl = `${FRONTEND_URL}/formulario/publico/${token}?didit_return=true&verification_token=${verificationToken}&status={status}&verified={verified}`;
```

Donde `{status}` y `{verified}` son placeholders que DIDIT reemplazará con los valores reales.
