import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const doctorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters']
    },
    specialization: {
        type: String,
        required: [true, 'Specialization is required'],
        enum: [
            'Clinical Psychology',
            'Psychiatry',
            'Behavioral Therapy',
            'Cognitive Behavioral Therapy',
            'Exposure Therapy',
            'PTSD Specialist',
            'Anxiety Disorders',
            'Phobia Treatment',
            'Other'
        ]
    },
    licenseNumber: {
        type: String,
        required: [true, 'License number is required'],
        unique: true
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required']
    },
    isActive: {
        type: Boolean,
        default: true
    },
    profileImage: {
        type: String,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastLogin: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Hash password before saving
doctorSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
doctorSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Remove password from JSON output
doctorSchema.methods.toJSON = function () {
    const doctor = this.toObject();
    delete doctor.password;
    return doctor;
};

const Doctor = mongoose.model('Doctor', doctorSchema);

export default Doctor; 