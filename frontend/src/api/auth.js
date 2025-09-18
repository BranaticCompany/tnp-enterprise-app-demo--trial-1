import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authAPI = {
  login: async (email, password) => {
    const response = await api.post('/api/v1/auth/login', { email, password })
    return response.data
  },
  
  register: async (email, password, role = 'student') => {
    const response = await api.post('/api/v1/auth/register', { email, password, role })
    return response.data
  },
  
  getProfile: async () => {
    const response = await api.get('/api/v1/profile/me')
    return response.data
  },
  
  updateProfile: async (profileData) => {
    const response = await api.put('/api/v1/profile', profileData)
    return response.data
  }
}

export const reportsAPI = {
  getApplicationsReport: async () => {
    const response = await api.get('/api/v1/reports/applications')
    return response.data
  },
  
  getInterviewsReport: async () => {
    const response = await api.get('/api/v1/reports/interviews')
    return response.data
  },
  
  getPlacementsReport: async () => {
    const response = await api.get('/api/v1/reports/placements')
    return response.data
  },
  
  getStudentsReport: async () => {
    const response = await api.get('/api/v1/reports/students')
    return response.data
  },
  
  getMyReport: async () => {
    const response = await api.get('/api/v1/reports/me')
    return response.data
  }
}

export default api
