// Función para detectar entorno automáticamente
const isDevelopment = (): boolean => {
  const hostname = window.location.hostname;
  return hostname === 'localhost' || 
         hostname === '127.0.0.1' || 
         hostname.includes('localhost');
};

// Función para obtener la URL base del API según el entorno
const getApiBaseUrl = (): string => {
  if (isDevelopment()) {
    // Desarrollo local - usar proxy vacío
    return '';
  } else {
    // Producción - URL completa del backend
    return 'https://consentimentos.mis-tareas.com/api-consentimientos';
  }
};

export const environment = {
  production: !isDevelopment(),
  apiUrl: getApiBaseUrl(),
  
  // Información adicional del entorno
  isDevelopment: isDevelopment(),
  hostname: typeof window !== 'undefined' ? window.location.hostname : 'unknown',
  
  // Configuración de la aplicación
  appName: 'ConsentPro',
  version: '1.0.0',
  
  // Configuración de validaciones
  maxLoginAttempts: 5,
  
  // Configuración de actualización automática
  autoRefreshInterval: 60000, // 1 minuto
  
  // Configuración de timeouts
  apiTimeout: 30000, // 30 segundos
  
  // Configuración de logs
  enableDebugLogs: isDevelopment()
};
