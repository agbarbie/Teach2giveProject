import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CertificateService {
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
  
  // Get jobseeker's certificates by user ID (for employers to view)
  getJobseekerCertificatesByUserId(userId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/users/${userId}/certificates`);
  }
  
  // PROTECTED ROUTES FOR JOBSEEKERS
  
  // Get current user's certificates
  getUserCertificates(): Observable<any> {
    return this.http.get(`${this.apiUrl}/users/certificates`, { headers: this.getAuthHeaders() });
  }
  
  // Add certificate to user profile
  addUserCertificate(certificateData: {
    title: string,
    issuer: string,
    issue_date: string,
    expiry_date?: string,
    credential_id?: string,
    credential_url?: string
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/users/certificates`, certificateData, { headers: this.getAuthHeaders() });
  }
  
  // Update user certificate
  updateUserCertificate(certificateId: number, updateData: {
    title?: string,
    issuer?: string,
    issue_date?: string,
    expiry_date?: string,
    credential_id?: string,
    credential_url?: string
  }): Observable<any> {
    return this.http.put(`${this.apiUrl}/users/certificates/${certificateId}`, updateData, { headers: this.getAuthHeaders() });
  }
  
  // Delete user certificate
  deleteUserCertificate(certificateId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/users/certificates/${certificateId}`, { headers: this.getAuthHeaders() });
  }
}