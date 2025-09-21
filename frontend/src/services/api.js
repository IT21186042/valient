import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Doctor APIs
export const doctorAPI = {
    login: (credentials) => api.post('/doctors/login', credentials),
    register: (data) => api.post('/doctors/register', data),
    getProfile: () => api.get('/doctors/profile'),
    updateProfile: (data) => api.put('/doctors/profile', data),
    getDashboardData: () => api.get('/doctors/dashboard'),
    getPatientsSummary: () => api.get('/doctors/patients-summary')
};

// Patient APIs
export const patientAPI = {
    getPatients: (params) => api.get('/patients', { params }),
    getPatientsByDoctorId: (doctorId) => api.get(`/patients/doctor/${doctorId}`),
    getPatient: (id) => api.get(`/patients/${id}`),
    createPatient: (data) => api.post('/patients', data),
    updatePatient: (id, data) => api.put(`/patients/${id}`, data),
    deletePatient: (id) => api.delete(`/patients/${id}`)
};

// Session APIs
export const sessionAPI = {
    getSessions: (params) => api.get('/sessions', { params }),
    getSession: (id) => api.get(`/sessions/${id}`),
    createSession: (data) => api.post('/sessions', data),
    updateSession: (id, data) => api.put(`/sessions/${id}`, data),
    cancelSession: (id, reason) => api.put(`/sessions/${id}/cancel`, { cancellationReason: reason }),
    getUpcomingSessions: () => api.get('/sessions/upcoming'),
    startVRSession: async (sessionId) => {
        return await api.post(`/sessions/${sessionId}/start`);
    },
    completeSession: async (sessionId) => {
        return await api.put(`/sessions/${sessionId}/complete`);
    },
    getVRSessionConfig: (token) => api.get(`/sessions/vr-config/${token}`)
};

// VR Data APIs
export const vrDataAPI = {
    getVRAnalytics: (params) => api.get('/vr-data/analytics', { params }),
    getVRSessionData: (sessionId) => api.get(`/vr-data/session/${sessionId}`),
    getPatientVRHistory: (patientId, params) => api.get(`/vr-data/patient/${patientId}`, { params }),
    updateVRSessionData: (vrDataId, data) => api.put(`/vr-data/${vrDataId}`, data),
    submitVRSessionData: (data) => api.post('/vr-data/submit', data),
    getVRSessions: (params) => api.get('/vr-data', { params }),
    getVRSession: (id) => api.get(`/vr-data/${id}`)
};

export default api; 