import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { reportsAPI } from '../api/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'

const RecruiterDashboard = () => {
  const { user } = useAuth()
  const [reports, setReports] = useState(null)
  const [loading, setLoading] = useState(false)

  const loadReports = async () => {
    setLoading(true)
    try {
      const [applications, interviews, placements] = await Promise.all([
        reportsAPI.getApplicationsReport(),
        reportsAPI.getInterviewsReport(),
        reportsAPI.getPlacementsReport()
      ])
      setReports({ applications, interviews, placements })
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
      <div className="mb-8 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-blue-900">
              Recruiter Dashboard
            </h1>
            <p className="text-blue-700 mt-1">
              Welcome back, {user?.email}
            </p>
            <p className="text-blue-600 text-sm mt-1">
              Post jobs, review applications, and schedule interviews
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              Recruiter
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
            <Card className="border-blue-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Active Jobs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">12</div>
                <p className="text-xs text-gray-600 mt-1">3 new this week</p>
              </CardContent>
            </Card>

            <Card className="border-green-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Applications Received</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {reports.applications?.overall_statistics?.total_applications || 0}
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {Math.floor((reports.applications?.overall_statistics?.total_applications || 0) * 0.15)} pending review
                </p>
              </CardContent>
            </Card>

            <Card className="border-purple-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Interviews Scheduled</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {reports.interviews?.overall_statistics?.total_interviews || 0}
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {Math.floor((reports.interviews?.overall_statistics?.total_interviews || 0) * 0.3)} this week
                </p>
              </CardContent>
            </Card>

            <Card className="border-orange-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Successful Hires</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {reports.applications?.overall_statistics?.hired_count || 0}
                </div>
                <p className="text-xs text-gray-600 mt-1">This semester</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Streamline your recruitment process</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Button className="h-20 flex flex-col items-center justify-center space-y-2 bg-blue-600 hover:bg-blue-700">
                  <span className="text-lg">📝</span>
                  <span>Post New Job</span>
                </Button>
                <Button className="h-20 flex flex-col items-center justify-center space-y-2" variant="outline">
                  <span className="text-lg">📋</span>
                  <span>Review Applications</span>
                </Button>
                <Button className="h-20 flex flex-col items-center justify-center space-y-2" variant="outline">
                  <span className="text-lg">📅</span>
                  <span>Schedule Interview</span>
                </Button>
                <Button className="h-20 flex flex-col items-center justify-center space-y-2" variant="outline">
                  <span className="text-lg">✅</span>
                  <span>Make Offer</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity & Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Applications</CardTitle>
                <CardDescription>Latest applications for your jobs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { name: 'John Doe', position: 'Software Engineer', time: '2 hours ago', status: 'New' },
                    { name: 'Jane Smith', position: 'Data Analyst', time: '4 hours ago', status: 'Reviewed' },
                    { name: 'Mike Johnson', position: 'Frontend Developer', time: '6 hours ago', status: 'Shortlisted' },
                    { name: 'Sarah Wilson', position: 'Backend Developer', time: '1 day ago', status: 'Interview Scheduled' },
                    { name: 'David Brown', position: 'Full Stack Developer', time: '2 days ago', status: 'Offer Made' }
                  ].map((application, index) => (
                    <div key={index} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded border">
                      <div>
                        <p className="text-sm font-medium">{application.name}</p>
                        <p className="text-xs text-gray-600">{application.position}</p>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          application.status === 'New' ? 'bg-blue-100 text-blue-800' :
                          application.status === 'Reviewed' ? 'bg-yellow-100 text-yellow-800' :
                          application.status === 'Shortlisted' ? 'bg-green-100 text-green-800' :
                          application.status === 'Interview Scheduled' ? 'bg-purple-100 text-purple-800' :
                          'bg-orange-100 text-orange-800'
                        }`}>
                          {application.status}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">{application.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Hiring Pipeline</CardTitle>
                <CardDescription>Current recruitment funnel</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { stage: 'Applications Received', count: reports.applications?.overall_statistics?.total_applications || 0, color: 'bg-blue-500' },
                    { stage: 'Under Review', count: Math.floor((reports.applications?.overall_statistics?.total_applications || 0) * 0.6), color: 'bg-yellow-500' },
                    { stage: 'Shortlisted', count: Math.floor((reports.applications?.overall_statistics?.total_applications || 0) * 0.3), color: 'bg-green-500' },
                    { stage: 'Interview Scheduled', count: reports.interviews?.overall_statistics?.total_interviews || 0, color: 'bg-purple-500' },
                    { stage: 'Offers Made', count: reports.applications?.overall_statistics?.hired_count || 0, color: 'bg-orange-500' }
                  ].map((stage, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full ${stage.color}`}></div>
                      <div className="flex-1 flex justify-between">
                        <span className="text-sm font-medium">{stage.stage}</span>
                        <span className="text-sm text-gray-600">{stage.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
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

export default RecruiterDashboard
