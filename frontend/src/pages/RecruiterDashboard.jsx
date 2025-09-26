import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { recruiterAPI } from '../api/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { useNavigate } from 'react-router-dom'

const RecruiterDashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(false)

  const loadDashboard = async () => {
    setLoading(true)
    try {
      const data = await recruiterAPI.getDashboard()
      console.log('Dashboard data loaded:', data)
      setDashboardData(data)
    } catch (error) {
      console.error('Failed to load dashboard:', error)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadDashboard()
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
            <Button onClick={loadDashboard} disabled={loading} variant="outline">
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

      {dashboardData && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-blue-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Jobs Posted</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{dashboardData.jobsPosted}</div>
                <p className="text-xs text-gray-600 mt-1">Total jobs posted</p>
              </CardContent>
            </Card>

            <Card className="border-green-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Applications Received</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {dashboardData.applicationsReceived}
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  For all your jobs
                </p>
              </CardContent>
            </Card>

            <Card className="border-purple-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Interviews Scheduled</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {dashboardData.interviewsScheduled}
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Total interviews
                </p>
              </CardContent>
            </Card>

            <Card className="border-orange-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Offers Made</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {dashboardData.offersMade}
                </div>
                <p className="text-xs text-gray-600 mt-1">{dashboardData.placedCount} placed</p>
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
                <Button 
                  className="h-20 flex flex-col items-center justify-center space-y-2 bg-blue-600 hover:bg-blue-700"
                  onClick={() => navigate('/recruiter/jobs/post')}
                >
                  <span className="text-lg">📝</span>
                  <span>Post New Job</span>
                </Button>
                <Button 
                  className="h-20 flex flex-col items-center justify-center space-y-2" 
                  variant="outline"
                  onClick={() => navigate('/recruiter/jobs')}
                >
                  <span className="text-lg">📋</span>
                  <span>Manage Jobs</span>
                </Button>
                <Button 
                  className="h-20 flex flex-col items-center justify-center space-y-2" 
                  variant="outline"
                  onClick={() => navigate('/recruiter/applications')}
                >
                  <span className="text-lg">📅</span>
                  <span>View Applications</span>
                </Button>
                <Button 
                  className="h-20 flex flex-col items-center justify-center space-y-2" 
                  variant="outline"
                  onClick={() => navigate('/recruiter/interviews')}
                >
                  <span className="text-lg">💼</span>
                  <span>Interviews</span>
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
                  {dashboardData.recentApplications && dashboardData.recentApplications.length > 0 ? (
                    dashboardData.recentApplications.map((application, index) => (
                      <div key={index} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded border">
                        <div>
                          <p className="text-sm font-medium">{application.student_name}</p>
                          <p className="text-xs text-gray-600">{application.job_title}</p>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            application.status === 'applied' ? 'bg-blue-100 text-blue-800' :
                            application.status === 'reviewed' ? 'bg-yellow-100 text-yellow-800' :
                            application.status === 'shortlisted' ? 'bg-green-100 text-green-800' :
                            application.status === 'offered' ? 'bg-purple-100 text-purple-800' :
                            application.status === 'placed' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                          </span>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(application.applied_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      <p>No recent applications</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Jobs</CardTitle>
                <CardDescription>Your latest job postings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardData.recentJobs && dashboardData.recentJobs.length > 0 ? (
                    dashboardData.recentJobs.map((job, index) => (
                      <div key={index} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded border">
                        <div>
                          <p className="text-sm font-medium">{job.title}</p>
                          <p className="text-xs text-gray-600">{job.company_name}</p>
                        </div>
                        <div className="text-right">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {job.application_count} applications
                          </span>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(job.posted_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      <p>No jobs posted yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Interviews</CardTitle>
                <CardDescription>Next interviews scheduled</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardData.upcomingInterviews && dashboardData.upcomingInterviews.length > 0 ? (
                    dashboardData.upcomingInterviews.map((interview, index) => (
                      <div key={index} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded border">
                        <div>
                          <p className="text-sm font-medium">{interview.student_name}</p>
                          <p className="text-xs text-gray-600">{interview.job_title}</p>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            interview.mode === 'online' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {interview.mode}
                          </span>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(interview.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      <p>No upcoming interviews</p>
                    </div>
                  )}
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
                    { stage: 'Applications Received', count: dashboardData.applicationsReceived, color: 'bg-blue-500' },
                    { stage: 'Interviews Scheduled', count: dashboardData.interviewsScheduled, color: 'bg-purple-500' },
                    { stage: 'Offers Made', count: dashboardData.offersMade, color: 'bg-orange-500' },
                    { stage: 'Successfully Placed', count: dashboardData.placedCount, color: 'bg-green-500' }
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

          {/* Highest Package Card */}
          {dashboardData.highestPackage > 0 && (
            <Card className="border-green-200">
              <CardHeader>
                <CardTitle className="text-green-800">Highest Package Offered</CardTitle>
                <CardDescription>Best placement achieved</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  ₹{(dashboardData.highestPackage / 100000).toFixed(1)}L
                </div>
                <p className="text-sm text-gray-600 mt-1">Per annum</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {!dashboardData && !loading && (
        <div className="text-center py-8">
          <p className="text-gray-600">No data available. Click "Refresh Data" to load dashboard.</p>
        </div>
      )}
    </div>
  )
}

export default RecruiterDashboard
