import express from 'express';
import {
  getUserCertificates,
  addUserCertificate,
  updateUserCertificate,
  deleteUserCertificate,
  getJobseekerCertificatesByUserId
} from '../controllers/certificateController';
import {
  getUserProjects,
  addUserProject,
  updateUserProject,
  deleteUserProject,
  getJobseekerProjectsByUserId
} from '../controllers/ProjectControllers';

const router = express.Router();

// Certificate routes
router.get('/users/:id/certificates', getJobseekerCertificatesByUserId);
router.get('/users/certificates', getUserCertificates);
router.post('/users/certificates', addUserCertificate);
router.put('/users/certificates/:id', updateUserCertificate);
router.delete('/users/certificates/:id', deleteUserCertificate);

// Project routes
router.get('/users/:id/projects', getJobseekerProjectsByUserId);
router.get('/users/projects',  getUserProjects);
router.post('/users/projects', addUserProject);
router.put('/users/projects/:id',  updateUserProject);
router.delete('/users/projects/:id', deleteUserProject);

export default router;