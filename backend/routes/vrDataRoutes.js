import express from 'express';
import {
    getVRSessions,
    getVRSession,
    createVRSession,
    updateVRSession,
    deleteVRSession
} from '../controllers/vrDataController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protected routes (doctor only)
router.route('/')
    .get(protect, getVRSessions)
    .post(protect, createVRSession);

router.route('/:id')
    .get(protect, getVRSession)
    .put(protect, updateVRSession)
    .delete(protect, deleteVRSession);

export default router; 