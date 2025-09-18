import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { reportsAPI } from '../api/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'

const StudentDashboard = () => {
  const { user } = useAuth()
  const [reports, setReports] = useState(null)
  const [loading, setLoading] = useState(false)

  const loadReports = async () => {
    setLoading(true)
    try {
      const data = await reportsAPI.getMyReport()
      setReports(data)
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
            <Card className="border-green-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Applications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {reports.applications?.total_applications || 0}
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {reports.applications?.shortlisted_count || 0} shortlisted
                </p>
              </CardContent>
            </Card>

            <Card className="border-blue-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Interviews</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {reports.interviews?.total_interviews || 0}
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {reports.interviews?.completed_count || 0} completed
                </p>
              </CardContent>
            </Card>

            <Card className="border-purple-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Placements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {reports.placements?.total_placements || 0}
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {reports.placements?.accepted_count || 0} accepted
                </p>
              </CardContent>
            </Card>

            <Card className="border-orange-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Highest Package</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {reports.placements?.highest_package_offered 
                    ? `₹${(reports.placements.highest_package_offered / 100000).toFixed(1)}L`
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
                <Button className="h-20 flex flex-col items-center justify-center space-y-2 bg-green-600 hover:bg-green-700">
                  <span className="text-lg">🔍</span>
                  <span>Browse Jobs</span>
                </Button>
                <Button className="h-20 flex flex-col items-center justify-center space-y-2" variant="outline">
                  <span className="text-lg">📝</span>
                  <span>Apply to Job</span>
                </Button>
                <Button className="h-20 flex flex-col items-center justify-center space-y-2" variant="outline">
                  <span className="text-lg">📋</span>
                  <span>View Applications</span>
                </Button>
                <Button className="h-20 flex flex-col items-center justify-center space-y-2" variant="outline">
                  <span className="text-lg">👤</span>
                  <span>Update Profile</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Application Status & Upcoming Events */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Application Status</CardTitle>
                <CardDescription>Track your application progress</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { company: 'Google', position: 'Software Engineer', status: 'Interview Scheduled', date: 'Tomorrow 2:00 PM' },
                    { company: 'Microsoft', position: 'Frontend Developer', status: 'Under Review', date: 'Applied 3 days ago' },
                    { company: 'Amazon', position: 'Full Stack Developer', status: 'Shortlisted', date: 'Applied 1 week ago' },
                    { company: 'Meta', position: 'Backend Developer', status: 'Applied', date: 'Applied 2 weeks ago' },
                    { company: 'Netflix', position: 'Data Engineer', status: 'Rejected', date: 'Applied 3 weeks ago' }
                  ].map((application, index) => (
                    <div key={index} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded border">
                      <div>
                        <p className="text-sm font-medium">{application.company}</p>
                        <p className="text-xs text-gray-600">{application.position}</p>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          application.status === 'Interview Scheduled' ? 'bg-blue-100 text-blue-800' :
                          application.status === 'Under Review' ? 'bg-yellow-100 text-yellow-800' :
                          application.status === 'Shortlisted' ? 'bg-green-100 text-green-800' :
                          application.status === 'Applied' ? 'bg-gray-100 text-gray-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {application.status}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">{application.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Upcoming Events</CardTitle>
                <CardDescription>Your schedule and important dates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { 
                      title: 'Google Interview', 
                      type: 'Technical Interview', 
                      time: 'Tomorrow, 2:00 PM', 
                      location: 'Online - Google Meet',
                      color: 'bg-blue-500'
                    },
                    { 
                      title: 'Career Fair', 
                      type: 'Networking Event', 
                      time: 'Friday, 10:00 AM', 
                      location: 'Main Auditorium',
                      color: 'bg-green-500'
                    },
                    { 
                      title: 'Resume Workshop', 
                      type: 'Skill Development', 
                      time: 'Next Monday, 3:00 PM', 
                      location: 'Room 201',
                      color: 'bg-purple-500'
                    },
                    { 
                      title: 'Microsoft Info Session', 
                      type: 'Company Presentation', 
                      time: 'Next Wednesday, 4:00 PM', 
                      location: 'Online - Teams',
                      color: 'bg-orange-500'
                    }
                  ].map((event, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded border">
                      <div className={`w-3 h-3 rounded-full ${event.color} mt-1`}></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{event.title}</p>
                        <p className="text-xs text-gray-600">{event.type}</p>
                        <p className="text-xs text-gray-500 mt-1">{event.time}</p>
                        <p className="text-xs text-gray-500">{event.location}</p>
                      </div>
                    </div>
                  ))}
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
                  <span className="text-sm text-gray-600">85%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{reports.applications?.total_applications || 0}</div>
                    <div className="text-xs text-gray-600">Applications Sent</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{reports.applications?.shortlisted_count || 0}</div>
                    <div className="text-xs text-gray-600">Shortlisted</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{reports.interviews?.total_interviews || 0}</div>
                    <div className="text-xs text-gray-600">Interviews</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{reports.placements?.total_placements || 0}</div>
                    <div className="text-xs text-gray-600">Offers Received</div>
                  </div>
                </div>
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

export default StudentDashboard
