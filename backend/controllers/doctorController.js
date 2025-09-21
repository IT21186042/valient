import asyncHandler from 'express-async-handler';
import Doctor from '../models/Doctor.js';
import Patient from '../models/Patient.js';
import TherapySession from '../models/TherapySession.js';
import VRSessionData from '../models/VRSessionData.js';
import { generateToken } from '../middleware/authMiddleware.js';

// @desc    Register a new doctor
// @route   POST /api/doctors/register
// @access  Public
const registerDoctor = asyncHandler(async (req, res) => {
    const { name, email, password, specialization, licenseNumber, phone } = req.body;

    if (!name || !email || !password || !specialization || !licenseNumber || !phone) {
        res.status(400);
        throw new Error('Please add all required fields');
    }

    // Check if doctor already exists
    const doctorExists = await Doctor.findOne({ email });

    if (doctorExists) {
        res.status(400);
        throw new Error('Doctor already exists with this email');
    }

    // Check if license number already exists
    const licenseExists = await Doctor.findOne({ licenseNumber });

    if (licenseExists) {
        res.status(400);
        throw new Error('License number already registered');
    }

    // Create doctor
    const doctor = await Doctor.create({
        name,
        email,
        password,
        specialization,
        licenseNumber,
        phone
    });

    if (doctor) {
        res.status(201).json({
            _id: doctor._id,
            name: doctor.name,
            email: doctor.email,
            specialization: doctor.specialization,
            licenseNumber: doctor.licenseNumber,
            phone: doctor.phone,
            token: generateToken(doctor._id),
        });
    } else {
        res.status(400);
        throw new Error('Invalid doctor data');
    }
});

// @desc    Authenticate a doctor
// @route   POST /api/doctors/login
// @access  Public
const loginDoctor = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        res.status(400);
        throw new Error('Please add email and password');
    }

    // Check for doctor email
    const doctor = await Doctor.findOne({ email });

    if (doctor && (await doctor.matchPassword(password))) {
        // Update last login
        doctor.lastLogin = new Date();
        await doctor.save();

        res.json({
            _id: doctor._id,
            name: doctor.name,
            email: doctor.email,
            specialization: doctor.specialization,
            licenseNumber: doctor.licenseNumber,
            phone: doctor.phone,
            lastLogin: doctor.lastLogin,
            token: generateToken(doctor._id),
        });
    } else {
        res.status(400);
        throw new Error('Invalid credentials');
    }
});

// @desc    Get doctor profile
// @route   GET /api/doctors/profile
// @access  Private
const getDoctorProfile = asyncHandler(async (req, res) => {
    res.json(req.doctor);
});

// @desc    Update doctor profile
// @route   PUT /api/doctors/profile
// @access  Private
const updateDoctorProfile = asyncHandler(async (req, res) => {
    const doctor = await Doctor.findById(req.doctor._id);

    if (doctor) {
        doctor.name = req.body.name || doctor.name;
        doctor.email = req.body.email || doctor.email;
        doctor.specialization = req.body.specialization || doctor.specialization;
        doctor.phone = req.body.phone || doctor.phone;
        doctor.profileImage = req.body.profileImage || doctor.profileImage;

        if (req.body.password) {
            doctor.password = req.body.password;
        }

        const updatedDoctor = await doctor.save();

        res.json({
            _id: updatedDoctor._id,
            name: updatedDoctor.name,
            email: updatedDoctor.email,
            specialization: updatedDoctor.specialization,
            licenseNumber: updatedDoctor.licenseNumber,
            phone: updatedDoctor.phone,
            profileImage: updatedDoctor.profileImage,
            token: generateToken(updatedDoctor._id),
        });
    } else {
        res.status(404);
        throw new Error('Doctor not found');
    }
});

// @desc    Get doctor dashboard data
// @route   GET /api/doctors/dashboard
// @access  Private
const getDashboardData = asyncHandler(async (req, res) => {
    const doctorId = req.doctor._id;

    // Get total patients
    const totalPatients = await Patient.countDocuments({ doctorId, isActive: true });

    // Get total sessions
    const totalSessions = await TherapySession.countDocuments({ doctorId });

    // Get sessions this week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const sessionsThisWeek = await TherapySession.countDocuments({
        doctorId,
        createdAt: { $gte: oneWeekAgo }
    });

    // Get upcoming sessions
    const upcomingSessions = await TherapySession.find({
        doctorId,
        sessionStatus: 'Scheduled',
        scheduledDateTime: { $gte: new Date() }
    })
        .populate('patientId', 'name patientId')
        .sort({ scheduledDateTime: 1 })
        .limit(5);

    // Get recent session data
    const recentSessionData = await VRSessionData.find({})
        .populate({
            path: 'sessionId',
            match: { doctorId },
            populate: {
                path: 'patientId',
                select: 'name patientId'
            }
        })
        .sort({ createdAt: -1 })
        .limit(5);

    // Filter out null sessions (where doctor doesn't match)
    const filteredRecentData = recentSessionData.filter(data => data.sessionId);

    // Calculate average improvement
    const completedSessions = await VRSessionData.find({})
        .populate({
            path: 'sessionId',
            match: { doctorId, sessionStatus: 'Completed' }
        });

    const validCompletedSessions = completedSessions.filter(data => data.sessionId);

    let averageImprovement = 0;
    if (validCompletedSessions.length > 0) {
        const totalImprovement = validCompletedSessions.reduce((sum, data) => {
            const improvement = data.improvementPercentage || 0;
            return sum + improvement;
        }, 0);
        averageImprovement = totalImprovement / validCompletedSessions.length;
    }

    // Get phobia distribution
    const phobiaStats = await Patient.aggregate([
        { $match: { doctorId: doctorId, isActive: true } },
        { $unwind: '$phobias' },
        { $group: { _id: '$phobias.type', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
    ]);

    res.json({
        stats: {
            totalPatients,
            totalSessions,
            sessionsThisWeek,
            averageImprovement: Math.round(averageImprovement * 100) / 100
        },
        upcomingSessions,
        recentSessionData: filteredRecentData,
        phobiaDistribution: phobiaStats
    });
});

// @desc    Get doctor's patients summary
// @route   GET /api/doctors/patients-summary
// @access  Private
const getPatientsSummary = asyncHandler(async (req, res) => {
    const patients = await Patient.find({
        doctorId: req.doctor._id,
        isActive: true
    }).select('name patientId phobias createdAt');

    // Get session counts for each patient
    const patientsWithSessionCounts = await Promise.all(
        patients.map(async (patient) => {
            const sessionCount = await TherapySession.countDocuments({
                patientId: patient._id
            });

            const lastSession = await TherapySession.findOne({
                patientId: patient._id
            }).sort({ createdAt: -1 });

            return {
                ...patient.toJSON(),
                sessionCount,
                lastSessionDate: lastSession ? lastSession.createdAt : null
            };
        })
    );

    res.json(patientsWithSessionCounts);
});

export {
    registerDoctor,
    loginDoctor,
    getDoctorProfile,
    updateDoctorProfile,
    getDashboardData,
    getPatientsSummary
}; 