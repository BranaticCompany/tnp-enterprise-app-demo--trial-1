import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import toast from 'react-hot-toast'
import { formatDate, formatStatus, getStatusColor } from '../../utils/formatters'

// Interview API functions
const interviewsAPI = {
  getRecruiterInterviews: async () => {
    const response = await fetch('/api/v1/interviews/recruiter', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch interviews')
    }
    
    return response.json()
  },

  scheduleInterview: async (data) => {
    const response = await fetch('/api/v1/interviews/recruiter', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to schedule interview')
    }
    
    return response.json()
  },

  updateInterviewMode: async (interviewId, mode) => {
    const response = await fetch(`/api/v1/interviews/recruiter/${interviewId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ mode })
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update interview mode')
    }
    
    return response.json()
  }
}

const RecruiterInterviews = () => {
  const { user } = useAuth()
  const [interviews, setInterviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [selectedCandidate, setSelectedCandidate] = useState(null)
  const [scheduleData, setScheduleData] = useState({
    date: '',
    time: '',
    mode: 'online'
  })

  useEffect(() => {
    fetchInterviews()
  }, [])

  const fetchInterviews = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('=== FRONTEND: Fetching recruiter interviews ===')
      
      const response = await interviewsAPI.getRecruiterInterviews()
      console.log('=== FRONTEND: Interviews response received ===')
      console.log('Response:', response)
      
      setInterviews(response.interviews || [])
    } catch (err) {
      console.error('=== FRONTEND: Error fetching interviews ===')
      console.error('Error:', err)
      
      const errorMessage = err.message || 'Failed to load interviews. Please try again.'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleScheduleInterview = async (candidate) => {
    setSelectedCandidate(candidate)
    setShowScheduleModal(true)
    
    // Set default date to tomorrow
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    setScheduleData({
      date: tomorrow.toISOString().split('T')[0],
      time: '10:00',
      mode: 'online'
    })
  }

  const handleSubmitSchedule = async (e) => {
    e.preventDefault()
    
    try {
      // Combine date and time
      const scheduledAt = new Date(`${scheduleData.date}T${scheduleData.time}:00`)
      
      const response = await interviewsAPI.scheduleInterview({
        application_id: selectedCandidate.application_id,
        scheduled_at: scheduledAt.toISOString(),
        mode: scheduleData.mode
      })
      
      toast.success('Interview scheduled successfully!')
      setShowScheduleModal(false)
      setSelectedCandidate(null)
      fetchInterviews() // Refresh the list
    } catch (err) {
      console.error('Error scheduling interview:', err)
      toast.error(err.message || 'Failed to schedule interview')
    }
  }

  const handleModeChange = async (interviewId, newMode) => {
    try {
      // Optimistically update UI
      setInterviews(prevInterviews => 
        prevInterviews.map(interview => 
          interview.interview_id === interviewId 
            ? { ...interview, mode: newMode }
            : interview
        )
      )

      const response = await interviewsAPI.updateInterviewMode(interviewId, newMode)
      toast.success(`Interview mode updated to ${newMode}`)
      
      // Update with server response to ensure consistency
      setInterviews(prevInterviews => 
        prevInterviews.map(interview => 
          interview.interview_id === interviewId 
            ? { ...interview, ...response.interview }
            : interview
        )
      )
    } catch (err) {
      console.error('Error updating interview mode:', err)
      toast.error(err.message || 'Failed to update interview mode')
      
      // Revert optimistic update on error
      fetchInterviews()
    }
  }

  // Filter interviews based on status
  const filteredInterviews = interviews.filter(interview => {
    if (statusFilter === 'all') return true
    return interview.status === statusFilter
  })

  const getStatusCounts = () => {
    const counts = {
      all: interviews.length,
      shortlisted: interviews.filter(i => i.status === 'shortlisted').length,
      scheduled: interviews.filter(i => i.status === 'scheduled').length,
      completed: interviews.filter(i => i.status === 'completed').length,
      cancelled: interviews.filter(i => i.status === 'cancelled').length
    }
    return counts
  }

  const getInterviewStatusBadge = (interview) => {
    if (interview.status === 'shortlisted') {
      return 'bg-yellow-100 text-yellow-800'
    } else if (interview.status === 'scheduled') {
      return 'bg-blue-100 text-blue-800'
    } else if (interview.status === 'completed') {
      return 'bg-green-100 text-green-800'
    } else if (interview.status === 'cancelled') {
      return 'bg-red-100 text-red-800'
    }
    return 'bg-gray-100 text-gray-800'
  }

  const getInterviewStatusText = (interview) => {
    if (interview.status === 'shortlisted') {
      return 'Shortlisted - Not Scheduled'
    } else if (interview.status === 'scheduled') {
      return `Scheduled - ${formatDate(interview.scheduled_at)}`
    } else if (interview.status === 'completed') {
      return `Completed - ${formatDate(interview.scheduled_at)}`
    } else if (interview.status === 'cancelled') {
      return 'Cancelled'
    }
    return interview.status
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header with role banner */}
      <div className="mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <h2 className="text-lg font-semibold text-blue-800">
            Welcome, {user?.email}
          </h2>
          <p className="text-blue-600">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2">
              {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
            </span>
            Manage interviews for shortlisted candidates
          </p>
        </div>
        
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Interviews Management</h1>
          <p className="text-gray-600 mt-2">Schedule and manage interviews with shortlisted candidates</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
          <Button 
            onClick={fetchInterviews} 
            variant="outline" 
            size="sm" 
            className="mt-2"
          >
            Retry
          </Button>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Loading interviews...</div>
        </div>
      )}

      {!loading && interviews.length === 0 && !error && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-gray-500 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 4v10m6-10v10m-6-4h6" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No shortlisted candidates yet</h3>
            <p className="text-gray-500">Shortlist candidates from the Applications tab to schedule interviews</p>
          </CardContent>
        </Card>
      )}

      {!loading && interviews.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">
              Interviews ({filteredInterviews.length} of {interviews.length})
            </h2>
          </div>

          {/* Status Filter */}
          <Card className="mb-4">
            <CardContent className="py-4">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-700">Filter by status:</span>
                <div className="flex space-x-2">
                  {[
                    { key: 'all', label: 'All', count: getStatusCounts().all },
                    { key: 'shortlisted', label: 'Shortlisted', count: getStatusCounts().shortlisted },
                    { key: 'scheduled', label: 'Scheduled', count: getStatusCounts().scheduled },
                    { key: 'completed', label: 'Completed', count: getStatusCounts().completed },
                    { key: 'cancelled', label: 'Cancelled', count: getStatusCounts().cancelled }
                  ].map((filter) => (
                    <button
                      key={filter.key}
                      onClick={() => setStatusFilter(filter.key)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        statusFilter === filter.key
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {filter.label} ({filter.count})
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {filteredInterviews.map((interview) => (
            <Card key={`${interview.application_id}-${interview.interview_id || 'shortlisted'}`} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      {interview.student_name || 'Student'}
                    </CardTitle>
                    <p className="text-gray-600 mt-1">
                      {interview.student_email || 'No email provided'}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Job: {interview.job_title} • {interview.company_name}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getInterviewStatusBadge(interview)}`}>
                      {getInterviewStatusText(interview)}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Candidate Details</h4>
                    {interview.student_phone && (
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Phone:</span> {interview.student_phone}
                      </p>
                    )}
                    {interview.student_branch && (
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Branch:</span> {interview.student_branch}
                      </p>
                    )}
                    {interview.student_year && (
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Year:</span> {interview.student_year}
                      </p>
                    )}
                    {/* CGPA field removed - not available in profiles table */}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Job Details</h4>
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">Position:</span> {interview.job_title}
                    </p>
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">Company:</span> {interview.company_name}
                    </p>
                    {interview.job_package && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Package:</span> ₹{interview.job_package?.toLocaleString()} LPA
                      </p>
                    )}
                  </div>
                </div>

                {interview.scheduled_at && interview.mode && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-md">
                    <h4 className="font-medium text-blue-900 mb-2">Interview Details</h4>
                    <p className="text-sm text-blue-800 mb-1">
                      <span className="font-medium">Date & Time:</span> {formatDate(interview.scheduled_at)}
                    </p>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-blue-800 font-medium">Mode:</span>
                      {interview.interview_id ? (
                        <select
                          value={interview.mode}
                          onChange={(e) => handleModeChange(interview.interview_id, e.target.value)}
                          className="text-sm bg-white border border-blue-200 rounded px-2 py-1 text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="online">Online</option>
                          <option value="offline">Offline</option>
                        </select>
                      ) : (
                        <span className="text-sm text-blue-800">
                          {interview.mode === 'online' ? 'Online' : 'Offline'}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {interview.feedback && (
                  <div className="mt-4 p-3 bg-green-50 rounded-md">
                    <h4 className="font-medium text-green-900 mb-2">Interview Feedback</h4>
                    <p className="text-sm text-green-800">{interview.feedback}</p>
                  </div>
                )}

                <div className="mt-4 flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    Application ID: {interview.application_id}
                  </div>
                  <div className="flex space-x-2">
                    {interview.status === 'shortlisted' && (
                      <Button
                        size="sm"
                        onClick={() => handleScheduleInterview(interview)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Schedule Interview
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Schedule Interview Modal */}
      {showScheduleModal && selectedCandidate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Schedule Interview</h3>
            <p className="text-gray-600 mb-4">
              Scheduling interview for <strong>{selectedCandidate.student_name}</strong>
            </p>
            
            <form onSubmit={handleSubmitSchedule} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Interview Date
                </label>
                <input
                  type="date"
                  value={scheduleData.date}
                  onChange={(e) => setScheduleData({...scheduleData, date: e.target.value})}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Interview Time
                </label>
                <input
                  type="time"
                  value={scheduleData.time}
                  onChange={(e) => setScheduleData({...scheduleData, time: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Interview Mode
                </label>
                <select
                  value={scheduleData.mode}
                  onChange={(e) => setScheduleData({...scheduleData, mode: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="online">Online</option>
                  <option value="offline">Offline</option>
                </select>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowScheduleModal(false)
                    setSelectedCandidate(null)
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Schedule Interview
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default RecruiterInterviews
