import { Request } from 'express';

/**
 * Core User Type (trimmed to essentials)
 */
export interface User {
  id: string;
  name: string;
  email: string;
  role_id: number;
  role_name: string;
  profile_completed: boolean;
}

export interface UserRequest extends Request {
  user?: User;  
}

export enum UserRole {
  ADMIN = 1,      
  EMPLOYER = 2,
  JOB_SEEKER = 3,
}
export const isUser = (obj: any): obj is User => {
  return obj && typeof obj.user_id === 'number' && typeof obj.email === 'string';
};