import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';


@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [FormsModule, CommonModule,RouterModule],
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

  constructor(private router: Router) {}

  onSubmit() {
    if (this.signupModel.password !== this.signupModel.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }

    console.log('User signed up:', this.signupModel);
    
    // Redirect based on role
    switch(this.signupModel.role) {
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