import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-settings.component.html',
  styleUrls: ['./admin-settings.component.css']
})
export class AdminSettingsComponent {
  // System Controls
  maintenanceMode = false;
  debugMode = false;
  systemMonitoring = true;

  // Data Management
  automatedBackup = true;
  apiAccess = true;
  backupFrequency = 'daily';

  // Security Settings
  accessControlLevel = 'standard';
  securityAudit = true;
  logRetention = '30 days';

  // System Management
  userRegistration = true;
  contentNotifications = true;
  automationTrace = false;

  backupFrequencies = ['daily', 'weekly', 'monthly'];
  accessLevels = ['basic', 'standard', 'high'];
  logRetentionOptions = ['7 days', '30 days', '90 days', '1 year'];
}