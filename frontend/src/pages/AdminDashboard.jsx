import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { adminAPI, reportsAPI } from '../api/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { useNavigate } from 'react-router-dom'

const AdminDashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const loadDashboardData = async () => {
    setLoading(true)
    setError(null)
    try {
      console.log('Loading admin dashboard data...')
      const [usersData, companiesData, studentsData] = await Promise.all([
        adminAPI.getAllUsers(),
        adminAPI.getAllCompanies(),
        adminAPI.getAllStudents()
      ])
      
      // Calculate statistics from the data
      const stats = {
        totalUsers: usersData.count || 0,
        totalStudents: studentsData.count || 0,
        totalCompanies: companiesData.count || 0,
        placedStudents: studentsData.students?.filter(s => s.placed).length || 0,
        totalApplications: studentsData.students?.reduce((sum, s) => sum + s.total_applications, 0) || 0,
        totalInterviews: studentsData.students?.reduce((sum, s) => sum + s.total_interviews, 0) || 0,
        companiesWithJobs: companiesData.companies?.filter(c => c.jobs_posted > 0).length || 0,
        totalJobsPosted: companiesData.companies?.reduce((sum, c) => sum + c.jobs_posted, 0) || 0
      }
      
      setDashboardData({
        users: usersData.users || [],
        companies: companiesData.companies || [],
        students: studentsData.students || [],
        stats
      })
      
      console.log('Dashboard data loaded:', stats)
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
      setError(error.response?.data?.message || 'Failed to load dashboard data')
    }
    setLoading(false)
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="mb-8 bg-gradient-to-r from-red-50 to-red-100 rounded-lg p-6 border border-red-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-red-900">
              Admin Dashboard
            </h1>
            <p className="text-red-700 mt-1">
              Welcome back, {user?.email}
            </p>
            <p className="text-red-600 text-sm mt-1">
              Manage users, companies, and oversee the entire TnP process
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
              Administrator
            </span>
            <Button onClick={loadDashboardData} disabled={loading} variant="outline">
              {loading ? 'Loading...' : 'Refresh Data'}
            </Button>
          </div>
        </div>
      </div>

      {loading && !dashboardData && (
        <div className="text-center py-8">
          <p className="text-gray-600">Loading dashboard data...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
          <Button onClick={loadDashboardData} className="mt-2" size="sm">
            Retry
          </Button>
        </div>
      )}

      {dashboardData && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="border-red-200 cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/admin/users')}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {dashboardData.stats.totalUsers}
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  All system users
                </p>
              </CardContent>
            </Card>

            <Card className="border-green-200 cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/admin/students')}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Students</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {dashboardData.stats.totalStudents}
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {dashboardData.stats.placedStudents} placed
                </p>
              </CardContent>
            </Card>

            <Card className="border-blue-200 cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/admin/companies')}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Companies</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {dashboardData.stats.totalCompanies}
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {dashboardData.stats.companiesWithJobs} with jobs
                </p>
              </CardContent>
            </Card>

            <Card className="border-purple-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Applications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {dashboardData.stats.totalApplications}
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Total submitted
                </p>
              </CardContent>
            </Card>

            <Card className="border-orange-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Interviews</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {dashboardData.stats.totalInterviews}
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Scheduled
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Students</CardTitle>
                <CardDescription>Latest student registrations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardData.students.slice(0, 5).map((student, index) => (
                    <div key={index} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                      <div>
                        <span className="text-sm font-medium">{student.name}</span>
                        <div className="text-xs text-gray-500">{student.branch}</div>
                      </div>
                      <div className="text-right">
                        {student.placed ? (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Placed
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Active
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full mt-2"
                    onClick={() => navigate('/admin/students')}
                  >
                    View All Students
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Companies</CardTitle>
                <CardDescription>Companies by job postings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardData.companies
                    .sort((a, b) => b.jobs_posted - a.jobs_posted)
                    .slice(0, 5)
                    .map((company, index) => (
                    <div key={index} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                      <span className="text-sm font-medium">{company.name}</span>
                      <div className="text-right">
                        <span className="text-sm text-gray-900 font-semibold">{company.jobs_posted}</span>
                        <span className="text-xs text-gray-500 ml-1">jobs</span>
                      </div>
                    </div>
                  ))}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full mt-2"
                    onClick={() => navigate('/admin/companies')}
                  >
                    View All Companies
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Overview</CardTitle>
                <CardDescription>Platform statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Placement Rate</span>
                    <span className="text-sm font-semibold">
                      {dashboardData.stats.totalStudents > 0 
                        ? `${((dashboardData.stats.placedStudents / dashboardData.stats.totalStudents) * 100).toFixed(1)}%`
                        : '0%'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Avg Applications/Student</span>
                    <span className="text-sm font-semibold">
                      {dashboardData.stats.totalStudents > 0 
                        ? (dashboardData.stats.totalApplications / dashboardData.stats.totalStudents).toFixed(1)
                        : '0'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Jobs per Company</span>
                    <span className="text-sm font-semibold">
                      {dashboardData.stats.totalCompanies > 0 
                        ? (dashboardData.stats.totalJobsPosted / dashboardData.stats.totalCompanies).toFixed(1)
                        : '0'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Interview Rate</span>
                    <span className="text-sm font-semibold">
                      {dashboardData.stats.totalApplications > 0 
                        ? `${((dashboardData.stats.totalInterviews / dashboardData.stats.totalApplications) * 100).toFixed(1)}%`
                        : '0%'
                      }
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Admin Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Navigate to key administrative functions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Button 
                  className="h-20 flex flex-col items-center justify-center space-y-2"
                  onClick={() => navigate('/admin/users')}
                >
                  <span className="text-lg">👥</span>
                  <span>Manage Users</span>
                  <span className="text-xs text-gray-300">{dashboardData.stats.totalUsers} users</span>
                </Button>
                <Button 
                  className="h-20 flex flex-col items-center justify-center space-y-2" 
                  variant="outline"
                  onClick={() => navigate('/admin/students')}
                >
                  <span className="text-lg">🎓</span>
                  <span>Manage Students</span>
                  <span className="text-xs text-gray-500">{dashboardData.stats.totalStudents} students</span>
                </Button>
                <Button 
                  className="h-20 flex flex-col items-center justify-center space-y-2" 
                  variant="outline"
                  onClick={() => navigate('/admin/companies')}
                >
                  <span className="text-lg">🏢</span>
                  <span>Manage Companies</span>
                  <span className="text-xs text-gray-500">{dashboardData.stats.totalCompanies} companies</span>
                </Button>
                <Button 
                  className="h-20 flex flex-col items-center justify-center space-y-2" 
                  variant="outline"
                  onClick={() => navigate('/admin/reports')}
                >
                  <span className="text-lg">📊</span>
                  <span>View Reports</span>
                  <span className="text-xs text-gray-500">Analytics</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {!dashboardData && !loading && !error && (
        <div className="text-center py-8">
          <p className="text-gray-600">No data available. Click "Refresh Data" to load dashboard.</p>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard
