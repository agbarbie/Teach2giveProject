import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { User } from '../../../interfaces/user';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css'],
})
export class AdminDashboardComponent {
  // User Management Data
  users: User[] = [
    {
      id: 1,
      name: 'Barbara Wangui',
      email: 'barbarawangul2002@gmail.com',
      role: 'Admin',
      status: 'Active'
    },
    {
      id: 2,
      name: 'John Doe',
      email: 'john.doe@example.com',
      role: 'Jobseeker',
      status: 'Active'
    },
    {
      id: 3,
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      role: 'Employer',
      status: 'Suspended'
    }
  ];

  // AI Assistant
  aiPrompt: string = '';
  searchQuery: string = '';
  showAddUserModal = false;
  newUser: User = {
    id: 0,
    name: '',
    email: '',
    role: '',
    status: 'Active'
  };

  // System Management Data
  cpuUsage = 78;
  memoryUsage = 65;
  diskUsage = 45;
  systemStatus = 'Operational';
  activeUsers = 1250;
  totalUsers = 15000;
  activeUserCount = 8500;
  newUsersToday = 120;
  avgEngagement = 85;
  totalCompanies = 2800;
  activeCompanies = 1600;
  newCompaniesToday = 45;
  avgResponseRate = 92;
  
  // Memory usage graph data
  memoryUsageGraph = [
    { time: '00:00', usage: 60 },
    { time: '04:00', usage: 40 },
    { time: '08:00', usage: 80 },
    { time: '12:00', usage: 65 },
    { time: '16:00', usage: 75 },
    { time: '20:00', usage: 50 }
  ];

  // System alerts
  systemAlerts = [
    { message: 'High CPU usage detected', time: '10 mins ago', severity: 'high' },
    { message: 'Backup completed successfully', time: '1 hour ago', severity: 'low' },
    { message: 'Database connection timeout', time: '2 hours ago', severity: 'medium' }
  ];

  constructor(public router: Router, public authService: AuthService) {}

  // Navigation Methods
  navigateTo(path: string): void {
    this.router.navigate([path]);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  // User Management Methods
  editUser(user: User): void {
    const index = this.users.indexOf(user);
    if (index > -1) {
      this.users[index] = { ...user };
      console.log('Edited user:', user.name);
    }
  }
  deleteUser(user: User): void {
    const index = this.users.indexOf(user);
    if (index > -1) {
      this.users.splice(index, 1);
      console.log('Deleted user:', user.name);
    }
  }

  toggleUserStatus(user: User): void {
    user.status = user.status === 'Active' ? 'Suspended' : 'Active';
    console.log(`User ${user.name} status changed to ${user.status}`);
  }

  addUser(): void {
    this.showAddUserModal = true;
  }

  closeAddUserModal(): void {
    this.showAddUserModal = false;
    this.resetNewUserForm();
  }

  submitNewUser(): void {
    const newUserWithId = { 
      ...this.newUser, 
      id: this.generateUserId() 
    };
    this.users.push(newUserWithId);
    console.log('Added user:', newUserWithId);
    this.closeAddUserModal();
  }

  private generateUserId(): number {
    return Math.max(...this.users.map(user => user.id), 0) + 1;
  }

  resetNewUserForm(): void {
    this.newUser = { 
      id: 0, 
      name: '', 
      email: '', 
      role: '', 
      status: 'Active' 
    };
  }

  searchUsers(): void {
    console.log('Searching for:', this.searchQuery);
    // Implement search functionality here
  }

  // AI Assistant Methods
  sendAIPrompt(): void {
    if (this.aiPrompt.trim()) {
      console.log('AI Prompt:', this.aiPrompt);
      this.aiPrompt = '';
    }
  }

  // System Management Helper Methods
  getCpuStatusClass(): string {
    return this.cpuUsage > 80 ? 'high' : this.cpuUsage > 60 ? 'medium' : 'normal';
  }

  getMemoryStatusClass(): string {
    return this.memoryUsage > 80 ? 'high' : this.memoryUsage > 60 ? 'medium' : 'normal';
  }

  getAlertClass(severity: string): string {
    return severity.toLowerCase();
  }
}