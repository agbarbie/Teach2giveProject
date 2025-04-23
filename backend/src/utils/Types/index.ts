export interface User {
  id: number;
  email: string;
  password: string;
  role: 'jobseeker' | 'employer' | 'admin';
  created_at: Date;
  updated_at: Date;
}

export interface JobSeekerProfile {
  id: number;
  user_id: number;
  full_name: string;
  profile_picture?: string;
  resume_url?: string;
  bio?: string;
  location?: string;
  experience_years?: number;
  created_at: Date;
  updated_at: Date;
}

export interface Company {
  id: number;
  owner_id: number;
  name: string;
  description?: string;
  website_url?: string;
  logo_url?: string;
  industry?: string;
  website?: string;
  location?: string;
  size?: string;
  created_at: Date;
  updated_at: Date;
}


export interface Job {
  id: number;
  company_id: number;
  title: string;
  description: string;
  requirements: string;
  location: string;
  salary_range?: string;
  job_type: 'full-time' | 'part-time' | 'contract' | 'internship' | 'remote';
  experience_level?: string;
  status: 'open' | 'closed' | 'draft';
  created_at: Date;
  updated_at: Date;
}

export interface Skill {
  id: number;
  name: string;
  category: string;
  created_at: Date;
  updated_at: Date;
}

export interface UserSkill {
  id: number;
  user_id: number;
  skill_id: number;
  proficiency_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  years_experience?: number;
  created_at: Date;
}

export interface JobSkill {
  id: number;
  job_id: number;
  skill_id: number;
  importance_level: 'required' | 'preferred' | 'bonus';
  created_at: Date;
}

export interface JobMatch {
  id: number;
  job_id: number;
  user_id: number;
  match_percentage: number;
  status: 'pending' | 'viewed' | 'saved' | 'applied';
  created_at: Date;
  updated_at: Date;
}

export interface Application {
  id: number;
  job_id: number;
  user_id: number;
  cover_letter?: string;
  status: 'pending' | 'reviewing' | 'interview' | 'rejected' | 'accepted';
  created_at: Date;
  updated_at: Date;
}

export interface InterviewRequest {
  id: number;
  application_id: number;
  proposed_date: Date;
  duration_minutes: number;
  interview_type: 'phone' | 'video' | 'in-person';
  location_or_link?: string;
  notes?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'rescheduled';
  created_at: Date;
  updated_at: Date;
}

export interface LearningResource {
  id: number;
  title: string;
  description: string;
  type: 'course' | 'book' | 'video' | 'article' | 'other';
  url: string;
  skill_id: number;
  created_at: Date;
  updated_at: Date;
}

export interface DecodedUser {
  id: number;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export interface RequestWithUser extends Request {
  user?: {
    id: number;
    role: string;
  };
  query?: {
    status?: string;
    minPercentage?: string;
  };
  params: {
    [key: string]: string;
  };
  body: any; 
  headers: Headers & {
    authorization?: string;
  };
}
