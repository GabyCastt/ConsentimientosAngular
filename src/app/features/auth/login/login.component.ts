import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  // Form fields
  email = signal('');
  password = signal('');
  rememberMe = signal(false);
  
  // UI state
  loading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  showPassword = signal(false);
  
  // Validation state
  emailValid = signal<boolean | null>(null);
  passwordValid = signal<boolean | null>(null);
  
  // Login attempts (seguridad)
  private loginAttempts = 0;
  private readonly MAX_ATTEMPTS = 5;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    // Si ya está autenticado, redirigir al dashboard
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }
  }

  // Validación en tiempo real del email
  onEmailChange(): void {
    const email = this.email();
    if (!email) {
      this.emailValid.set(null);
      return;
    }
    this.emailValid.set(this.isValidEmail(email));
  }

  // Validación en tiempo real de la contraseña
  onPasswordChange(): void {
    const password = this.password();
    if (!password) {
      this.passwordValid.set(null);
      return;
    }
    this.passwordValid.set(password.length >= 6);
  }

  onSubmit(): void {
    // Validar campos
    if (!this.validateForm()) {
      return;
    }

    // Verificar intentos de login
    if (this.loginAttempts >= this.MAX_ATTEMPTS) {
      this.errorMessage.set(
        'Demasiados intentos fallidos. Recarga la página para intentar nuevamente.'
      );
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    this.authService.login(
      this.email(),
      this.password(),
      this.rememberMe()
    ).subscribe({
      next: (response) => {
        // Login exitoso
        this.loginAttempts = 0;
        this.errorMessage.set('');
        this.successMessage.set(`¡Bienvenido, ${response.user?.nombre || 'Usuario'}!`);
        
        // Pequeño delay para mostrar el mensaje de éxito
        setTimeout(() => {
          this.loading.set(false);
          this.router.navigate(['/dashboard']);
        }, 1000);
      },
      error: (error) => {
        // Login fallido
        this.loginAttempts++;
        this.loading.set(false);
        
        const remainingAttempts = this.MAX_ATTEMPTS - this.loginAttempts;
        let errorMsg = error.error?.message || 'Credenciales incorrectas';
        
        if (remainingAttempts > 0) {
          errorMsg += ` (${remainingAttempts} intentos restantes)`;
        }
        
        this.errorMessage.set(errorMsg);
        
        // Limpiar contraseña
        this.password.set('');
      }
    });
  }

  private validateForm(): boolean {
    // Validar email
    if (!this.email() || !this.isValidEmail(this.email())) {
      this.errorMessage.set('Por favor ingresa un email válido');
      return false;
    }

    // Validar contraseña
    if (!this.password() || this.password().length < 6) {
      this.errorMessage.set('La contraseña debe tener al menos 6 caracteres');
      return false;
    }

    return true;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  togglePassword(): void {
    this.showPassword.update(v => !v);
  }
}