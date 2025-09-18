import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import RecruiterDashboard from '../pages/RecruiterDashboard'
import { AuthProvider } from '../contexts/AuthContext'

// Mock the API
vi.mock('../api/auth', () => ({
  reportsAPI: {
    getApplicationsReport: vi.fn(() => Promise.resolve({
      overall_statistics: { total_applications: 150, hired_count: 25 }
    })),
    getInterviewsReport: vi.fn(() => Promise.resolve({
      overall_statistics: { total_interviews: 75, completed_count: 60 }
    })),
    getPlacementsReport: vi.fn(() => Promise.resolve({
      overall_statistics: { average_package: 1200000 }
    }))
  }
}))

const MockAuthProvider = ({ children, user = { email: 'recruiter@test.com', role: 'recruiter' } }) => {
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

describe('RecruiterDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders recruiter dashboard with correct title', async () => {
    renderWithProviders(<RecruiterDashboard />, { email: 'recruiter@test.com', role: 'recruiter' })
    
    expect(screen.getByText('Recruiter Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Welcome back, recruiter@test.com')).toBeInTheDocument()
  })

  it('shows recruiter-specific content', async () => {
    renderWithProviders(<RecruiterDashboard />, { email: 'recruiter@test.com', role: 'recruiter' })
    
    expect(screen.getByText('Recruiter')).toBeInTheDocument()
    expect(screen.getByText('Post jobs, review applications, and schedule interviews')).toBeInTheDocument()
  })

  it('displays key metrics for recruiter', async () => {
    renderWithProviders(<RecruiterDashboard />, { email: 'recruiter@test.com', role: 'recruiter' })
    
    await waitFor(() => {
      expect(screen.getByText('Active Jobs')).toBeInTheDocument()
      expect(screen.getByText('Applications Received')).toBeInTheDocument()
      expect(screen.getByText('Interviews Scheduled')).toBeInTheDocument()
      expect(screen.getByText('Successful Hires')).toBeInTheDocument()
    })
  })

  it('shows recruiter action buttons including Post New Job', async () => {
    renderWithProviders(<RecruiterDashboard />, { email: 'recruiter@test.com', role: 'recruiter' })
    
    await waitFor(() => {
      expect(screen.getByText('Post New Job')).toBeInTheDocument()
      expect(screen.getByText('Review Applications')).toBeInTheDocument()
      expect(screen.getByText('Schedule Interview')).toBeInTheDocument()
      expect(screen.getByText('Make Offer')).toBeInTheDocument()
    })
  })

  it('displays recent applications and hiring pipeline', async () => {
    renderWithProviders(<RecruiterDashboard />, { email: 'recruiter@test.com', role: 'recruiter' })
    
    await waitFor(() => {
      expect(screen.getByText('Recent Applications')).toBeInTheDocument()
      expect(screen.getByText('Hiring Pipeline')).toBeInTheDocument()
    })
  })
})
