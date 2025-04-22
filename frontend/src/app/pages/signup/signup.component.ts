import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { AuthService } from '../../services/auth.service'; // Ensure this path is correct
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterModule, HttpClientModule],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent {
  signupModel = {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'jobseeker'
  };
  
  loading = false;
  errorMessage = '';

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  onSubmit() {
    // Password validation
    if (this.signupModel.password !== this.signupModel.confirmPassword) {
      this.errorMessage = 'Passwords do not match!';
      return;
    }

    // Check for missing fields
    if (!this.signupModel.email || !this.signupModel.password || !this.signupModel.role) {
      this.errorMessage = 'Please fill in all required fields!';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    
    console.log('Registering user with email:', this.signupModel.email);

    // Use AuthService to register the user
    this.authService.register(
      this.signupModel.email,
      this.signupModel.password,
      this.signupModel.role
    ).pipe(
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
    ).subscribe(response => {
      if (response) {
        console.log('User registered successfully:', response);
        
        // Store the user data with AuthService
        // The handleAuthentication method in AuthService should already take care of this
        
        // Redirect based on role
        this.redirectBasedOnRole(this.signupModel.role);
      }
    });
  }

  private redirectBasedOnRole(role: string): void {
    switch (role) {
      case 'jobseeker':
        this.router.navigate(['/jobseeker-dashboard']);
        break;
      case 'employer':
        this.router.navigate(['/employer-dashboard']);
        break;
      case 'admin':
        this.router.navigate(['/admin-dashboard']);
        break;
      default:
        this.router.navigate(['/landing']);
    }
  }
}