import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { patientAPI, sessionAPI } from '../../services/api';
import { useUser } from '../../context/UserContext';

const SessionForm = ({ session, onSubmit, onPatientSelect, selectedPatient, isEditing }) => {
    const navigate = useNavigate();
    const { user } = useUser();
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        patientId: '',
        sessionType: '',
        phobiaType: '',
        vrScenario: {
            name: '',
            environment: '',
            difficulty: 'Beginner'
        },
        sessionConfig: {
            duration: 30,
            exposureLevel: 1,
            biofeedbackEnabled: false,
            voiceGuidanceEnabled: true
        },
        preSessionData: {
            fearScore: 0,
            anxietyLevel: 0,
            notes: ''
        },
        scheduledDateTime: '',
        notes: ''
    });

    const sessionTypes = ['Initial Assessment', 'Exposure Therapy', 'Progress Check', 'Final Assessment'];
    const phobiaTypes = ['Arachnophobia', 'Claustrophobia', 'Aerophobia', 'Cynophobia'];
    const vrEnvironments = ['Elevator', 'Small Room', 'MRI', 'Dog Park', 'Airplane', 'Spider Room'];
    const difficulties = ['Beginner', 'Intermediate', 'Advanced'];

    useEffect(() => {
        fetchPatients();
        if (session) {
            setFormData({
                ...session,
                scheduledDateTime: new Date(session.scheduledDateTime).toISOString().slice(0, 16)
            });
        }
        setLoading(false);
    }, [session]);

    useEffect(() => {
        if (selectedPatient) {
            setFormData(prev => ({
                ...prev,
                patientId: selectedPatient._id
            }));
        }
    }, [selectedPatient]);

    const fetchPatients = async () => {
        try {
            const response = await patientAPI.getPatientsByDoctorId(user._id);
            setPatients(response.data.patients);
        } catch (error) {
            console.error('Error fetching patients:', error);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData(prev => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: type === 'checkbox' ? checked : value
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Validate required fields
        if (!formData.patientId) {
            alert('Please select a patient');
            return;
        }
        if (!formData.sessionType) {
            alert('Please select a session type');
            return;
        }
        if (!formData.phobiaType) {
            alert('Please select a phobia type');
            return;
        }
        if (!formData.vrScenario.environment) {
            alert('Please select a VR environment');
            return;
        }
        if (!formData.scheduledDateTime) {
            alert('Please select a date and time');
            return;
        }
        if (formData.preSessionData.fearScore === undefined || formData.preSessionData.fearScore === '') {
            alert('Please enter a fear score');
            return;
        }

        // Set VR scenario name based on environment
        const vrScenario = {
            ...formData.vrScenario,
            name: `${formData.vrScenario.environment} Scenario`
        };

        // Prepare the submission data
        const submissionData = {
            ...formData,
            vrScenario,
            scheduledDateTime: new Date(formData.scheduledDateTime).toISOString()
        };

        // Remove _id if it exists (for new sessions)
        if (submissionData._id) {
            delete submissionData._id;
        }

        onSubmit(submissionData);
    };

    const handleRemovePatient = () => {
        setFormData(prev => ({
            ...prev,
            patientId: ''
        }));
        onPatientSelect(null);
    };

    const handlePatientSelect = () => {
        onPatientSelect();
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            {/* Form Header */}
            <div className="border-b border-gray-200 pb-5">
                <h3 className="text-2xl font-bold leading-6 text-gray-900">
                    {isEditing ? 'Edit Session' : 'New Session'}
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                    Please fill in all required information about the session.
                </p>
            </div>

            {/* Patient Selection */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center space-x-2 mb-4">
                    <svg className="h-5 w-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <h4 className="text-lg font-medium text-gray-900">Patient Information</h4>
                </div>
                <div className="space-y-4">
                    {selectedPatient ? (
                        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center space-x-4">
                                    <div className="h-16 w-16 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center">
                                        <span className="text-xl font-medium text-white">
                                            {selectedPatient.name.charAt(0)}
                                        </span>
                                    </div>
                                    <div>
                                        <h5 className="text-lg font-medium text-gray-900">{selectedPatient.name}</h5>
                                        <p className="text-sm text-gray-500">
                                            {selectedPatient.gender}, {selectedPatient.age} years
                                        </p>
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {selectedPatient.phobias.map((phobia, index) => (
                                                <span
                                                    key={index}
                                                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                                                >
                                                    {phobia.type}
                                                    <span className="ml-1 text-indigo-600">({phobia.severity})</span>
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleRemovePatient}
                                    className="inline-flex items-center p-2 border border-transparent rounded-full text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                                >
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                                <div className="flex items-center space-x-2">
                                    <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    <span className="text-gray-600">{selectedPatient.email}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                    <span className="text-gray-600">{selectedPatient.phone}</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl">
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <h3 className="mt-2 text-sm font-medium text-gray-900">No patient selected</h3>
                            <p className="mt-1 text-sm text-gray-500">Select a patient to continue with the session.</p>
                            <div className="mt-6">
                                <button
                                    type="button"
                                    onClick={handlePatientSelect}
                                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
                                >
                                    <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                    </svg>
                                    Select Patient
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Session Details */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center space-x-2 mb-4">
                    <svg className="h-5 w-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <h4 className="text-lg font-medium text-gray-900">Session Details</h4>
                </div>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Session Type</label>
                        <select
                            name="sessionType"
                            value={formData.sessionType}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white transition duration-150 ease-in-out"
                            required
                        >
                            <option value="">Select a session type</option>
                            {sessionTypes.map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phobia Type</label>
                        <select
                            name="phobiaType"
                            value={formData.phobiaType}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white transition duration-150 ease-in-out"
                            required
                        >
                            <option value="">Select a phobia type</option>
                            {phobiaTypes.map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Date and Time</label>
                        <input
                            type="datetime-local"
                            name="scheduledDateTime"
                            value={formData.scheduledDateTime}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white transition duration-150 ease-in-out"
                            required
                        />
                    </div>
                </div>
            </div>

            {/* VR Scenario */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center space-x-2 mb-4">
                    <svg className="h-5 w-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <h4 className="text-lg font-medium text-gray-900">VR Scenario</h4>
                </div>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Environment</label>
                        <select
                            name="vrScenario.environment"
                            value={formData.vrScenario.environment}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white transition duration-150 ease-in-out"
                            required
                        >
                            <option value="">Select an environment</option>
                            {vrEnvironments.map(env => (
                                <option key={env} value={env}>{env}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                        <select
                            name="vrScenario.difficulty"
                            value={formData.vrScenario.difficulty}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white transition duration-150 ease-in-out"
                        >
                            {difficulties.map(diff => (
                                <option key={diff} value={diff}>{diff}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Session Configuration */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center space-x-2 mb-4">
                    <svg className="h-5 w-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <h4 className="text-lg font-medium text-gray-900">Session Configuration</h4>
                </div>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                        <input
                            type="number"
                            name="sessionConfig.duration"
                            value={formData.sessionConfig.duration}
                            onChange={handleChange}
                            min="15"
                            max="120"
                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white transition duration-150 ease-in-out"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Exposure Level (1-10)</label>
                        <input
                            type="number"
                            name="sessionConfig.exposureLevel"
                            value={formData.sessionConfig.exposureLevel}
                            onChange={handleChange}
                            min="1"
                            max="10"
                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white transition duration-150 ease-in-out"
                        />
                    </div>
                </div>

                <div className="mt-6 space-y-4">
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            name="sessionConfig.biofeedbackEnabled"
                            checked={formData.sessionConfig.biofeedbackEnabled}
                            onChange={handleChange}
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 transition duration-150 ease-in-out"
                        />
                        <label className="ml-2 block text-sm text-gray-700">Enable Biofeedback</label>
                    </div>

                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            name="sessionConfig.voiceGuidanceEnabled"
                            checked={formData.sessionConfig.voiceGuidanceEnabled}
                            onChange={handleChange}
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 transition duration-150 ease-in-out"
                        />
                        <label className="ml-2 block text-sm text-gray-700">Enable Voice Guidance</label>
                    </div>
                </div>
            </div>

            {/* Pre-session Data */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center space-x-2 mb-4">
                    <svg className="h-5 w-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h4 className="text-lg font-medium text-gray-900">Pre-session Data</h4>
                </div>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Initial Fear Score (0-10)</label>
                        <input
                            type="number"
                            name="preSessionData.fearScore"
                            value={formData.preSessionData.fearScore}
                            onChange={handleChange}
                            min="0"
                            max="10"
                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white transition duration-150 ease-in-out"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Anxiety Level (0-10)</label>
                        <input
                            type="number"
                            name="preSessionData.anxietyLevel"
                            value={formData.preSessionData.anxietyLevel}
                            onChange={handleChange}
                            min="0"
                            max="10"
                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white transition duration-150 ease-in-out"
                        />
                    </div>
                </div>

                <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                        name="preSessionData.notes"
                        value={formData.preSessionData.notes}
                        onChange={handleChange}
                        rows="3"
                        className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white transition duration-150 ease-in-out"
                        placeholder="Enter any pre-session notes or observations"
                    />
                </div>
            </div>

            {/* Additional Notes */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center space-x-2 mb-4">
                    <svg className="h-5 w-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <h4 className="text-lg font-medium text-gray-900">Additional Notes</h4>
                </div>
                <div>
                    <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        rows="4"
                        className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white transition duration-150 ease-in-out"
                        placeholder="Enter any additional notes or comments"
                    />
                </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-5 border-t border-gray-200">
                <button
                    type="submit"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
                >
                    {isEditing ? 'Update Session' : 'Create Session'}
                </button>
            </div>
        </form>
    );
};

export default SessionForm; 