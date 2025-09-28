import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { interviewsAPI } from '../../api/auth'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import toast from 'react-hot-toast'
import { formatDate, formatSalary } from '../../utils/formatters'

const StudentInterviews = () => {
  const { user } = useAuth()
  const [interviews, setInterviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchMyInterviews()
  }, [])

  const fetchMyInterviews = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await interviewsAPI.getMyInterviews()
      setInterviews(response.interviews || response || [])
    } catch (err) {
      console.error('Error fetching interviews:', err)
      setError('Failed to load interviews. Please try again.')
      toast.error('Failed to load interviews')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      case 'rescheduled':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getInterviewStats = () => {
    const stats = {
      total: interviews.length,
      scheduled: 0,
      completed: 0,
      cancelled: 0,
      upcoming: 0
    }

    const now = new Date()
    interviews.forEach(interview => {
      const status = interview.status?.toLowerCase()
      const interviewDate = new Date(interview.scheduled_at)

      if (status === 'scheduled') {
        stats.scheduled++
        if (interviewDate > now) {
          stats.upcoming++
        }
      } else if (status === 'completed') {
        stats.completed++
      } else if (status === 'cancelled') {
        stats.cancelled++
      }
    })

    return stats
  }

  const getInterviewTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'technical':
        return 'bg-purple-100 text-purple-800'
      case 'hr':
        return 'bg-orange-100 text-orange-800'
      case 'managerial':
        return 'bg-indigo-100 text-indigo-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const stats = getInterviewStats()

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Loading interviews...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header with role banner */}
      <div className="mb-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <h2 className="text-lg font-semibold text-green-800">
            Welcome, {user?.email}
          </h2>
          <p className="text-green-600">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 mr-2">
              {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
            </span>
            Track your interview schedule and status
          </p>
        </div>

        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Interviews</h1>
          <p className="text-gray-600 mt-2">View and manage your scheduled interviews</p>
        </div>
      </div>

      {/* Statistics Cards */}
      {interviews.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-600">Total</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.scheduled}</div>
              <div className="text-sm text-gray-600">Scheduled</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.upcoming}</div>
              <div className="text-sm text-gray-600">Upcoming</div>
            </CardContent>
          </Card>
        </div>
      )}

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
          <Button
            onClick={fetchMyInterviews}
            variant="outline"
            size="sm"
            className="mt-2"
          >
            Retry
          </Button>
        </div>
      )}

      {interviews.length === 0 && !loading && !error ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-gray-500 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0V7a2 2 0 012-2h4a2 2 0 012 2v0M8 7v8a2 2 0 002 2h4a2 2 0 002-2V7m-6 0h6" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No interviews scheduled</h3>
            <p className="text-gray-500">Your scheduled interviews will appear here</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {interviews.length} interview{interviews.length !== 1 ? 's' : ''} found
            </div>
            <div className="text-sm text-gray-600">
              {stats.upcoming} upcoming • {stats.completed} completed
            </div>
          </div>

          {interviews.map((interview) => {
            const isUpcoming = new Date(interview.scheduled_at) > new Date()

            return (
              <Card key={interview.id} className="hover:shadow-md transition-shadow" data-cy="interview-item">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <CardTitle className="text-xl text-gray-900" data-cy="interview-job-title">
                          {interview.job_title}
                        </CardTitle>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getInterviewTypeColor(interview.mode)}`}>
                          {interview.mode || 'Interview'}
                        </span>
                      </div>
                      <p className="text-gray-600">{interview.company_name}</p>
                      <p className="text-sm text-gray-500 mt-1">📍 {interview.mode === 'online' ? 'Online Interview' : 'On-site Interview'}</p>
                      {interview.job_package && (
                        <p className="text-sm text-green-600 mt-1">💰 {formatSalary(interview.job_package)}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-blue-600 mb-2">
                        {formatDate(interview.scheduled_at)}
                      </div>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(interview.status)}`} data-cy="interview-status">
                        {interview.status?.charAt(0).toUpperCase() + interview.status?.slice(1)}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Interview Details</h4>
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Date:</span> {formatDate(interview.scheduled_at)}
                      </p>
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Mode:</span> {interview.mode === 'online' ? 'Online' : 'On-site'}
                      </p>
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Application Status:</span> {interview.application_status}
                      </p>
                      {interview.job_type && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Job Type:</span> {interview.job_type}
                        </p>
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Status & Feedback</h4>
                      <p className={`text-sm mb-1 ${interview.status === 'completed' ? 'text-green-600' : interview.status === 'scheduled' ? 'text-blue-600' : 'text-gray-600'}`}>
                        Status: {interview.status?.charAt(0).toUpperCase() + interview.status?.slice(1)}
                      </p>
                      {interview.status === 'completed' && interview.feedback && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-gray-900">Feedback:</p>
                          <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded mt-1">
                            {interview.feedback}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {interview.job_description && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="font-medium text-gray-900 mb-2">Job Description</h4>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {interview.job_description}
                      </p>
                    </div>
                  )}

                  {/* Required Skills Section */}
                  {interview.job_skills && interview.job_skills.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="font-medium text-gray-900 mb-2">Required Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {interview.job_skills.map((skill, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-indigo-100 text-indigo-800"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t mt-4">
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-500">
                        Interview ID: {interview.id}
                      </span>
                      {interview.status === 'completed' && (
                        <span className="text-sm text-green-600">
                          ✅ Interview completed
                        </span>
                      )}
                    </div>
                    {interview.status === 'scheduled' && isUpcoming && (
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default StudentInterviews
