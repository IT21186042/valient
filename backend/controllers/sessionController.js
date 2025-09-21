import asyncHandler from 'express-async-handler';
import TherapySession from '../models/TherapySession.js';
import Patient from '../models/Patient.js';
import VRSessionData from '../models/VRSessionData.js';
import { exec } from 'child_process';
import path from 'path'

// @desc    Create a new therapy session
// @route   POST /api/sessions
// @access  Private (Doctor only)
const createSession = asyncHandler(async (req, res) => {
    const {
        patientId,
        sessionType,
        phobiaType,
        vrScenario,
        sessionConfig,
        preSessionData,
        scheduledDateTime,
        notes
    } = req.body;

    if (!patientId || !sessionType || !phobiaType || !vrScenario || !scheduledDateTime || !preSessionData) {
        res.status(400);
        throw new Error('Please provide all required fields');
    }

    // Verify patient exists and belongs to doctor
    const patient = await Patient.findById(patientId);
    if (!patient) {
        res.status(404);
        throw new Error('Patient not found');
    }

    if (patient.doctorId.toString() !== req.doctor._id.toString()) {
        res.status(403);
        throw new Error('Not authorized to create session for this patient');
    }

    // Validate pre-session data
    if (!preSessionData.fearScore && preSessionData.fearScore !== 0) {
        res.status(400);
        throw new Error('Pre-session fear score is required');
    }

    // Validate VR scenario
    if (!vrScenario.name || !vrScenario.environment) {
        res.status(400);
        throw new Error('VR scenario name and environment are required');
    }

    // Validate session config
    if (!sessionConfig.duration || !sessionConfig.exposureLevel) {
        res.status(400);
        throw new Error('Session duration and exposure level are required');
    }

    const session = await TherapySession.create({
        patientId,
        doctorId: req.doctor._id,
        sessionType,
        phobiaType,
        vrScenario,
        sessionConfig,
        preSessionData,
        scheduledDateTime,
        notes
    });

    // Populate patient data for response
    await session.populate('patientId', 'name patientId');

    res.status(201).json(session);
});

// @desc    Get all sessions for a doctor
// @route   GET /api/sessions
// @access  Private (Doctor only)
const getSessions = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 10,
        status = '',
        patientId = '',
        phobiaType = '',
        dateFrom = '',
        dateTo = '',
        sortBy = 'scheduledDateTime'
    } = req.query;

    // Build query
    let query = { doctorId: req.doctor._id };

    if (status) {
        query.sessionStatus = status;
    }

    if (patientId) {
        query.patientId = patientId;
    }

    if (phobiaType) {
        query.phobiaType = phobiaType;
    }

    // Date range filter
    if (dateFrom || dateTo) {
        query.scheduledDateTime = {};
        if (dateFrom) {
            query.scheduledDateTime.$gte = new Date(dateFrom);
        }
        if (dateTo) {
            query.scheduledDateTime.$lte = new Date(dateTo);
        }
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get sessions with pagination
    const sessions = await TherapySession.find(query)
        .populate('patientId', 'name patientId age')
        .sort({ [sortBy]: sortBy === 'scheduledDateTime' ? 1 : -1 })
        .skip(skip)
        .limit(parseInt(limit));

    // Get total count for pagination
    const total = await TherapySession.countDocuments(query);

    res.json({
        sessions,
        pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            totalSessions: total,
            hasNext: skip + parseInt(limit) < total,
            hasPrev: parseInt(page) > 1
        }
    });
});

// @desc    Get single session
// @route   GET /api/sessions/:id
// @access  Private (Doctor only)
const getSession = asyncHandler(async (req, res) => {
    const session = await TherapySession.findById(req.params.id)
        .populate('patientId')
        .populate('doctorId', 'name specialization');

    if (!session) {
        res.status(404);
        throw new Error('Session not found');
    }

    // Check if doctor owns this session
    if (session.doctorId._id.toString() !== req.doctor._id.toString()) {
        res.status(403);
        throw new Error('Not authorized to access this session');
    }

    // Get VR session data if available
    const vrData = await VRSessionData.findOne({ sessionId: session._id });

    res.json({
        session,
        vrData
    });
});

