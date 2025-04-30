import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environments';

@Injectable({
  providedIn: 'root'
})
export class SkillService {
  private apiUrl = 'http://51.20.121.18/api/skills';
  
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
  
  // Get all skills (for dropdown)
  getAllSkills(category?: string): Observable<any> {
    let url = `${this.apiUrl}/skills`;
    if (category) {
      url += `?category=${category}`;
    }
    return this.http.get(url);
  }
  
  // Get skill by ID
  getSkillById(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/skills/${id}`);
  }
  
  // Get all skill categories
  getSkillCategories(): Observable<any> {
    return this.http.get(`${this.apiUrl}/skills/categories`);
  }
  
  // Get jobseeker's skills by user ID (for employers to view)
  getJobseekerSkillsByUserId(userId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/users/${userId}/skills`);
  }
  
  // PROTECTED ROUTES FOR JOBSEEKERS
  
  // Get current user's skills
  getUserSkills(): Observable<any> {
    return this.http.get(`${this.apiUrl}/users/skills`, { headers: this.getAuthHeaders() });
  }
  
  // Add skill to user profile
  addUserSkill(skillData: { skill_id: number, proficiency_level: string, years_experience: number }): Observable<any> {
    return this.http.post(`${this.apiUrl}/users/skills`, skillData, { headers: this.getAuthHeaders() });
  }
  
  // Update user skill
  updateUserSkill(userSkillId: number, updateData: { proficiency_level?: string, years_experience?: number }): Observable<any> {
    return this.http.put(`${this.apiUrl}/users/skills/${userSkillId}`, updateData, { headers: this.getAuthHeaders() });
  }
  
  // Delete user skill
  deleteUserSkill(userSkillId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/users/skills/${userSkillId}`, { headers: this.getAuthHeaders() });
  }
  
  // ADMIN ROUTES
  
  // Create new skill (admin only)
  createSkill(skillData: { skill_name: string, category: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/admin/skills`, skillData, { headers: this.getAuthHeaders() });
  }
  
  // Update existing skill (admin only)
  updateSkill(skillId: number, skillData: { skill_name?: string, category?: string }): Observable<any> {
    return this.http.put(`${this.apiUrl}/admin/skills/${skillId}`, skillData, { headers: this.getAuthHeaders() });
  }
  
  // Delete skill (admin only)
  deleteSkill(skillId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/admin/skills/${skillId}`, { headers: this.getAuthHeaders() });
  }
}