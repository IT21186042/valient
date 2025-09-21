import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import { sessionAPI, patientAPI } from '../../services/api';
import { format } from 'date-fns';
import SessionForm from '../../components/forms/SessionForm';

function Sessions() {
    const navigate = useNavigate();
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [showSessionModal, setShowSessionModal] = useState(false);
    const [showPatientModal, setShowPatientModal] = useState(false);
    const [selectedSession, setSelectedSession] = useState(null);
    const [patients, setPatients] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [filters, setFilters] = useState({
        status: '',
        patientId: '',
        phobiaType: '',
        dateFrom: '',
        dateTo: '',
        sortBy: 'scheduledDateTime',
        search: ''
    });

    const sessionStatuses = ['Scheduled', 'In Progress', 'Completed', 'Cancelled'];
    const phobiaTypes = ['Arachnophobia', 'Claustrophobia', 'Aerophobia', 'Cynophobia'];
    const sessionTypes = ['Initial Assessment', 'Exposure Therapy', 'Progress Check', 'Final Assessment'];

    useEffect(() => {
        fetchSessions();
    }, [currentPage, filters]);

    const fetchSessions = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: currentPage,
                limit: 10,
                ...filters
            });

            const response = await sessionAPI.getSessions(params);
            setSessions(response.data.sessions);
            setTotalPages(response.data.pagination.totalPages);
        } catch (error) {
            console.error('Error fetching sessions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setCurrentPage(1);
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setCurrentPage(1);
        fetchSessions();
    };

    const handleResetFilters = () => {
        setFilters({
            status: '',
            patientId: '',
            phobiaType: '',
            dateFrom: '',
            dateTo: '',
            sortBy: 'scheduledDateTime',
            search: ''
        });
        setCurrentPage(1);
    };

    const handleSessionClick = (session) => {
        setSelectedSession(session);
        setShowSessionModal(true);
    };

    const handleCancelSession = async (sessionId) => {
        try {
            await sessionAPI.cancelSession(sessionId);
            fetchSessions();
            setShowSessionModal(false);
        } catch (error) {
            console.error('Error cancelling session:', error);
        }
    };

    const handleStartSession = async (sessionId) => {
        try {
            const response = await sessionAPI.startVRSession(sessionId);
            // Update the session in the list with the new status
            setSessions(prevSessions =>
                prevSessions.map(session =>
                    session._id === sessionId
                        ? { ...session, sessionStatus: 'In Progress', actualStartTime: response.data.session.startTime }
                        : session
                )
            );
            // Show success message
            alert('VR session started successfully');
        } catch (error) {
            console.error('Error starting session:', error);
            alert(error.response?.data?.error || 'Failed to start session');
        }
    };

    const handleCompleteSession = async (sessionId) => {
        try {
            const response = await sessionAPI.completeSession(sessionId);
            // Update the session in the list with the completed status
            setSessions(prevSessions =>
                prevSessions.map(session =>
                    session._id === sessionId
                        ? { ...session, sessionStatus: 'Completed', actualEndTime: response.data.session.actualEndTime }
                        : session
                )
            );
            // Show success message
            alert('Session completed successfully');
        } catch (error) {
            console.error('Error completing session:', error);
            alert(error.response?.data?.error || 'Failed to complete session');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Scheduled':
                return 'bg-blue-100 text-blue-800';
            case 'In Progress':
                return 'bg-yellow-100 text-yellow-800';
            case 'Completed':
                return 'bg-green-100 text-green-800';
            case 'Cancelled':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const fetchPatients = async () => {
        try {
            const response = await patientAPI.getPatients();
            setPatients(response.data.patients);
        } catch (error) {
            console.error('Error fetching patients:', error);
        }
    };

    const handleNewSession = () => {
        setSelectedSession(null);
        setSelectedPatient(null);
        setShowSessionModal(true);
    };

    const handlePatientSelect = (patient) => {
        setSelectedPatient(patient);
        setShowPatientModal(false);
    };

    const handleOpenPatientModal = async () => {
        await fetchPatients();
        setShowPatientModal(true);
    };

    const handleSessionSubmit = async (formData) => {
        try {
            if (selectedSession) {
                await sessionAPI.updateSession(selectedSession._id, formData);
            } else {
                await sessionAPI.createSession(formData);
            }
            setShowSessionModal(false);
            fetchSessions();
        } catch (error) {
            console.error('Error saving session:', error);
        }
    };

    return (
        <Layout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Page header */}
                <div className="md:flex md:items-center md:justify-between">
                    <div className="flex-1 min-w-0">
                        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                            Therapy Sessions
                        </h2>
                    </div>
                    <div className="mt-4 flex md:mt-0 md:ml-4">
                        <button
                            onClick={handleNewSession}
                            className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                            </svg>
                            New Session
                        </button>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="mt-8 bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <form onSubmit={handleSearch} className="space-y-4">
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="flex-1">
                                    <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                                    <div className="relative rounded-lg shadow-sm">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <input
                                            type="text"
                                            name="search"
                                            id="search"
                                            value={filters.search}
                                            onChange={handleFilterChange}
                                            placeholder="Search sessions..."
                                            className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-lg transition duration-150 ease-in-out"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <button
                                        type="submit"
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
                                    >
                                        Search
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleResetFilters}
                                        className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
                                    >
                                        Reset
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                <div>
                                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                    <select
                                        id="status"
                                        name="status"
                                        value={filters.status}
                                        onChange={handleFilterChange}
                                        className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition duration-150 ease-in-out"
                                    >
                                        <option value="">All</option>
                                        {sessionStatuses.map(status => (
                                            <option key={status} value={status}>{status}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="phobiaType" className="block text-sm font-medium text-gray-700 mb-1">Phobia Type</label>
                                    <select
                                        id="phobiaType"
                                        name="phobiaType"
                                        value={filters.phobiaType}
                                        onChange={handleFilterChange}
                                        className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition duration-150 ease-in-out"
                                    >
                                        <option value="">All</option>
                                        {phobiaTypes.map(type => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="dateFrom" className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                                    <input
                                        type="date"
                                        id="dateFrom"
                                        name="dateFrom"
                                        value={filters.dateFrom}
                                        onChange={handleFilterChange}
                                        className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition duration-150 ease-in-out"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="dateTo" className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                                    <input
                                        type="date"
                                        id="dateTo"
                                        name="dateTo"
                                        value={filters.dateTo}
                                        onChange={handleFilterChange}
                                        className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition duration-150 ease-in-out"
                                    />
                                </div>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Sessions Table */}
                <div className="mt-8 bg-white shadow rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phobia</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {loading ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-4 text-center">
                                            <div className="flex justify-center">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : sessions.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                                            No sessions found
                                        </td>
                                    </tr>
                                ) : (
                                    sessions.map((session) => (
                                        <tr key={session._id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleSessionClick(session)}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="h-10 w-10 flex-shrink-0">
                                                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                                            <span className="text-indigo-600 font-medium">
                                                                {session.patientId.name.charAt(0)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">{session.patientId.name}</div>
                                                        <div className="text-sm text-gray-500">ID: {session.patientId.patientId}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{session.sessionType}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{session.phobiaType}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {format(new Date(session.scheduledDateTime), 'MMM d, yyyy')}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {format(new Date(session.scheduledDateTime), 'h:mm a')}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(session.sessionStatus)}`}>
                                                    {session.sessionStatus}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                {session.sessionStatus === 'Scheduled' && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleStartSession(session._id);
                                                        }}
                                                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                                                    >
                                                        Start
                                                    </button>
                                                )}
                                                {session.sessionStatus === 'In Progress' && (
                                                    <>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleCompleteSession(session._id);
                                                            }}
                                                            className="text-green-600 hover:text-green-900 mr-4"
                                                        >
                                                            Complete
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleCancelSession(session._id);
                                                            }}
                                                            className="text-red-600 hover:text-red-900"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination */}
                <div className="mt-4 bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                    <div className="flex-1 flex justify-between sm:hidden">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                            Next
                        </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm text-gray-700">
                                Showing page <span className="font-medium">{currentPage}</span> of{' '}
                                <span className="font-medium">{totalPages}</span>
                            </p>
                        </div>
                        <div>
                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                                >
                                    Next
                                </button>
                            </nav>
                        </div>
                    </div>
                </div>

                {/* Session Form Modal */}
                {showSessionModal && (
                    <div className="fixed inset-0 z-50 overflow-y-auto">
                        <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
                            {/* Backdrop */}
                            <div
                                className="fixed inset-0 bg-gray-500 bg-opacity-30 transition-opacity"
                                onClick={() => setShowSessionModal(false)}
                            />

                            {/* Modal */}
                            <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl">
                                <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
                                    <div className="sm:flex sm:items-start">
                                        <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                                                {selectedSession ? 'Edit Session' : 'New Session'}
                                            </h3>
                                            <div className="mt-2 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
                                                <SessionForm
                                                    session={selectedSession}
                                                    onSubmit={handleSessionSubmit}
                                                    onPatientSelect={handleOpenPatientModal}
                                                    selectedPatient={selectedPatient}
                                                    isEditing={!!selectedSession}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                    <button
                                        type="button"
                                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                        onClick={() => setShowSessionModal(false)}
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Patient Selection Modal */}
                {showPatientModal && (
                    <div className="fixed inset-0 z-[60] overflow-y-auto">
                        <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
                            {/* Backdrop */}
                            <div
                                className="fixed inset-0 bg-gray-500 bg-opacity-30 transition-opacity"
                                onClick={() => setShowPatientModal(false)}
                            />

                            {/* Modal */}
                            <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
                                <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
                                    <div className="sm:flex sm:items-start">
                                        <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                                                Select Patient
                                            </h3>
                                            <div className="mt-2 max-h-[calc(100vh-200px)] overflow-y-auto">
                                                <table className="min-w-full divide-y divide-gray-200">
                                                    <thead className="bg-gray-50 sticky top-0">
                                                        <tr>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phobias</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                        {patients.length === 0 ? (
                                                            <tr>
                                                                <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                                                                    No patients found
                                                                </td>
                                                            </tr>
                                                        ) : (
                                                            patients.map((patient) => (
                                                                <tr key={patient._id} className="hover:bg-gray-50">
                                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                                        <div className="text-sm font-medium text-gray-900">{patient.name}</div>
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                                        <div className="text-sm text-gray-500">{patient.patientId}</div>
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                                        <div className="text-sm text-gray-500">
                                                                            {patient.phobias.map(p => p.type).join(', ')}
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                                        <button
                                                                            onClick={() => handlePatientSelect(patient)}
                                                                            className="text-indigo-600 hover:text-indigo-900"
                                                                        >
                                                                            Select
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            ))
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                    <button
                                        type="button"
                                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                        onClick={() => setShowPatientModal(false)}
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}

export default Sessions; 