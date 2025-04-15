import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-employer-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './employer-settings.component.html',
  styleUrls: ['./employer-settings.component.css']
})
export class EmployerSettingsComponent {
  // Company Profile
  companyVisibility = true;
  jobPostingPrivacy = false;
  brandCustomization = false;

  // Team & Security
  teamAccessLevel = 'basic';
  twoFactorEnabled = false;
  passwordLastChanged = '30 days ago';

  // Recruitment Tools
  autoResponder = true;
  candidateTracking = true;
  recruitingAnalytics = true;

  // Notification Preferences
  emailAlerts = true;
  timeZone = 'UTC-5 (Eastern Time)';

  timeZones = ['UTC-5 (Eastern Time)', 'UTC-8 (Pacific Time)', 'UTC (GMT)', 'UTC+1 (Central Europe)'];
}