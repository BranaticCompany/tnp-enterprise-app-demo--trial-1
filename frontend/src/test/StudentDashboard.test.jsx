import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import StudentDashboard from '../pages/StudentDashboard'
import { AuthProvider } from '../contexts/AuthContext'

// Mock the API
vi.mock('../api/auth', () => ({
  reportsAPI: {
    getMyReport: vi.fn(() => Promise.resolve({
      applications: { total_applications: 5, shortlisted_count: 2 },
      interviews: { total_interviews: 3, completed_count: 2 },
      placements: { total_placements: 1, accepted_count: 1, highest_package_offered: 1500000 }
    }))
  }
}))

const MockAuthProvider = ({ children, user = { email: 'student@test.com', role: 'student' } }) => {
  const mockAuthValue = {
    user,
    isAuthenticated: true,
    loading: false,
    isAdmin: user.role === 'admin',
    isRecruiter: user.role === 'recruiter',
    isStudent: user.role === 'student'
  }

  return (
    <AuthProvider value={mockAuthValue}>
      {children}
    </AuthProvider>
  )
}

const renderWithProviders = (component, user) => {
  return render(
    <BrowserRouter>
      <MockAuthProvider user={user}>
        {component}
      </MockAuthProvider>
    </BrowserRouter>
  )
}

describe('StudentDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders student dashboard with correct title', async () => {
    renderWithProviders(<StudentDashboard />, { email: 'student@test.com', role: 'student' })
    
    expect(screen.getByText('Student Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Welcome back, student@test.com')).toBeInTheDocument()
  })

  it('shows student-specific content', async () => {
    renderWithProviders(<StudentDashboard />, { email: 'student@test.com', role: 'student' })
    
    expect(screen.getByText('Student')).toBeInTheDocument()
    expect(screen.getByText('Track your applications, interviews, and placement opportunities')).toBeInTheDocument()
  })

  it('displays key metrics for student', async () => {
    renderWithProviders(<StudentDashboard />, { email: 'student@test.com', role: 'student' })
    
    await waitFor(() => {
      expect(screen.getByText('Applications')).toBeInTheDocument()
      expect(screen.getByText('Interviews')).toBeInTheDocument()
      expect(screen.getByText('Placements')).toBeInTheDocument()
      expect(screen.getByText('Highest Package')).toBeInTheDocument()
    })
  })

  it('shows student action buttons including My Applications', async () => {
    renderWithProviders(<StudentDashboard />, { email: 'student@test.com', role: 'student' })
    
    await waitFor(() => {
      expect(screen.getByText('Browse Jobs')).toBeInTheDocument()
      expect(screen.getByText('Apply to Job')).toBeInTheDocument()
      expect(screen.getByText('View Applications')).toBeInTheDocument()
      expect(screen.getByText('Update Profile')).toBeInTheDocument()
    })
  })

  it('displays application status and upcoming events', async () => {
    renderWithProviders(<StudentDashboard />, { email: 'student@test.com', role: 'student' })
    
    await waitFor(() => {
      expect(screen.getByText('Application Status')).toBeInTheDocument()
      expect(screen.getByText('Upcoming Events')).toBeInTheDocument()
      expect(screen.getByText('Placement Progress')).toBeInTheDocument()
    })
  })
})
