import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  FormControl,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';
import { ProjectService } from '../../services/services/project.service';
import { CertificateService } from '../../services/services/certificate.service';

@Component({
  selector: 'app-job-application-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  providers: [CertificateService],
  templateUrl: './job-application-form.component.html',
  styleUrls: ['./job-application-form.component.css']
})
export class JobApplicationForm implements OnInit {
  applicationForm!: FormGroup;
  selectedCVFile: File | null = null;
  
  constructor(
    private fb: FormBuilder,
    private projectService: ProjectService,
    private certificateService: CertificateService
  ) {}
  
  ngOnInit() {
    this.initForm();
    this.loadUserData();
  }
  
  initForm() {
    this.applicationForm = this.fb.group({
      personalInfo: this.fb.group({
        firstName: ['', Validators.required],
        lastName: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        phone: ['', Validators.required],
        password: ['', [Validators.required, Validators.minLength(6)]]
      }),
      educationInfo: this.fb.group({
        highSchool: [''],
        degree: [''],
        college: ['']
      }),
      skills: this.fb.array([]),
      certificates: this.fb.array([]),
      projects: this.fb.array([]),
      workExperience: [''],
      portfolioUrl: ['']
    });
  }
  
  // Load user's existing data from APIs
  loadUserData() {
    this.loadUserProjects();
    this.loadUserCertificates();
  }
  
  // Load projects from API
  loadUserProjects() {
    this.projectService.getUserProjects().subscribe({
      next: (projects) => {
        // Clear existing projects
        while (this.projects.length) {
          this.projects.removeAt(0);
        }
        
        // Add each project from API
        projects.forEach((project: any) => {
          this.projects.push(this.fb.group({
            id: [project.id], // Store ID for updates
            title: [project.title, Validators.required],
            description: [project.description, Validators.required],
            technologies: [project.technologies ? project.technologies.join(', ') : ''],
            url: [project.project_url || ''],
            startDate: [project.start_date],
            endDate: [project.end_date]
          }));
        });
      },
      error: (err) => {
        console.error('Error loading projects:', err);
      }
    });
  }
  
  // Load certificates from API
  loadUserCertificates() {
    this.certificateService.getUserCertificates().subscribe({
      next: (certificates) => {
        // Clear existing certificates
        while (this.certificates.length) {
          this.certificates.removeAt(0);
        }
        
        // Add each certificate from API
        certificates.forEach((cert: any) => {
          this.certificates.push(this.fb.group({
            id: [cert.id], // Store ID for updates
            name: [cert.title, Validators.required],
            issuer: [cert.issuer, Validators.required],
            issueDate: [cert.issue_date],
            expiryDate: [cert.expiry_date],
            credential: [cert.credential_id],
            credentialUrl: [cert.credential_url]
          }));
        });
      },
      error: (err) => {
        console.error('Error loading certificates:', err);
      }
    });
  }
  
  // Skills management
  get skills(): FormArray {
    return this.applicationForm.get('skills') as FormArray;
  }
  
  addSkill() {
    this.skills.push(new FormControl('', Validators.required));
  }
  
  removeSkill(index: number) {
    this.skills.removeAt(index);
  }
  
  // Certificates management
  get certificates(): FormArray {
    return this.applicationForm.get('certificates') as FormArray;
  }
  
  createCertificateGroup(): FormGroup {
    return this.fb.group({
      id: [null], // For existing certificates
      name: ['', Validators.required],
      issuer: ['', Validators.required],
      issueDate: [''],
      expiryDate: [''],
      credential: [''],
      credentialUrl: ['']
    });
  }
  
  addCertificate() {
    this.certificates.push(this.createCertificateGroup());
  }
  
  removeCertificate(index: number) {
    const certificate = this.certificates.at(index) as FormGroup;
    const certificateId = certificate.get('id')?.value;
    
    if (certificateId) {
      // Delete from API if it exists
      this.certificateService.deleteUserCertificate(certificateId).subscribe({
        next: () => {
          this.certificates.removeAt(index);
        },
        error: (err) => {
          console.error('Error deleting certificate:', err);
        }
      });
    } else {
      // Just remove from form if it's new
      this.certificates.removeAt(index);
    }
  }
  
