import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Button } from './ui/button'

const Navbar = () => {
  const { user, logout, isAdmin, isRecruiter, isStudent } = useAuth()
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(null)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const toggleDropdown = (dropdown) => {
    setDropdownOpen(dropdownOpen === dropdown ? null : dropdown)
  }

  const closeDropdown = () => {
    setDropdownOpen(null)
  }

  return (
    <nav className="bg-white shadow-sm border-b" onClick={closeDropdown}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link 
              to={
                user?.role === 'admin' ? '/admin/dashboard' :
                user?.role === 'recruiter' ? '/recruiter/dashboard' :
                user?.role === 'student' ? '/student/dashboard' :
                '/dashboard'
              } 
              className="text-xl font-bold text-gray-900"
            >
              TnP Portal
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {user && (
              <>
                {/* Admin Navigation */}
                {isAdmin && (
                  <>
                    <Link
                      to="/admin/dashboard"
                      className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/admin/users"
                      className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Users
                    </Link>
                    <Link
                      to="/admin/companies"
                      className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Companies
                    </Link>
                    <Link
                      to="/admin/reports"
                      className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Reports
                    </Link>
                  </>
                )}

                {/* Recruiter Navigation */}
                {isRecruiter && (
                  <>
                    <Link
                      to="/recruiter/dashboard"
                      className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Dashboard
                    </Link>
                    
                    {/* Jobs Dropdown */}
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleDropdown('jobs')
                        }}
                        className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium flex items-center"
                      >
                        Jobs
                        <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {dropdownOpen === 'jobs' && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border">
                          <Link
                            to="/recruiter/jobs/post"
                            onClick={closeDropdown}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            Post Job
                          </Link>
                          <Link
                            to="/recruiter/jobs"
                            onClick={closeDropdown}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            Manage Jobs
                          </Link>
                        </div>
                      )}
                    </div>
                    
                    <Link
                      to="/recruiter/applications"
                      className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Applications
                    </Link>
                    <Link
                      to="/recruiter/interviews"
                      className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Interviews
                    </Link>
                  </>
                )}

                {/* Student Navigation */}
                {isStudent && (
                  <>
                    <Link
                      to="/student/dashboard"
                      className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/student/jobs"
                      className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Browse Jobs
                    </Link>
                    <Link
                      to="/student/applications"
                      className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                      data-cy="nav-my-applications"
                    >
                      My Applications
                    </Link>
                    <Link
                      to="/student/interviews"
                      className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                      data-cy="nav-my-interviews"
                    >
                      My Interviews
                    </Link>
                    <Link
                      to="/student/placements"
                      className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                      data-cy="nav-my-placements"
                    >
                      My Placements
                    </Link>
                  </>
                )}

                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">{user.email}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    user?.role === 'admin' ? 'bg-red-100 text-red-800' :
                    user?.role === 'recruiter' ? 'bg-blue-100 text-blue-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
                  </span>
                  <Button variant="outline" size="sm" onClick={handleLogout}>
                    Logout
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
