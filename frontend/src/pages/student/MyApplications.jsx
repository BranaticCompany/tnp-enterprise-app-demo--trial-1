import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { applicationsAPI } from '../../api/auth'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import toast from 'react-hot-toast'
import { formatSalary, formatDate } from '../../utils/formatters'

const MyApplications = () => {
  const { user } = useAuth()
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchMyApplications()
  }, [])

  const fetchMyApplications = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await applicationsAPI.getMyApplications()
      setApplications(response.applications || response || [])
    } catch (err) {
      console.error('Error fetching applications:', err)
      setError('Failed to load applications. Please try again.')
      toast.error('Failed to load applications')
    } finally {
      setLoading(false)
    }
  }


  const getStatusLabel = (status) => {
    const statusLabels = {
      'applied': 'Applied',
      'shortlisted': 'Shortlisted',
      'placed': 'Placed',
      'rejected': 'Rejected'
    }
    return statusLabels[status?.toLowerCase()] || status
  }

  const getStatusColor = (status) => {
    const statusColors = {
      'applied': 'bg-blue-100 text-blue-800',
      'shortlisted': 'bg-orange-100 text-orange-800',
      'placed': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800'
    }
    return statusColors[status?.toLowerCase()] || 'bg-gray-100 text-gray-800'
  }

  const getApplicationStats = () => {
    const stats = {
      total: applications.length,
      applied: 0,
      shortlisted: 0,
      placed: 0,
      rejected: 0
    }

    applications.forEach(app => {
      // Use normalized status from backend
      const status = app.normalized_status || app.status?.toLowerCase()
      if (status === 'applied') {
        stats.applied++
      } else if (status === 'shortlisted') {
        stats.shortlisted++
      } else if (status === 'placed') {
        stats.placed++
      } else if (status === 'rejected') {
        stats.rejected++
      }
    })

    return stats
  }

  const stats = getApplicationStats()

  const getJobTypeColor = (jobType) => {
    switch (jobType?.toLowerCase()) {
      case 'full-time':
        return 'bg-blue-100 text-blue-800'
      case 'part-time':
        return 'bg-green-100 text-green-800'
      case 'internship':
        return 'bg-purple-100 text-purple-800'
      case 'contract':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Loading applications...</div>
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
            Track your job applications
          </p>
        </div>

        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Applications</h1>
          <p className="text-gray-600 mt-2">Track the status of your job applications</p>
        </div>
      </div>

      {/* Statistics Cards */}
      {applications.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-black">{stats.total}</div>
              <div className="text-sm text-gray-600">Total</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.applied}</div>
              <div className="text-sm text-gray-600">Applied</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.shortlisted}</div>
              <div className="text-sm text-gray-600">Shortlisted</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.placed}</div>
              <div className="text-sm text-gray-600">Placed</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
              <div className="text-sm text-gray-600">Rejected</div>
            </CardContent>
          </Card>
        </div>
      )}

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
          <Button
            onClick={fetchMyApplications}
            variant="outline"
            size="sm"
            className="mt-2"
          >
            Retry
          </Button>
        </div>
      )}

      {applications.length === 0 && !loading && !error ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-gray-500 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No applications yet</h3>
            <p className="text-gray-500 mb-4">Start applying to jobs to see your applications here</p>
            <Button onClick={() => window.location.href = '/student/jobs'}>
              Browse Jobs
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {applications.length} application{applications.length !== 1 ? 's' : ''}
            </div>
          </div>

          {applications.map((application) => (
            <Card key={application.id} className="hover:shadow-md transition-shadow" data-cy="job-item">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <CardTitle className="text-xl text-gray-900" data-cy="job-title">{application.job_title}</CardTitle>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getJobTypeColor(application.job_type)}`}>
                        {application.job_type || 'Full Time'}
                      </span>
                    </div>
                    <p className="text-gray-600">{application.company_name}</p>
                    <p className="text-sm text-gray-500 mt-1">Applied: {formatDate(application.created_at)}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-green-600 mb-2">
                      {formatSalary(application.final_package || application.job_package)}
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(application.normalized_status || application.status)}`} data-cy="applied-badge">
                        {getStatusLabel(application.normalized_status || application.status)}
                      </span>
                      <div className="text-xs text-gray-500">
                        Updated: {formatDate(application.updated_at)}
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Application Details</h4>
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">Applied:</span> {formatDate(application.created_at)}
                    </p>
                    {application.application_deadline && (
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Deadline:</span> {formatDate(application.application_deadline)}
                      </p>
                    )}
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Total Applications:</span> {application.total_applications || 'N/A'}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <h4 className="font-medium text-gray-900 mb-2">Job Description</h4>
                    <p className="text-sm text-gray-600 line-clamp-3">
                      {application.job_description || 'No description provided'}
                    </p>
                  </div>
                </div>

                {application.job_eligibility && (
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Eligibility</h4>
                    <p className="text-sm text-gray-600">{application.job_eligibility}</p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center space-x-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                      {getStatusLabel(application.status)}
                    </span>
                    {application.status === 'placed' && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        🎉 Congratulations!
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    Application ID: {application.id}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default MyApplications
