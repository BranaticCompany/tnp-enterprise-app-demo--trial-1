import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { reportsAPI } from '../api/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'

const AdminDashboard = () => {
  const { user } = useAuth()
  const [reports, setReports] = useState(null)
  const [loading, setLoading] = useState(false)

  const loadReports = async () => {
    setLoading(true)
    try {
      const [applications, interviews, placements, students] = await Promise.all([
        reportsAPI.getApplicationsReport(),
        reportsAPI.getInterviewsReport(),
        reportsAPI.getPlacementsReport(),
        reportsAPI.getStudentsReport()
      ])
      setReports({ applications, interviews, placements, students })
    } catch (error) {
      console.error('Failed to load reports:', error)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadReports()
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
            <Button onClick={loadReports} disabled={loading} variant="outline">
              {loading ? 'Loading...' : 'Refresh Data'}
            </Button>
          </div>
        </div>
      </div>

      {loading && !reports && (
        <div className="text-center py-8">
          <p className="text-gray-600">Loading dashboard data...</p>
        </div>
      )}

      {reports && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-red-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Students</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {reports.students?.overall_statistics?.total_students || 0}
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {reports.students?.overall_statistics?.students_placed || 0} placed
                </p>
              </CardContent>
            </Card>

            <Card className="border-blue-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Applications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {reports.applications?.overall_statistics?.total_applications || 0}
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {reports.applications?.overall_statistics?.hired_count || 0} hired
                </p>
              </CardContent>
            </Card>

            <Card className="border-green-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Interviews</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {reports.interviews?.overall_statistics?.total_interviews || 0}
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {reports.interviews?.overall_statistics?.completed_count || 0} completed
                </p>
              </CardContent>
            </Card>

            <Card className="border-purple-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Avg Package</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {reports.placements?.overall_statistics?.average_package 
                    ? `₹${(reports.placements.overall_statistics.average_package / 100000).toFixed(1)}L`
                    : 'N/A'
                  }
                </div>
                <p className="text-xs text-gray-600 mt-1">Average</p>
              </CardContent>
            </Card>
          </div>

          {/* Reports & Analytics Section */}
          <div className="mb-6">
            <h2 data-cy="reports-section" className="text-2xl font-bold text-gray-900 mb-4">Reports & Analytics</h2>
          </div>

          {/* Detailed Reports */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Applications by Company</CardTitle>
                <CardDescription>Top companies by application volume</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reports.applications?.applications_by_company?.slice(0, 8).map((company, index) => (
                    <div key={index} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                      <span className="text-sm font-medium">{company.company_name}</span>
                      <div className="text-right">
                        <span className="text-sm text-gray-900 font-semibold">{company.total_applications}</span>
                        <span className="text-xs text-gray-500 ml-1">applications</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Placement Statistics</CardTitle>
                <CardDescription>Package distribution overview</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reports.placements?.package_distribution?.map((range, index) => (
                    <div key={index} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                      <span className="text-sm font-medium">{range.package_range}</span>
                      <div className="text-right">
                        <span className="text-sm text-gray-900 font-semibold">{range.placement_count}</span>
                        <span className="text-xs text-gray-500 ml-1">placements</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Admin Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Admin Actions</CardTitle>
              <CardDescription>Quick access to administrative functions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button className="h-20 flex flex-col items-center justify-center space-y-2">
                  <span className="text-lg">👥</span>
                  <span>Manage Users</span>
                </Button>
                <Button className="h-20 flex flex-col items-center justify-center space-y-2" variant="outline">
                  <span className="text-lg">🏢</span>
                  <span>Manage Companies</span>
                </Button>
                <Button className="h-20 flex flex-col items-center justify-center space-y-2" variant="outline">
                  <span className="text-lg">📊</span>
                  <span>Generate Reports</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {!reports && !loading && (
        <div className="text-center py-8">
          <p className="text-gray-600">No data available. Click "Refresh Data" to load dashboard.</p>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard
