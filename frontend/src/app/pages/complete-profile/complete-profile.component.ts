import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-complete-profile',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './complete-profile.component.html',
  styleUrls: ['./complete-profile.component.css']
})
export class CompleteProfileComponent {
  currentStep = 1;
  totalSteps = 4;
  
  // Form groups for each step
  personalInfoForm: FormGroup;
  experienceForm: FormGroup;
  skillsForm: FormGroup;
  educationForm: FormGroup;

  // Sample data
  experiences: any[] = [];
  skills: string[] = ['Angular', 'TypeScript', 'HTML/CSS'];
  educationItems: any[] = [];

  constructor(private fb: FormBuilder, private router: Router) {
    // Initialize forms
    this.personalInfoForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      location: ['', Validators.required],
      headline: ['', Validators.required]
    });

    this.experienceForm = this.fb.group({
      company: [''],
      position: [''],
      startDate: [''],
      endDate: [''],
      description: ['']
    });

    this.skillsForm = this.fb.group({
      newSkill: ['']
    });

    this.educationForm = this.fb.group({
      institution: [''],
      degree: [''],
      fieldOfStudy: [''],
      startDate: [''],
      endDate: ['']
    });
  }

  nextStep() {
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
    }
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  addExperience() {
    if (this.experienceForm.valid) {
      this.experiences.push(this.experienceForm.value);
      this.experienceForm.reset();
    }
  }

  addSkill() {
    const newSkill = this.skillsForm.get('newSkill')?.value;
    if (newSkill && !this.skills.includes(newSkill)) {
      this.skills.push(newSkill);
      this.skillsForm.get('newSkill')?.reset();
    }
  }

  addEducation() {
    if (this.educationForm.valid) {
      this.educationItems.push(this.educationForm.value);
      this.educationForm.reset();
    }
  }

  removeSkill(skill: string) {
    this.skills = this.skills.filter(s => s !== skill);
  }

  removeExperience(index: number) {
    this.experiences.splice(index, 1);
  }

  removeEducation(index: number) {
    this.educationItems.splice(index, 1);
  }

  completeProfile() {
    // Submit all data
    const profileData = {
      personalInfo: this.personalInfoForm.value,
      experiences: this.experiences,
      skills: this.skills,
      education: this.educationItems
    };
    
    console.log('Profile completed:', profileData);
    this.router.navigate(['/dashboard']);
  }
}