// @desc    Update session
// @route   PUT /api/sessions/:id
// @access  Private (Doctor only)
const updateSession = asyncHandler(async (req, res) => {
    const session = await TherapySession.findById(req.params.id);

    if (!session) {
        res.status(404);
        throw new Error('Session not found');
    }

    // Check if doctor owns this session
    if (session.doctorId.toString() !== req.doctor._id.toString()) {
        res.status(403);
        throw new Error('Not authorized to update this session');
    }

    // Prevent updating completed sessions
    if (session.sessionStatus === 'Completed') {
        res.status(400);
        throw new Error('Cannot update completed session');
    }

    const updatedSession = await TherapySession.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
    ).populate('patientId', 'name patientId');

    res.json(updatedSession);
});

// @desc    Update session status
// @route   PUT /api/sessions/:id/status
// @access  Private (Doctor only)
const updateSessionStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;
    const session = await TherapySession.findById(req.params.id);

    if (!session) {
        res.status(404);
        throw new Error('Session not found');
    }

    // Check if doctor owns this session
    if (session.doctorId.toString() !== req.doctor._id.toString()) {
        res.status(403);
        throw new Error('Not authorized to update this session');
    }

    // Validate status transition
    const validTransitions = {
        'Scheduled': ['In Progress', 'Cancelled'],
        'In Progress': ['Completed', 'Interrupted'],
        'Interrupted': ['In Progress', 'Cancelled'],
        'Completed': [], // No valid transitions from completed
        'Cancelled': [] // No valid transitions from cancelled
    };

    if (!validTransitions[session.sessionStatus].includes(status)) {
        res.status(400);
        throw new Error(`Cannot transition from ${session.sessionStatus} to ${status}`);
    }

    // Update status and related timestamps
    session.sessionStatus = status;

    switch (status) {
        case 'In Progress':
            session.actualStartTime = new Date();
            break;
        case 'Completed':
            session.actualEndTime = new Date();
            break;
        case 'Interrupted':
            session.actualEndTime = new Date();
            break;
    }

    await session.save();

    res.json({
        message: `Session status updated to ${status}`,
        session
    });
});

// @desc    Complete VR session
// @route   PUT /api/sessions/:id/complete
// @access  Private (Doctor only)
const completeSession = asyncHandler(async (req, res) => {
    const session = await TherapySession.findById(req.params.id)
        .populate('patientId', 'name patientId phobias');

    if (!session) {
        res.status(404);
        throw new Error('Session not found');
    }

    // Check if doctor owns this session
    if (session.doctorId.toString() !== req.doctor._id.toString()) {
        res.status(403);
        throw new Error('Not authorized to complete this session');
    }

    // Only allow completing sessions that are in progress
    if (session.sessionStatus !== 'In Progress') {
        res.status(400);
        throw new Error('Only sessions in progress can be completed');
    }

    // Update session status and end time
    session.sessionStatus = 'Completed';
    session.actualEndTime = new Date();

    // Calculate actual duration
    const duration = Math.round((session.actualEndTime - session.actualStartTime) / (1000 * 60)); // in minutes

    await session.save();

    res.json({
        message: 'Session completed successfully',
        session: {
            ...session.toJSON(),
            actualDuration: duration
        }
    });
});

