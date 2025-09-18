import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Navbar from './components/Navbar'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import AdminDashboard from './pages/AdminDashboard'
import RecruiterDashboard from './pages/RecruiterDashboard'
import StudentDashboard from './pages/StudentDashboard'
import AccessDenied from './pages/AccessDenied'
import './index.css'

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />
}

const RoleBasedRoute = ({ children, allowedRoles }) => {
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
  
  if (!allowedRoles.includes(user?.role)) {
    return <AccessDenied />
  }
  
  return children
}

const RoleDashboardRedirect = () => {
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

const PublicRoute = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }
  
  if (isAuthenticated) {
    // Redirect to role-specific dashboard
    if (user?.role === 'admin') return <Navigate to="/admin/dashboard" />
    if (user?.role === 'recruiter') return <Navigate to="/recruiter/dashboard" />
    if (user?.role === 'student') return <Navigate to="/student/dashboard" />
  }
  
  return children
}

const AppContent = () => {
  const { isAuthenticated } = useAuth()
  
  return (
    <div className="min-h-screen bg-gray-50">
      {isAuthenticated && <Navbar />}
      <Routes>
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } 
        />
        
        {/* Legacy dashboard route - redirects to role-specific dashboard */}
        <Route path="/dashboard" element={<RoleDashboardRedirect />} />
        
        {/* Admin Routes */}
        <Route 
          path="/admin/dashboard" 
          element={
            <RoleBasedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </RoleBasedRoute>
          } 
        />
        <Route 
          path="/admin/users" 
          element={
            <RoleBasedRoute allowedRoles={['admin']}>
              <div className="p-6 max-w-7xl mx-auto">
                <h1 className="text-2xl font-bold">User Management</h1>
                <p className="text-gray-600 mt-2">Manage all users in the system</p>
              </div>
            </RoleBasedRoute>
          } 
        />
        <Route 
          path="/admin/companies" 
          element={
            <RoleBasedRoute allowedRoles={['admin']}>
              <div className="p-6 max-w-7xl mx-auto">
                <h1 className="text-2xl font-bold">Company Management</h1>
                <p className="text-gray-600 mt-2">Manage companies and their job postings</p>
              </div>
            </RoleBasedRoute>
          } 
        />
        <Route 
          path="/admin/reports" 
          element={
            <RoleBasedRoute allowedRoles={['admin']}>
              <div className="p-6 max-w-7xl mx-auto">
                <h1 className="text-2xl font-bold">Reports & Analytics</h1>
                <p className="text-gray-600 mt-2">View detailed reports and analytics</p>
              </div>
            </RoleBasedRoute>
          } 
        />
        
        {/* Recruiter Routes */}
        <Route 
          path="/recruiter/dashboard" 
          element={
            <RoleBasedRoute allowedRoles={['recruiter']}>
              <RecruiterDashboard />
            </RoleBasedRoute>
          } 
        />
        <Route 
          path="/recruiter/jobs" 
          element={
            <RoleBasedRoute allowedRoles={['recruiter']}>
              <div className="p-6 max-w-7xl mx-auto">
                <h1 className="text-2xl font-bold">Job Management</h1>
                <p className="text-gray-600 mt-2">Create and manage your job postings</p>
              </div>
            </RoleBasedRoute>
          } 
        />
        <Route 
          path="/recruiter/applications" 
          element={
            <RoleBasedRoute allowedRoles={['recruiter']}>
              <div className="p-6 max-w-7xl mx-auto">
                <h1 className="text-2xl font-bold">Applications</h1>
                <p className="text-gray-600 mt-2">Review and manage job applications</p>
              </div>
            </RoleBasedRoute>
          } 
        />
        <Route 
          path="/recruiter/interviews" 
          element={
            <RoleBasedRoute allowedRoles={['recruiter']}>
              <div className="p-6 max-w-7xl mx-auto">
                <h1 className="text-2xl font-bold">Interviews</h1>
                <p className="text-gray-600 mt-2">Schedule and manage interviews</p>
              </div>
            </RoleBasedRoute>
          } 
        />
        
        {/* Student Routes */}
        <Route 
          path="/student/dashboard" 
          element={
            <RoleBasedRoute allowedRoles={['student']}>
              <StudentDashboard />
            </RoleBasedRoute>
          } 
        />
        <Route 
          path="/student/jobs" 
          element={
            <RoleBasedRoute allowedRoles={['student']}>
              <div className="p-6 max-w-7xl mx-auto">
                <h1 className="text-2xl font-bold">Available Jobs</h1>
                <p className="text-gray-600 mt-2">Browse and apply to job opportunities</p>
              </div>
            </RoleBasedRoute>
          } 
        />
        <Route 
          path="/student/applications" 
          element={
            <RoleBasedRoute allowedRoles={['student']}>
              <div className="p-6 max-w-7xl mx-auto">
                <h1 className="text-2xl font-bold">My Applications</h1>
                <p className="text-gray-600 mt-2">Track your job applications</p>
              </div>
            </RoleBasedRoute>
          } 
        />
        <Route 
          path="/student/interviews" 
          element={
            <RoleBasedRoute allowedRoles={['student']}>
              <div className="p-6 max-w-7xl mx-auto">
                <h1 className="text-2xl font-bold">My Interviews</h1>
                <p className="text-gray-600 mt-2">View your scheduled interviews</p>
              </div>
            </RoleBasedRoute>
          } 
        />
        <Route 
          path="/student/placements" 
          element={
            <RoleBasedRoute allowedRoles={['student']}>
              <div className="p-6 max-w-7xl mx-auto">
                <h1 className="text-2xl font-bold">Placements</h1>
                <p className="text-gray-600 mt-2">View your placement status and offers</p>
              </div>
            </RoleBasedRoute>
          } 
        />
        
        <Route path="/" element={<RoleDashboardRedirect />} />
        <Route path="*" element={<RoleDashboardRedirect />} />
      </Routes>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  )
}

export default App
