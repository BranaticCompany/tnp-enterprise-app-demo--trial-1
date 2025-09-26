import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { jobsAPI } from '../../api/auth'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { formatSalary, formatDate } from '../../utils/formatters'

const JobsList = () => {
  const { user } = useAuth()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchJobs()
  }, [])

  const fetchJobs = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await jobsAPI.getRecruiterJobs()
      setJobs(response.jobs || response || [])
    } catch (err) {
      console.error('Error fetching jobs:', err)
      setError('Failed to load jobs. Please try again.')
      toast.error('Failed to load jobs')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job?')) {
      return
    }

    try {
      await jobsAPI.deleteJob(jobId)
      setJobs(jobs.filter(job => job.id !== jobId))
      toast.success('Job deleted successfully')
    } catch (err) {
      console.error('Error deleting job:', err)
      toast.error('Failed to delete job')
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
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <h2 className="text-lg font-semibold text-blue-800">
            Welcome, {user?.email}
          </h2>
          <p className="text-blue-600">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2">
              {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
            </span>
            Manage your job postings
          </p>
        </div>

        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Jobs Management</h1>
            <p className="text-gray-600 mt-2">View and manage all your job postings</p>
          </div>
          <Link to="/recruiter/jobs/post">
            <Button className="bg-blue-600 hover:bg-blue-700">
              Post New Job
            </Button>
          </Link>
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs posted yet</h3>
            <p className="text-gray-500 mb-4">Get started by posting your first job opening</p>
            <Link to="/recruiter/jobs/post">
              <Button>Post Your First Job</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <Card key={job.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl text-blue-900">{job.title}</CardTitle>
                    <p className="text-gray-600 mt-1">{job.company_name || job.company || 'N/A'}</p>
                  </div>
                  <div className="flex space-x-2">
                    <Link to={`/recruiter/applications?jobId=${job.id}`}>
                      <Button variant="outline" size="sm">
                        View Applications
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteJob(job.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Job Details</h4>
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">Salary:</span> {formatSalary(job.salary)}
                    </p>
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">Deadline:</span> {formatDate(job.deadline)}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Posted:</span> {formatDate(job.createdAt)}
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
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-900 mb-2">Requirements</h4>
                    <p className="text-sm text-gray-600">{job.requirements}</p>
                  </div>
                )}

                {/* Skills Section */}
                {job.skills && job.skills.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-900 mb-2">Required Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {job.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {job.status || 'Active'}
                    </span>
                    <span className="text-sm text-gray-500">
                      Applications: {job.applicationCount || 0}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    ID: {job.id}
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

export default JobsList
