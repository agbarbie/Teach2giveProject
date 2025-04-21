import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, catchError, map, of, tap } from 'rxjs';
import { environment } from '../environments/environments';

interface User {
  id: number;
  email: string;
  role: string;
}

interface AuthResponse {
  id: number;
  email: string;
  role: string;
  token: string;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl || 'http://51.20.121.18/api';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    // Initialize user from localStorage if available
    const user = localStorage.getItem('currentUser');
    if (user) {
      this.currentUserSubject.next(JSON.parse(user));
    }
  }

  get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    return !!this.currentUserValue && !!this.getToken();
  }

  register(email: string, password: string, role: string = 'jobseeker'): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/register`, { email, password, role }).pipe(
      tap(response => this.handleAuthentication(response))
    );
  }

  login(email: string, password: string): Observable<AuthResponse> {
    // Added slash between apiUrl and auth/login
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, { email, password }).pipe(
      tap(response => this.handleAuthentication(response))
    );
  }

  logout(): void {
    // Clear all auth data
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  getCurrentUser(): Observable<User> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.getToken()}`
    });

    // Added slash between apiUrl and auth/me
    return this.http.get<AuthResponse>(`${this.apiUrl}/auth/me`, { headers }).pipe(
      map(response => {
        const user = {
          id: response.id,
          email: response.email,
          role: response.role
        };
        this.currentUserSubject.next(user);
        localStorage.setItem('currentUser', JSON.stringify(user));
        return user;
      }),
      catchError(error => {
        this.logout();
        throw error; // Handle error appropriately
      })
    );
  }

  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.getToken()}`
    });

    // Added slash between apiUrl and auth/password
    return this.http.put(`${this.apiUrl}/auth/password`, { currentPassword, newPassword }, { headers });
  }

  private handleAuthentication(response: AuthResponse): void {
    const user = {
      id: response.id,
      email: response.email,
      role: response.role
    };

    // Store user details and token in local storage
    localStorage.setItem('currentUser', JSON.stringify(user));
    localStorage.setItem('token', response.token);
    this.currentUserSubject.next(user);
  }
}