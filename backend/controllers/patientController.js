import asyncHandler from 'express-async-handler';
import Patient from '../models/Patient.js';
import TherapySession from '../models/TherapySession.js';
import VRSessionData from '../models/VRSessionData.js';

// @desc    Create a new patient
// @route   POST /api/patients
// @access  Private (Doctor only)
const createPatient = asyncHandler(async (req, res) => {
    const {
        name,
        dateOfBirth,
        gender,
        email,
        phone,
        address,
        emergencyContact,
        medicalHistory,
        phobias,
        notes
    } = req.body;

    if (!name || !dateOfBirth || !gender || !phone || !emergencyContact || !phobias) {
        res.status(400);
        throw new Error('Please provide all required fields');
    }

    // Validate phobias array
    if (!Array.isArray(phobias) || phobias.length === 0) {
        res.status(400);
        throw new Error('At least one phobia must be specified');
    }

    // Validate emergency contact
    if (!emergencyContact.name || !emergencyContact.relationship || !emergencyContact.phone) {
        res.status(400);
        throw new Error('Complete emergency contact information is required');
    }

    const patient = await Patient.create({
        name,
        dateOfBirth,
        gender,
        email,
        phone,
        address,
        emergencyContact,
        medicalHistory,
        phobias,
        doctorId: req.doctor._id,
        notes
    });

    res.status(201).json(patient);
});

// @desc    Get all patients for a doctor
// @route   GET /api/patients
// @access  Private (Doctor only)
const getPatients = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, search = '', phobiaType = '', sortBy = 'createdAt' } = req.query;

    // Build query
    let query = { doctorId: req.doctor._id, isActive: true };

    // Add search filter
    if (search) {
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
        ];
    }

    // Add phobia type filter
    if (phobiaType) {
        query['phobias.type'] = phobiaType;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get patients with pagination
    const patients = await Patient.find(query)
        .sort({ [sortBy]: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Patient.countDocuments(query);

    // Get session counts for each patient
    const patientsWithStats = await Promise.all(
        patients.map(async (patient) => {
            const sessionCount = await TherapySession.countDocuments({
                patientId: patient._id
            });

            const lastSession = await TherapySession.findOne({
                patientId: patient._id
            }).sort({ createdAt: -1 });

            const completedSessions = await TherapySession.countDocuments({
                patientId: patient._id,
                sessionStatus: 'Completed'
            });

            return {
                ...patient.toJSON(),
                stats: {
                    totalSessions: sessionCount,
                    completedSessions,
                    lastSessionDate: lastSession ? lastSession.createdAt : null
                }
            };
        })
    );

    res.json({
        patients: patientsWithStats,
        pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            totalPatients: total,
            hasNext: skip + parseInt(limit) < total,
            hasPrev: parseInt(page) > 1
        }
    });
});

// @desc    Get single patient
// @route   GET /api/patients/:patientId
// @access  Private (Doctor only)
const getPatient = asyncHandler(async (req, res) => {
    const patient = await Patient.findById(req.params.patientId);

    if (!patient) {
        res.status(404);
        throw new Error('Patient not found');
    }

    // Check if doctor owns this patient
    if (patient.doctorId.toString() !== req.doctor._id.toString()) {
        res.status(403);
        throw new Error('Not authorized to access this patient');
    }

    // Get patient's session statistics
    const totalSessions = await TherapySession.countDocuments({
        patientId: patient._id
    });

    const completedSessions = await TherapySession.countDocuments({
        patientId: patient._id,
        sessionStatus: 'Completed'
    });

    const upcomingSessions = await TherapySession.countDocuments({
        patientId: patient._id,
        sessionStatus: 'Scheduled',
        scheduledDateTime: { $gte: new Date() }
    });

    // Get recent sessions
    const recentSessions = await TherapySession.find({
        patientId: patient._id
    })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('sessionId sessionType phobiaType sessionStatus scheduledDateTime createdAt');

    // Get progress data
    const progressData = await VRSessionData.find({
        patientId: patient._id
    })
        .populate('sessionId', 'sessionType scheduledDateTime')
        .sort({ createdAt: 1 })
        .select('fearScores sessionStartTime improvementPercentage effectivenessScore');

    res.json({
        patient,
        stats: {
            totalSessions,
            completedSessions,
            upcomingSessions
        },
        recentSessions,
        progressData
    });
});

// @desc    Get patients by doctor ID
// @route   GET /api/patients/doctor/:doctorId
// @access  Private (Doctor only)
const getPatientsByDoctorId = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, search = '', phobiaType = '', sortBy = 'createdAt' } = req.query;
    const doctorId = req.params.doctorId;

    // Verify the requesting doctor is accessing their own patients
    if (doctorId !== req.doctor._id.toString()) {
        res.status(403);
        throw new Error('Not authorized to access these patients');
    }

    // Build query
    let query = { doctorId, isActive: true };

    // Add search filter
    if (search) {
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
        ];
    }

    // Add phobia type filter
    if (phobiaType) {
        query['phobias.type'] = phobiaType;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get patients with pagination
    const patients = await Patient.find(query)
        .sort({ [sortBy]: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Patient.countDocuments(query);

    // Get session counts for each patient
    const patientsWithStats = await Promise.all(
        patients.map(async (patient) => {
            const sessionCount = await TherapySession.countDocuments({
                patientId: patient._id
            });

            const lastSession = await TherapySession.findOne({
                patientId: patient._id
            }).sort({ createdAt: -1 });

            const completedSessions = await TherapySession.countDocuments({
                patientId: patient._id,
                sessionStatus: 'Completed'
            });

            return {
                ...patient.toJSON(),
                stats: {
                    totalSessions: sessionCount,
                    completedSessions,
                    lastSessionDate: lastSession ? lastSession.createdAt : null
                }
            };
        })
    );

    res.json({
        patients: patientsWithStats,
        pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            totalPatients: total,
            hasNext: skip + parseInt(limit) < total,
            hasPrev: parseInt(page) > 1
        }
    });
});

export {
    createPatient,
    getPatients,
    getPatient,
    getPatientsByDoctorId
}; 