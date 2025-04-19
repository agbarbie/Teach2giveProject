"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRecommendedSkills = exports.getJobMatchesForUser = void 0;
const db_config_1 = __importDefault(require("../db/db.config"));
// Get job matches for a jobseeker based on their skills
const getJobMatchesForUser = async (req, res, next) => {
    try {
        const { user_id } = req.params;
        // Get user's skills
        const skillsResult = await db_config_1.default.query(`SELECT skill_id FROM jobseeker_skills WHERE jobseeker_id = $1`, [user_id]);
        const skillIds = skillsResult.rows.map(row => row.skill_id);
        if (skillIds.length === 0) {
            res.status(200).json({ message: 'No skills found. Please add skills to get matches.', matches: [] });
            return;
        }
        // Match jobs that require those skills
        const matchResult = await db_config_1.default.query(`
      SELECT DISTINCT j.*
      FROM jobs j
      JOIN job_skills js ON j.id = js.job_id
      WHERE js.skill_id = ANY($1::int[])
      `, [skillIds]);
        res.status(200).json({ matches: matchResult.rows });
    }
    catch (error) {
        next(error); // Pass error to the global error handler
    }
};
exports.getJobMatchesForUser = getJobMatchesForUser;
// Get recommended skills for user based on desired jobs
const getRecommendedSkills = async (req, res, next) => {
    try {
        const { user_id } = req.params;
        // Get current user skills
        const currentSkillsRes = await db_config_1.default.query(`SELECT skill_id FROM jobseeker_skills WHERE jobseeker_id = $1`, [user_id]);
        const userSkillIds = currentSkillsRes.rows.map(row => row.skill_id);
        // Get popular skills from top jobs
        const recommendedSkillsRes = await db_config_1.default.query(`
      SELECT DISTINCT skill_id
      FROM job_skills
      WHERE skill_id NOT IN (
        SELECT skill_id FROM jobseeker_skills WHERE jobseeker_id = $1
      )
      LIMIT 10
      `, [user_id]);
        const recommendedSkills = recommendedSkillsRes.rows;
        res.status(200).json({ recommendedSkills });
    }
    catch (error) {
        next(error); // Pass error to the global error handler
    }
};
exports.getRecommendedSkills = getRecommendedSkills;
