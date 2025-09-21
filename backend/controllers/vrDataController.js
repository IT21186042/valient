import asyncHandler from 'express-async-handler';
import VRSessionData from '../models/VRSessionData.js';
import TherapySession from '../models/TherapySession.js';

// @desc    Submit VR session data from Unity
// @route   POST /api/vr-data/submit
// @access  Public (VR Auth via session token)
const submitVRSessionData = asyncHandler(async (req, res) => {
    const {
        sessionToken,
        sessionStartTime,
        sessionEndTime,
        totalDuration,
        fearScores,
        biometricData,
        vrInteractionData,
        exposureMetrics,
        sessionNotes,
        sessionRating,
        dataQuality
    } = req.body;

    if (!sessionToken || !sessionStartTime || !sessionEndTime || !totalDuration || !fearScores) {
        res.status(400);
        throw new Error('Please provide all required session data');
    }

    // Find the therapy session
    const therapySession = await TherapySession.findOne({ sessionToken });

    if (!therapySession) {
        res.status(404);
        throw new Error('Invalid session token');
    }

    // Validate fear scores
    if (!fearScores.initial && fearScores.initial !== 0) {
        res.status(400);
        throw new Error('Initial fear score is required');
    }

    if (!fearScores.final && fearScores.final !== 0) {
        res.status(400);
        throw new Error('Final fear score is required');
    }

    // Validate biometric data if provided
    if (biometricData) {
        if (biometricData.heartRate && (!biometricData.heartRate.initial || !biometricData.heartRate.final)) {
            res.status(400);
            throw new Error('Heart rate data must include initial and final values');
        }
        if (biometricData.skinConductance && (!biometricData.skinConductance.initial || !biometricData.skinConductance.final)) {
            res.status(400);
            throw new Error('Skin conductance data must include initial and final values');
        }
    }

    // Validate VR interaction data if provided
    if (vrInteractionData) {
        if (vrInteractionData.interactions) {
            for (const interaction of vrInteractionData.interactions) {
                if (!interaction.timestamp || !interaction.objectId || !interaction.interactionType) {
                    res.status(400);
                    throw new Error('Each interaction must include timestamp, objectId, and interactionType');
                }
            }
        }
    }

    // Check if VR data already exists for this session
    const existingData = await VRSessionData.findOne({ sessionId: therapySession._id });

    if (existingData) {
        res.status(400);
        throw new Error('VR session data already exists for this session');
    }

    // Create VR session data
    const vrSessionData = await VRSessionData.create({
        sessionId: therapySession._id,
        patientId: therapySession.patientId,
        sessionStartTime,
        sessionEndTime,
        totalDuration,
        fearScores,
        biometricData: biometricData || {},
        vrInteractionData: vrInteractionData || {},
        exposureMetrics: exposureMetrics || {},
        sessionNotes: sessionNotes || {},
        sessionRating: sessionRating || {},
        dataQuality: dataQuality || { completeness: 100, accuracy: 100 }
    });

    // Update therapy session status
    therapySession.sessionStatus = 'Completed';
    therapySession.actualEndTime = new Date(sessionEndTime);
    await therapySession.save();

    res.status(201).json({
        message: 'VR session data submitted successfully',
        vrSessionData,
        improvementPercentage: vrSessionData.improvementPercentage,
        effectivenessScore: vrSessionData.effectivenessScore
    });
});

// @desc    Get VR session data
// @route   GET /api/vr-data/session/:sessionId
// @access  Private (Doctor only)
const getVRSessionData = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;

    // Find the therapy session first to check ownership
    const therapySession = await TherapySession.findById(sessionId);

    if (!therapySession) {
        res.status(404);
        throw new Error('Session not found');
    }

    // Check if doctor owns this session
    if (therapySession.doctorId.toString() !== req.doctor._id.toString()) {
        res.status(403);
        throw new Error('Not authorized to access this session data');
    }

    // Get VR session data
    const vrData = await VRSessionData.findOne({ sessionId })
        .populate('sessionId', 'sessionType phobiaType vrScenario scheduledDateTime')
        .populate('patientId', 'name patientId');

    if (!vrData) {
        res.status(404);
        throw new Error('VR session data not found');
    }

    res.json(vrData);
});

