import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { AuthService } from '../../services/auth.service'; // Make sure this path is correct for your project structure
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule, 
    CommonModule, 
    RouterModule,
    HttpClientModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  loading = false;
  errorMessage = '';
  
  constructor(
    private fb: FormBuilder, 
    private router: Router,
    private authService: AuthService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    // If user is already logged in, redirect to appropriate dashboard
    if (this.authService.isLoggedIn()) {
      this.redirectBasedOnRole(this.authService.currentUserValue?.role);
    }
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      return;
    }

    const { email, password, role } = this.loginForm.value;
    this.loading = true;
    this.errorMessage = '';

    console.log(`Attempting to login with email: ${email} and role: ${role}`);

    this.authService.login(email, password)
      .pipe(
        catchError(error => {
          console.error('Login error details:', error);
          if (error.error && error.error.message) {
            this.errorMessage = error.error.message;
          } else if (error.status === 404) {
            this.errorMessage = 'Login failed: API endpoint not found. Please contact support.';
          } else {
            this.errorMessage = 'Login failed. Please check your credentials and try again.';
          }
          return of(null);
        }),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe(response => {
        if (response) {
          // Successful login
          console.log('Login successful:', response);
          
          // Check if the returned role matches the selected role
          if (response.role && response.role !== role) {
            this.errorMessage = `You attempted to login as a ${role}, but your account is registered as a ${response.role}.`;
            this.authService.logout(); // Log them out since roles don't match
            return;
          }
          
          // Redirect based on role
          this.redirectBasedOnRole(role);
        }
      });
  }

  private redirectBasedOnRole(role?: string): void {
    switch (role) {
      case 'admin':
        this.router.navigate(['/admin-dashboard']);
        break;
      case 'employer':
        this.router.navigate(['/employer-dashboard']);
        break;
      case 'jobseeker':
        this.router.navigate(['/jobseeker-dashboard']);
        break;
      default:
        this.router.navigate(['/landing']);
    }
  }
}