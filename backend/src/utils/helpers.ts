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
/**
 * Generate JWT token
 */
export const generateToken = (userId: string, roleId: number) => {
  const jwtSecret = process.env.JWT_SECRET;
  const refreshSecret = process.env.REFRESH_TOKEN_SECRET;

  if (!jwtSecret || !refreshSecret) {
    throw new Error("JWT_SECRET or REFRESH_TOKEN_SECRET is not defined in environment variables");
  }

  try {
    // Generate a short-lived access token (15 minutes)
    const accessToken = jwt.sign({ userId, roleId }, jwtSecret, { expiresIn: "15m" });

    // Generate a long-lived refresh token (30 days)
    const refreshToken = jwt.sign({ userId }, refreshSecret, { expiresIn: "30d" });

    // Return the tokens directly
    return { accessToken, refreshToken };
  } catch (error) {
    console.error("Error generating JWT:", error);
    throw new Error("Error generating authentication tokens");
  }
};
/**
 * Verify JWT token with better error handling
 */
export const verifyToken = (token: string): DecodedUser | null => {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }
    
    return jwt.verify(token, secret) as DecodedUser;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      console.log('Token expired:', error.expiredAt);
    } else if (error instanceof jwt.JsonWebTokenError) {
      console.log('JWT error:', error.message);
    } else {
      console.log('Unexpected token verification error:', error);
    }
    return null;
  }
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

/**
 * Check if token is about to expire and needs refreshing
 * Returns true if token will expire within the specified threshold (default 5 minutes)
 */
export const isTokenNearExpiry = (token: string, thresholdMinutes: number = 5): boolean => {
  try {
    const decoded = jwt.decode(token) as { exp?: number };
    if (!decoded || !decoded.exp) return true;
    
    const expiryTime = decoded.exp * 1000; // Convert to milliseconds
    const currentTime = Date.now();
    const timeUntilExpiry = expiryTime - currentTime;
    
    // Return true if token expires within threshold minutes
    return timeUntilExpiry < thresholdMinutes * 60 * 1000;
  } catch (error) {
    // If we can't decode the token, assume it needs refreshing
    return true;
  }
};