import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginForm: FormGroup;

  constructor(private fb: FormBuilder, private router: Router) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['', Validators.required] // ✅ Added role control
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      const { email, password, role } = this.loginForm.value;
      console.log('Logging in with:', { email, password, role });

      // ✅ Role-based redirection
      switch (role) {
        case 'admin':
          this.router.navigate(['/admin-dashboard']);
          break;
        case 'employer':
          this.router.navigate(['/employers-dashboard']);
          break;
        case 'jobseeker':
          this.router.navigate(['/jobseekers-dashboard']);
          break;
        default:
          this.router.navigate(['/landing']);
      }
    }
  }
}
