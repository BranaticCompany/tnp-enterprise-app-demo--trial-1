import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { applicationsAPI, interviewsAPI, placementsAPI, profileAPI } from '../api/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { formatSalary, formatDate } from '../utils/formatters'
import { useNavigate } from 'react-router-dom'

const StudentDashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [dashboardData, setDashboardData] = useState({
    applications: [],
    interviews: [],
    placements: []
  })
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({
    applications: 0,
    shortlisted: 0,
    interviews: 0,
    placements: 0,
    highestPackage: 0
  })

  // Status normalization function for display
  const normalizeStatusForDisplay = (status) => {
    const statusMap = {
      'reviewed': 'Shortlisted',
      'round1_qualified': 'Shortlisted',
      'round2_qualified': 'Shortlisted',
      'offered': 'Shortlisted',
      'hired': 'Placed',
      'applied': 'Applied',
      'shortlisted': 'Shortlisted',
      'placed': 'Placed',
      'rejected': 'Rejected'
    }
    return statusMap[status?.toLowerCase()] || status?.charAt(0).toUpperCase() + status?.slice(1)
  }

  // Calculate profile completion percentage
  const calculateProfileCompletion = () => {
    if (!profile) return 0
    
    const fields = ['full_name', 'phone', 'branch', 'year_of_study', 'cgpa', 'resume_url']
    const filledFields = fields.filter(field => profile[field] && profile[field].toString().trim())
    const skillsBonus = profile.skills && profile.skills.length > 0 ? 1 : 0
    
    return Math.round(((filledFields.length + skillsBonus) / (fields.length + 1)) * 100)
  }

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      // Fetch all data in parallel
      const [applicationsResponse, interviewsResponse, placementsResponse, profileResponse] = await Promise.all([
        applicationsAPI.getMyApplications().catch(err => ({ applications: [] })),
        interviewsAPI.getMyInterviews().catch(err => ({ interviews: [] })),
        placementsAPI.getMyPlacements().catch(err => ({ placements: [] })),
        profileAPI.getMyProfile().catch(err => ({ profile: null }))
      ])

      const applications = applicationsResponse.applications || applicationsResponse || []
      const interviews = interviewsResponse.interviews || interviewsResponse || []
      const placements = placementsResponse.placements || placementsResponse || []
      const profileData = profileResponse.profile || null

      setDashboardData({ applications, interviews, placements })
      setProfile(profileData)

      // Calculate stats
      const shortlistedCount = applications.filter(app => {
        const status = (app.normalized_status || app.status || '').toLowerCase()
        return ['shortlisted', 'reviewed', 'round1_qualified', 'round2_qualified', 'offered'].includes(status)
      }).length

      const placedCount = placements.filter(p => p.status === 'accepted').length
      const highestPackage = placements.reduce((max, p) => {
        const packageValue = p.package || p.salary || 0
        return Math.max(max, packageValue)
      }, 0)

      setStats({
        applications: applications.length,
        shortlisted: shortlistedCount,
        interviews: interviews.length,
        placements: placedCount,
        highestPackage
      })
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="mb-8 bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-green-900">
              Student Dashboard
            </h1>
            <p className="text-green-700 mt-1">
              Welcome back, {user?.email}
            </p>
            <p className="text-green-600 text-sm mt-1">
              Track your applications, interviews, and placement opportunities
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
              Student
            </span>
            <Button onClick={loadDashboardData} disabled={loading} variant="outline">
              {loading ? 'Loading...' : 'Refresh Data'}
            </Button>
          </div>
        </div>
      </div>

      {loading && (
        <div className="text-center py-8">
          <p className="text-gray-600">Loading dashboard data...</p>
        </div>
      )}

      {!loading && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-green-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Applications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {stats.applications}
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {stats.shortlisted} shortlisted
                </p>
              </CardContent>
            </Card>

            <Card className="border-blue-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Interviews</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {stats.interviews}
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {dashboardData.interviews.filter(i => i.status === 'completed').length} completed
                </p>
              </CardContent>
            </Card>

            <Card className="border-purple-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Placements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {stats.placements}
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {stats.placements} accepted
                </p>
              </CardContent>
            </Card>

            <Card className="border-orange-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Highest Package</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {stats.highestPackage > 0
                    ? formatSalary(stats.highestPackage)
                    : 'N/A'
                  }
                </div>
                <p className="text-xs text-gray-600 mt-1">Offered</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Manage your placement journey</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Button 
                  className="h-20 flex flex-col items-center justify-center space-y-2 bg-green-600 hover:bg-green-700"
                  onClick={() => navigate('/student/jobs')}
                >
                  <span className="text-lg">🔍</span>
                  <span>Browse Jobs</span>
                </Button>
                <Button 
                  className="h-20 flex flex-col items-center justify-center space-y-2" 
                  variant="outline"
                  onClick={() => navigate('/student/applications')}
                >
                  <span className="text-lg">📋</span>
                  <span>My Applications</span>
                </Button>
                <Button 
                  className="h-20 flex flex-col items-center justify-center space-y-2" 
                  variant="outline"
                  onClick={() => navigate('/student/placements')}
                >
                  <span className="text-lg">🎯</span>
                  <span>My Placements</span>
                </Button>
                <Button 
                  className="h-20 flex flex-col items-center justify-center space-y-2" 
                  variant="outline"
                  onClick={() => navigate('/student/profile')}
                >
                  <span className="text-lg">👤</span>
                  <span>Update Profile</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Application Status & Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Applications</CardTitle>
                <CardDescription>Your latest job applications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardData.applications.length > 0 ? (
                    dashboardData.applications
                      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                      .slice(0, 3)
                      .map((application, index) => {
                        const status = (application.normalized_status || application.status || '').toLowerCase()
                        const getStatusColor = (status) => {
                          if (['placed', 'hired'].includes(status)) return 'bg-green-100 text-green-800'
                          if (['shortlisted', 'reviewed', 'round1_qualified', 'round2_qualified', 'offered'].includes(status)) return 'bg-orange-100 text-orange-800'
                          if (status === 'applied') return 'bg-blue-100 text-blue-800'
                          if (status === 'rejected') return 'bg-red-100 text-red-800'
                          return 'bg-gray-100 text-gray-800'
                        }
                        
                        return (
                          <div key={application.id} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded border">
                            <div className="flex-1">
                              <p className="text-sm font-medium">{application.company_name}</p>
                              <p className="text-xs text-gray-600">{application.job_title}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {formatSalary(application.final_package || application.job_package)}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                                {normalizeStatusForDisplay(status)}
                              </span>
                              <p className="text-xs text-gray-500 mt-1">
                                Applied • {formatDate(application.created_at)}
                              </p>
                            </div>
                          </div>
                        )
                      })
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      <p>No applications yet</p>
                      <p className="text-xs mt-1">Start applying to jobs to see your activity here</p>
                      <Button 
                        size="sm" 
                        className="mt-2" 
                        onClick={() => navigate('/student/jobs')}
                      >
                        Browse Jobs
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Upcoming Interviews</CardTitle>
                <CardDescription>Your scheduled interviews and important dates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(() => {
                    const now = new Date()
                    const upcomingInterviews = dashboardData.interviews
                      .filter(interview => {
                        const interviewDate = new Date(interview.scheduled_at)
                        return interview.status === 'scheduled' && interviewDate > now
                      })
                      .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at))
                      .slice(0, 4)
                    
                    if (upcomingInterviews.length === 0) {
                      return (
                        <div className="text-center py-6 text-gray-500">
                          <div className="text-4xl mb-2">📅</div>
                          <p className="font-medium">No upcoming interviews</p>
                          <p className="text-xs mt-1">Your scheduled interviews will appear here</p>
                          {dashboardData.interviews.length > 0 && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="mt-2" 
                              onClick={() => navigate('/student/interviews')}
                            >
                              View All Interviews
                            </Button>
                          )}
                        </div>
                      )
                    }
                    
                    return upcomingInterviews.map((interview) => {
                      const interviewDate = new Date(interview.scheduled_at)
                      const getInterviewColor = (mode) => {
                        return mode === 'online' ? 'bg-blue-500' : 'bg-green-500'
                      }
                      
                      return (
                        <div key={interview.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded border">
                          <div className={`w-3 h-3 rounded-full ${getInterviewColor(interview.mode)} mt-1`}></div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{interview.company_name} Interview</p>
                            <p className="text-xs text-gray-600">{interview.job_title}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {interviewDate.toLocaleDateString('en-US', { 
                                weekday: 'short', 
                                month: 'short', 
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                            <p className="text-xs text-gray-500">
                              {interview.mode === 'online' ? 'Online Interview' : interview.location || 'On-site Interview'}
                            </p>
                            {interview.job_package && (
                              <p className="text-xs text-green-600 font-medium mt-1">
                                {formatSalary(interview.job_package)}
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    })
                  })()} 
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Progress Tracker */}
          <Card>
            <CardHeader>
              <CardTitle>Placement Progress</CardTitle>
              <CardDescription>Your journey towards successful placement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Profile Completion</span>
                  <span className="text-sm text-gray-600">{calculateProfileCompletion()}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full transition-all duration-300" style={{ width: `${calculateProfileCompletion()}%` }}></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{stats.applications}</div>
                    <div className="text-xs text-gray-600">Applications Sent</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{stats.shortlisted}</div>
                    <div className="text-xs text-gray-600">Shortlisted</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{stats.interviews}</div>
                    <div className="text-xs text-gray-600">Interviews</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{stats.placements}</div>
                    <div className="text-xs text-gray-600">Offers Received</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {!loading && stats.applications === 0 && stats.interviews === 0 && stats.placements === 0 && (
        <div className="text-center py-8">
          <div className="text-gray-500 mb-4">
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Welcome to your placement journey!</h3>
            <p className="text-gray-600 mb-4">Start by browsing available jobs and submitting applications</p>
            <Button onClick={() => navigate('/student/jobs')} className="bg-green-600 hover:bg-green-700">
              Browse Jobs
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default StudentDashboard
