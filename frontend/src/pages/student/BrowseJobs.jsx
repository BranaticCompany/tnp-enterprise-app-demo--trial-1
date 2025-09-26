import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { jobsAPI, applicationsAPI } from '../../api/auth'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import toast from 'react-hot-toast'
import { formatSalary, formatDate } from '../../utils/formatters'

const BrowseJobs = () => {
  const { user } = useAuth()
  const [jobs, setJobs] = useState([])
  const [appliedJobs, setAppliedJobs] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [applyingJobs, setApplyingJobs] = useState(new Set())
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchJobs()
    fetchMyApplications()
  }, [])

  const fetchJobs = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await jobsAPI.getAllJobs()
      setJobs(response.jobs || response || [])
    } catch (err) {
      console.error('Error fetching jobs:', err)
      setError('Failed to load jobs. Please try again.')
      toast.error('Failed to load jobs')
    } finally {
      setLoading(false)
    }
  }

  const fetchMyApplications = async () => {
    try {
      // Try student-specific endpoint first, fallback to general endpoint
      let response
      try {
        response = await applicationsAPI.getMyApplications()
      } catch (err) {
        console.log('Student-specific endpoint not available, using general endpoint')
        response = await applicationsAPI.getAllApplications()
      }

      const applications = response.applications || response || []
      console.log('Fetched applications:', applications) // Debug log
      // Ensure robust type comparison for job IDs
      const appliedJobIds = new Set(applications.map(app => String(app.jobId || app.job_id)))
      console.log('Applied job IDs:', appliedJobIds) // Debug log
      setAppliedJobs(appliedJobIds)
    } catch (err) {
      console.error('Error fetching applications:', err)
      // Don't show error toast for this as it's not critical
      // Set empty set to ensure buttons still work
      setAppliedJobs(new Set())
    }
  }

  const handleApply = async (jobId) => {
    try {
      setApplyingJobs(prev => new Set([...prev, jobId]))

      const response = await applicationsAPI.createApplication({ jobId })
      console.log('Application created:', response) // Debug log

      // Add to applied jobs set with string conversion for consistency
      setAppliedJobs(prev => new Set([...prev, String(jobId)]))
      toast.success('Application submitted successfully!')
    } catch (err) {
      console.error('Error applying to job:', err)
      const errorMessage = err.response?.data?.message || 'Failed to submit application. Please try again.'
      toast.error(errorMessage)
    } finally {
      setApplyingJobs(prev => {
        const newSet = new Set(prev)
        newSet.delete(jobId)
        return newSet
      })
    }
  }


  const isDeadlinePassed = (deadline) => {
    if (!deadline) return false
    return new Date(deadline) < new Date()
  }

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
          <div className="text-gray-600">Loading jobs...</div>
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
            Discover and apply to job opportunities
          </p>
        </div>

        <div>
          <h1 className="text-3xl font-bold text-gray-900">Browse Jobs</h1>
          <p className="text-gray-600 mt-2">Find and apply to exciting job opportunities</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
          <Button
            onClick={fetchJobs}
            variant="outline"
            size="sm"
            className="mt-2"
          >
            Retry
          </Button>
        </div>
      )}

      {jobs.length === 0 && !loading && !error ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-gray-500 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6.5" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs available</h3>
            <p className="text-gray-500">Check back later for new job opportunities</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {jobs.length} job{jobs.length !== 1 ? 's' : ''} available
            </div>
            <div className="text-sm text-gray-600">
              Applied to {appliedJobs.size} job{appliedJobs.size !== 1 ? 's' : ''} • Total applications: {appliedJobs.size}
            </div>
          </div>

          {jobs.map((job) => {
            const hasApplied = appliedJobs.has(String(job.id))
            console.log(`Job ${job.id}: hasApplied = ${hasApplied}, appliedJobs:`, appliedJobs) // Debug log
            const isApplying = applyingJobs.has(job.id)
            const deadlinePassed = isDeadlinePassed(job.deadline)

            return (
              <Card key={job.id} className="hover:shadow-md transition-shadow" data-cy="job-item">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <CardTitle className="text-xl text-gray-900" data-cy="job-title">{job.title}</CardTitle>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getJobTypeColor(job.jobType)}`}>
                          {job.jobType || 'Full Time'}
                        </span>
                      </div>
                      <p className="text-gray-600">{job.company || 'Company'}</p>
                      {job.location && (
                        <p className="text-sm text-gray-500 mt-1">📍 {job.location}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-green-600 mb-2" data-cy="job-salary">
                        {formatSalary(job.salary)}
                      </div>
                      {hasApplied ? (
                        <Button disabled className="bg-gray-100 text-gray-500" data-cy="applied-badge">
                          Applied ✓
                        </Button>
                      ) : deadlinePassed ? (
                        <Button disabled className="bg-gray-100 text-gray-500">
                          Deadline Passed
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleApply(job.id)}
                          disabled={isApplying}
                          className="bg-green-600 hover:bg-green-700"
                          data-cy="apply-btn"
                        >
                          {isApplying ? 'Applying...' : 'Apply Now'}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Job Details</h4>
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Posted:</span> {formatDate(job.createdAt)}
                      </p>
                      {job.deadline && (
                        <p className={`text-sm mb-1 ${deadlinePassed ? 'text-red-600' : 'text-gray-600'}`}>
                          <span className="font-medium">Deadline:</span> {formatDate(job.deadline)}
                          {deadlinePassed && ' (Expired)'}
                        </p>
                      )}
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Applications:</span> {job.applicationCount || 0}
                      </p>
                    </div>
                    <div className="md:col-span-2">
                      <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                      <p className="text-sm text-gray-600 line-clamp-3">
                        {job.description || 'No description provided'}
                      </p>
                    </div>
                  </div>

                  {job.requirements && (
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 mb-2">Requirements</h4>
                      <p className="text-sm text-gray-600">{job.requirements}</p>
                    </div>
                  )}

                  {/* Skills Section */}
                  {job.skills && job.skills.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 mb-2">Required Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {job.skills.map((skill, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800 border border-indigo-200"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center space-x-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {job.status || 'Active'}
                      </span>
                      {hasApplied && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Applied
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      Job ID: {job.id}
                    </div>
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

export default BrowseJobs
