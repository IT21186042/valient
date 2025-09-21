import express from 'express';
import {
    registerDoctor,
    loginDoctor,
    getDoctorProfile,
    updateDoctorProfile,
    getDashboardData,
    getPatientsSummary
} from '../controllers/doctorController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/register', registerDoctor);
router.post('/login', loginDoctor);

// Protected routes
router.route('/profile')
    .get(protect, getDoctorProfile)
    .put(protect, updateDoctorProfile);

router.get('/dashboard', protect, getDashboardData);
router.get('/patients-summary', protect, getPatientsSummary);

export default router; 