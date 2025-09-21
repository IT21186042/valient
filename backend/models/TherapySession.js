import mongoose from 'mongoose';

const therapySessionSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: [true, 'Patient ID is required']
    },
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
        required: [true, 'Doctor ID is required']
    },
    sessionType: {
        type: String,
        enum: ['Initial Assessment', 'Exposure Therapy', 'Progress Check', 'Final Assessment'],
        required: [true, 'Session type is required']
    },
    phobiaType: {
        type: String,
        enum: [
            'Arachnophobia', // Spiders
            'Claustrophobia', // Enclosed spaces
            'Aerophobia', // fear of flying
            'Cynophobia',
        ],
        required: [true, 'Phobia type is required']
    },
    vrScenario: {
        name: {
            type: String,
            required: [true, 'VR scenario name is required']
        },
        description: String,
        difficulty: {
            type: String,
            enum: ['Beginner', 'Intermediate', 'Advanced'],
            default: 'Beginner'
        },
        environment: {
            type: String,
            enum: [
                'Elevator',
                'Small Room',
                'MRI',
                'Dog Park',
                'Airplane',
                'Spider Room',
            ]
        }
    },
    sessionConfig: {
        duration: {
            type: Number, // in minutes
            default: 30
        },
        exposureLevel: {
            type: Number,
            min: 1,
            max: 10,
            default: 1
        },
        biofeedbackEnabled: {
            type: Boolean,
            default: false
        },
        voiceGuidanceEnabled: {
            type: Boolean,
            default: true
        }
    },
    preSessionData: {
        fearScore: {
            type: Number,
            min: 0,
            max: 10,
            required: true
        },
        anxietyLevel: {
            type: Number,
            min: 0,
            max: 10
        },
        notes: String,
    },
    sessionStatus: {
        type: String,
        enum: ['Scheduled', 'In Progress', 'Completed', 'Cancelled', 'Interrupted'],
        default: 'Scheduled'
    },
    scheduledDateTime: {
        type: Date,
        required: [true, 'Scheduled date and time is required']
    },
    actualStartTime: Date,
    actualEndTime: Date,
    sessionToken: {
        type: String,
        unique: true
    },
    notes: {
        type: String,
        maxlength: [2000, 'Notes cannot exceed 2000 characters']
    }
}, {
    timestamps: true
});

// Generate session token before saving
therapySessionSchema.pre('save', async function (next) {
    if (!this.sessionToken) {
        this.sessionToken = `VR${Date.now()}${Math.random().toString(36).substr(2, 9)}`.toUpperCase();
    }
    next();
});

// Calculate actual duration virtual field
therapySessionSchema.virtual('actualDuration').get(function () {
    if (this.actualStartTime && this.actualEndTime) {
        return Math.round((this.actualEndTime - this.actualStartTime) / (1000 * 60)); // in minutes
    }
    return null;
});

// Check if session is active
therapySessionSchema.virtual('isActive').get(function () {
    return this.sessionStatus === 'In Progress';
});

// Ensure virtual fields are serialized
therapySessionSchema.set('toJSON', { virtuals: true });

const TherapySession = mongoose.model('TherapySession', therapySessionSchema);

export default TherapySession; 