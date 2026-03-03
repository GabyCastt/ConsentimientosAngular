import { Injectable } from '@angular/core';

export interface AlertButton {
  text: string;
  style?: 'primary' | 'success' | 'danger' | 'warning' | 'secondary';
  handler?: () => void;
}

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  
  success(title: string, message: string): void {
    this.showAlert(title, message, 'success');
  }

  error(title: string, message: string): void {
    this.showAlert(title, message, 'error');
  }

  warning(title: string, message: string): void {
    this.showAlert(title, message, 'warning');
  }

  info(title: string, message: string): void {
    this.showAlert(title, message, 'info');
  }

  private showAlert(title: string, message: string, type: 'success' | 'error' | 'warning' | 'info'): void {
    const icons = {
      success: '✓',
      error: '✗',
      warning: '⚠',
      info: 'ℹ'
    };

    const colors = {
      success: '#28a745',
      error: '#dc3545',
      warning: '#ffc107',
      info: '#17a2b8'
    };

    const bgColors = {
      success: '#d4edda',
      error: '#f8d7da',
      warning: '#fff3cd',
      info: '#d1ecf1'
    };

    // Crear el contenedor del alert
    const alertDiv = document.createElement('div');
    alertDiv.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.3);
      z-index: 10000;
      min-width: 320px;
      max-width: 500px;
      animation: slideIn 0.3s ease-out;
    `;

    alertDiv.innerHTML = `
      <style>
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translate(-50%, -60%);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%);
          }
        }
      </style>
      <div style="
        background: ${bgColors[type]};
        border-top-left-radius: 12px;
        border-top-right-radius: 12px;
        padding: 20px;
        border-bottom: 3px solid ${colors[type]};
      ">
        <div style="
          display: flex;
          align-items: center;
          gap: 12px;
        ">
          <div style="
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: ${colors[type]};
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            font-weight: bold;
          ">${icons[type]}</div>
          <div style="flex: 1;">
            <h3 style="
              margin: 0;
              font-size: 18px;
              font-weight: 600;
              color: #333;
            ">${title}</h3>
          </div>
        </div>
      </div>
      <div style="padding: 20px;">
        <p style="
          margin: 0;
          color: #555;
          line-height: 1.5;
          white-space: pre-line;
        ">${message}</p>
      </div>
      <div style="
        padding: 15px 20px;
        border-top: 1px solid #e9ecef;
        text-align: right;
      ">
        <button id="alertOkBtn" style="
          background: ${colors[type]};
          color: white;
          border: none;
          padding: 10px 30px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        ">Aceptar</button>
      </div>
    `;

    // Crear overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      z-index: 9999;
    `;

    // Agregar al DOM
    document.body.appendChild(overlay);
    document.body.appendChild(alertDiv);

    // Función para cerrar
    const closeAlert = () => {
      alertDiv.style.animation = 'slideOut 0.2s ease-in';
      overlay.style.opacity = '0';
      overlay.style.transition = 'opacity 0.2s';
      
      setTimeout(() => {
        document.body.removeChild(alertDiv);
        document.body.removeChild(overlay);
      }, 200);
    };

    // Event listeners
    const okBtn = alertDiv.querySelector('#alertOkBtn');
    okBtn?.addEventListener('click', closeAlert);
    overlay.addEventListener('click', closeAlert);

    // Agregar animación de salida
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideOut {
        from {
          opacity: 1;
          transform: translate(-50%, -50%);
        }
        to {
          opacity: 0;
          transform: translate(-50%, -60%);
        }
      }
    `;
    document.head.appendChild(style);
  }
}
