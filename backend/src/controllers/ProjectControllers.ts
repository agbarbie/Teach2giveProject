import { Request, Response } from 'express';
import asyncHandler from '../middlewares/asyncHandlers';
import pool from '../db/db.config';
import { AppError } from '../middlewares/errorMiddlewares';
import { formatSuccess } from '../utils/helpers';
import { RequestWithUser } from '../utils/Types/index';

// @desc    Get user's projects
// @route   GET /api/users/projects
// @access  Private (Jobseeker)
export const getUserProjects = asyncHandler(async (req: RequestWithUser, res: Response) => {
  const userId = req.user?.id;

  const result = await pool.query(
    `SELECT p.*, 
            CASE WHEN COUNT(pt.technology) = 0 THEN '[]'::json
            ELSE json_agg(pt.technology) END AS technologies
     FROM user_projects p
     LEFT JOIN project_technologies pt ON p.id = pt.project_id
     WHERE p.user_id = $1
     GROUP BY p.id
     ORDER BY p.start_date DESC`,
    [userId]
  );

  res.json(formatSuccess(result.rows, 'User projects retrieved successfully'));
});

// @desc    Add project to user profile
// @route   POST /api/users/projects
// @access  Private (Jobseeker)
export const addUserProject = asyncHandler(async (req: RequestWithUser, res: Response) => {
  const userId = req.user?.id;
  const { 
    title, 
    description, 
    start_date, 
    end_date, 
    project_url, 
    image_url,
    technologies 
  } = req.body;

  // Validate input
  if (!title || !description || !start_date) {
    throw new AppError('Title, description and start date are required', 400);
  }

  // Start a transaction
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Add project to user profile
    const projectResult = await client.query(
      `INSERT INTO user_projects 
       (user_id, title, description, start_date, end_date, project_url, image_url, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       RETURNING *`,
      [
        userId, 
        title, 
        description, 
        start_date,
        end_date || null,
        project_url || null,
        image_url || null
      ]
    );
    
    const projectId = projectResult.rows[0].id;
    
    // Add technologies if provided
    if (technologies && Array.isArray(technologies) && technologies.length > 0) {
      const techValues = technologies.map(tech => `(${projectId}, $${technologies.indexOf(tech) + 1})`);
      const techParams = technologies.map(tech => tech);
      
      await client.query(
        `INSERT INTO project_technologies (project_id, technology) VALUES ${techValues.join(', ')}`,
        techParams
      );
    }
    
    await client.query('COMMIT');
    
    // Get complete project with technologies
    const finalResult = await pool.query(
      `SELECT p.*, 
              CASE WHEN COUNT(pt.technology) = 0 THEN '[]'::json
              ELSE json_agg(pt.technology) END AS technologies
       FROM user_projects p
       LEFT JOIN project_technologies pt ON p.id = pt.project_id
       WHERE p.id = $1
       GROUP BY p.id`,
      [projectId]
    );
    
    res.status(201).json(formatSuccess(finalResult.rows[0], 'Project added to profile successfully'));
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
});

