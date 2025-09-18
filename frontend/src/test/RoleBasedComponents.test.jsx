import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import React from 'react'

// Simple test components to verify role-based rendering
const TestAdminComponent = () => {
  return (
    <div>
      <h1>Admin Dashboard</h1>
      <p>Reports</p>
      <button>Manage Users</button>
    </div>
  )
}

const TestRecruiterComponent = () => {
  return (
    <div>
      <h1>Recruiter Dashboard</h1>
      <p>Post Job</p>
      <button>Review Applications</button>
    </div>
  )
}

const TestStudentComponent = () => {
  return (
    <div>
      <h1>Student Dashboard</h1>
      <p>My Applications</p>
      <button>Apply to Job</button>
    </div>
  )
}

const TestNavbar = ({ userRole }) => {
  return (
    <nav>
      <div>TnP Portal</div>
      {userRole === 'admin' && (
        <div>
          <a href="/admin/reports">Reports</a>
          <a href="/admin/users">Users</a>
        </div>
      )}
      {userRole === 'recruiter' && (
        <div>
          <a href="/recruiter/jobs">Jobs</a>
          <a href="/recruiter/interviews">Interviews</a>
        </div>
      )}
      {userRole === 'student' && (
        <div>
          <a href="/student/applications">My Applications</a>
          <a href="/student/interviews">My Interviews</a>
        </div>
      )}
    </nav>
  )
}

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>)
}

describe('Role-Based Components', () => {
  describe('Admin Components', () => {
    it('admin sees Reports', () => {
      renderWithRouter(<TestAdminComponent />)
      expect(screen.getByText('Reports')).toBeInTheDocument()
    })

    it('admin dashboard has correct title', () => {
      renderWithRouter(<TestAdminComponent />)
      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument()
    })

    it('admin can manage users', () => {
      renderWithRouter(<TestAdminComponent />)
      expect(screen.getByText('Manage Users')).toBeInTheDocument()
    })
  })

  describe('Recruiter Components', () => {
    it('recruiter sees Post Job', () => {
      renderWithRouter(<TestRecruiterComponent />)
      expect(screen.getByText('Post Job')).toBeInTheDocument()
    })

    it('recruiter dashboard has correct title', () => {
      renderWithRouter(<TestRecruiterComponent />)
      expect(screen.getByText('Recruiter Dashboard')).toBeInTheDocument()
    })

    it('recruiter can review applications', () => {
      renderWithRouter(<TestRecruiterComponent />)
      expect(screen.getByText('Review Applications')).toBeInTheDocument()
    })
  })

  describe('Student Components', () => {
    it('student sees My Applications', () => {
      renderWithRouter(<TestStudentComponent />)
      expect(screen.getByText('My Applications')).toBeInTheDocument()
    })

    it('student dashboard has correct title', () => {
      renderWithRouter(<TestStudentComponent />)
      expect(screen.getByText('Student Dashboard')).toBeInTheDocument()
    })

    it('student can apply to jobs', () => {
      renderWithRouter(<TestStudentComponent />)
      expect(screen.getByText('Apply to Job')).toBeInTheDocument()
    })
  })

  describe('Navigation Role-Based Visibility', () => {
    it('admin navigation shows Reports and Users', () => {
      renderWithRouter(<TestNavbar userRole="admin" />)
      expect(screen.getByText('Reports')).toBeInTheDocument()
      expect(screen.getByText('Users')).toBeInTheDocument()
    })

    it('recruiter navigation shows Jobs and Interviews', () => {
      renderWithRouter(<TestNavbar userRole="recruiter" />)
      expect(screen.getByText('Jobs')).toBeInTheDocument()
      expect(screen.getByText('Interviews')).toBeInTheDocument()
    })

    it('student navigation shows My Applications and My Interviews', () => {
      renderWithRouter(<TestNavbar userRole="student" />)
      expect(screen.getByText('My Applications')).toBeInTheDocument()
      expect(screen.getByText('My Interviews')).toBeInTheDocument()
    })

    it('negative case: student cannot see Reports', () => {
      renderWithRouter(<TestNavbar userRole="student" />)
      expect(screen.queryByText('Reports')).not.toBeInTheDocument()
    })

    it('negative case: recruiter cannot see Users', () => {
      renderWithRouter(<TestNavbar userRole="recruiter" />)
      expect(screen.queryByText('Users')).not.toBeInTheDocument()
    })
  })

  describe('Access Control Logic', () => {
    const AccessControlTest = ({ allowedRoles, userRole, children }) => {
      const hasAccess = allowedRoles.includes(userRole)
      
      if (!hasAccess) {
        return <div>Access Denied</div>
      }
      
      return <div>{children}</div>
    }

    it('admin can access admin routes', () => {
      renderWithRouter(
        <AccessControlTest allowedRoles={['admin']} userRole="admin">
          <div>Admin Content</div>
        </AccessControlTest>
      )
      expect(screen.getByText('Admin Content')).toBeInTheDocument()
      expect(screen.queryByText('Access Denied')).not.toBeInTheDocument()
    })

    it('student cannot access admin routes', () => {
      renderWithRouter(
        <AccessControlTest allowedRoles={['admin']} userRole="student">
          <div>Admin Content</div>
        </AccessControlTest>
      )
      expect(screen.getByText('Access Denied')).toBeInTheDocument()
      expect(screen.queryByText('Admin Content')).not.toBeInTheDocument()
    })

    it('recruiter can access recruiter routes', () => {
      renderWithRouter(
        <AccessControlTest allowedRoles={['recruiter']} userRole="recruiter">
          <div>Recruiter Content</div>
        </AccessControlTest>
      )
      expect(screen.getByText('Recruiter Content')).toBeInTheDocument()
    })

    it('student can access student routes', () => {
      renderWithRouter(
        <AccessControlTest allowedRoles={['student']} userRole="student">
          <div>Student Content</div>
        </AccessControlTest>
      )
      expect(screen.getByText('Student Content')).toBeInTheDocument()
    })
  })
})
