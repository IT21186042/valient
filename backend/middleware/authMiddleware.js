import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import Doctor from '../models/Doctor.js';

const protect = asyncHandler(async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get doctor from the token
            req.doctor = await Doctor.findById(decoded.id).select('-password');

            if (!req.doctor) {
                res.status(401);
                throw new Error('Doctor not found');
            }

            if (!req.doctor.isActive) {
                res.status(401);
                throw new Error('Doctor account is deactivated');
            }

            next();
        } catch (error) {
            console.error(error);
            res.status(401);
            throw new Error('Not authorized, token failed');
        }
    }

    if (!token) {
        res.status(401);
        throw new Error('Not authorized, no token');
    }
});

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// Middleware to check if doctor owns the patient
const checkPatientOwnership = asyncHandler(async (req, res, next) => {
    const { patientId } = req.params;

    if (!patientId) {
        res.status(400);
        throw new Error('Patient ID is required');
    }

    // Import Patient model here to avoid circular dependency
    const Patient = (await import('../models/Patient.js')).default;

    const patient = await Patient.findById(patientId);

    if (!patient) {
        res.status(404);
        throw new Error('Patient not found');
    }

    if (patient.doctorId.toString() !== req.doctor._id.toString()) {
        res.status(403);
        throw new Error('Not authorized to access this patient');
    }

    req.patient = patient;
    next();
});

// Middleware to check if doctor owns the session
const checkSessionOwnership = asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    if (!id) {
        res.status(400);
        throw new Error('Session ID is required');
    }

    // Import TherapySession model here to avoid circular dependency
    const TherapySession = (await import('../models/TherapySession.js')).default;

    const session = await TherapySession.findById(id);

    if (!session) {
        res.status(404);
        throw new Error('Session not found');
    }

    if (session.doctorId.toString() !== req.doctor._id.toString()) {
        res.status(403);
        throw new Error('Not authorized to access this session');
    }

    req.session = session;
    next();
});

// VR Session Authentication Middleware
const vrAuth = asyncHandler(async (req, res, next) => {
    // Get session token from request body or query
    const sessionToken = req.body.sessionToken || req.query.sessionToken;

    if (!sessionToken) {
        res.status(401);
        throw new Error('Session token is required');
    }

    // Find session by token
    const session = await TherapySession.findOne({ sessionToken });

    if (!session) {
        res.status(401);
        throw new Error('Invalid session token');
    }

    // Check if session is in valid status
    if (session.sessionStatus !== 'Scheduled' && session.sessionStatus !== 'In Progress') {
        res.status(400);
        throw new Error('Session is not in a valid status');
    }

    // Get patient data
    const patient = await Patient.findById(session.patientId);
    if (!patient) {
        res.status(404);
        throw new Error('Patient not found');
    }

    // Attach session and patient to request
    req.session = session;
    req.patient = patient;
    next();
});

export { protect, generateToken, checkPatientOwnership, checkSessionOwnership, vrAuth };