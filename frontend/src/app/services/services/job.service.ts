import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, map, catchError } from 'rxjs/operators';
import { AuthService } from '../auth.service';
import { environment } from '../../environments/environments';

export interface Job {
  job_id?: number;
  company_id: number;
  title: string;
  description: string;
  location: string;
  is_remote: boolean;
  status: string;
  salary_range: string;
  job_type: string;
  requirements?: string;
  company_name?: string;
  created_at?: string;
  updated_at?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class JobsService {
  private apiUrl = `'http://51.20.121.18/api'}/jobs`;
  private jobsSubject = new BehaviorSubject<Job[]>([]);
  public jobs$ = this.jobsSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  // Get all jobs with optional filters
  getJobs(filters?: { location?: string; title?: string; company?: string }): Observable<Job[]> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.location) params = params.set('location', filters.location);
      if (filters.title) params = params.set('title', filters.title);
      if (filters.company) params = params.set('company', filters.company);
    }

    return this.http.get<ApiResponse<Job[]>>(this.apiUrl, { params }).pipe(
      map(response => response.data),
      tap(jobs => this.jobsSubject.next(jobs)),
      catchError(error => {
        console.error('Error fetching jobs:', error);
        throw error;
      })
    );
  }

  // Get job by ID
  getJobById(id: number): Observable<Job> {
    return this.http.get<ApiResponse<Job>>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.data),
      catchError(error => {
        console.error(`Error fetching job with ID ${id}:`, error);
        throw error;
      })
    );
  }

  // Create a new job
  createJob(job: Omit<Job, 'job_id'>): Observable<Job> {
    const headers = this.getAuthHeaders();
    return this.http.post<ApiResponse<Job>>(this.apiUrl, job, { headers }).pipe(
      map(response => response.data),
      tap(newJob => {
        const currentJobs = this.jobsSubject.value;
        this.jobsSubject.next([newJob, ...currentJobs]);
      }),
      catchError(error => {
        console.error('Error creating job:', error);
        throw error;
      })
    );
  }

  // Update an existing job
  updateJob(id: number, job: Partial<Job>): Observable<Job> {
    const headers = this.getAuthHeaders();
    return this.http.put<ApiResponse<Job>>(`${this.apiUrl}/${id}`, job, { headers }).pipe(
      map(response => response.data),
      tap(updatedJob => {
        const currentJobs = this.jobsSubject.value;
        const index = currentJobs.findIndex(j => j.job_id === updatedJob.job_id);
        if (index !== -1) {
          const updatedJobs = [...currentJobs];
          updatedJobs[index] = updatedJob;
          this.jobsSubject.next(updatedJobs);
        }
      }),
      catchError(error => {
        console.error(`Error updating job with ID ${id}:`, error);
        throw error;
      })
    );
  }

  // Delete a job
  deleteJob(id: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/${id}`, { headers }).pipe(
      tap(() => {
        const currentJobs = this.jobsSubject.value;
        this.jobsSubject.next(currentJobs.filter(job => job.job_id !== id));
      }),
      catchError(error => {
        console.error(`Error deleting job with ID ${id}:`, error);
        throw error;
      })
    );
  }

  // Helper method to get companies for dropdown
  getUserCompanies(): Observable<any[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<ApiResponse<any[]>>(`${environment.apiUrl}/companies/my-companies`, { headers }).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Error fetching user companies:', error);
        throw error;
      })
    );
  }

  // Helper method to set auth headers
  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }
}