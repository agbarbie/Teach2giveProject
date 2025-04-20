import express from 'express';
import { getAllUsers, getUserById, getUsersByType, updateUser, deleteUser, createUser } from '../controllers/UserController';

const router = express.Router();

// Define the routes and their corresponding controller functions
router.get('/', getAllUsers);  // Get all users
router.get('/:id', getUserById);  // Get a user by ID
router.get('/type/:user_type', getUsersByType);  // Get users by user type
router.post('/', createUser);  // Create a new user
router.put('/:id', updateUser);  // Update a user by ID
router.delete('/:id', deleteUser);  // Delete a user by ID

export default router;
