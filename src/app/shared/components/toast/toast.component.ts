import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container position-fixed top-0 end-0 p-3">
      @for (toast of toasts(); track toast.id) {
        <div 
          class="toast show" 
          [class.bg-success]="toast.type === 'success'"
          [class.bg-danger]="toast.type === 'error'"
          [class.bg-warning]="toast.type === 'warning'"
          [class.bg-info]="toast.type === 'info'"
          role="alert">
          <div class="toast-header">
            <i [class]="getIcon(toast.type)" class="me-2"></i>
            <strong class="me-auto">{{ getTitle(toast.type) }}</strong>
            <button 
              type="button" 
              class="btn-close" 
              (click)="remove(toast.id)">
            </button>
          </div>
          <div class="toast-body text-white">
            {{ toast.message }}
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      z-index: 9999;
    }
    
    .toast {
      margin-bottom: 0.5rem;
      min-width: 300px;
    }
    
    .toast-body {
      color: white !important;
    }
  `]
})
export class ToastComponent {
  toasts = signal<ToastMessage[]>([]);
  private nextId = 1;

  show(message: string, type: ToastMessage['type'] = 'info', duration = 5000): void {
    const toast: ToastMessage = {
      id: this.nextId++,
      message,
      type,
      duration
    };

    this.toasts.update(toasts => [...toasts, toast]);

    if (duration > 0) {
      setTimeout(() => this.remove(toast.id), duration);
    }
  }

  remove(id: number): void {
    this.toasts.update(toasts => toasts.filter(t => t.id !== id));
  }

  protected getIcon(type: string): string {
    const icons = {
      success: 'fas fa-check-circle text-success',
      error: 'fas fa-exclamation-triangle text-danger',
      warning: 'fas fa-exclamation-circle text-warning',
      info: 'fas fa-info-circle text-info'
    };
    return icons[type as keyof typeof icons] || icons.info;
  }

  protected getTitle(type: string): string {
    const titles = {
      success: 'Éxito',
      error: 'Error',
      warning: 'Advertencia',
      info: 'Información'
    };
    return titles[type as keyof typeof titles] || 'Notificación';
  }
}