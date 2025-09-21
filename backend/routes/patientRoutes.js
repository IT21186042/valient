import express from 'express';
import {
    createPatient,
    getPatients,
    getPatient,
    getPatientsByDoctorId
} from '../controllers/patientController.js';
import { protect, checkPatientOwnership } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes are protected (doctor only)
router.route('/')
    .get(protect, getPatients)
    .post(protect, createPatient);

router.route('/:patientId')
    .get(protect, checkPatientOwnership, getPatient);

// New route for getting patients by doctor ID
router.get('/doctor/:doctorId', protect, getPatientsByDoctorId);

export default router; 