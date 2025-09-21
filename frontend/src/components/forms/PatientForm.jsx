import { useState, useEffect } from 'react';

function PatientForm({ initialData, onSubmit, onCancel }) {
    const [formData, setFormData] = useState({
        name: '',
        dateOfBirth: '',
        gender: '',
        email: '',
        phone: '',
        address: {
            street: '',
            city: '',
            state: '',
            zipCode: '',
            country: ''
        },
        emergencyContact: {
            name: '',
            relationship: '',
            phone: ''
        },
        medicalHistory: {
            medications: [],
            previousTherapy: false,
            mentalHealthHistory: '',
            physicalLimitations: ''
        },
        phobias: [{
            type: '',
            severity: 1,
            description: '',
            triggers: []
        }],
        notes: ''
    });

    const phobiaTypes = [
        'Arachnophobia',
        'Claustrophobia',
        'Aerophobia',
        'Cynophobia'
    ];

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        }
    }, [initialData]);

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

    const handlePhobiaChange = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            phobias: prev.phobias.map((phobia, i) =>
                i === index ? { ...phobia, [field]: value } : phobia
            )
        }));
    };

    const addPhobia = () => {
        setFormData(prev => ({
            ...prev,
            phobias: [...prev.phobias, {
                type: '',
                severity: 1,
                description: '',
                triggers: []
            }]
        }));
    };

    const removePhobia = (index) => {
        setFormData(prev => ({
            ...prev,
            phobias: prev.phobias.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            {/* Form Header */}
            <div className="border-b border-gray-200 pb-5">
                <h3 className="text-2xl font-bold leading-6 text-gray-900">
                    {initialData ? 'Edit Patient' : 'Add New Patient'}
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                    Please fill in all required information about the patient.
                </p>
            </div>

            {/* Basic Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center space-x-2 mb-4">
                    <svg className="h-5 w-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <h4 className="text-lg font-medium text-gray-900">Basic Information</h4>
                </div>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                            Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="name"
                            id="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition duration-150 ease-in-out"
                            placeholder="Enter full name"
                        />
                    </div>
                    <div>
                        <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">
                            Date of Birth <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="date"
                            name="dateOfBirth"
                            id="dateOfBirth"
                            value={formData.dateOfBirth}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition duration-150 ease-in-out"
                        />
                    </div>
                    <div>
                        <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
                            Gender <span className="text-red-500">*</span>
                        </label>
                        <select
                            name="gender"
                            id="gender"
                            value={formData.gender}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition duration-150 ease-in-out"
                        >
                            <option value="">Select gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                            <option value="Prefer not to say">Prefer not to say</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                            Phone Number <span className="text-red-500">*</span>
                        </label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                            </div>
                            <input
                                type="tel"
                                name="phone"
                                id="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                required
                                className="block w-full pl-10 rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition duration-150 ease-in-out"
                                placeholder="Enter phone number"
                            />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                            Email Address
                        </label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <input
                                type="email"
                                name="email"
                                id="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="block w-full pl-10 rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition duration-150 ease-in-out"
                                placeholder="Enter email address"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Address */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center space-x-2 mb-4">
                    <svg className="h-5 w-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <h4 className="text-lg font-medium text-gray-900">Address Information</h4>
                </div>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                        <label htmlFor="address.street" className="block text-sm font-medium text-gray-700">
                            Street Address
                        </label>
                        <input
                            type="text"
                            name="address.street"
                            id="address.street"
                            value={formData.address.street}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition duration-150 ease-in-out"
                            placeholder="Enter street address"
                        />
                    </div>
                    <div>
                        <label htmlFor="address.city" className="block text-sm font-medium text-gray-700">
                            City
                        </label>
                        <input
                            type="text"
                            name="address.city"
                            id="address.city"
                            value={formData.address.city}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition duration-150 ease-in-out"
                            placeholder="Enter city"
                        />
                    </div>
                    <div>
                        <label htmlFor="address.state" className="block text-sm font-medium text-gray-700">
                            State/Province
                        </label>
                        <input
                            type="text"
                            name="address.state"
                            id="address.state"
                            value={formData.address.state}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition duration-150 ease-in-out"
                            placeholder="Enter state/province"
                        />
                    </div>
                    <div>
                        <label htmlFor="address.zipCode" className="block text-sm font-medium text-gray-700">
                            ZIP/Postal Code
                        </label>
                        <input
                            type="text"
                            name="address.zipCode"
                            id="address.zipCode"
                            value={formData.address.zipCode}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition duration-150 ease-in-out"
                            placeholder="Enter ZIP/postal code"
                        />
                    </div>
                    <div>
                        <label htmlFor="address.country" className="block text-sm font-medium text-gray-700">
                            Country
                        </label>
                        <input
                            type="text"
                            name="address.country"
                            id="address.country"
                            value={formData.address.country}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition duration-150 ease-in-out"
                            placeholder="Enter country"
                        />
                    </div>
                </div>
            </div>

            {/* Emergency Contact */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center space-x-2 mb-4">
                    <svg className="h-5 w-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <h4 className="text-lg font-medium text-gray-900">Emergency Contact</h4>
                </div>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                        <label htmlFor="emergencyContact.name" className="block text-sm font-medium text-gray-700">
                            Contact Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="emergencyContact.name"
                            id="emergencyContact.name"
                            value={formData.emergencyContact.name}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition duration-150 ease-in-out"
                            placeholder="Enter contact name"
                        />
                    </div>
                    <div>
                        <label htmlFor="emergencyContact.relationship" className="block text-sm font-medium text-gray-700">
                            Relationship <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="emergencyContact.relationship"
                            id="emergencyContact.relationship"
                            value={formData.emergencyContact.relationship}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition duration-150 ease-in-out"
                            placeholder="Enter relationship"
                        />
                    </div>
                    <div>
                        <label htmlFor="emergencyContact.phone" className="block text-sm font-medium text-gray-700">
                            Contact Phone <span className="text-red-500">*</span>
                        </label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                            </div>
                            <input
                                type="tel"
                                name="emergencyContact.phone"
                                id="emergencyContact.phone"
                                value={formData.emergencyContact.phone}
                                onChange={handleChange}
                                required
                                className="block w-full pl-10 rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition duration-150 ease-in-out"
                                placeholder="Enter contact phone"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Medical History */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center space-x-2 mb-4">
                    <svg className="h-5 w-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h4 className="text-lg font-medium text-gray-900">Medical History</h4>
                </div>
                <div className="space-y-6">
                    <div>
                        <label htmlFor="medicalHistory.medications" className="block text-sm font-medium text-gray-700">
                            Current Medications
                        </label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                name="medicalHistory.medications"
                                id="medicalHistory.medications"
                                value={formData.medicalHistory.medications.join(', ')}
                                onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    medicalHistory: {
                                        ...prev.medicalHistory,
                                        medications: e.target.value.split(',').map(m => m.trim())
                                    }
                                }))}
                                className="block w-full pl-10 rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition duration-150 ease-in-out"
                                placeholder="Enter medications separated by commas"
                            />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="medicalHistory.mentalHealthHistory" className="block text-sm font-medium text-gray-700">
                            Mental Health History
                        </label>
                        <textarea
                            name="medicalHistory.mentalHealthHistory"
                            id="medicalHistory.mentalHealthHistory"
                            value={formData.medicalHistory.mentalHealthHistory}
                            onChange={handleChange}
                            rows={3}
                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition duration-150 ease-in-out"
                            placeholder="Enter mental health history"
                        />
                    </div>
                    <div>
                        <label htmlFor="medicalHistory.physicalLimitations" className="block text-sm font-medium text-gray-700">
                            Physical Limitations
                        </label>
                        <textarea
                            name="medicalHistory.physicalLimitations"
                            id="medicalHistory.physicalLimitations"
                            value={formData.medicalHistory.physicalLimitations}
                            onChange={handleChange}
                            rows={3}
                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition duration-150 ease-in-out"
                            placeholder="Enter physical limitations"
                        />
                    </div>
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            name="medicalHistory.previousTherapy"
                            id="medicalHistory.previousTherapy"
                            checked={formData.medicalHistory.previousTherapy}
                            onChange={handleChange}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded transition duration-150 ease-in-out"
                        />
                        <label htmlFor="medicalHistory.previousTherapy" className="ml-2 block text-sm text-gray-900">
                            Previous Therapy Experience
                        </label>
                    </div>
                </div>
            </div>

            {/* Phobias */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                        <svg className="h-5 w-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <h4 className="text-lg font-medium text-gray-900">Phobias</h4>
                    </div>
                    <button
                        type="button"
                        onClick={addPhobia}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
                    >
                        <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        Add Phobia
                    </button>
                </div>
                <div className="space-y-4">
                    {formData.phobias.map((phobia, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-4 space-y-4">
                            <div className="flex justify-between items-center">
                                <h5 className="text-sm font-medium text-gray-900">Phobia {index + 1}</h5>
                                <button
                                    type="button"
                                    onClick={() => removePhobia(index)}
                                    className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition duration-150 ease-in-out"
                                >
                                    <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    Remove
                                </button>
                            </div>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label htmlFor={`phobia-${index}-type`} className="block text-sm font-medium text-gray-700">
                                        Type <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        id={`phobia-${index}-type`}
                                        value={phobia.type}
                                        onChange={(e) => handlePhobiaChange(index, 'type', e.target.value)}
                                        required
                                        className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition duration-150 ease-in-out"
                                    >
                                        <option value="">Select phobia type</option>
                                        {phobiaTypes.map((type) => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor={`phobia-${index}-severity`} className="block text-sm font-medium text-gray-700">
                                        Severity (1-10) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        id={`phobia-${index}-severity`}
                                        value={phobia.severity}
                                        onChange={(e) => handlePhobiaChange(index, 'severity', parseInt(e.target.value))}
                                        min="1"
                                        max="10"
                                        required
                                        className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition duration-150 ease-in-out"
                                    />
                                </div>
                                <div className="sm:col-span-2">
                                    <label htmlFor={`phobia-${index}-description`} className="block text-sm font-medium text-gray-700">
                                        Description
                                    </label>
                                    <textarea
                                        id={`phobia-${index}-description`}
                                        value={phobia.description}
                                        onChange={(e) => handlePhobiaChange(index, 'description', e.target.value)}
                                        rows={3}
                                        className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition duration-150 ease-in-out"
                                        placeholder="Describe the phobia and its impact"
                                    />
                                </div>
                                <div className="sm:col-span-2">
                                    <label htmlFor={`phobia-${index}-triggers`} className="block text-sm font-medium text-gray-700">
                                        Triggers
                                    </label>
                                    <input
                                        type="text"
                                        id={`phobia-${index}-triggers`}
                                        value={phobia.triggers.join(', ')}
                                        onChange={(e) => handlePhobiaChange(index, 'triggers', e.target.value.split(',').map(t => t.trim()))}
                                        className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition duration-150 ease-in-out"
                                        placeholder="Enter triggers separated by commas"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Notes */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center space-x-2 mb-4">
                    <svg className="h-5 w-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <h4 className="text-lg font-medium text-gray-900">Additional Notes</h4>
                </div>
                <div>
                    <textarea
                        name="notes"
                        id="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        rows={4}
                        className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition duration-150 ease-in-out"
                        placeholder="Enter any additional notes or comments"
                    />
                </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-5 border-t border-gray-200">
                <button
                    type="button"
                    onClick={onCancel}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
                >
                    {initialData ? 'Save Changes' : 'Add Patient'}
                </button>
            </div>
        </form>
    );
}

export default PatientForm; 