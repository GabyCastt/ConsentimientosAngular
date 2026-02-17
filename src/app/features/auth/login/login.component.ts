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
  email = signal('');
  password = signal('');
  rememberMe = signal(false);
  loading = signal(false);
  errorMessage = signal('');
  showPassword = signal(false);

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit(): void {
    if (!this.email() || !this.password()) {
      this.errorMessage.set('Por favor completa todos los campos');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    this.authService.login(
      this.email(),
      this.password(),
      this.rememberMe()
    ).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.errorMessage.set(error.error?.message || 'Error al iniciar sesión');
        this.loading.set(false);
      }
    });
  }

  togglePassword(): void {
    this.showPassword.update(v => !v);
  }
}