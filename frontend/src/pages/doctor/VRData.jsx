import { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import { format } from 'date-fns';
import { vrDataAPI } from '../../services/api';

function VRData() {
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        phobiaType: '',
        dateFrom: '',
        dateTo: ''
    });
    const [vrSessions, setVRSessions] = useState([]);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalSessions: 0
    });

    const phobiaTypes = ["Arachnophobia", "Claustrophobia", "Aerophobia", "Cynophobia"];

    // Generate dummy data
    const generateDummyData = () => {
        const dummySessions = [
            {
                _id: '1',
                patientId: {
                    _id: 'P001',
                    name: 'John Smith',
                    age: 25,
                    id: 'P001'
                },
                sessionId: 'S001',
                duration: 45,
                scenario: {
                    name: 'Spider Exposure',
                    environment: 'Forest Cabin'
                },
                phobiaType: 'Arachnophobia',
                createdAt: new Date(Date.now() - 86400000) // 1 day ago
            },
            {
                _id: '2',
                patientId: {
                    _id: 'P002',
                    name: 'Sarah Johnson',
                    age: 30,
                    id: 'P002'
                },
                sessionId: 'S002',
                duration: 30,
                scenario: {
                    name: 'Elevator Simulation',
                    environment: 'Modern Building'
                },
                phobiaType: 'Claustrophobia',
                createdAt: new Date(Date.now() - 172800000) // 2 days ago
            },
            {
                _id: '3',
                patientId: {
                    _id: 'P003',
                    name: 'Michael Brown',
                    age: 28,
                    id: 'P003'
                },
                sessionId: 'S003',
                duration: 60,
                scenario: {
                    name: 'Flight Simulation',
                    environment: 'Airplane Cabin'
                },
                phobiaType: 'Aerophobia',
                createdAt: new Date(Date.now() - 259200000) // 3 days ago
            }
        ];

        return {
            sessions: dummySessions,
            pagination: {
                currentPage: 1,
                totalPages: 1,
                totalSessions: dummySessions.length,
                hasNext: false,
                hasPrev: false
            }
        };
    };

    useEffect(() => {
        fetchSessions();
    }, [filters, pagination.currentPage]);

    const fetchSessions = async () => {
        try {
            setLoading(true);
            const params = {
                page: pagination.currentPage,
                limit: 10,
                phobiaType: filters.phobiaType,
                dateFrom: filters.dateFrom,
                dateTo: filters.dateTo,
                search: searchTerm
            };

            const response = await vrDataAPI.getVRSessions(params);

            // If no sessions found, use dummy data
            if (response.data.sessions.length === 0) {
                const dummyData = generateDummyData();
                setVRSessions(dummyData.sessions);
                setPagination(dummyData.pagination);
            } else {
                setVRSessions(response.data.sessions);
                setPagination(response.data.pagination);
            }
        } catch (error) {
            console.error('Error fetching sessions:', error);
            // If there's an error, show dummy data
            const dummyData = generateDummyData();
            setVRSessions(dummyData.sessions);
            setPagination(dummyData.pagination);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    const handlePageChange = (newPage) => {
        setPagination(prev => ({ ...prev, currentPage: newPage }));
    };

    const handleResetFilters = () => {
        setFilters({
            phobiaType: '',
            dateFrom: '',
            dateTo: ''
        });
        setSearchTerm('');
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Page header */}
                <div className="md:flex md:items-center md:justify-between mb-8">
                    <div className="flex-1 min-w-0">
                        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                            VR Session Data
                        </h2>
                        <p className="mt-1 text-sm text-gray-500">
                            View and analyze VR therapy session data
                        </p>
                    </div>
                </div>

                {/* Filters and Search */}
                <div className="bg-white shadow rounded-lg p-6 mb-8">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                        <div className="lg:col-span-2">
                            <label htmlFor="search" className="block text-sm font-medium text-gray-700">Search</label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <input
                                    type="text"
                                    id="search"
                                    value={searchTerm}
                                    onChange={handleSearch}
                                    placeholder="Search by patient name or ID"
                                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-4 pr-12 sm:text-sm border-gray-300 rounded-md"
                                />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="phobiaType" className="block text-sm font-medium text-gray-700">Phobia Type</label>
                            <select
                                id="phobiaType"
                                name="phobiaType"
                                value={filters.phobiaType}
                                onChange={handleFilterChange}
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                            >
                                <option value="">All Types</option>
                                {phobiaTypes.map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="dateFrom" className="block text-sm font-medium text-gray-700">From Date</label>
                            <input
                                type="date"
                                id="dateFrom"
                                name="dateFrom"
                                value={filters.dateFrom}
                                onChange={handleFilterChange}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                        </div>
                        <div>
                            <label htmlFor="dateTo" className="block text-sm font-medium text-gray-700">To Date</label>
                            <input
                                type="date"
                                id="dateTo"
                                name="dateTo"
                                value={filters.dateTo}
                                onChange={handleFilterChange}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                        </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                        <button
                            onClick={handleResetFilters}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Reset Filters
                        </button>
                    </div>
                </div>

                {/* VR Sessions Table */}
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Session ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scenario</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phobia Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {vrSessions.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                                            No sessions found
                                        </td>
                                    </tr>
                                ) : (
                                    vrSessions.map((session) => (
                                        <tr key={session._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{session._id}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {session.patientId?.name || 'Unknown Patient'}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    ID: {session.patientId?.id || session.patientId?._id || 'N/A'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{session.duration} min</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{session.scenario.name}</div>
                                                <div className="text-sm text-gray-500">{session.scenario.environment}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${session.phobiaType === 'Arachnophobia' ? 'bg-red-100 text-red-800' :
                                                    session.phobiaType === 'Claustrophobia' ? 'bg-yellow-100 text-yellow-800' :
                                                        session.phobiaType === 'Aerophobia' ? 'bg-blue-100 text-blue-800' :
                                                            'bg-purple-100 text-purple-800'
                                                    }`}>
                                                    {session.phobiaType}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {format(new Date(session.createdAt), 'MMM d, yyyy')}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {format(new Date(session.createdAt), 'h:mm a')}
                                                </div>
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
                            onClick={() => handlePageChange(pagination.currentPage - 1)}
                            disabled={pagination.currentPage === 1}
                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => handlePageChange(pagination.currentPage + 1)}
                            disabled={pagination.currentPage === pagination.totalPages}
                            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                        </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm text-gray-700">
                                Showing page <span className="font-medium">{pagination.currentPage}</span> of{' '}
                                <span className="font-medium">{pagination.totalPages}</span>
                            </p>
                        </div>
                        <div>
                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                <button
                                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                                    disabled={pagination.currentPage === 1}
                                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                                    disabled={pagination.currentPage === pagination.totalPages}
                                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </nav>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}

export default VRData; 