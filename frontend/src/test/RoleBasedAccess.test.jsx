import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Navbar from '../components/Navbar'
import AccessDenied from '../pages/AccessDenied'
import { AuthProvider } from '../contexts/AuthContext'

const MockAuthProvider = ({ children, user }) => {
  const mockAuthValue = {
    user,
    isAuthenticated: !!user,
    loading: false,
    isAdmin: user?.role === 'admin',
    isRecruiter: user?.role === 'recruiter',
    isStudent: user?.role === 'student',
    logout: vi.fn()
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

describe('Role-Based Access Control', () => {
  describe('Navbar Role-Based Navigation', () => {
    it('shows admin navigation items for admin user', () => {
      const adminUser = { email: 'admin@test.com', role: 'admin' }
      renderWithProviders(<Navbar />, adminUser)
      
      expect(screen.getByText('Users')).toBeInTheDocument()
      expect(screen.getByText('Companies')).toBeInTheDocument()
      expect(screen.getByText('Reports')).toBeInTheDocument()
      expect(screen.getByText('Administrator')).toBeInTheDocument()
    })

    it('shows recruiter navigation items for recruiter user', () => {
      const recruiterUser = { email: 'recruiter@test.com', role: 'recruiter' }
      renderWithProviders(<Navbar />, recruiterUser)
      
      expect(screen.getByText('Jobs')).toBeInTheDocument()
      expect(screen.getByText('Applications')).toBeInTheDocument()
      expect(screen.getByText('Interviews')).toBeInTheDocument()
      expect(screen.getByText('Recruiter')).toBeInTheDocument()
      
      // Should not see admin items
      expect(screen.queryByText('Users')).not.toBeInTheDocument()
      expect(screen.queryByText('Companies')).not.toBeInTheDocument()
    })

    it('shows student navigation items for student user', () => {
      const studentUser = { email: 'student@test.com', role: 'student' }
      renderWithProviders(<Navbar />, studentUser)
      
      expect(screen.getByText('Jobs')).toBeInTheDocument()
      expect(screen.getByText('My Applications')).toBeInTheDocument()
      expect(screen.getByText('My Interviews')).toBeInTheDocument()
      expect(screen.getByText('Placements')).toBeInTheDocument()
      expect(screen.getByText('Student')).toBeInTheDocument()
      
      // Should not see admin or recruiter items
      expect(screen.queryByText('Users')).not.toBeInTheDocument()
      expect(screen.queryByText('Companies')).not.toBeInTheDocument()
      expect(screen.queryByText('Reports')).not.toBeInTheDocument()
    })

    it('student cannot see Reports navigation item', () => {
      const studentUser = { email: 'student@test.com', role: 'student' }
      renderWithProviders(<Navbar />, studentUser)
      
      // Negative case: Student should not see Reports
      expect(screen.queryByText('Reports')).not.toBeInTheDocument()
    })
  })

  describe('Access Denied Page', () => {
    it('renders access denied page with user role', () => {
      const studentUser = { email: 'student@test.com', role: 'student' }
      renderWithProviders(<AccessDenied />, studentUser)
      
      expect(screen.getByText('Access Denied')).toBeInTheDocument()
      expect(screen.getByText("You don't have permission to access this page")).toBeInTheDocument()
      expect(screen.getByText('Student')).toBeInTheDocument()
      expect(screen.getByText('Go to My Dashboard')).toBeInTheDocument()
    })

    it('shows correct role badge for admin', () => {
      const adminUser = { email: 'admin@test.com', role: 'admin' }
      renderWithProviders(<AccessDenied />, adminUser)
      
      expect(screen.getByText('Administrator')).toBeInTheDocument()
    })

    it('shows correct role badge for recruiter', () => {
      const recruiterUser = { email: 'recruiter@test.com', role: 'recruiter' }
      renderWithProviders(<AccessDenied />, recruiterUser)
      
      expect(screen.getByText('Recruiter')).toBeInTheDocument()
    })
  })

  describe('Role-Specific Content Visibility', () => {
    it('admin sees Reports in navigation', () => {
      const adminUser = { email: 'admin@test.com', role: 'admin' }
      renderWithProviders(<Navbar />, adminUser)
      
      expect(screen.getByText('Reports')).toBeInTheDocument()
    })

    it('recruiter sees Post Job functionality (implied by Jobs nav)', () => {
      const recruiterUser = { email: 'recruiter@test.com', role: 'recruiter' }
      renderWithProviders(<Navbar />, recruiterUser)
      
      expect(screen.getByText('Jobs')).toBeInTheDocument()
    })

    it('student sees My Applications', () => {
      const studentUser = { email: 'student@test.com', role: 'student' }
      renderWithProviders(<Navbar />, studentUser)
      
      expect(screen.getByText('My Applications')).toBeInTheDocument()
    })

    it('negative case: student cannot see Reports', () => {
      const studentUser = { email: 'student@test.com', role: 'student' }
      renderWithProviders(<Navbar />, studentUser)
      
      expect(screen.queryByText('Reports')).not.toBeInTheDocument()
    })
  })
})
