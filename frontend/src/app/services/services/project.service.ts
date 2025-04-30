import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private apiUrl = 'http://51.20.121.18/api/portfolio';
  
  constructor(private http: HttpClient) { }

  // Helper method to get auth token
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // PUBLIC ROUTES
  
  // Get jobseeker's projects by user ID (for employers to view)
  getJobseekerProjectsByUserId(userId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/users/${userId}/projects`);
  }
  
  // PROTECTED ROUTES FOR JOBSEEKERS
  
  // Get current user's projects
  getUserProjects(): Observable<any> {
    return this.http.get(`${this.apiUrl}/users/projects`, { headers: this.getAuthHeaders() });
  }
  
  // Add project to user profile
  addUserProject(projectData: {
    title: string,
    description: string,
    start_date: string,
    end_date?: string,
    project_url?: string,
    image_url?: string,
    technologies: string[] // Array of tech stack items
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/users/projects`, projectData, { headers: this.getAuthHeaders() });
  }
  
  // Update user project
  updateUserProject(projectId: number, updateData: {
    title?: string,
    description?: string,
    start_date?: string,
    end_date?: string,
    project_url?: string,
    image_url?: string,
    technologies?: string[]
  }): Observable<any> {
    return this.http.put(`${this.apiUrl}/users/projects/${projectId}`, updateData, { headers: this.getAuthHeaders() });
  }
  
  // Delete user project
  deleteUserProject(projectId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/users/projects/${projectId}`, { headers: this.getAuthHeaders() });
  }
}