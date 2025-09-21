import mongoose from 'mongoose';

const vrSessionDataSchema = new mongoose.Schema({
    sessionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TherapySession',
        required: [true, 'Session ID is required']
    },
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: [true, 'Patient ID is required']
    },
    duration: {
        type: Number,
        required: [true, 'Duration is required']
    },
    scenario: {
        name: {
            type: String,
            required: [true, 'Scenario name is required']
        },
        environment: {
            type: String,
            required: [true, 'Environment is required']
        }
    },
    phobiaType: {
        type: String,
        enum: ['Arachnophobia', 'Claustrophobia', 'Aerophobia', 'Cynophobia'],
        required: [true, 'Phobia type is required']
    }
}, {
    timestamps: true
});

const VRSessionData = mongoose.model('VRSessionData', vrSessionDataSchema);

export default VRSessionData; 