import db from '../db/db.config';
import { Request, Response } from 'express';

// Get learning resources based on recommended skills for a user
const getLearningResources = async (req: Request, res: Response): Promise<void> => {
  try {
    const { user_id } = req.params;

    // Get recommended skills (skills not already learned by the jobseeker)
    const recommendedSkillsRes = await db.query(
      `
      SELECT DISTINCT skill_id
      FROM job_skills
      WHERE skill_id NOT IN (
        SELECT skill_id FROM jobseeker_skills WHERE jobseeker_id = $1
      )
      `,
      [user_id]
    );

    const recommendedSkillIds = recommendedSkillsRes.rows.map(row => row.skill_id);

    if (recommendedSkillIds.length === 0) {
      res.status(200).json({ message: 'No recommended skills found.', resources: [] });
      return;
    }

    // Fetch learning resources for those skills
    const resourcesRes = await db.query(
      `
      SELECT lr.*
      FROM learning_resources lr
      WHERE lr.skill_id = ANY($1::int[])
      `,
      [recommendedSkillIds]
    );

    res.status(200).json({ resources: resourcesRes.rows });
  } catch (error) {
    console.error('Learning Resources Error:', error);
    res.status(500).json({ message: 'Error fetching learning resources' });
  }
};
export default getLearningResources