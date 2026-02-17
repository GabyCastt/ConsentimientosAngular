import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="loading-overlay" [class.show]="show()">
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <p class="mt-3 mb-0">{{ message() }}</p>
      </div>
    </div>
  `,
  styles: [`
    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      display: none;
      justify-content: center;
      align-items: center;
      z-index: 9999;
    }
    
    .loading-overlay.show {
      display: flex;
    }
    
    .loading-content {
      background: white;
      padding: 2rem;
      border-radius: 10px;
      text-align: center;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    }
    
    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #042396;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `]
})
export class LoadingComponent {
  show = input<boolean>(false);
  message = input<string>('Cargando...');
}