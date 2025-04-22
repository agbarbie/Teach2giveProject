import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { HttpClientModule } from '@angular/common/http';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterModule, HttpClientModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  loading = false;
  submitted = false;
  errorMessage = '';
  showPassword = false;
  roles = ['jobseeker', 'employer', 'admin'];
  
  constructor(
    private fb: FormBuilder, 
    private router: Router,
    private authService: AuthService
  ) {
    // Initialize form with validators
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['jobseeker', Validators.required]
    });
  }

  ngOnInit(): void {
    // Check if user is already logged in
    const currentUser = this.authService.currentUserValue;
    
    // Only redirect if user is logged in AND has a valid role
    if (currentUser && this.authService.isLoggedIn() && currentUser.role) {
      console.log('User already logged in with role:', currentUser.role);
      // Redirect to appropriate dashboard based on role
      this.redirectToDashboard(currentUser.role);
    } else {
      console.log('User not logged in or missing role, staying on login page');
    }
  }

  // Getter for easy access to form fields
  get f() { 
    return this.loginForm.controls; 
  }

  onSubmit() {
    this.submitted = true;
    this.errorMessage = '';
    
    // Stop here if form is invalid
    if (this.loginForm.invalid) {
      return;
    }

    const { email, password, role } = this.loginForm.value;
    this.loading = true;

    this.authService.login(email, password)
      .pipe(
        catchError(error => {
          console.error('Login error:', error);
          this.errorMessage = error.error?.message || 'Login failed. Please check your credentials and try again.';
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
            return;
          }
          
          // Store the user data
          this.authService.setUserData(response); // Store user data
          
          // Redirect based on role
          this.redirectToDashboard(role || response.role);
        }
      });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  redirectToDashboard(role: string): void {
    console.log('Redirecting to dashboard:', role);
    
    // If no role or invalid role, stay on login page
    if (!role) {
      console.log('No role provided, staying on login page');
      return;
    }
    
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
        console.log('Invalid role, staying on login page');
        // Stay on login page for invalid roles
    }
  }
  
  goToSignup() {
    this.router.navigate(['/signup']);
  }
  
  goToForgotPassword() {
    this.router.navigate(['/forgot-password']);
  }
}