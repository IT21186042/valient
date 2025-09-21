import mongoose from 'mongoose';

const patientSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Patient name is required'],
        trim: true,
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    dateOfBirth: {
        type: Date,
        required: [true, 'Date of birth is required']
    },
    gender: {
        type: String,
        required: [true, 'Gender is required'],
        enum: ['Male', 'Female', 'Other', 'Prefer not to say']
    },
    email: {
        type: String,
        required: false,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required']
    },
    address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String
    },
    emergencyContact: {
        name: {
            type: String,
            required: [true, 'Emergency contact name is required']
        },
        relationship: {
            type: String,
            required: [true, 'Emergency contact relationship is required']
        },
        phone: {
            type: String,
            required: [true, 'Emergency contact phone is required']
        }
    },
    medicalHistory: {
        medications: [String],
        previousTherapy: Boolean,
        mentalHealthHistory: String,
        physicalLimitations: String
    },
    phobias: [{
        type: {
            type: String,
            enum: [
                'Arachnophobia', // Spiders
                'Claustrophobia', // Enclosed spaces
                'Aerophobia', // fear of flying
                'Cynophobia', // Dogs
            ],
            required: true
        },
        severity: {
            type: Number,
            min: 1,
            max: 10,
            required: true
        },
        description: String,
        triggers: [String]
    }],
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
        required: [true, 'Doctor assignment is required']
    },
    isActive: {
        type: Boolean,
        default: true
    },
    notes: {
        type: String,
        maxlength: [1000, 'Notes cannot exceed 1000 characters']
    }
}, {
    timestamps: true
});

// Calculate age virtual field
patientSchema.virtual('age').get(function () {
    if (this.dateOfBirth) {
        const today = new Date();
        const birthDate = new Date(this.dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    }
    return null;
});

// Ensure virtual fields are serialized
patientSchema.set('toJSON', { virtuals: true });

const Patient = mongoose.model('Patient', patientSchema);

export default Patient; 