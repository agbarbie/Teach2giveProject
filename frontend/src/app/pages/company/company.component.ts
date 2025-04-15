import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-company',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './company.component.html',
  styleUrls: ['./company.component.css']
})
export class CompanyComponent {
  companyForm: FormGroup;
  logoFile: File | null = null;
  industries = [
    'Technology',
    'Finance',
    'Healthcare',
    'Education',
    'Retail',
    'Manufacturing',
    'Other'
  ];

  constructor(private fb: FormBuilder, private router: Router) {
    this.companyForm = this.fb.group({
      companyName: ['', Validators.required],
      website: ['', Validators.required],
      industry: ['', Validators.required],
      companyDescription: ['', Validators.required],
      workEmail: ['', [Validators.email]],
      phoneNumber: ['', Validators.required]
    });
  }

  onLogoFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      this.logoFile = input.files[0];
    }
  }

  onSubmit() {
    if (this.companyForm.valid) {
      // Here you would typically send the data to your backend
      console.log({
        ...this.companyForm.value,
        logoFile: this.logoFile
      });
      this.router.navigate(['/employer-dashboard']);
    }
  }
}