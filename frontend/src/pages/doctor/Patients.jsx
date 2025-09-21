import { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import PatientForm from '../../components/forms/PatientForm';
import { patientAPI } from '../../services/api';
import { useUser } from '../../context/UserContext';

function Patients() {
    const { user } = useUser();
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedPhobia, setSelectedPhobia] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [error, setError] = useState(null);

    const phobiaTypes = [
        'Arachnophobia',
        'Claustrophobia',
        'Aerophobia',
        'Cynophobia'
    ];

    useEffect(() => {
        if (user?._id) {
            fetchPatients();
        }
    }, [currentPage, searchTerm, selectedPhobia, user?._id]);

    const fetchPatients = async () => {
        try {
            setLoading(true);
            const response = await patientAPI.getPatientsByDoctorId(user._id, {
                page: currentPage,
                search: searchTerm,
                phobiaType: selectedPhobia
            });
            setPatients(response.data.patients);
            setTotalPages(response.data.pagination.totalPages);
            setError(null);
        } catch (err) {
            setError('Failed to fetch patients. Please try again.');
            console.error('Error fetching patients:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setCurrentPage(1);
        fetchPatients();
    };

    const handleAddPatient = async (formData) => {
        try {
            await patientAPI.createPatient(formData);
            setShowAddModal(false);
            fetchPatients();
        } catch (err) {
            setError('Failed to add patient. Please try again.');
            console.error('Error adding patient:', err);
        }
    };

    const handleEditPatient = async (formData) => {
        try {
            await patientAPI.updatePatient(selectedPatient._id, formData);
            setShowEditModal(false);
            setSelectedPatient(null);
            fetchPatients();
        } catch (err) {
            setError('Failed to update patient. Please try again.');
            console.error('Error updating patient:', err);
        }
    };

    const handleDeletePatient = async (patientId) => {
        if (window.confirm('Are you sure you want to delete this patient?')) {
            try {
                await patientAPI.deletePatient(patientId);
                fetchPatients();
            } catch (err) {
                setError('Failed to delete patient. Please try again.');
                console.error('Error deleting patient:', err);
            }
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <Layout>
            <div className="px-4 sm:px-6 lg:px-8 py-8 bg-gray-50 min-h-screen">
                {/* Header */}
                <div className="sm:flex sm:items-center sm:justify-between mb-8">
                    <div className="sm:flex-auto">
                        <h1 className="text-3xl font-bold text-gray-900">Patients</h1>
                        <p className="mt-2 text-sm text-gray-700">
                            Manage your patients and their therapy sessions
                        </p>
                    </div>
                    <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
                        <button
                            type="button"
                            onClick={() => setShowAddModal(true)}
                            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        >
                            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                            </svg>
                            Add Patient
                        </button>
                    </div>
                </div>

                {/* Search and Filter */}
                <div className="bg-white rounded-lg shadow mb-6">
                    <div className="p-6">
                        <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-end sm:justify-between">
                            <div className="flex-1 max-w-2xl">
                                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                                    Search Patients
                                </label>
                                <form onSubmit={handleSearch} className="relative">
                                    <div className="relative rounded-lg shadow-sm">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <input
                                            id="search"
                                            type="text"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition duration-150 ease-in-out"
                                            placeholder="Search by name or email..."
                                        />
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                            <button
                                                type="submit"
                                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-lg text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
                                            >
                                                Search
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-end space-y-4 sm:space-y-0 sm:space-x-4">
                                <div className="w-full sm:w-48">
                                    <label htmlFor="phobia-filter" className="block text-sm font-medium text-gray-700 mb-1">
                                        Filter by Phobia
                                    </label>
                                    <div className="relative">
                                        <select
                                            id="phobia-filter"
                                            value={selectedPhobia}
                                            onChange={(e) => setSelectedPhobia(e.target.value)}
                                            className="block w-full pl-3 pr-10 py-2.5 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg appearance-none bg-white transition duration-150 ease-in-out"
                                        >
                                            <option value="">All Phobias</option>
                                            {phobiaTypes.map((type) => (
                                                <option key={type} value={type}>{type}</option>
                                            ))}
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                                            <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setSearchTerm('');
                                        setSelectedPhobia('');
                                        setCurrentPage(1);
                                        fetchPatients();
                                    }}
                                    className="inline-flex items-center px-4 py-2.5 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
                                >
                                    <svg className="h-5 w-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    Reset Filters
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 rounded-md bg-red-50 p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">{error}</h3>
                            </div>
                        </div>
                    </div>
                )}

                {/* Patient Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        {loading ? (
                            <div className="flex justify-center items-center h-64">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                            </div>
                        ) : (
                            <table className="min-w-full divide-y divide-gray-300">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Patient Info</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Contact Details</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Phobias</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Emergency Contact</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Medical History</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Sessions</th>
                                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                                            <span className="sr-only">Actions</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {patients.map((patient) => (
                                        <tr key={patient._id} className="hover:bg-gray-50 transition-colors duration-150">
                                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                                                <div className="flex items-center">
                                                    <div className="h-10 w-10 flex-shrink-0">
                                                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                                            <span className="text-indigo-600 font-medium">
                                                                {patient.name.split(' ').map(n => n[0]).join('')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="font-medium text-gray-900">{patient.name}</div>
                                                        <div className="text-gray-500">{patient.email}</div>
                                                        <div className="text-xs text-gray-400">
                                                            Age: {patient.age} | {patient.gender}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                <div className="space-y-1">
                                                    <div className="flex items-center">
                                                        <svg className="h-4 w-4 text-gray-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                        </svg>
                                                        {patient.phone}
                                                    </div>
                                                    <div className="flex items-center">
                                                        <svg className="h-4 w-4 text-gray-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        </svg>
                                                        {patient.address.city}, {patient.address.country}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                <div className="flex flex-wrap gap-1">
                                                    {patient.phobias.map((phobia, index) => (
                                                        <span
                                                            key={index}
                                                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                                                        >
                                                            {phobia.type}
                                                            <span className="ml-1 text-indigo-600">({phobia.severity})</span>
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                <div className="space-y-1">
                                                    <div className="font-medium text-gray-900">{patient.emergencyContact.name}</div>
                                                    <div className="text-gray-500">{patient.emergencyContact.phone}</div>
                                                    <div className="text-xs text-gray-400">{patient.emergencyContact.relationship}</div>
                                                </div>
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                <div className="space-y-1">
                                                    <div className="flex items-center">
                                                        <span className="text-gray-900">Previous Therapy:</span>
                                                        <span className="ml-2 text-gray-500">
                                                            {patient.medicalHistory.previousTherapy ? 'Yes' : 'No'}
                                                        </span>
                                                    </div>
                                                    {patient.medicalHistory.medications.length > 0 && (
                                                        <div className="text-xs text-gray-500">
                                                            Meds: {patient.medicalHistory.medications.join(', ')}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                <div className="space-y-1">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-gray-900">Total:</span>
                                                        <span className="text-gray-500">{patient.stats.totalSessions}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-gray-900">Completed:</span>
                                                        <span className="text-gray-500">{patient.stats.completedSessions}</span>
                                                    </div>
                                                    {patient.stats.lastSessionDate && (
                                                        <div className="text-xs text-gray-400">
                                                            Last: {formatDate(patient.stats.lastSessionDate)}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                                <div className="flex justify-end space-x-2">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedPatient(patient);
                                                            setShowEditModal(true);
                                                        }}
                                                        className="text-indigo-600 hover:text-indigo-900"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeletePatient(patient._id)}
                                                        className="text-red-600 hover:text-red-900"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* Pagination */}
                <div className="mt-6 flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-lg shadow">
                    <div className="flex flex-1 justify-between sm:hidden">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                        </button>
                    </div>
                    <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm text-gray-700">
                                Showing page <span className="font-medium">{currentPage}</span> of{' '}
                                <span className="font-medium">{totalPages}</span>
                            </p>
                        </div>
                        <div>
                            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <span className="sr-only">Previous</span>
                                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                        <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <span className="sr-only">Next</span>
                                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                        <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </nav>
                        </div>
                    </div>
                </div>

                {/* Add Patient Modal */}
                {showAddModal && (
                    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Patient</h3>
                                <PatientForm
                                    onSubmit={handleAddPatient}
                                    onCancel={() => setShowAddModal(false)}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Edit Patient Modal */}
                {showEditModal && selectedPatient && (
                    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Patient</h3>
                                <PatientForm
                                    initialData={selectedPatient}
                                    onSubmit={handleEditPatient}
                                    onCancel={() => {
                                        setShowEditModal(false);
                                        setSelectedPatient(null);
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}

export default Patients; 