import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-auth-screen',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterModule, HttpClientModule],
  templateUrl: './auth-screen.component.html',
  styleUrls: ['./auth-screen.component.css'],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-in', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms ease-out', style({ opacity: 0 }))
      ])
    ])
  ]
})
export class AuthScreenComponent implements OnInit {
  isLoginView = true;
  loginForm: FormGroup;
  signupForm: FormGroup;
  loading = false;
  errorMessage = '';
  roles = ['jobseeker', 'employer', 'admin'];
  showPassword = false;
  activeRole = 'jobseeker';
  
  constructor(
    private fb: FormBuilder, 
    private router: Router,
    private authService: AuthService
  ) {
    // Initialize login form with validators
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['jobseeker', Validators.required]
    });
    
    // Initialize signup form with validators
    this.signupForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
      role: ['jobseeker', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    // Check if user is already logged in
    const currentUser = this.authService.currentUserValue;
    if (currentUser && this.authService.isLoggedIn() && currentUser.role) {
      console.log('User already logged in with role:', currentUser.role);
      this.redirectToDashboard(currentUser.role);
    }
  }

  // Password match validator
  passwordMatchValidator(g: FormGroup) {
    const password = g.get('password')?.value;
    const confirmPassword = g.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { 'mismatch': true };
  }

  // Getter for easy access to login form fields
  get loginF() { 
    return this.loginForm.controls; 
  }
  
  // Getter for easy access to signup form fields
  get signupF() { 
    return this.signupForm.controls; 
  }

  // Switch between login and signup views
  toggleView() {
    this.isLoginView = !this.isLoginView;
    this.errorMessage = '';
    
    // Reset forms when toggling
    if (this.isLoginView) {
      this.loginForm.reset({ role: this.activeRole });
    } else {
      this.signupForm.reset({ role: this.activeRole });
    }
  }

  // Set active role for both forms
  setActiveRole(role: string) {
    this.activeRole = role;
    this.loginForm.patchValue({ role });
    this.signupForm.patchValue({ role });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  onLoginSubmit() {
    this.errorMessage = '';
    
    // Stop here if form is invalid
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
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
          console.log('Login successful:', response);
          
          // Check if the returned role matches the selected role
          if (response.role && response.role !== role) {
            this.errorMessage = `You attempted to login as a ${role}, but your account is registered as a ${response.role}.`;
            return;
          }
          
          // Redirect based on role
          this.redirectToDashboard(role || response.role);
        }
      });
  }

  onSignupSubmit() {
    this.errorMessage = '';
    
    // Stop here if form is invalid
    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();
      return;
    }

    // Check password match
    if (this.signupF['password'].value !== this.signupF['confirmPassword'].value) {
      this.errorMessage = 'Passwords do not match!';
      return;
    }

    const { name, email, password, role } = this.signupForm.value;
    this.loading = true;

    console.log('Registering user with email:', email);

    this.authService.register(email, password, role)
      .pipe(
        catchError(error => {
          console.error('Registration error:', error);
          if (error.error && error.error.message) {
            this.errorMessage = error.error.message;
          } else if (error.status === 404) {
            this.errorMessage = 'Registration failed: API endpoint not found. Please contact support.';
          } else {
            this.errorMessage = 'Registration failed. Please try again later.';
          }
          return of(null);
        }),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe(response => {
        if (response) {
          console.log('User registered successfully:', response);
          this.redirectToDashboard(role);
        }
      });
  }

  redirectToDashboard(role: string): void {
    console.log('Redirecting to dashboard:', role);
    
    if (!role) {
      console.log('No role provided, staying on auth screen');
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
        console.log('Invalid role, navigating to landing page');
        this.router.navigate(['/landing']);
    }
  }
  
  goToForgotPassword() {
    this.router.navigate(['/forgot-password']);
  }
  
  goToLanding() {
    this.router.navigate(['/landing']);
  }
}