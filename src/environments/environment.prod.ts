export const environment = {
  production: true,
  apiUrl: 'https://consentimentos.mis-tareas.com/api-consentimientos',
  
  // Información adicional del entorno
  isDevelopment: false,
  hostname: typeof window !== 'undefined' ? window.location.hostname : 'production',
  
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
  enableDebugLogs: false
};
