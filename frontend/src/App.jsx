import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Navbar from './components/Navbar'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import AdminDashboard from './pages/AdminDashboard'
import RecruiterDashboard from './pages/RecruiterDashboard'
import StudentDashboard from './pages/StudentDashboard'
import AccessDenied from './pages/AccessDenied'
// Admin pages
import AdminUsers from './pages/admin/AdminUsers'
import AdminCompanies from './pages/admin/AdminCompanies'
import AdminStudents from './pages/admin/AdminStudents'
// Recruiter pages
import JobsList from './pages/recruiter/JobsList'
import PostJob from './pages/recruiter/PostJob'
import ApplicationsList from './pages/recruiter/ApplicationsList'
import RecruiterInterviews from './pages/recruiter/RecruiterInterviews'
// Student pages
import BrowseJobs from './pages/student/BrowseJobs'
import MyApplications from './pages/student/MyApplications'
import MyPlacements from './pages/student/MyPlacements'
import StudentInterviews from './pages/student/StudentInterviews'
import StudentProfile from './components/StudentProfile'
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
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            theme: {
              primary: 'green',
              secondary: 'black',
            },
          },
        }}
      />
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
              <AdminUsers />
            </RoleBasedRoute>
          } 
        />
        <Route 
          path="/admin/companies" 
          element={
            <RoleBasedRoute allowedRoles={['admin']}>
              <AdminCompanies />
            </RoleBasedRoute>
          } 
        />
        <Route 
          path="/admin/students" 
          element={
            <RoleBasedRoute allowedRoles={['admin']}>
              <AdminStudents />
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
              <JobsList />
            </RoleBasedRoute>
          } 
        />
        <Route 
          path="/recruiter/jobs/post" 
          element={
            <RoleBasedRoute allowedRoles={['recruiter']}>
              <PostJob />
            </RoleBasedRoute>
          } 
        />
        <Route 
          path="/recruiter/applications" 
          element={
            <RoleBasedRoute allowedRoles={['recruiter']}>
              <ApplicationsList />
            </RoleBasedRoute>
          } 
        />
        <Route 
          path="/recruiter/interviews" 
          element={
            <RoleBasedRoute allowedRoles={['recruiter']}>
              <RecruiterInterviews />
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
              <BrowseJobs />
            </RoleBasedRoute>
          } 
        />
        <Route 
          path="/student/applications" 
          element={
            <RoleBasedRoute allowedRoles={['student']}>
              <MyApplications />
            </RoleBasedRoute>
          } 
        />
        <Route 
          path="/student/interviews" 
          element={
            <RoleBasedRoute allowedRoles={['student']}>
              <StudentInterviews />
            </RoleBasedRoute>
          } 
        />
        <Route 
          path="/student/placements" 
          element={
            <RoleBasedRoute allowedRoles={['student']}>
              <MyPlacements />
            </RoleBasedRoute>
          } 
        />
        <Route 
          path="/student/profile" 
          element={
            <RoleBasedRoute allowedRoles={['student']}>
              <StudentProfile />
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
