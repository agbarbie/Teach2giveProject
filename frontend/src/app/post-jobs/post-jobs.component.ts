import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { JobsService } from '../services/services/job.service';
import { AuthService } from '../services/auth.service';
import { catchError, finalize, of } from 'rxjs';

@Component({
  selector: 'app-post-jobs',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, FormsModule],
  templateUrl: './post-jobs.component.html',
  styleUrls: ['./post-jobs.component.css']
})
export class PostJobsComponent implements OnInit {
  jobForm!: FormGroup;
  jobTypes = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Remote'];
  userCompanies: any[] = [];
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';
  
  constructor(
    private fb: FormBuilder,
    private router: Router,
    private jobsService: JobsService,
    private authService: AuthService
  ) {}
  
  ngOnInit(): void {
    this.loadUserCompanies();
    this.initializeForm();
  }
  
  // Load companies owned by the current user
  private loadUserCompanies(): void {
    this.jobsService.getUserCompanies().subscribe({
      next: (companies) => {
        this.userCompanies = companies;
        
        // If companies are available, set the first one as default
        if (this.userCompanies.length > 0) {
          this.jobForm?.get('company_id')?.setValue(this.userCompanies[0].company_id);
        }
      },
      error: (error) => {
        console.error('Error loading companies:', error);
        this.errorMessage = 'Unable to load your companies. Please try again later.';
      }
    });
  }

  // Initialize the form with validation
  private initializeForm(): void {
    this.jobForm = this.fb.group({
      company_id: ['', Validators.required],
      title: ['', [Validators.required, Validators.minLength(5)]],
      description: ['', [Validators.required, Validators.minLength(20)]],
      requirements: ['', [Validators.required, Validators.minLength(20)]],
      salary_range: ['', Validators.required],
      location: ['', Validators.required],
      is_remote: [false],
      job_type: ['Full-time', Validators.required],
      status: ['open']
    });
  }

  // Toggle remote status
  toggleRemote(): void {
    const isRemoteControl = this.jobForm.get('is_remote');
    isRemoteControl?.setValue(!isRemoteControl.value);
  }

  // Handle form submission
  onSubmit(): void {
    if (this.jobForm.invalid) {
      this.jobForm.markAllAsTouched();
      this.errorMessage = 'Please fill in all required fields correctly.';
      return;
    }
    
    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';
    
    // Create job object from form
    const newJob = this.prepareJobData();
    
    // Send to backend
    this.jobsService.createJob(newJob).pipe(
      catchError(error => {
        this.errorMessage = error.error?.message || 'Failed to create job. Please try again.';
        return of(null);
      }),
      finalize(() => {
        this.isSubmitting = false;
      })
    ).subscribe(result => {
      if (result) {
        this.successMessage = 'Job created successfully!';
        setTimeout(() => this.router.navigate(['/jobs']), 1500);
      }
    });
  }

  // Prepare job data for API
  private prepareJobData(): any {
    const formData = this.jobForm.value;
    return {
      company_id: formData.company_id,
      title: formData.title,
      description: formData.description + '\n\nRequirements:\n' + formData.requirements,
      location: formData.location,
      is_remote: formData.is_remote,
      status: formData.status,
      salary_range: formData.salary_range,
      job_type: formData.job_type
    };
  }

  // Cancel and navigate back
  onCancel(): void {
    this.router.navigate(['/jobs']);
  }

  // General navigation method
  navigateTo(path: string): void {
    this.router.navigate([path]);
  }

  // Form control getter for template
  get f() {
    return this.jobForm.controls;
  }
}