import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-jobseeker-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './jobseeker-settings.component.html',
  styleUrls: ['./jobseeker-settings.component.css']
})
export class JobseekerSettingsComponent {
  jobPreferences: string[] = [];

  toggleJobPreference(pref: string): void {
    const index = this.jobPreferences.indexOf(pref);
    if (index > -1) {
      this.jobPreferences.splice(index, 1);
    } else {
      this.jobPreferences.push(pref);
    }
  }

  // Account Preferences
  profileVisibility = 'public';
  researchPrivacy = true;
  // Removed duplicate declaration of jobPreferences

  // Security Settings
  twoFactorEnabled = false;
  passwordLastChanged = '30 days ago';
  privacyProtocol = 'Always Manage v1.0';
  shareboardEnabled = false;

  // Notification Settings
  emailNotifications = true;
  searchAlerts = true;

  // Preferences
  language = 'English';
  timeZone = 'UTC-5 (Eastern Time)';

  // Generator Design
  jobPricingPrivacy = true;
  brandCustomization = false;
  automaticRequests = true;
  cardlessTracking = false;
  incentiveAnalytics = true;

  // Team & Security
  teamAccessLevel = 'basic';
  treeFactorAuth = false;
  notificationPreferences = {
    emailUsers: true,
    timeZone: 'UTC-5 (Eastern Time)'
  };

  languages = ['English', 'Spanish', 'French', 'German'];
  timeZones = ['UTC-5 (Eastern Time)', 'UTC-8 (Pacific Time)', 'UTC (GMT)', 'UTC+1 (Central Europe)'];
}