// @desc    Start VR session (for Unity integration)
// @route   POST /api/sessions/:id/start
// @access  Private (VR Auth)
const startVRSession = asyncHandler(async (req, res) => {
    const session = await TherapySession.findById(req.params.id)
        .populate('patientId', 'name patientId phobias');

    if (!session) {
        res.status(404);
        throw new Error('Session not found');
    }

    // Only allow starting scheduled sessions
    if (session.sessionStatus !== 'Scheduled') {
        res.status(400);
        throw new Error('Only scheduled sessions can be started');
    }

    // Update session status to In Progress
    session.sessionStatus = 'In Progress';
    session.actualStartTime = new Date();
    await session.save();

    if (session.phobiaType === null) {
        throw new Error('Phobia type is required');
    }

    // Define executable paths for different phobia types
    const exePaths = {
        "Arachnophobia": "D:\research final viva\valiant\backend\exe\Claustrophobia\build\MRI.exe",
        "Claustrophobia": "D:\research final viva\valiant\backend\exe\Claustrophobia\build\MRI.exe",
        "Aerophobia":"D:\research final viva\valiant\backend\exe\Claustrophobia\build\MRI.exe" ,
        "Cynophobia": "D:\research final viva\valiant\backend\exe\Cynophobia\Build 5\Tem vr.exe",
        
       
    };

    // Get the executable path based on phobia type
    const exePath = exePaths[session.phobiaType];
    if (!exePath) {
        throw new Error(`No executable found for phobia type: ${session.phobiaType}`);
    }

    // Use child_process to launch the executable
    try {
        const args = [
  `"${exePath}"`,
  session.sessionToken,
  session.vrScenario.name,
  session.patientId.patientId
];

exec(args.join(' '), (error, stdout, stderr) => {

            if (error) {
                console.error(`Error launching VR application: ${error.message}`);
                // Update session status to Interrupted if there's an error
                session.sessionStatus = 'Interrupted';
                session.actualEndTime = new Date();
                session.save();
                return res.status(500).json({ error: 'Failed to launch VR application' });
            }

            console.log(`VR Application Output: ${stdout}`);
            res.json({
                message: 'VR session started successfully',
                session: {
                    _id: session._id,
                    sessionToken: session.sessionToken,
                    status: session.sessionStatus,
                    startTime: session.actualStartTime,
                    patient: {
                        name: session.patientId.name,
                        patientId: session.patientId.patientId,
                        phobias: session.patientId.phobias
                    },
                    vrScenario: {
                        name: session.vrScenario.name,
                        description: session.vrScenario.description,
                        difficulty: session.vrScenario.difficulty,
                        environment: session.vrScenario.environment
                    },
                    sessionConfig: {
                        duration: session.sessionConfig.duration,
                        exposureLevel: session.sessionConfig.exposureLevel,
                        biofeedbackEnabled: session.sessionConfig.biofeedbackEnabled,
                        voiceGuidanceEnabled: session.sessionConfig.voiceGuidanceEnabled
                    },
                    preSessionData: session.preSessionData
                }
            });
        });
    } catch (err) {
        console.error(`Unexpected error: ${err.message}`);
        // Update session status to Interrupted if there's an error
        session.sessionStatus = 'Interrupted';
        session.actualEndTime = new Date();
        await session.save();
        res.status(500).json({ error: 'Unexpected error occurred while starting VR session' });
    }
});

// @desc    Get session configuration for Unity
// @route   GET /api/sessions/vr-config/:sessionToken
// @access  Public (VR Auth via token)
const getVRSessionConfig = asyncHandler(async (req, res) => {
    const { sessionToken } = req.params;

    const session = await TherapySession.findOne({ sessionToken })
        .populate('patientId', 'name patientId phobias')
        .populate('doctorId', 'name specialization');

    if (!session) {
        res.status(404);
        throw new Error('Invalid session token');
    }

    if (session.sessionStatus === 'Completed' || session.sessionStatus === 'Cancelled') {
        res.status(400);
        throw new Error('Session is no longer active');
    }

    res.json({
        _id: session._id,
        patient: {
            name: session.patientId.name,
            patientId: session.patientId.patientId,
            phobias: session.patientId.phobias
        },
        doctor: {
            name: session.doctorId.name,
            specialization: session.doctorId.specialization
        },
        sessionType: session.sessionType,
        phobiaType: session.phobiaType,
        vrScenario: session.vrScenario,
        sessionConfig: session.sessionConfig,
        preSessionData: session.preSessionData
    });
});

// @desc    Cancel session
// @route   PUT /api/sessions/:id/cancel
// @access  Private (Doctor only)
const cancelSession = asyncHandler(async (req, res) => {
    const session = await TherapySession.findById(req.params.id);

    if (!session) {
        res.status(404);
        throw new Error('Session not found');
    }

    // Check if doctor owns this session
    if (session.doctorId.toString() !== req.doctor._id.toString()) {
        res.status(403);
        throw new Error('Not authorized to cancel this session');
    }

    if (session.sessionStatus === 'Completed') {
        res.status(400);
        throw new Error('Cannot cancel completed session');
    }

    session.sessionStatus = 'Cancelled';
    session.notes = req.body.cancellationReason || session.notes;
    await session.save();

    res.json({ message: 'Session cancelled successfully', session });
});

// @desc    Get upcoming sessions for dashboard
// @route   GET /api/sessions/upcoming
// @access  Private (Doctor only)
const getUpcomingSessions = asyncHandler(async (req, res) => {
    const { limit = 5 } = req.query;

    const upcomingSessions = await TherapySession.find({
        doctorId: req.doctor._id,
        sessionStatus: 'Scheduled',
        scheduledDateTime: { $gte: new Date() }
    })
        .populate('patientId', 'name patientId')
        .sort({ scheduledDateTime: 1 })
        .limit(parseInt(limit));

    res.json(upcomingSessions);
});

export {
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
}; 