// @desc    Get patient's VR session history
// @route   GET /api/vr-data/patient/:patientId
// @access  Private (Doctor only)
const getPatientVRHistory = asyncHandler(async (req, res) => {
    const { patientId } = req.params;
    const { page = 1, limit = 10, phobiaType = '' } = req.query;

    // Build query
    let query = { patientId };

    if (phobiaType) {
        // We need to populate session to filter by phobia type
        const sessions = await TherapySession.find({
            patientId,
            doctorId: req.doctor._id,
            phobiaType
        }).select('_id');

        query.sessionId = { $in: sessions.map(s => s._id) };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get VR session data with pagination
    const vrDataList = await VRSessionData.find(query)
        .populate({
            path: 'sessionId',
            match: { doctorId: req.doctor._id },
            select: 'sessionType phobiaType vrScenario scheduledDateTime sessionStatus'
        })
        .sort({ sessionStartTime: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    // Filter out sessions where doctor doesn't match (from populate)
    const filteredData = vrDataList.filter(data => data.sessionId);

    // Get total count
    const totalQuery = await VRSessionData.find(query).populate({
        path: 'sessionId',
        match: { doctorId: req.doctor._id }
    });
    const total = totalQuery.filter(data => data.sessionId).length;

    res.json({
        vrSessionData: filteredData,
        pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            totalSessions: total,
            hasNext: skip + parseInt(limit) < total,
            hasPrev: parseInt(page) > 1
        }
    });
});

// @desc    Get VR analytics for doctor's patients
// @route   GET /api/vr-data/analytics
// @access  Private (Doctor only)
const getVRAnalytics = asyncHandler(async (req, res) => {
    const { timeframe = '3months', patientId = '' } = req.query;

    // Calculate date range
    let startDate = new Date();
    switch (timeframe) {
        case '1month':
            startDate.setMonth(startDate.getMonth() - 1);
            break;
        case '3months':
            startDate.setMonth(startDate.getMonth() - 3);
            break;
        case '6months':
            startDate.setMonth(startDate.getMonth() - 6);
            break;
        case '1year':
            startDate.setFullYear(startDate.getFullYear() - 1);
            break;
        default:
            startDate.setMonth(startDate.getMonth() - 3);
    }

    // Build base query for sessions belonging to this doctor
    let sessionQuery = {
        doctorId: req.doctor._id,
        createdAt: { $gte: startDate }
    };

    if (patientId) {
        sessionQuery.patientId = patientId;
    }

    // Get relevant sessions
    const sessions = await TherapySession.find(sessionQuery).select('_id');
    const sessionIds = sessions.map(s => s._id);

    // Get VR data for these sessions
    const vrDataList = await VRSessionData.find({
        sessionId: { $in: sessionIds }
    }).populate('sessionId', 'phobiaType sessionType');

    // Calculate analytics
    const analytics = {
        totalSessions: vrDataList.length,
        averageImprovement: 0,
        averageEffectiveness: 0,
        phobiaBreakdown: {},
        improvementTrend: [],
        sessionTypeBreakdown: {},
        biometricInsights: {
            averageHeartRateReduction: 0,
            stressReductionSessions: 0
        }
    };

    if (vrDataList.length > 0) {
        // Calculate averages
        let totalImprovement = 0;
        let totalEffectiveness = 0;
        let heartRateReductions = [];

        vrDataList.forEach(data => {
            // Improvement percentage
            if (data.improvementPercentage !== null) {
                totalImprovement += data.improvementPercentage;
            }

            // Effectiveness score
            if (data.effectivenessScore !== null) {
                totalEffectiveness += data.effectivenessScore;
            }

            // Phobia breakdown
            const phobiaType = data.sessionId.phobiaType;
            if (!analytics.phobiaBreakdown[phobiaType]) {
                analytics.phobiaBreakdown[phobiaType] = {
                    sessions: 0,
                    totalImprovement: 0,
                    averageImprovement: 0
                };
            }
            analytics.phobiaBreakdown[phobiaType].sessions++;
            analytics.phobiaBreakdown[phobiaType].totalImprovement += data.improvementPercentage || 0;

            // Session type breakdown
            const sessionType = data.sessionId.sessionType;
            if (!analytics.sessionTypeBreakdown[sessionType]) {
                analytics.sessionTypeBreakdown[sessionType] = 0;
            }
            analytics.sessionTypeBreakdown[sessionType]++;

            // Heart rate analysis
            if (data.biometricData?.heartRate?.initial && data.biometricData?.heartRate?.final) {
                const reduction = data.biometricData.heartRate.initial - data.biometricData.heartRate.final;
                heartRateReductions.push(reduction);
            }

            // Improvement trend data
            analytics.improvementTrend.push({
                date: data.sessionStartTime,
                improvement: data.improvementPercentage || 0,
                fearScoreReduction: data.fearScores.initial - data.fearScores.final
            });
        });

        // Calculate final averages
        analytics.averageImprovement = totalImprovement / vrDataList.length;
        analytics.averageEffectiveness = totalEffectiveness / vrDataList.length;

        // Calculate phobia averages
        Object.keys(analytics.phobiaBreakdown).forEach(phobia => {
            const breakdown = analytics.phobiaBreakdown[phobia];
            breakdown.averageImprovement = breakdown.totalImprovement / breakdown.sessions;
        });

        // Heart rate insights
        if (heartRateReductions.length > 0) {
            analytics.biometricInsights.averageHeartRateReduction =
                heartRateReductions.reduce((sum, val) => sum + val, 0) / heartRateReductions.length;
            analytics.biometricInsights.stressReductionSessions =
                heartRateReductions.filter(reduction => reduction > 0).length;
        }

        // Sort improvement trend by date
        analytics.improvementTrend.sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    res.json(analytics);
});

// @desc    Update VR session data (for corrections)
// @route   PUT /api/vr-data/:vrDataId
// @access  Private (Doctor only)
const updateVRSessionData = asyncHandler(async (req, res) => {
    const vrData = await VRSessionData.findById(req.params.vrDataId)
        .populate('sessionId', 'doctorId');

    if (!vrData) {
        res.status(404);
        throw new Error('VR session data not found');
    }

    // Check if doctor owns this session
    if (vrData.sessionId.doctorId.toString() !== req.doctor._id.toString()) {
        res.status(403);
        throw new Error('Not authorized to update this VR session data');
    }

    const updatedVRData = await VRSessionData.findByIdAndUpdate(
        req.params.vrDataId,
        req.body,
        { new: true, runValidators: true }
    ).populate('sessionId', 'sessionType phobiaType');

    res.json(updatedVRData);
});

// @desc    Get all VR sessions with filters
// @route   GET /api/vr-data
// @access  Private (Doctor only)
const getVRSessions = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 10,
        phobiaType = '',
        dateFrom = '',
        dateTo = '',
        search = ''
    } = req.query;

    // Build query
    let query = {};

    // Add phobia type filter
    if (phobiaType) {
        query.phobiaType = phobiaType;
    }

    // Add date range filter
    if (dateFrom || dateTo) {
        query.createdAt = {};
        if (dateFrom) {
            query.createdAt.$gte = new Date(dateFrom);
        }
        if (dateTo) {
            query.createdAt.$lte = new Date(dateTo);
        }
    }

    // Add search filter for patient name or ID
    if (search) {
        query.$or = [
            { 'patientId.name': { $regex: search, $options: 'i' } },
            { 'patientId.patientId': { $regex: search, $options: 'i' } }
        ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get sessions with pagination and populate patient information
    const sessions = await VRSessionData.find(query)
        .populate('patientId', 'name patientId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    // Get total count for pagination
    const total = await VRSessionData.countDocuments(query);

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

// @desc    Get single VR session details
// @route   GET /api/vr-data/:id
// @access  Private (Doctor only)
const getVRSession = asyncHandler(async (req, res) => {
    const session = await VRSessionData.findById(req.params.id)
        .populate('patientId', 'name patientId')
        .populate('sessionId', 'sessionType');

    if (!session) {
        res.status(404);
        throw new Error('Session not found');
    }

    res.json(session);
});

// @desc    Create new VR session data
// @route   POST /api/vr-data
// @access  Private (Doctor only)
const createVRSession = asyncHandler(async (req, res) => {
    const { sessionId, patientId, duration, scenario, phobiaType } = req.body;

    // Validate required fields
    if (!sessionId || !patientId || !duration || !scenario || !phobiaType) {
        res.status(400);
        throw new Error('Please provide all required fields');
    }

    // Create VR session data
    const vrSession = await VRSessionData.create({
        sessionId,
        patientId,
        duration,
        scenario,
        phobiaType
    });

    res.status(201).json(vrSession);
});

// @desc    Update VR session data
// @route   PUT /api/vr-data/:id
// @access  Private (Doctor only)
const updateVRSession = asyncHandler(async (req, res) => {
    const session = await VRSessionData.findById(req.params.id);

    if (!session) {
        res.status(404);
        throw new Error('Session not found');
    }

    const updatedSession = await VRSessionData.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
    ).populate('patientId', 'name patientId');

    res.json(updatedSession);
});

// @desc    Delete VR session data
// @route   DELETE /api/vr-data/:id
// @access  Private (Doctor only)
const deleteVRSession = asyncHandler(async (req, res) => {
    const session = await VRSessionData.findById(req.params.id);

    if (!session) {
        res.status(404);
        throw new Error('Session not found');
    }

    await session.deleteOne();

    res.json({ message: 'VR session data removed' });
});

export {
    submitVRSessionData,
    getVRSessionData,
    getPatientVRHistory,
    getVRAnalytics,
    updateVRSessionData,
    getVRSessions,
    getVRSession,
    createVRSession,
    updateVRSession,
    deleteVRSession
}; 