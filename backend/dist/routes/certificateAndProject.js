"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const certificateController_1 = require("../controllers/certificateController");
const ProjectControllers_1 = require("../controllers/ProjectControllers");
const router = express_1.default.Router();
// Certificate routes
router.get('/users/:id/certificates', certificateController_1.getJobseekerCertificatesByUserId);
router.get('/users/certificates', certificateController_1.getUserCertificates);
router.post('/users/certificates', certificateController_1.addUserCertificate);
router.put('/users/certificates/:id', certificateController_1.updateUserCertificate);
router.delete('/users/certificates/:id', certificateController_1.deleteUserCertificate);
// Project routes
router.get('/users/:id/projects', ProjectControllers_1.getJobseekerProjectsByUserId);
router.get('/users/projects', ProjectControllers_1.getUserProjects);
router.post('/users/projects', ProjectControllers_1.addUserProject);
router.put('/users/projects/:id', ProjectControllers_1.updateUserProject);
router.delete('/users/projects/:id', ProjectControllers_1.deleteUserProject);
exports.default = router;
