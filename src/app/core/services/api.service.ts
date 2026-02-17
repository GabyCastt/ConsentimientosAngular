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

  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

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
    return this.http.post<T>(
      this.config.getApiUrl(endpoint),
      data,
      { headers: this.getHeaders() }
    );
  }

  put<T>(endpoint: string, data: any): Observable<T> {
    return this.http.put<T>(
      this.config.getApiUrl(endpoint),
      data,
      { headers: this.getHeaders() }
    );
  }

  delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(
      this.config.getApiUrl(endpoint),
      { headers: this.getHeaders() }
    );
  }
}