import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import AdminDashboard from '../pages/AdminDashboard'
import { AuthProvider } from '../contexts/AuthContext'

// Mock the API
vi.mock('../api/auth', () => ({
  reportsAPI: {
    getApplicationsReport: vi.fn(() => Promise.resolve({
      overall_statistics: { total_applications: 150, hired_count: 25 },
      applications_by_company: [
        { company_name: 'Google', total_applications: 50 },
        { company_name: 'Microsoft', total_applications: 30 }
      ]
    })),
    getInterviewsReport: vi.fn(() => Promise.resolve({
      overall_statistics: { total_interviews: 75, completed_count: 60 }
    })),
    getPlacementsReport: vi.fn(() => Promise.resolve({
      overall_statistics: { average_package: 1200000 },
      package_distribution: [
        { package_range: '10-15 LPA', placement_count: 20 },
        { package_range: '15-20 LPA', placement_count: 15 }
      ]
    })),
    getStudentsReport: vi.fn(() => Promise.resolve({
      overall_statistics: { total_students: 200, students_placed: 45 }
    }))
  }
}))

// Mock the AuthContext
const MockAuthContext = React.createContext()

const MockAuthProvider = ({ children, user = { email: 'admin@test.com', role: 'admin' } }) => {
  const mockAuthValue = {
    user,
    isAuthenticated: true,
    loading: false,
    isAdmin: user.role === 'admin',
    isRecruiter: user.role === 'recruiter',
    isStudent: user.role === 'student'
  }

  return (
    <MockAuthContext.Provider value={mockAuthValue}>
      {children}
    </MockAuthContext.Provider>
  )
}

// Mock the useAuth hook
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => {
    const context = React.useContext(MockAuthContext)
    return context || {
      user: { email: 'admin@test.com', role: 'admin' },
      isAuthenticated: true,
      loading: false,
      isAdmin: true,
      isRecruiter: false,
      isStudent: false
    }
  },
  AuthProvider: ({ children }) => children
}))

const renderWithProviders = (component, user) => {
  return render(
    <BrowserRouter>
      <MockAuthProvider user={user}>
        {component}
      </MockAuthProvider>
    </BrowserRouter>
  )
}

describe('AdminDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders admin dashboard with correct title', async () => {
    renderWithProviders(<AdminDashboard />, { email: 'admin@test.com', role: 'admin' })
    
    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Welcome back, admin@test.com')).toBeInTheDocument()
  })

  it('shows admin-specific content', async () => {
    renderWithProviders(<AdminDashboard />, { email: 'admin@test.com', role: 'admin' })
    
    expect(screen.getByText('Administrator')).toBeInTheDocument()
    expect(screen.getByText('Manage users, companies, and oversee the entire TnP process')).toBeInTheDocument()
  })

  it('displays key metrics for admin', async () => {
    renderWithProviders(<AdminDashboard />, { email: 'admin@test.com', role: 'admin' })
    
    await waitFor(() => {
      expect(screen.getByText('Total Students')).toBeInTheDocument()
      expect(screen.getByText('Total Applications')).toBeInTheDocument()
      expect(screen.getByText('Total Interviews')).toBeInTheDocument()
      expect(screen.getByText('Avg Package')).toBeInTheDocument()
    })
  })

  it('shows admin action buttons', async () => {
    renderWithProviders(<AdminDashboard />, { email: 'admin@test.com', role: 'admin' })
    
    await waitFor(() => {
      expect(screen.getByText('Manage Users')).toBeInTheDocument()
      expect(screen.getByText('Manage Companies')).toBeInTheDocument()
      expect(screen.getByText('Generate Reports')).toBeInTheDocument()
    })
  })

  it('displays reports section', async () => {
    renderWithProviders(<AdminDashboard />, { email: 'admin@test.com', role: 'admin' })
    
    await waitFor(() => {
      expect(screen.getByText('Applications by Company')).toBeInTheDocument()
      expect(screen.getByText('Placement Statistics')).toBeInTheDocument()
    })
  })
})
