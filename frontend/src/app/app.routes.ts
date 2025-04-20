import { Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LoginComponent } from './pages/login/login.component';
import { SignupComponent } from './pages/signup/signup.component';
import { JobseekerDashboardComponent } from './components/job-seeker-dashboard/job-seeker-dashboard.component';
import { EmployerDashboardComponent } from './components/employer-dashboard/employer-dashboard.component';
import { LandingComponent } from './pages/landing/landing.component';
import { ContactComponent } from './pages/contact/contact.component';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';
import { AiAssistantComponent } from './pages/ai-assistant/ai-assistant.component';
import { AnalyticsComponent } from './pages/analytics/analytics.component';
import { JobsComponent } from './jobs/jobs.component';
import {JobApplicationForm} from './pages/job-application-form/job-application-form.component'
import { CandidatesComponent } from './pages/candidates/candidates.component';
import {JobSeekerProfileComponent} from './pages/jobseeker-profile/jobseeker-profile.component';
import { PostJobsComponent } from './post-jobs/post-jobs.component';
import { CompanyComponent } from './pages/company/company.component';
import { CompleteProfileComponent } from './pages/complete-profile/complete-profile.component';
import { AdminSettingsComponent } from './pages/admin-settings/admin-settings.component';
import { EmployerSettingsComponent } from './pages/employer-settings/employer-settings.component';
import { JobseekerSettingsComponent } from './pages/jobseeker-settings/jobseeker-settings.component';
import { PortfolioComponent } from './pages/portfolio/portfolio.component';

export const routes: Routes = [
  { path: '', redirectTo: 'landing', pathMatch: 'full' },
  {path: 'portfolio', component: PortfolioComponent},
  {path: 'admin-settings', component: AdminSettingsComponent},
  {path: 'employer-settings', component: EmployerSettingsComponent},
  {path: 'jobseeker-settings', component: JobseekerSettingsComponent},
  { path: 'ai-assistant', component: AiAssistantComponent, data: { title: 'AI Assistant' } },
  { path: 'post-jobs', component: PostJobsComponent, data: { title: 'Post Jobs' } },
  { path: 'jobseeker-profile', component: JobSeekerProfileComponent, data: { title: 'Job Seeker Profile' } },
  { path: 'candidates', component: CandidatesComponent, data: { title: 'Candidates Overview' } },
  { path: 'landing', component: LandingComponent },
  { path: 'job-application-form', component: JobApplicationForm, data: { title: 'Job Application Form' } },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  // Add these new routes:
  { path: 'complete-profile', component: CompleteProfileComponent },
  { path: 'company', component: CompanyComponent },
  { path: 'jobseeker-dashboard', component: JobseekerDashboardComponent, data: { title: 'JobSeeker Dashboard' } },
  { path: 'employer-dashboard', component: EmployerDashboardComponent, data: { title: 'Employer Dashboard' } },
  { path: 'jobs', component: JobsComponent },
  { path: 'contact', component: ContactComponent },
  { path: 'analytics', component: AnalyticsComponent },
  { 
    path: 'admin-dashboard', 
    component: AdminDashboardComponent,
    data: { title: 'Admin Dashboard' },
    children: [
      { path: 'ai-assistant', component: AiAssistantComponent },
      { path: 'analytics', component: AnalyticsComponent },
      { path: '', redirectTo: 'users', pathMatch: 'full' }
    ] 
  },
  { path: '**', redirectTo: 'landing' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