  // Projects management
  get projects(): FormArray {
    return this.applicationForm.get('projects') as FormArray;
  }
  
  createProjectGroup(): FormGroup {
    return this.fb.group({
      id: [null], // For existing projects
      title: ['', Validators.required],
      description: ['', Validators.required],
      technologies: [''],
      url: [''],
      startDate: [''],
      endDate: ['']
    });
  }
  
  addProject() {
    this.projects.push(this.createProjectGroup());
  }
  
  removeProject(index: number) {
    const project = this.projects.at(index) as FormGroup;
    const projectId = project.get('id')?.value;
    
    if (projectId) {
      // Delete from API if it exists
      this.projectService.deleteUserProject(projectId).subscribe({
        next: () => {
          this.projects.removeAt(index);
        },
        error: (err) => {
          console.error('Error deleting project:', err);
        }
      });
    } else {
      // Just remove from form if it's new
      this.projects.removeAt(index);
    }
  }
  
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedCVFile = file;
    }
  }
  
  submitApplication() {
    if (this.applicationForm.valid) {
      // Process and submit certificate data
      this.submitCertificates();
      
      // Process and submit project data
      this.submitProjects();
      
      // For the rest of the form data, you'd make additional API calls
      const formData = {
        ...this.applicationForm.value,
        cv: this.selectedCVFile
      };
      console.log('Submitting application:', formData);
    } else {
      // Mark all fields as touched to trigger validation messages
      this.markFormGroupTouched(this.applicationForm);
    }
  }
  
  // Submit certificates (create new ones and update existing ones)
  submitCertificates() {
    const certificateForms = this.certificates.controls as FormGroup[];
    
    certificateForms.forEach(certForm => {
      const certId = certForm.get('id')?.value;
      const certData = {
        title: certForm.get('name')?.value,
        issuer: certForm.get('issuer')?.value,
        issue_date: certForm.get('issueDate')?.value,
        expiry_date: certForm.get('expiryDate')?.value,
        credential_id: certForm.get('credential')?.value,
        credential_url: certForm.get('credentialUrl')?.value
      };
      
      if (certId) {
        // Update existing certificate
        this.certificateService.updateUserCertificate(certId, certData).subscribe({
          next: (response) => {
            console.log('Certificate updated:', response);
          },
          error: (err) => {
            console.error('Error updating certificate:', err);
          }
        });
      } else {
        // Create new certificate
        this.certificateService.addUserCertificate(certData).subscribe({
          next: (response) => {
            console.log('Certificate created:', response);
            // Update form with new ID
            certForm.patchValue({ id: response.id });
          },
          error: (err) => {
            console.error('Error creating certificate:', err);
          }
        });
      }
    });
  }
  
  // Submit projects (create new ones and update existing ones)
  submitProjects() {
    const projectForms = this.projects.controls as FormGroup[];
    
    projectForms.forEach(projectForm => {
      const projectId = projectForm.get('id')?.value;
      // Split comma-separated technologies into an array
      const techStr = projectForm.get('technologies')?.value;
      const technologies = techStr ? techStr.split(',').map((tech: string) => tech.trim()) : [];
      
      const projectData = {
        title: projectForm.get('title')?.value,
        description: projectForm.get('description')?.value,
        start_date: projectForm.get('startDate')?.value,
        end_date: projectForm.get('endDate')?.value,
        project_url: projectForm.get('url')?.value,
        technologies: technologies
      };
      
      if (projectId) {
        // Update existing project
        this.projectService.updateUserProject(projectId, projectData).subscribe({
          next: (response) => {
            console.log('Project updated:', response);
          },
          error: (err) => {
            console.error('Error updating project:', err);
          }
        });
      } else {
        // Create new project
        this.projectService.addUserProject(projectData as any).subscribe({
          next: (response) => {
            console.log('Project created:', response);
            // Update form with new ID
            projectForm.patchValue({ id: response.id });
          },
          error: (err) => {
            console.error('Error creating project:', err);
          }
        });
      }
    });
  }
  
  // Helper method to mark all controls in a form group as touched
  markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
}