import express from 'express';
import {
    createSession,
    getSessions,
    getSession,
    updateSession,
    startVRSession,
    getVRSessionConfig,
    cancelSession,
    getUpcomingSessions,
    updateSessionStatus,
    completeSession
} from '../controllers/sessionController.js';
import { protect, checkSessionOwnership, vrAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protected routes (doctor only)
router.route('/')
    .get(protect, getSessions)
    .post(protect, createSession);

router.get('/upcoming', protect, getUpcomingSessions);

// VR Unity integration routes
router.get('/vr-config/:sessionToken', getVRSessionConfig);
router.post('/:id/start', protect, checkSessionOwnership, startVRSession);
router.put('/:id/complete', protect, checkSessionOwnership, completeSession);

// Session management routes
router.route('/:id')
    .get(protect, checkSessionOwnership, getSession)
    .put(protect, checkSessionOwnership, updateSession);

router.put('/:id/cancel', protect, checkSessionOwnership, cancelSession);
router.put('/:id/status', protect, checkSessionOwnership, updateSessionStatus);

export default router; 