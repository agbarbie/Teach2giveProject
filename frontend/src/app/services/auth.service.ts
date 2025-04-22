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
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, { email, password }).pipe(
      tap(response => this.handleAuthentication(response))
    );
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  getCurrentUser(): Observable<User> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.getToken()}`
    });

    return this.http.get<AuthResponse>(`${this.apiUrl}/auth/me`, { headers }).pipe(
      map(response => {
        const user: User = {
          id: response.id,
          email: response.email,
          role: response.role
        };
        this.setUserData(user); // use the new method here
        return user;
      }),
      catchError(error => {
        this.logout();
        throw error;
      })
    );
  }

  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.getToken()}`
    });

    return this.http.put(`${this.apiUrl}/auth/password`, { currentPassword, newPassword }, { headers });
  }

  private handleAuthentication(response: AuthResponse): void {
    const user: User = {
      id: response.id,
      email: response.email,
      role: response.role
    };

    this.setUserData(user, response.token);
  }

  // ✅ Added method for manual user data setting
  setUserData(user: User, token?: string): void {
    localStorage.setItem('currentUser', JSON.stringify(user));
    if (token) {
      localStorage.setItem('token', token);
    }
    this.currentUserSubject.next(user);
  }
}
