import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const Dashboard = () => {
  const { user, isAuthenticated, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />
  }
  
  // Redirect to role-specific dashboard
  if (user?.role === 'admin') return <Navigate to="/admin/dashboard" />
  if (user?.role === 'recruiter') return <Navigate to="/recruiter/dashboard" />
  if (user?.role === 'student') return <Navigate to="/student/dashboard" />
  
  return <Navigate to="/login" />
}


export default Dashboard
