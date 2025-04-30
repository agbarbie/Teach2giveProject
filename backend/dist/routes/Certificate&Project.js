"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const certificateController_1 = require("../controllers/certificateController");
const ProjectControllers_1 = require("../controllers/ProjectControllers");
const protect_1 = require("../middlewares/protect");
const router = express_1.default.Router();
// Certificate routes
router.get('/users/:id/certificates', certificateController_1.getJobseekerCertificatesByUserId);
router.get('/users/certificates', protect_1.protect, certificateController_1.getUserCertificates);
router.post('/users/certificates', protect_1.protect, certificateController_1.addUserCertificate);
router.put('/users/certificates/:id', protect_1.protect, certificateController_1.updateUserCertificate);
router.delete('/users/certificates/:id', protect_1.protect, certificateController_1.deleteUserCertificate);
// Project routes
router.get('/users/:id/projects', ProjectControllers_1.getJobseekerProjectsByUserId);
router.get('/users/projects', protect_1.protect, ProjectControllers_1.getUserProjects);
router.post('/users/projects', protect_1.protect, ProjectControllers_1.addUserProject);
router.put('/users/projects/:id', protect_1.protect, ProjectControllers_1.updateUserProject);
router.delete('/users/projects/:id', protect_1.protect, ProjectControllers_1.deleteUserProject);
exports.default = router;
