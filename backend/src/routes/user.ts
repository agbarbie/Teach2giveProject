import express from 'express';
import { getAllUsers, getUserById, getUsersByType } from '../controllers/UserController';

const router = express.Router();

router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.get('/type/:user_type', getUsersByType);

export default router;