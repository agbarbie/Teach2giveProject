"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isTokenNearExpiry = exports.formatSuccess = exports.formatError = exports.calculateMatchPercentage = exports.isValidEmail = exports.verifyToken = exports.generateToken = exports.comparePassword = exports.hashPassword = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
/**
 * Hashes a password
 */
const hashPassword = async (password) => {
    const salt = await bcryptjs_1.default.genSalt(10);
    return bcryptjs_1.default.hash(password, salt);
};
exports.hashPassword = hashPassword;
/**
 * Compare password with hashed password
 */
const comparePassword = async (password, hashedPassword) => {
    return bcryptjs_1.default.compare(password, hashedPassword);
};
exports.comparePassword = comparePassword;
/**
 * Generate JWT token
 */
/**
 * Generate JWT token
 */
const generateToken = (userId, roleId) => {
    const jwtSecret = process.env.JWT_SECRET;
    const refreshSecret = process.env.REFRESH_TOKEN_SECRET;
    if (!jwtSecret || !refreshSecret) {
        throw new Error("JWT_SECRET or REFRESH_TOKEN_SECRET is not defined in environment variables");
    }
    try {
        // Generate a short-lived access token (15 minutes)
        const accessToken = jsonwebtoken_1.default.sign({ userId, roleId }, jwtSecret, { expiresIn: "15m" });
        // Generate a long-lived refresh token (30 days)
        const refreshToken = jsonwebtoken_1.default.sign({ userId }, refreshSecret, { expiresIn: "30d" });
        // Return the tokens directly
        return { accessToken, refreshToken };
    }
    catch (error) {
        console.error("Error generating JWT:", error);
        throw new Error("Error generating authentication tokens");
    }
};
exports.generateToken = generateToken;
/**
 * Verify JWT token with better error handling
 */
const verifyToken = (token) => {
    try {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new Error('JWT_SECRET is not defined in environment variables');
        }
        return jsonwebtoken_1.default.verify(token, secret);
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            console.log('Token expired:', error.expiredAt);
        }
        else if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            console.log('JWT error:', error.message);
        }
        else {
            console.log('Unexpected token verification error:', error);
        }
        return null;
    }
};
exports.verifyToken = verifyToken;
/**
 * Validate email format
 */
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
exports.isValidEmail = isValidEmail;
/**
 * Calculate match percentage between job skills and user skills
 */
const calculateMatchPercentage = (jobSkills, userSkills) => {
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
        if (jobSkill.importance_level === 'required')
            importanceWeight = 3;
        else if (jobSkill.importance_level === 'preferred')
            importanceWeight = 2;
        maxPossibleScore += 3 * importanceWeight; // Maximum possible points per skill
        // Check if user has the skill
        if (userSkillsMap.has(jobSkill.skill_id)) {
            const proficiency = userSkillsMap.get(jobSkill.skill_id);
            // Calculate points based on proficiency
            let proficiencyPoints = 1; // beginner
            if (proficiency === 'intermediate')
                proficiencyPoints = 2;
            else if (proficiency === 'advanced' || proficiency === 'expert')
                proficiencyPoints = 3;
            totalScore += proficiencyPoints * importanceWeight;
        }
    });
    // Avoid division by zero
    if (maxPossibleScore === 0)
        return 0;
    // Calculate percentage and round to nearest integer
    return Math.round((totalScore / maxPossibleScore) * 100);
};
exports.calculateMatchPercentage = calculateMatchPercentage;
/**
 * Format error response
 */
const formatError = (message, code = 400) => {
    return {
        status: 'error',
        code,
        message
    };
};
exports.formatError = formatError;
/**
 * Format success response
 */
const formatSuccess = (data, message = 'Success') => {
    return {
        status: 'success',
        message,
        data
    };
};
exports.formatSuccess = formatSuccess;
/**
 * Check if token is about to expire and needs refreshing
 * Returns true if token will expire within the specified threshold (default 5 minutes)
 */
const isTokenNearExpiry = (token, thresholdMinutes = 5) => {
    try {
        const decoded = jsonwebtoken_1.default.decode(token);
        if (!decoded || !decoded.exp)
            return true;
        const expiryTime = decoded.exp * 1000; // Convert to milliseconds
        const currentTime = Date.now();
        const timeUntilExpiry = expiryTime - currentTime;
        // Return true if token expires within threshold minutes
        return timeUntilExpiry < thresholdMinutes * 60 * 1000;
    }
    catch (error) {
        // If we can't decode the token, assume it needs refreshing
        return true;
    }
};
exports.isTokenNearExpiry = isTokenNearExpiry;
