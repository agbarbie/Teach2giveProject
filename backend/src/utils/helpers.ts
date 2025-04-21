import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, DecodedUser } from '../utils/Types/index';

/**
 * Hashes a password
 */
export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

/**
 * Compare password with hashed password
 */
export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

/**
 * Generate JWT token
 */
export const generateToken = (user: Partial<User>): string => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET as string,
    {
      expiresIn: process.env.JWT_EXPIRES_IN ? parseInt(process.env.JWT_EXPIRES_IN, 10) : undefined
    }
  );
};

/**
 * Verify JWT token
 */
export const verifyToken = (token: string): DecodedUser => {
  return jwt.verify(token, process.env.JWT_SECRET as string) as DecodedUser;
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Calculate match percentage between job skills and user skills
 */
export const calculateMatchPercentage = (
  jobSkills: { skill_id: number; importance_level: string }[],
  userSkills: { skill_id: number; proficiency_level: string }[]
): number => {
  // Convert user skills to a map for easier lookup
  const userSkillsMap = new Map();
  userSkills.forEach(skill => {
    userSkillsMap.set(skill.skill_id, skill.proficiency_level);
  });

  let totalScore = 0;
  let maxPossibleScore = 0;

  jobSkills.forEach(jobSkill => {
    // Weigh skills by importance
    let importanceWeight = 1;
    if (jobSkill.importance_level === 'required') importanceWeight = 3;
    else if (jobSkill.importance_level === 'preferred') importanceWeight = 2;
    
    maxPossibleScore += 3 * importanceWeight; // Maximum possible points per skill
    
    // Check if user has the skill
    if (userSkillsMap.has(jobSkill.skill_id)) {
      const proficiency = userSkillsMap.get(jobSkill.skill_id);
      
      // Calculate points based on proficiency
      let proficiencyPoints = 1; // beginner
      if (proficiency === 'intermediate') proficiencyPoints = 2;
      else if (proficiency === 'advanced' || proficiency === 'expert') proficiencyPoints = 3;
      
      totalScore += proficiencyPoints * importanceWeight;
    }
  });

  // Avoid division by zero
  if (maxPossibleScore === 0) return 0;
  
  // Calculate percentage and round to nearest integer
  return Math.round((totalScore / maxPossibleScore) * 100);
};

/**
 * Format error response
 */
export const formatError = (message: string, code: number = 400) => {
  return {
    status: 'error',
    code,
    message
  };
};

/**
 * Format success response
 */
export const formatSuccess = (data: any, message: string = 'Success') => {
  return {
    status: 'success',
    message,
    data
  };
};