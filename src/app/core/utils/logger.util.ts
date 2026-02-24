/**
 * Utilidad de logging sin emojis
 * Usa prefijos de texto para mejor compatibilidad
 */

export class Logger {
  private static isDevelopment = !window.location.hostname.includes('production');

  static log(prefix: string, ...args: any[]): void {
    if (this.isDevelopment) {
      console.log(`[${prefix}]`, ...args);
    }
  }

  static error(prefix: string, ...args: any[]): void {
    console.error(`[${prefix}]`, ...args);
  }

  static warn(prefix: string, ...args: any[]): void {
    if (this.isDevelopment) {
      console.warn(`[${prefix}]`, ...args);
    }
  }

  static info(prefix: string, ...args: any[]): void {
    if (this.isDevelopment) {
      console.info(`[${prefix}]`, ...args);
    }
  }

  // Métodos específicos por contexto
  static api = {
    send: (...args: any[]) => Logger.log('API-SEND', ...args),
    receive: (...args: any[]) => Logger.log('API-RECEIVE', ...args),
    error: (...args: any[]) => Logger.error('API-ERROR', ...args),
  };

  static auth = {
    login: (...args: any[]) => Logger.log('AUTH-LOGIN', ...args),
    logout: (...args: any[]) => Logger.log('AUTH-LOGOUT', ...args),
    token: (...args: any[]) => Logger.log('AUTH-TOKEN', ...args),
    error: (...args: any[]) => Logger.error('AUTH-ERROR', ...args),
  };

  static form = {
    submit: (...args: any[]) => Logger.log('FORM-SUBMIT', ...args),
    validate: (...args: any[]) => Logger.log('FORM-VALIDATE', ...args),
    error: (...args: any[]) => Logger.error('FORM-ERROR', ...args),
  };

  static data = {
    load: (...args: any[]) => Logger.log('DATA-LOAD', ...args),
    save: (...args: any[]) => Logger.log('DATA-SAVE', ...args),
    delete: (...args: any[]) => Logger.log('DATA-DELETE', ...args),
    error: (...args: any[]) => Logger.error('DATA-ERROR', ...args),
  };

  static ui = {
    render: (...args: any[]) => Logger.log('UI-RENDER', ...args),
    click: (...args: any[]) => Logger.log('UI-CLICK', ...args),
    error: (...args: any[]) => Logger.error('UI-ERROR', ...args),
  };
}
