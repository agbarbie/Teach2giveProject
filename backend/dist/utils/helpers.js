"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatSuccess = exports.formatError = exports.calculateMatchPercentage = exports.isValidEmail = exports.verifyToken = exports.generateToken = exports.comparePassword = exports.hashPassword = void 0;
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
const generateToken = (user) => {
    return jsonwebtoken_1.default.sign({
        id: user.id,
        email: user.email,
        role: user.role
    }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN ? parseInt(process.env.JWT_EXPIRES_IN, 10) : undefined
    });
};
exports.generateToken = generateToken;
/**
 * Verify JWT token
 */
const verifyToken = (token) => {
    return jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
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
