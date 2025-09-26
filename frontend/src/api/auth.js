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

export const jobsAPI = {
  getAllJobs: async () => {
    const response = await api.get('/api/v1/jobs')
    return response.data
  },

  getRecruiterJobs: async () => {
    const response = await api.get('/api/v1/jobs/recruiter/jobs')
    return response.data
  },

  createJob: async (jobData) => {
    const response = await api.post('/api/v1/jobs', jobData)
    return response.data
  },

  getJobById: async (jobId) => {
    const response = await api.get(`/api/v1/jobs/${jobId}`)
    return response.data
  },

  updateJob: async (jobId, jobData) => {
    const response = await api.put(`/api/v1/jobs/${jobId}`, jobData)
    return response.data
  },

  deleteJob: async (jobId) => {
    const response = await api.delete(`/api/v1/jobs/${jobId}`)
    return response.data
  }
}

export const applicationsAPI = {
  getAllApplications: async (jobId = null) => {
    const url = jobId ? `/api/v1/applications/job/${jobId}` : '/api/v1/applications'
    const response = await api.get(url)
    return response.data
  },

  getMyApplications: async () => {
    const response = await api.get('/api/v1/applications/me')
    return response.data
  },

  createApplication: async (applicationData) => {
    const response = await api.post('/api/v1/applications', applicationData)
    return response.data
  },

  getApplicationById: async (applicationId) => {
    const response = await api.get(`/api/v1/applications/${applicationId}`)
    return response.data
  },

  updateApplication: async (applicationId, applicationData) => {
    const response = await api.put(`/api/v1/applications/${applicationId}`, applicationData)
    return response.data
  },

  updateApplicationStatus: async (applicationId, statusData) => {
    const response = await api.put(`/api/v1/applications/${applicationId}/status`, statusData)
    return response.data
  }
}

export const placementsAPI = {
  getAllPlacements: async () => {
    const response = await api.get('/api/v1/placements')
    return response.data
  },

  getMyPlacements: async () => {
    const response = await api.get('/api/v1/placements/me')
    return response.data
  }
}

export const interviewsAPI = {
  getAllInterviews: async () => {
    const response = await api.get('/api/v1/interviews')
    return response.data
  },

  getMyInterviews: async () => {
    const response = await api.get('/api/v1/interviews/me')
    return response.data
  }
}

export const companiesAPI = {
  getAllCompanies: async () => {
    const response = await api.get('/api/v1/companies')
    return response.data
  },

  getCompanyById: async (companyId) => {
    const response = await api.get(`/api/v1/companies/${companyId}`)
    return response.data
  },

  createCompany: async (companyData) => {
    const response = await api.post('/api/v1/companies', companyData)
    return response.data
  },

  updateCompany: async (companyId, companyData) => {
    const response = await api.put(`/api/v1/companies/${companyId}`, companyData)
    return response.data
  },

  deleteCompany: async (companyId) => {
    const response = await api.delete(`/api/v1/companies/${companyId}`)
    return response.data
  }
}

export const recruiterAPI = {
  getDashboard: async () => {
    const response = await api.get('/api/v1/recruiter/dashboard')
    return response.data
  }
}

export const adminAPI = {
  getAllUsers: async () => {
    const response = await api.get('/api/v1/admin/users')
    return response.data
  },

  getAllCompanies: async () => {
    const response = await api.get('/api/v1/admin/companies')
    return response.data
  },

  getAllStudents: async () => {
    const response = await api.get('/api/v1/admin/students')
    return response.data
  }
}

export default api
