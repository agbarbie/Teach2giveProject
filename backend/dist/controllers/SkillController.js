"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMatchingJobs = exports.getUserSkills = exports.addSkillToUser = void 0;
const db_config_1 = __importDefault(require("../db/db.config"));
// Add a skill to a user
const addSkillToUser = async (req, res) => {
    try {
        const { user_id, skill_name } = req.body;
        // First check if skill exists, if not insert
        const skillResult = await db_config_1.default.query(`INSERT INTO skills (name)
       VALUES ($1)
       ON CONFLICT (name) DO NOTHING
       RETURNING id`, [skill_name]);
        // Get skill id
        const skillId = skillResult.rows[0]?.id || (await db_config_1.default.query(`SELECT id FROM skills WHERE name = $1`, [skill_name])).rows[0]?.id;
        if (!skillId) {
            res.status(500).json({ message: 'Skill could not be found or created' });
            return;
        }
        // Add skill to user
        await db_config_1.default.query(`INSERT INTO user_skills (user_id, skill_id) VALUES ($1, $2)`, [user_id, skillId]);
        res.status(200).json({ message: 'Skill added to user' });
    }
    catch (error) {
        console.error('Add Skill Error:', error);
        res.status(500).json({ message: 'Server error adding skill' });
    }
};
exports.addSkillToUser = addSkillToUser;
// Get user skills
const getUserSkills = async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await db_config_1.default.query(`SELECT s.name FROM skills s
       INNER JOIN user_skills us ON s.id = us.skill_id
       WHERE us.user_id = $1`, [userId]);
        res.status(200).json(result.rows.map(row => row.name));
    }
    catch (error) {
        console.error('Get Skills Error:', error);
        res.status(500).json({ message: 'Server error fetching user skills' });
    }
};
exports.getUserSkills = getUserSkills;
// Match jobs to user's skills
const getMatchingJobs = async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await db_config_1.default.query(`SELECT DISTINCT j.* FROM jobs j
       JOIN job_skills js ON j.id = js.job_id
       WHERE js.skill_id IN (
         SELECT skill_id FROM user_skills WHERE user_id = $1
       )`, [userId]);
        res.status(200).json(result.rows);
    }
    catch (error) {
        console.error('Match Jobs Error:', error);
        res.status(500).json({ message: 'Server error matching jobs' });
    }
};
exports.getMatchingJobs = getMatchingJobs;
