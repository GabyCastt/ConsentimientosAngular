import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { ConfigService } from './config.service';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Signals para estado reactivo
  currentUser = signal<User | null>(null);
  isAuthenticated = signal<boolean>(false);

  constructor(
    private http: HttpClient,
    private router: Router,
    private config: ConfigService
  ) {
    this.checkAuth();
  }

  login(email: string, password: string, rememberMe: boolean): Observable<any> {
    return this.http.post(this.config.getApiUrl(this.config.endpoints.login), {
      email,
      password,
      rememberMe
    }).pipe(
      tap((response: any) => {
        this.setSession(response, rememberMe);
      })
    );
  }

  private setSession(authResult: any, rememberMe: boolean): void {
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem('authToken', authResult.token);
    storage.setItem('currentUser', JSON.stringify(authResult.user));
    
    this.currentUser.set(authResult.user);
    this.isAuthenticated.set(true);
  }

  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('currentUser');
    
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    
    this.router.navigate(['/login']);
  }

  checkAuth(): void {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    const userStr = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        this.currentUser.set(user);
        this.isAuthenticated.set(true);
      } catch (error) {
        this.logout();
      }
    }
  }

  getToken(): string | null {
    return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  }
}