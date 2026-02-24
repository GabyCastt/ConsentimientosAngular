import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from './config.service';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  constructor(
    private http: HttpClient,
    private config: ConfigService,
    private auth: AuthService
  ) {}

  private getHeaders(isFormData: boolean = false): HttpHeaders {
    let headers = new HttpHeaders();
    
    // No agregar Content-Type para FormData (el navegador lo hace automáticamente)
    if (!isFormData) {
      headers = headers.set('Content-Type', 'application/json');
    }

    const token = this.auth.getToken();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  }

  get<T>(endpoint: string): Observable<T> {
    return this.http.get<T>(
      this.config.getApiUrl(endpoint),
      { headers: this.getHeaders() }
    );
  }

  post<T>(endpoint: string, data: any): Observable<T> {
    const isFormData = data instanceof FormData;
    return this.http.post<T>(
      this.config.getApiUrl(endpoint),
      data,
      { headers: this.getHeaders(isFormData) }
    );
  }

  put<T>(endpoint: string, data: any): Observable<T> {
    const isFormData = data instanceof FormData;
    return this.http.put<T>(
      this.config.getApiUrl(endpoint),
      data,
      { headers: this.getHeaders(isFormData) }
    );
  }

  delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(
      this.config.getApiUrl(endpoint),
      { headers: this.getHeaders() }
    );
  }
}