// @desc    Update user project
// @route   PUT /api/users/projects/:id
// @access  Private (Jobseeker)
export const updateUserProject = asyncHandler(async (req: RequestWithUser, res: Response) => {
  const userId = req.user?.id;
  const projectId = parseInt(req.params.id);
  const { 
    title, 
    description, 
    start_date, 
    end_date, 
    project_url, 
    image_url,
    technologies 
  } = req.body;

  // Check if project exists and belongs to the user
  const projectExists = await pool.query(
    'SELECT * FROM user_projects WHERE id = $1 AND user_id = $2',
    [projectId, userId]
  );

  if (projectExists.rows.length === 0) {
    throw new AppError('Project not found in your profile or you do not have permission', 404);
  }

  // Start a transaction
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Update project fields
    const updateFields = [];
    const queryParams = [];
    let paramCounter = 1;

    if (title !== undefined) {
      updateFields.push(`title = $${paramCounter}`);
      queryParams.push(title);
      paramCounter++;
    }

    if (description !== undefined) {
      updateFields.push(`description = $${paramCounter}`);
      queryParams.push(description);
      paramCounter++;
    }

    if (start_date !== undefined) {
      updateFields.push(`start_date = $${paramCounter}`);
      queryParams.push(start_date);
      paramCounter++;
    }

    if (end_date !== undefined) {
      updateFields.push(`end_date = $${paramCounter}`);
      queryParams.push(end_date);
      paramCounter++;
    }

    if (project_url !== undefined) {
      updateFields.push(`project_url = $${paramCounter}`);
      queryParams.push(project_url);
      paramCounter++;
    }

    if (image_url !== undefined) {
      updateFields.push(`image_url = $${paramCounter}`);
      queryParams.push(image_url);
      paramCounter++;
    }

    // Add updated_at and project ID
    updateFields.push(`updated_at = NOW()`);
    queryParams.push(projectId);

    if (updateFields.length > 1) {
      // Update the project
      const updateQuery = `
        UPDATE user_projects 
        SET ${updateFields.join(', ')} 
        WHERE id = $${paramCounter} 
        RETURNING *
      `;

      await client.query(updateQuery, queryParams);
    }
    
    // Update technologies if provided
    if (technologies && Array.isArray(technologies)) {
      // Remove existing technologies
      await client.query('DELETE FROM project_technologies WHERE project_id = $1', [projectId]);
      
      // Add new technologies
      if (technologies.length > 0) {
        const techValues = technologies.map((_, idx) => `($1, $${idx + 2})`);
        const techParams = [projectId, ...technologies];
        
        await client.query(
          `INSERT INTO project_technologies (project_id, technology) VALUES ${techValues.join(', ')}`,
          techParams
        );
      }
    }
    
    await client.query('COMMIT');
    
    // Get updated project with technologies
    const finalResult = await pool.query(
      `SELECT p.*, 
              CASE WHEN COUNT(pt.technology) = 0 THEN '[]'::json
              ELSE json_agg(pt.technology) END AS technologies
       FROM user_projects p
       LEFT JOIN project_technologies pt ON p.id = pt.project_id
       WHERE p.id = $1
       GROUP BY p.id`,
      [projectId]
    );
    
    res.json(formatSuccess(finalResult.rows[0], 'Project updated successfully'));
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
});

// @desc    Delete user project
// @route   DELETE /api/users/projects/:id
// @access  Private (Jobseeker)
export const deleteUserProject = asyncHandler(async (req: RequestWithUser, res: Response) => {
  const userId = req.user?.id;
  const projectId = parseInt(req.params.id);

  // Check if project exists and belongs to the user
  const projectExists = await pool.query(
    'SELECT * FROM user_projects WHERE id = $1 AND user_id = $2',
    [projectId, userId]
  );

  if (projectExists.rows.length === 0) {
    throw new AppError('Project not found in your profile or you do not have permission', 404);
  }

  // Start a transaction
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Delete related technologies first
    await client.query('DELETE FROM project_technologies WHERE project_id = $1', [projectId]);
    
    // Delete the project
    await client.query('DELETE FROM user_projects WHERE id = $1', [projectId]);
    
    await client.query('COMMIT');
    
    res.json(formatSuccess(null, 'Project removed from profile successfully'));
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
});

// @desc    Get jobseeker's projects by user ID (for employers to view)
// @route   GET /api/users/:id/projects
// @access  Public
export const getJobseekerProjectsByUserId = asyncHandler(async (req: Request, res: Response) => {
  const jobseekerId = parseInt(req.params.id);

  // Check if user exists and is a jobseeker
  const userExists = await pool.query(
    'SELECT * FROM users WHERE id = $1 AND role = $2',
    [jobseekerId, 'jobseeker']
  );

  if (userExists.rows.length === 0) {
    throw new AppError('Jobseeker not found', 404);
  }

  const result = await pool.query(
    `SELECT p.id, p.title, p.description, p.start_date, p.end_date, p.project_url, p.image_url,
            CASE WHEN COUNT(pt.technology) = 0 THEN '[]'::json
            ELSE json_agg(pt.technology) END AS technologies
     FROM user_projects p
     LEFT JOIN project_technologies pt ON p.id = pt.project_id
     WHERE p.user_id = $1
     GROUP BY p.id
     ORDER BY p.start_date DESC`,
    [jobseekerId]
  );

  res.json(formatSuccess(result.rows, 'Jobseeker projects retrieved successfully'));
});